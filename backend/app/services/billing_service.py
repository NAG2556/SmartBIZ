import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Bill, BillItem, Customer, Product, Payment, Transaction, User
from app.schemas.schemas import BillCreate, BillOut, BillItemOut
from app.services.customer_service import calculate_customer_balance

def generate_bill_number(db: Session, user: User) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(Bill).filter(Bill.user_id == user.id).count()
    prefix = user.invoice_prefix or "INV"
    return f"{prefix}-{year}-{(count + 1):04d}"

def create_bill(db: Session, user: User, data: BillCreate) -> BillOut:
    # 1. Validate customer belongs to user
    customer = db.query(Customer).filter(
        Customer.id == data.customer_id,
        Customer.user_id == user.id,
        Customer.is_active == True
    ).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    if not data.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bill must have at least one item")

    # 2. Compute line items and subtotal safely on backend
    computed_items = []
    subtotal = 0.0

    for item in data.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid quantity for {item.product_name}")
        
        unit_price = item.unit_price
        # If product_id given, verify product and update stock if physical product
        if item.product_id:
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.user_id == user.id
            ).first()
            if product and not product.is_service:
                product.stock_quantity = max(0.0, product.stock_quantity - item.quantity)
        
        line_subtotal = round(item.quantity * unit_price, 2)
        subtotal += line_subtotal
        computed_items.append({
            "product_id": item.product_id,
            "product_name": item.product_name.strip(),
            "unit": item.unit or "pcs",
            "quantity": item.quantity,
            "unit_price": unit_price,
            "subtotal": line_subtotal
        })

    discount = max(0.0, data.discount_amount or 0.0)
    total_amount = max(0.0, round(subtotal - discount, 2))
    amount_paid = max(0.0, round(data.amount_paid or 0.0, 2))
    
    # Cap amount paid at total_amount for this bill
    if amount_paid > total_amount:
        amount_paid = total_amount
    credit_amount = round(total_amount - amount_paid, 2)

    bill_num = generate_bill_number(db, user)
    bill_date = data.bill_date or datetime.datetime.utcnow()

    # 3. Create Bill record
    bill = Bill(
        user_id=user.id,
        customer_id=customer.id,
        bill_number=bill_num,
        subtotal=round(subtotal, 2),
        discount_amount=discount,
        total_amount=total_amount,
        amount_paid=amount_paid,
        credit_amount=credit_amount,
        payment_method=data.payment_method or "Cash",
        notes=data.notes,
        bill_date=bill_date,
    )
    db.add(bill)
    db.flush()  # to get bill.id

    # 4. Create BillItem records
    item_outs = []
    for ci in computed_items:
        bi = BillItem(
            bill_id=bill.id,
            product_id=ci["product_id"],
            product_name=ci["product_name"],
            unit=ci["unit"],
            quantity=ci["quantity"],
            unit_price=ci["unit_price"],
            subtotal=ci["subtotal"]
        )
        db.add(bi)
        db.flush()
        item_outs.append(BillItemOut(
            id=bi.id,
            product_id=bi.product_id,
            product_name=bi.product_name,
            unit=bi.unit,
            quantity=bi.quantity,
            unit_price=bi.unit_price,
            subtotal=bi.subtotal
        ))

    # 5. Create Payment record if amount_paid > 0
    payment_id = None
    if amount_paid > 0:
        payment = Payment(
            user_id=user.id,
            customer_id=customer.id,
            bill_id=bill.id,
            amount=amount_paid,
            payment_method=data.payment_method or "Cash",
            notes=f"Payment for invoice {bill_num}",
            payment_date=bill_date,
        )
        db.add(payment)
        db.flush()
        payment_id = payment.id

    # 6. Ledger Transaction (Source of Truth)
    prev_balance = calculate_customer_balance(db, customer.id)
    new_balance = round(prev_balance + credit_amount, 2)

    tx_desc = f"Bill {bill_num} (Total: {user.currency}{total_amount}, Paid: {user.currency}{amount_paid}, Credit: {user.currency}{credit_amount})"
    transaction = Transaction(
        user_id=user.id,
        customer_id=customer.id,
        bill_id=bill.id,
        payment_id=payment_id,
        transaction_type="PURCHASE",
        amount=total_amount,
        debit=total_amount,
        credit=amount_paid,
        running_balance=new_balance,
        description=tx_desc,
        transaction_date=bill_date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(bill)

    return BillOut(
        id=bill.id,
        bill_number=bill.bill_number,
        customer_id=customer.id,
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_serial=customer.customer_serial_number,
        subtotal=bill.subtotal,
        discount_amount=bill.discount_amount,
        total_amount=bill.total_amount,
        amount_paid=bill.amount_paid,
        credit_amount=bill.credit_amount,
        payment_method=bill.payment_method,
        notes=bill.notes,
        bill_date=bill.bill_date,
        created_at=bill.created_at,
        items=item_outs,
        previous_balance=prev_balance,
        new_outstanding_balance=new_balance
    )

def get_bills(
    db: Session, user_id: int, customer_id: Optional[int] = None, limit: int = 100
) -> List[BillOut]:
    query = db.query(Bill).filter(Bill.user_id == user_id)
    if customer_id:
        query = query.filter(Bill.customer_id == customer_id)
    bills = query.order_by(Bill.bill_date.desc()).limit(limit).all()

    results = []
    for b in bills:
        customer = b.customer
        item_outs = [
            BillItemOut(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                unit=item.unit,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal
            ) for item in b.items
        ]
        results.append(BillOut(
            id=b.id,
            bill_number=b.bill_number,
            customer_id=b.customer_id,
            customer_name=customer.name if customer else "Unknown",
            customer_phone=customer.phone if customer else "",
            customer_serial=customer.customer_serial_number if customer else "",
            subtotal=b.subtotal,
            discount_amount=b.discount_amount,
            total_amount=b.total_amount,
            amount_paid=b.amount_paid,
            credit_amount=b.credit_amount,
            payment_method=b.payment_method,
            notes=b.notes,
            bill_date=b.bill_date,
            created_at=b.created_at,
            items=item_outs,
            previous_balance=0.0,
            new_outstanding_balance=calculate_customer_balance(db, b.customer_id) if customer else 0.0
        ))
    return results

def get_bill_by_id(db: Session, user_id: int, bill_id: int) -> Optional[BillOut]:
    b = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == user_id).first()
    if not b:
        return None
    customer = b.customer
    item_outs = [
        BillItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product_name,
            unit=item.unit,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal
        ) for item in b.items
    ]
    return BillOut(
        id=b.id,
        bill_number=b.bill_number,
        customer_id=b.customer_id,
        customer_name=customer.name if customer else "Unknown",
        customer_phone=customer.phone if customer else "",
        customer_serial=customer.customer_serial_number if customer else "",
        subtotal=b.subtotal,
        discount_amount=b.discount_amount,
        total_amount=b.total_amount,
        amount_paid=b.amount_paid,
        credit_amount=b.credit_amount,
        payment_method=b.payment_method,
        notes=b.notes,
        bill_date=b.bill_date,
        created_at=b.created_at,
        items=item_outs,
        previous_balance=0.0,
        new_outstanding_balance=calculate_customer_balance(db, b.customer_id) if customer else 0.0
    )
