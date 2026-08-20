import re
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Customer, Transaction, Bill, Payment
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerOut, CustomerLookupResponse

def normalize_phone(phone: str) -> str:
    """Normalize phone number by removing spaces, dashes, parentheses and leading zeros."""
    if not phone:
        return ""
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    # If 10-digit Indian number without country code, keep standard 10 digits
    if len(cleaned) == 10 and not cleaned.startswith("+"):
        return cleaned
    if cleaned.startswith("+91") and len(cleaned) == 13:
        return cleaned[3:]
    return cleaned

def generate_customer_serial(db: Session, user_id: int) -> str:
    """Generate next serial number like CUST-0001 for the business."""
    count = db.query(Customer).filter(Customer.user_id == user_id).count()
    return f"CUST-{(count + 1):04d}"

def calculate_customer_balance(db: Session, customer_id: int) -> float:
    """
    Source of truth balance calculation:
    Balance = Total Debit (Purchases) - Total Credit (Payments)
    """
    total_debit = db.query(func.coalesce(func.sum(Transaction.debit), 0.0)).filter(
        Transaction.customer_id == customer_id
    ).scalar() or 0.0

    total_credit = db.query(func.coalesce(func.sum(Transaction.credit), 0.0)).filter(
        Transaction.customer_id == customer_id
    ).scalar() or 0.0

    return round(float(total_debit - total_credit), 2)

def enrich_customer_out(db: Session, customer: Customer) -> CustomerOut:
    balance = calculate_customer_balance(db, customer.id)
    total_purchases = db.query(func.coalesce(func.sum(Transaction.debit), 0.0)).filter(
        Transaction.customer_id == customer.id
    ).scalar() or 0.0
    total_payments = db.query(func.coalesce(func.sum(Transaction.credit), 0.0)).filter(
        Transaction.customer_id == customer.id
    ).scalar() or 0.0
    bills_count = db.query(Bill).filter(Bill.customer_id == customer.id).count()

    return CustomerOut(
        id=customer.id,
        customer_serial_number=customer.customer_serial_number,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        address=customer.address,
        notes=customer.notes,
        is_active=customer.is_active,
        outstanding_balance=round(balance, 2),
        total_purchases=round(float(total_purchases), 2),
        total_payments=round(float(total_payments), 2),
        bills_count=bills_count,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
    )

def lookup_customer_by_phone(db: Session, user_id: int, raw_phone: str) -> CustomerLookupResponse:
    norm = normalize_phone(raw_phone)
    if not norm:
        return CustomerLookupResponse(found=False, customer=None, normalized_phone="")

    # Search by normalized or exact phone for this business
    customers = db.query(Customer).filter(
        Customer.user_id == user_id,
        Customer.is_active == True
    ).all()

    matched = None
    for c in customers:
        if normalize_phone(c.phone) == norm or c.phone.endswith(norm) or norm.endswith(normalize_phone(c.phone)):
            matched = c
            break

    if matched:
        return CustomerLookupResponse(
            found=True,
            customer=enrich_customer_out(db, matched),
            normalized_phone=norm
        )
    return CustomerLookupResponse(found=False, customer=None, normalized_phone=norm)

def create_customer(db: Session, user_id: int, data: CustomerCreate) -> CustomerOut:
    norm_phone = normalize_phone(data.phone)
    # Check if duplicate phone exists for this business
    existing = db.query(Customer).filter(
        Customer.user_id == user_id,
        Customer.phone == norm_phone
    ).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.name = data.name
            existing.email = data.email
            existing.address = data.address
            db.commit()
            db.refresh(existing)
            return enrich_customer_out(db, existing)
        return enrich_customer_out(db, existing)

    serial = generate_customer_serial(db, user_id)
    customer = Customer(
        user_id=user_id,
        customer_serial_number=serial,
        name=data.name.strip(),
        phone=norm_phone,
        email=data.email.strip() if data.email else None,
        address=data.address.strip() if data.address else None,
        notes=data.notes.strip() if data.notes else None,
        is_active=True,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return enrich_customer_out(db, customer)

def get_customers(
    db: Session, user_id: int, search: Optional[str] = None, only_outstanding: bool = False
) -> List[CustomerOut]:
    query = db.query(Customer).filter(Customer.user_id == user_id, Customer.is_active == True)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Customer.name.ilike(s)) |
            (Customer.phone.ilike(s)) |
            (Customer.customer_serial_number.ilike(s))
        )

    customers = query.order_by(Customer.created_at.desc()).all()
    results = [enrich_customer_out(db, c) for c in customers]

    if only_outstanding:
        results = [c for c in results if c.outstanding_balance > 0.01]

    return results

def get_customer_by_id(db: Session, user_id: int, customer_id: int) -> Optional[CustomerOut]:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user_id
    ).first()
    if not customer:
        return None
    return enrich_customer_out(db, customer)

def update_customer(db: Session, user_id: int, customer_id: int, data: CustomerUpdate) -> Optional[CustomerOut]:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user_id
    ).first()
    if not customer:
        return None

    if data.name is not None:
        customer.name = data.name.strip()
    if data.phone is not None:
        customer.phone = normalize_phone(data.phone)
    if data.email is not None:
        customer.email = data.email.strip() if data.email else None
    if data.address is not None:
        customer.address = data.address.strip() if data.address else None
    if data.notes is not None:
        customer.notes = data.notes.strip() if data.notes else None
    if data.is_active is not None:
        customer.is_active = data.is_active

    db.commit()
    db.refresh(customer)
    return enrich_customer_out(db, customer)

def delete_customer(db: Session, user_id: int, customer_id: int) -> bool:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user_id
    ).first()
    if not customer:
        return False
    customer.is_active = False
    db.commit()
    return True
