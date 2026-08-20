from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import User, Customer, Message
from app.services.customer_service import calculate_customer_balance
from app.services.twilio_service import send_message, build_reminder_message

def process_daily_payment_reminders(db: Session, target_user_id: Optional[int] = None) -> Dict[str, Any]:
    query = db.query(User)
    if target_user_id:
        query = query.filter(User.id == target_user_id)
    else:
        query = query.filter((User.whatsapp_reminder_enabled == True) | (User.sms_reminder_enabled == True))

    users = query.all()
    total_sent = 0
    total_reminded_amount = 0.0
    detailed_logs = []

    for user in users:
        min_amount = user.min_reminder_amount or 50.0
        channel = "WHATSAPP" if user.whatsapp_reminder_enabled else "SMS"

        customers = db.query(Customer).filter(Customer.user_id == user.id, Customer.is_active == True).all()
        for cust in customers:
            balance = calculate_customer_balance(db, cust.id)
            if balance >= min_amount:
                # Build reminder message
                msg_body = build_reminder_message(
                    business_name=user.business_name,
                    customer_name=cust.name,
                    outstanding_amount=balance,
                    currency=user.currency or "₹"
                )
                # Dispatch
                msg = send_message(
                    db=db,
                    user=user,
                    recipient_phone=cust.phone,
                    message_content=msg_body,
                    channel=channel,
                    message_type="REMINDER",
                    customer_id=cust.id,
                    recipient_name=cust.name
                )
                total_sent += 1
                total_reminded_amount += balance
                detailed_logs.append({
                    "customer_id": cust.id,
                    "customer_name": cust.name,
                    "phone": cust.phone,
                    "balance": balance,
                    "channel": channel,
                    "message_id": msg.id
                })

    return {
        "reminders_sent": total_sent,
        "total_outstanding_reminded": round(total_reminded_amount, 2),
        "details": detailed_logs
    }
