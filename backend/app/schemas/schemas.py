import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    EmailStr = str


# --- AUTH & USER ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    business_name: str
    business_type: Optional[str] = "General Store"
    address: Optional[str] = None
    currency: Optional[str] = "₹"

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None
    invoice_prefix: Optional[str] = None
    sms_reminder_enabled: Optional[bool] = None
    whatsapp_reminder_enabled: Optional[bool] = None
    min_reminder_amount: Optional[float] = None
    reminder_time: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    business_name: str
    business_type: str
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    address: Optional[str] = None
    currency: str
    invoice_prefix: str
    sms_reminder_enabled: bool
    whatsapp_reminder_enabled: bool
    min_reminder_amount: float
    reminder_time: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- CUSTOMER ---
class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class CustomerOut(BaseModel):
    id: int
    customer_serial_number: str
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    outstanding_balance: float = 0.0
    total_purchases: float = 0.0
    total_payments: float = 0.0
    bills_count: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class CustomerLookupResponse(BaseModel):
    found: bool
    customer: Optional[CustomerOut] = None
    normalized_phone: str


# --- PRODUCT ---
class ProductCreate(BaseModel):
    name: str
    category: Optional[str] = "General"
    description: Optional[str] = None
    selling_price: float
    cost_price: Optional[float] = 0.0
    stock_quantity: Optional[float] = 0.0
    unit: Optional[str] = "pcs"
    is_service: Optional[bool] = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[float] = None
    unit: Optional[str] = None
    is_service: Optional[bool] = None
    is_active: Optional[bool] = None

class ProductPriceUpdate(BaseModel):
    new_price: float
    notify_customers: bool = False
    custom_message: Optional[str] = None

class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str] = None
    selling_price: float
    cost_price: Optional[float] = 0.0
    stock_quantity: float
    unit: str
    is_service: bool
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- BILLING & BILL ITEMS ---
class BillItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    unit: Optional[str] = "pcs"
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)

class BillItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    unit: str
    quantity: float
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class BillCreate(BaseModel):
    customer_id: int
    items: List[BillItemCreate]
    discount_amount: Optional[float] = 0.0
    amount_paid: Optional[float] = 0.0
    payment_method: Optional[str] = "Cash"
    notes: Optional[str] = None
    bill_date: Optional[datetime.datetime] = None

class BillOut(BaseModel):
    id: int
    bill_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_serial: Optional[str] = None
    subtotal: float
    discount_amount: float
    total_amount: float
    amount_paid: float
    credit_amount: float
    payment_method: str
    notes: Optional[str] = None
    bill_date: datetime.datetime
    created_at: datetime.datetime
    items: List[BillItemOut] = []
    previous_balance: float = 0.0
    new_outstanding_balance: float = 0.0

    class Config:
        from_attributes = True


# --- PAYMENTS ---
class PaymentCreate(BaseModel):
    customer_id: int
    bill_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    payment_method: Optional[str] = "Cash"
    notes: Optional[str] = None
    payment_date: Optional[datetime.datetime] = None

class PaymentOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_serial: Optional[str] = None
    bill_id: Optional[int] = None
    amount: float
    payment_method: str
    notes: Optional[str] = None
    payment_date: datetime.datetime
    created_at: datetime.datetime
    previous_balance: float = 0.0
    new_balance: float = 0.0

    class Config:
        from_attributes = True


# --- TRANSACTIONS & LEDGER ---
class TransactionOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    bill_id: Optional[int] = None
    bill_number: Optional[str] = None
    payment_id: Optional[int] = None
    transaction_type: str
    amount: float
    debit: float
    credit: float
    running_balance: float
    description: Optional[str] = None
    transaction_date: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CustomerLedgerSummary(BaseModel):
    customer: CustomerOut
    total_purchases: float
    total_payments: float
    current_outstanding_balance: float
    transactions: List[TransactionOut] = []


# --- DASHBOARD & ANALYTICS ---
class DashboardStats(BaseModel):
    today_sales: float
    today_collection: float
    today_credit: float
    total_outstanding_credit: float
    total_customers: int
    total_products: int
    total_transactions_count: int
    currency: str = "₹"

class SalesTrendItem(BaseModel):
    date: str
    sales: float
    collection: float
    credit: float

class TopCustomerItem(BaseModel):
    customer_id: int
    name: str
    phone: str
    serial_number: str
    total_spent: float
    outstanding_balance: float
    bills_count: int

class TopProductItem(BaseModel):
    product_id: Optional[int] = None
    name: str
    total_quantity_sold: float
    total_revenue: float


# --- MESSAGES & CAMPAIGNS ---
class MessageCreate(BaseModel):
    customer_id: Optional[int] = None
    recipient_phone: str
    recipient_name: Optional[str] = None
    message_content: str
    channel: Optional[str] = "WHATSAPP"  # WHATSAPP, SMS
    message_type: Optional[str] = "CUSTOM"

class MessageOut(BaseModel):
    id: int
    customer_id: Optional[int] = None
    recipient_phone: str
    recipient_name: Optional[str] = None
    message_type: str
    channel: str
    message_content: str
    status: str
    provider_message_id: Optional[str] = None
    created_at: datetime.datetime
    sent_at: datetime.datetime

    class Config:
        from_attributes = True

class CampaignCreate(BaseModel):
    title: str
    campaign_type: str  # BULK_OFFER, PERSONALIZED_OFFER, PRICE_HIKE, PAYMENT_REMINDER
    channel: Optional[str] = "WHATSAPP"
    audience_type: Optional[str] = "ALL"  # ALL, PAST_BUYERS, OUTSTANDING, SELECTED
    selected_customer_ids: Optional[List[int]] = None
    message_template: str
    discount_percentage: Optional[float] = None
    target_product_id: Optional[int] = None

class CampaignOut(BaseModel):
    id: int
    title: str
    campaign_type: str
    channel: str
    audience_type: str
    message_template: str
    discount_percentage: Optional[float] = None
    target_product_id: Optional[int] = None
    target_product_name: Optional[str] = None
    status: str
    recipient_count: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class PersonalizedOfferCustomer(BaseModel):
    customer_id: int
    customer_name: str
    customer_phone: str
    frequent_product_name: str
    frequent_product_id: Optional[int] = None
    purchase_count: int
    suggested_discount: float
    personalized_message: str

class PriceHikeNotificationPreview(BaseModel):
    product_name: str
    old_price: float
    new_price: float
    target_customers_count: int
    customers: List[Dict[str, Any]]
    sample_message: str


# --- AI ASSISTANT ---
class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class AIToolExecuted(BaseModel):
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output: Any

class AIChatResponse(BaseModel):
    reply: str
    tools_executed: List[AIToolExecuted] = []
    action_type: Optional[str] = None
    action_data: Optional[Any] = None
