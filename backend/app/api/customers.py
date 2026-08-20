from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerOut, CustomerLookupResponse, CustomerLedgerSummary
from app.services.customer_service import (
    create_customer, get_customers, get_customer_by_id, update_customer, delete_customer, lookup_customer_by_phone
)
from app.services.payment_service import get_customer_ledger

router = APIRouter(prefix="/customers", tags=["Customer Management"])

@router.get("/lookup", response_model=CustomerLookupResponse)
def lookup_customer(
    phone: str = Query(..., description="Customer phone number to identify"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Smart Customer Identification: Search phone number instantly for billing/lookup."""
    return lookup_customer_by_phone(db, user.id, phone)

@router.get("/", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, phone, or serial number"),
    only_outstanding: bool = Query(False, description="Filter only customers who owe money"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_customers(db, user.id, search=search, only_outstanding=only_outstanding)

@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def add_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return create_customer(db, user.id, data)

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    customer = get_customer_by_id(db, user.id, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerOut)
def edit_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    customer = update_customer(db, user.id, customer_id, data)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.delete("/{customer_id}")
def remove_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    success = delete_customer(db, user.id, customer_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return {"message": "Customer deactivated successfully"}

@router.get("/{customer_id}/ledger", response_model=CustomerLedgerSummary)
def customer_ledger(
    customer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Retrieve complete financial transaction history and running balance for this customer."""
    return get_customer_ledger(db, user, customer_id)
