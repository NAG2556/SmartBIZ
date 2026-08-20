from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserUpdate, UserOut, Token

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip() if data.phone else None,
        hashed_password=get_password_hash(data.password),
        business_name=data.business_name.strip(),
        business_type=data.business_type or "General Store",
        address=data.address.strip() if data.address else None,
        currency=data.currency or "₹",
        invoice_prefix="INV",
        sms_reminder_enabled=True,
        whatsapp_reminder_enabled=True,
        min_reminder_amount=100.0,
        reminder_time="09:00"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    login_id = data.email.strip().lower()
    user = db.query(User).filter((User.email == login_id) | (User.phone == login_id)).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password"
        )

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)

@router.put("/me", response_model=UserOut)
def update_profile(data: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.name is not None:
        user.name = data.name.strip()
    if data.phone is not None:
        user.phone = data.phone.strip()
    if data.business_name is not None:
        user.business_name = data.business_name.strip()
    if data.business_type is not None:
        user.business_type = data.business_type.strip()
    if data.business_phone is not None:
        user.business_phone = data.business_phone.strip()
    if data.business_email is not None:
        user.business_email = data.business_email.strip()
    if data.address is not None:
        user.address = data.address.strip()
    if data.currency is not None:
        user.currency = data.currency.strip()
    if data.invoice_prefix is not None:
        user.invoice_prefix = data.invoice_prefix.strip().upper()
    if data.sms_reminder_enabled is not None:
        user.sms_reminder_enabled = data.sms_reminder_enabled
    if data.whatsapp_reminder_enabled is not None:
        user.whatsapp_reminder_enabled = data.whatsapp_reminder_enabled
    if data.min_reminder_amount is not None:
        user.min_reminder_amount = max(0.0, data.min_reminder_amount)
    if data.reminder_time is not None:
        user.reminder_time = data.reminder_time.strip()

    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
