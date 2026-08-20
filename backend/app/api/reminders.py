from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.services.reminder_service import process_daily_payment_reminders

router = APIRouter(prefix="/reminders", tags=["Automated Payment Reminders"])

@router.post("/trigger-now", response_model=Dict[str, Any])
def trigger_payment_reminders_now(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Evaluates all active customers of the business with outstanding balances >= min_reminder_amount,
    prepares polite morning reminders, and dispatches via Twilio WhatsApp/SMS.
    """
    return process_daily_payment_reminders(db, target_user_id=user.id)
