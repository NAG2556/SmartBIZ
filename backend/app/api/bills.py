from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import BillCreate, BillOut
from app.services.billing_service import create_bill, get_bills, get_bill_by_id

router = APIRouter(prefix="/bills", tags=["Smart Billing & Invoices"])

@router.post("/", response_model=BillOut, status_code=status.HTTP_201_CREATED)
def create_new_bill(
    data: BillCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Create a new smart invoice, perform backend calculations, deduct stock, and update customer ledger."""
    return create_bill(db, user, data)

@router.get("/", response_model=List[BillOut])
def list_bills(
    customer_id: Optional[int] = Query(None, description="Filter bills by customer"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_bills(db, user.id, customer_id=customer_id, limit=limit)

@router.get("/{bill_id}", response_model=BillOut)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    bill = get_bill_by_id(db, user.id, bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    return bill
