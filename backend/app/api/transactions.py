from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Transaction
from app.schemas.schemas import TransactionOut

router = APIRouter(prefix="/transactions", tags=["Financial Transactions & Ledger"])

@router.get("/", response_model=List[TransactionOut])
def list_transactions(
    customer_id: Optional[int] = Query(None, description="Filter by customer"),
    transaction_type: Optional[str] = Query(None, description="PURCHASE, PAYMENT, etc."),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Retrieve all business ledger transactions (the immutable source of truth for customer balances)."""
    query = db.query(Transaction).filter(Transaction.user_id == user.id)
    if customer_id:
        query = query.filter(Transaction.customer_id == customer_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    txs = query.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).limit(limit).all()

    results = []
    for t in txs:
        cust = t.customer
        bill_num = t.bill.bill_number if t.bill else None
        results.append(TransactionOut(
            id=t.id,
            customer_id=t.customer_id,
            customer_name=cust.name if cust else "Unknown",
            bill_id=t.bill_id,
            bill_number=bill_num,
            payment_id=t.payment_id,
            transaction_type=t.transaction_type,
            amount=t.amount,
            debit=t.debit,
            credit=t.credit,
            running_balance=t.running_balance,
            description=t.description,
            transaction_date=t.transaction_date,
            created_at=t.created_at,
        ))
    return results
