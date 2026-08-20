from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Message
from app.schemas.schemas import MessageCreate, MessageOut
from app.services.twilio_service import send_message

router = APIRouter(prefix="/messages", tags=["Communication & Twilio Messaging"])

@router.post("/send", response_model=MessageOut)
def dispatch_single_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    msg = send_message(
        db=db,
        user=user,
        recipient_phone=data.recipient_phone,
        message_content=data.message_content,
        channel=data.channel or "WHATSAPP",
        message_type=data.message_type or "CUSTOM",
        customer_id=data.customer_id,
        recipient_name=data.recipient_name
    )
    return MessageOut.model_validate(msg)

@router.get("/logs", response_model=List[MessageOut])
def get_message_logs(
    customer_id: Optional[int] = Query(None, description="Filter by customer"),
    channel: Optional[str] = Query(None, description="Filter by channel (WHATSAPP, SMS)"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Message).filter(Message.user_id == user.id)
    if customer_id:
        query = query.filter(Message.customer_id == customer_id)
    if channel:
        query = query.filter(Message.channel == channel.upper())
    
    logs = query.order_by(Message.sent_at.desc()).limit(limit).all()
    return [MessageOut.model_validate(m) for m in logs]
