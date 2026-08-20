from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import PaymentCreate, PaymentOut
from app.services.payment_service import record_customer_payment, get_payments

router = APIRouter(prefix="/payments", tags=["Payment Management"])

@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Record customer payment and automatically reconcile outstanding ledger balance."""
    return record_customer_payment(db, user, data)

@router.get("/", response_model=List[PaymentOut])
def list_payments(
    customer_id: Optional[int] = Query(None, description="Filter payments by customer"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_payments(db, user.id, customer_id=customer_id, limit=limit)
