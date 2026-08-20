import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.models.models import Bill, Payment, Customer, Product, Transaction, BillItem, User, Message
from app.schemas.schemas import (
    DashboardStats, SalesTrendItem, TopCustomerItem, TopProductItem
)
from app.services.customer_service import calculate_customer_balance, get_customers

def get_dashboard_stats(db: Session, user: User) -> DashboardStats:
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    # 1. Today's Sales
    today_sales = db.query(func.coalesce(func.sum(Bill.total_amount), 0.0)).filter(
        Bill.user_id == user.id,
        Bill.bill_date >= today_start,
        Bill.bill_date < today_end
    ).scalar() or 0.0

    # 2. Today's Collection
    today_collection = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.user_id == user.id,
        Payment.payment_date >= today_start,
        Payment.payment_date < today_end
    ).scalar() or 0.0

    # 3. Today's Credit Generated
    today_credit = db.query(func.coalesce(func.sum(Bill.credit_amount), 0.0)).filter(
        Bill.user_id == user.id,
        Bill.bill_date >= today_start,
        Bill.bill_date < today_end
    ).scalar() or 0.0

    # 4. Total Outstanding Credit across all active customers
    all_customers = db.query(Customer).filter(
        Customer.user_id == user.id,
        Customer.is_active == True
    ).all()
    total_outstanding = 0.0
    for c in all_customers:
        bal = calculate_customer_balance(db, c.id)
        if bal > 0:
            total_outstanding += bal

    # 5. Total counts
    total_customers = len(all_customers)
    total_products = db.query(Product).filter(Product.user_id == user.id, Product.is_active == True).count()
    total_tx = db.query(Transaction).filter(Transaction.user_id == user.id).count()

    return DashboardStats(
        today_sales=round(float(today_sales), 2),
        today_collection=round(float(today_collection), 2),
        today_credit=round(float(today_credit), 2),
        total_outstanding_credit=round(total_outstanding, 2),
        total_customers=total_customers,
        total_products=total_products,
        total_transactions_count=total_tx,
        currency=user.currency or "₹"
    )

def get_sales_trends(db: Session, user: User, days: int = 7) -> List[SalesTrendItem]:
    today = datetime.datetime.utcnow().date()
    start_date = today - datetime.timedelta(days=days - 1)
    
    results = []
    for i in range(days):
        current_date = start_date + datetime.timedelta(days=i)
        day_start = datetime.datetime.combine(current_date, datetime.time.min)
        day_end = datetime.datetime.combine(current_date, datetime.time.max)

        sales = db.query(func.coalesce(func.sum(Bill.total_amount), 0.0)).filter(
            Bill.user_id == user.id,
            Bill.bill_date >= day_start,
            Bill.bill_date <= day_end
        ).scalar() or 0.0

        collection = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
            Payment.user_id == user.id,
            Payment.payment_date >= day_start,
            Payment.payment_date <= day_end
        ).scalar() or 0.0

        credit = db.query(func.coalesce(func.sum(Bill.credit_amount), 0.0)).filter(
            Bill.user_id == user.id,
            Bill.bill_date >= day_start,
            Bill.bill_date <= day_end
        ).scalar() or 0.0

        results.append(SalesTrendItem(
            date=current_date.strftime("%d %b"),
            sales=round(float(sales), 2),
            collection=round(float(collection), 2),
            credit=round(float(credit), 2)
        ))

    return results

def get_top_customers(db: Session, user: User, limit: int = 5) -> List[TopCustomerItem]:
    customers = db.query(Customer).filter(Customer.user_id == user.id, Customer.is_active == True).all()
    enriched = []
    for c in customers:
        total_spent = db.query(func.coalesce(func.sum(Bill.total_amount), 0.0)).filter(
            Bill.customer_id == c.id,
            Bill.user_id == user.id
        ).scalar() or 0.0
        bills_count = db.query(Bill).filter(Bill.customer_id == c.id, Bill.user_id == user.id).count()
        bal = calculate_customer_balance(db, c.id)

        enriched.append(TopCustomerItem(
            customer_id=c.id,
            name=c.name,
            phone=c.phone,
            serial_number=c.customer_serial_number,
            total_spent=round(float(total_spent), 2),
            outstanding_balance=round(bal, 2),
            bills_count=bills_count
        ))

    enriched.sort(key=lambda x: x.total_spent, reverse=True)
    return enriched[:limit]

def get_top_products(db: Session, user: User, limit: int = 5) -> List[TopProductItem]:
    # Group bill items by product name
    items = db.query(
        BillItem.product_name,
        func.coalesce(func.sum(BillItem.quantity), 0.0).label("qty"),
        func.coalesce(func.sum(BillItem.subtotal), 0.0).label("revenue")
    ).join(Bill, Bill.id == BillItem.bill_id).filter(
        Bill.user_id == user.id
    ).group_by(BillItem.product_name).order_by(func.sum(BillItem.subtotal).desc()).limit(limit).all()

    return [
        TopProductItem(
            product_id=None,
            name=row[0],
            total_quantity_sold=round(float(row[1]), 2),
            total_revenue=round(float(row[2]), 2)
        ) for row in items
    ]

def get_credit_aging_report(db: Session, user: User) -> List[Dict[str, Any]]:
    customers = db.query(Customer).filter(Customer.user_id == user.id, Customer.is_active == True).all()
    now = datetime.datetime.utcnow()
    report = []

    for c in customers:
        bal = calculate_customer_balance(db, c.id)
        if bal <= 0:
            continue

        # Find latest purchase or unpaid bill
        latest_bill = db.query(Bill).filter(
            Bill.customer_id == c.id,
            Bill.user_id == user.id,
            Bill.credit_amount > 0
        ).order_by(Bill.bill_date.desc()).first()

        days_pending = 0
        if latest_bill and latest_bill.bill_date:
            days_pending = (now - latest_bill.bill_date).days

        bucket = "0-15 Days"
        if days_pending > 30:
            bucket = "30+ Days (High Priority)"
        elif days_pending > 15:
            bucket = "16-30 Days"

        report.append({
            "customer_id": c.id,
            "name": c.name,
            "phone": c.phone,
            "serial_number": c.customer_serial_number,
            "outstanding_balance": round(bal, 2),
            "days_pending": max(1, days_pending),
            "aging_bucket": bucket,
            "last_bill_date": latest_bill.bill_date.strftime("%Y-%m-%d") if latest_bill else "N/A"
        })

    report.sort(key=lambda x: x["outstanding_balance"], reverse=True)
    return report
