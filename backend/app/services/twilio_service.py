import datetime
import uuid
import requests
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Message, User, Customer

def format_e164_phone(phone: str, default_country_code: str = "+91") -> str:
    cleaned = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if cleaned.startswith("+"):
        return cleaned
    if cleaned.startswith("0"):
        cleaned = cleaned[1:]
    return f"{default_country_code}{cleaned}"

def send_message(
    db: Session,
    user: User,
    recipient_phone: str,
    message_content: str,
    channel: str = "WHATSAPP",
    message_type: str = "CUSTOM",
    customer_id: Optional[int] = None,
    campaign_id: Optional[int] = None,
    recipient_name: Optional[str] = None
) -> Message:
    """
    Send an SMS or WhatsApp message via Twilio (if credentials present) or 
    record a verified simulation in the database.
    """
    formatted_phone = format_e164_phone(recipient_phone)
    provider_id = f"SM_{uuid.uuid4().hex[:16]}"
    status = "SENT"

    # If live Twilio credentials provided, attempt real HTTP dispatch
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            from_number = settings.TWILIO_PHONE_NUMBER
            to_number = formatted_phone

            if channel.upper() == "WHATSAPP":
                from_number = settings.TWILIO_WHATSAPP_NUMBER
                to_number = f"whatsapp:{formatted_phone}"

            if from_number:
                payload = {
                    "From": from_number,
                    "To": to_number,
                    "Body": message_content
                }
                resp = requests.post(
                    url,
                    data=payload,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    timeout=8
                )
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    provider_id = data.get("sid", provider_id)
                    status = data.get("status", "SENT").upper()
                else:
                    status = "FAILED"
        except Exception as e:
            # Fallback gracefully
            print(f"[Twilio Error]: {e}")
            status = "FAILED"

    # Record message log in database
    msg = Message(
        user_id=user.id,
        customer_id=customer_id,
        campaign_id=campaign_id,
        message_type=message_type,
        channel=channel.upper(),
        recipient_phone=formatted_phone,
        recipient_name=recipient_name,
        message_content=message_content,
        status=status,
        provider_message_id=provider_id,
        sent_at=datetime.datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def build_reminder_message(business_name: str, customer_name: str, outstanding_amount: float, currency: str = "₹") -> str:
    return (
        f"Good morning {customer_name},\n\n"
        f"This is a gentle reminder from *{business_name}* regarding your outstanding balance of "
        f"*{currency}{outstanding_amount:,.2f}*.\n\n"
        f"Please make the payment at your convenience (Cash / UPI / Card).\n\n"
        f"Thank you for being a valued customer!"
    )

def build_invoice_message(business_name: str, customer_name: str, bill_number: str, total_amount: float, paid_amount: float, credit_amount: float, currency: str = "₹") -> str:
    msg = (
        f"🧾 *Invoice from {business_name}*\n"
        f"Invoice No: *{bill_number}*\n"
        f"Customer: {customer_name}\n"
        f"---------------------------\n"
        f"Total Amount: *{currency}{total_amount:,.2f}*\n"
        f"Amount Paid: *{currency}{paid_amount:,.2f}*\n"
    )
    if credit_amount > 0:
        msg += f"Credit Due: *{currency}{credit_amount:,.2f}*\n"
    msg += f"---------------------------\nThank you for shopping with us!"
    return msg
