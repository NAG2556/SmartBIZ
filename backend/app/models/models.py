import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    business_name = Column(String(150), nullable=False)
    business_type = Column(String(100), default="General Store")  # e.g. Grocery, Electronics, Clothing, Hardware, Service
    business_phone = Column(String(20), nullable=True)
    business_email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    currency = Column(String(10), default="₹")
    invoice_prefix = Column(String(20), default="INV")
    sms_reminder_enabled = Column(Boolean, default=True)
    whatsapp_reminder_enabled = Column(Boolean, default=True)
    min_reminder_amount = Column(Float, default=100.0)
    reminder_time = Column(String(10), default="09:00")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    customers = relationship("Customer", back_populates="user", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_serial_number = Column(String(50), nullable=False, index=True)  # e.g. CUST-0001
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="customers")
    bills = relationship("Bill", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="customer", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="customer", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), default="General", index=True)
    description = Column(Text, nullable=True)
    selling_price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, nullable=True, default=0.0)
    stock_quantity = Column(Float, default=0.0)
    unit = Column(String(20), default="pcs")  # kg, liter, pcs, box, hr, item
    is_service = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="products")
    bill_items = relationship("BillItem", back_populates="product")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    bill_number = Column(String(50), nullable=False, index=True)  # INV-2026-0001
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    amount_paid = Column(Float, nullable=False, default=0.0)
    credit_amount = Column(Float, nullable=False, default=0.0)  # Total - Paid
    payment_method = Column(String(50), default="Cash")  # Cash, UPI, Card, Mixed, Unpaid
    notes = Column(Text, nullable=True)
    bill_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bills")
    customer = relationship("Customer", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="bill")
    transactions = relationship("Transaction", back_populates="bill")


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(150), nullable=False)
    unit = Column(String(20), default="pcs")
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False, default=0.0)

    bill = relationship("Bill", back_populates="items")
    product = relationship("Product", back_populates="bill_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(String(50), default="Cash")  # Cash, UPI, Card, Bank Transfer, Cheque
    notes = Column(Text, nullable=True)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")
    bill = relationship("Bill", back_populates="payments")
    transactions = relationship("Transaction", back_populates="payment")


class Transaction(Base):
    """
    Financial Ledger Transaction.
    SOURCE OF TRUTH for customer balance calculations.
    Type: PURCHASE (+credit/owing), PAYMENT (-credit/settling), ADJUSTMENT, OPENING_BALANCE
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    transaction_type = Column(String(50), nullable=False)  # PURCHASE, PAYMENT, OPENING_BALANCE, ADJUSTMENT
    amount = Column(Float, nullable=False, default=0.0)
    debit = Column(Float, default=0.0)   # Amount owed / purchase total
    credit = Column(Float, default=0.0)  # Amount paid
    running_balance = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    transaction_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    bill = relationship("Bill", back_populates="transactions")
    payment = relationship("Payment", back_populates="transactions")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    campaign_type = Column(String(50), nullable=False)  # BULK_OFFER, PERSONALIZED_OFFER, PRICE_HIKE, PAYMENT_REMINDER
    channel = Column(String(20), default="WHATSAPP")   # WHATSAPP, SMS, ALL
    audience_type = Column(String(50), default="ALL")   # ALL, PAST_BUYERS, OUTSTANDING, SELECTED
    message_template = Column(Text, nullable=False)
    discount_percentage = Column(Float, nullable=True)
    target_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    status = Column(String(50), default="DRAFT")       # DRAFT, SCHEDULED, SENT, COMPLETED
    recipient_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="campaigns")
    target_product = relationship("Product")
    messages = relationship("Message", back_populates="campaign")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    message_type = Column(String(50), nullable=False)  # REMINDER, PROMOTION, PRICE_ALERT, INVOICE, ANNOUNCEMENT
    channel = Column(String(20), default="WHATSAPP")   # WHATSAPP, SMS
    recipient_phone = Column(String(20), nullable=False)
    recipient_name = Column(String(100), nullable=True)
    message_content = Column(Text, nullable=False)
    status = Column(String(50), default="SENT")        # PENDING, SENT, DELIVERED, FAILED
    provider_message_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="messages")
    customer = relationship("Customer", back_populates="messages")
    campaign = relationship("Campaign", back_populates="messages")
