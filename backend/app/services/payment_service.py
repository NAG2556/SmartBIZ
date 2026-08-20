import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Payment, Customer, Transaction, User
from app.schemas.schemas import PaymentCreate, PaymentOut, TransactionOut, CustomerLedgerSummary
from app.services.customer_service import calculate_customer_balance, enrich_customer_out

def record_customer_payment(db: Session, user: User, data: PaymentCreate) -> PaymentOut:
    customer = db.query(Customer).filter(
        Customer.id == data.customer_id,
        Customer.user_id == user.id,
        Customer.is_active == True
    ).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    if data.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount must be greater than 0")

    prev_balance = calculate_customer_balance(db, customer.id)
    payment_date = data.payment_date or datetime.datetime.utcnow()

    # 1. Create Payment record
    payment = Payment(
        user_id=user.id,
        customer_id=customer.id,
        bill_id=data.bill_id,
        amount=round(data.amount, 2),
        payment_method=data.payment_method or "Cash",
        notes=data.notes,
        payment_date=payment_date,
    )
    db.add(payment)
    db.flush()

    # 2. Update Running Balance via Ledger Transaction
    new_balance = round(prev_balance - data.amount, 2)
    method_str = f" via {data.payment_method}" if data.payment_method else ""
    desc = f"Payment received{method_str}"
    if data.notes:
        desc += f" - {data.notes}"

    transaction = Transaction(
        user_id=user.id,
        customer_id=customer.id,
        payment_id=payment.id,
        bill_id=data.bill_id,
        transaction_type="PAYMENT",
        amount=round(data.amount, 2),
        debit=0.0,
        credit=round(data.amount, 2),
        running_balance=new_balance,
        description=desc,
        transaction_date=payment_date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(payment)

    return PaymentOut(
        id=payment.id,
        customer_id=customer.id,
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_serial=customer.customer_serial_number,
        bill_id=payment.bill_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        notes=payment.notes,
        payment_date=payment.payment_date,
        created_at=payment.created_at,
        previous_balance=prev_balance,
        new_balance=new_balance
    )

def get_payments(
    db: Session, user_id: int, customer_id: Optional[int] = None, limit: int = 100
) -> List[PaymentOut]:
    query = db.query(Payment).filter(Payment.user_id == user_id)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
    payments = query.order_by(Payment.payment_date.desc()).limit(limit).all()

    results = []
    for p in payments:
        cust = p.customer
        results.append(PaymentOut(
            id=p.id,
            customer_id=p.customer_id,
            customer_name=cust.name if cust else "Unknown",
            customer_phone=cust.phone if cust else "",
            customer_serial=cust.customer_serial_number if cust else "",
            bill_id=p.bill_id,
            amount=p.amount,
            payment_method=p.payment_method,
            notes=p.notes,
            payment_date=p.payment_date,
            created_at=p.created_at,
            previous_balance=0.0,
            new_balance=0.0
        ))
    return results

def get_customer_ledger(db: Session, user: User, customer_id: int) -> CustomerLedgerSummary:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user.id
    ).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    transactions = db.query(Transaction).filter(
        Transaction.customer_id == customer.id,
        Transaction.user_id == user.id
    ).order_by(Transaction.transaction_date.asc(), Transaction.id.asc()).all()

    tx_outs = []
    running = 0.0
    total_purchases = 0.0
    total_payments = 0.0

    for t in transactions:
        running += (t.debit - t.credit)
        total_purchases += t.debit
        total_payments += t.credit
        bill_num = t.bill.bill_number if t.bill else None
        tx_outs.append(TransactionOut(
            id=t.id,
            customer_id=t.customer_id,
            customer_name=customer.name,
            bill_id=t.bill_id,
            bill_number=bill_num,
            payment_id=t.payment_id,
            transaction_type=t.transaction_type,
            amount=t.amount,
            debit=t.debit,
            credit=t.credit,
            running_balance=round(running, 2),
            description=t.description,
            transaction_date=t.transaction_date,
            created_at=t.created_at,
        ))

    # Reverse for UI timeline display (newest first)
    tx_outs.reverse()

    return CustomerLedgerSummary(
        customer=enrich_customer_out(db, customer),
        total_purchases=round(total_purchases, 2),
        total_payments=round(total_payments, 2),
        current_outstanding_balance=round(running, 2),
        transactions=tx_outs
    )
