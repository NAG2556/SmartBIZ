import datetime
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.models import User, Customer, Product, Bill, BillItem, Payment, Transaction, Message, Campaign
from app.services.billing_service import create_bill
from app.schemas.schemas import BillCreate, BillItemCreate

def seed_database_if_empty(db: Session):
    # Check if demo user exists
    user = db.query(User).filter(User.email == "ravi@smartbiz.ai").first()
    if user:
        return  # Already seeded

    print("[Seed] Seeding realistic SME business data...")

    # 1. Create Demo Shopkeeper / User
    user = User(
        name="Ravi Sharma",
        email="ravi@smartbiz.ai",
        phone="9876500001",
        hashed_password=get_password_hash("password123"),
        business_name="Sharma SuperStore & Electronics",
        business_type="Retail & Services",
        business_phone="+91 98765 00001",
        business_email="contact@sharmastore.com",
        address="Shop #14, Main Market, MG Road, Bengaluru, Karnataka",
        currency="₹",
        invoice_prefix="INV",
        sms_reminder_enabled=True,
        whatsapp_reminder_enabled=True,
        min_reminder_amount=100.0,
        reminder_time="09:00"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Create Products / Services
    products_data = [
        {"name": "Royal Basmati Rice", "category": "Grocery", "price": 85.0, "cost": 70.0, "stock": 350.0, "unit": "kg", "service": False},
        {"name": "Sunflower Cooking Oil 1L", "category": "Grocery", "price": 145.0, "cost": 120.0, "stock": 180.0, "unit": "liter", "service": False},
        {"name": "Refined White Sugar", "category": "Grocery", "price": 46.0, "cost": 38.0, "stock": 500.0, "unit": "kg", "service": False},
        {"name": "Tata Salt 1kg", "category": "Grocery", "price": 28.0, "cost": 22.0, "stock": 200.0, "unit": "pack", "service": False},
        {"name": "Wireless Optical Mouse", "category": "Electronics", "price": 450.0, "cost": 320.0, "stock": 45.0, "unit": "pcs", "service": False},
        {"name": "Fast Charging USB-C Cable", "category": "Electronics", "price": 250.0, "cost": 140.0, "stock": 90.0, "unit": "pcs", "service": False},
        {"name": "Bluetooth Neckband Pro", "category": "Electronics", "price": 1199.0, "cost": 850.0, "stock": 30.0, "unit": "pcs", "service": False},
        {"name": "Premium Cotton Formal Shirt", "category": "Clothing", "price": 899.0, "cost": 550.0, "stock": 60.0, "unit": "pcs", "service": False},
        {"name": "Slim Fit Denim Jeans", "category": "Clothing", "price": 1399.0, "cost": 890.0, "stock": 40.0, "unit": "pcs", "service": False},
        {"name": "Mobile Screen Replacement Service", "category": "Services", "price": 750.0, "cost": 200.0, "stock": 0.0, "unit": "service", "service": True},
        {"name": "PC / Laptop Maintenance Service", "category": "Services", "price": 500.0, "cost": 50.0, "stock": 0.0, "unit": "service", "service": True},
    ]

    prod_objs = {}
    for p in products_data:
        prod = Product(
            user_id=user.id,
            name=p["name"],
            category=p["category"],
            selling_price=p["price"],
            cost_price=p["cost"],
            stock_quantity=p["stock"],
            unit=p["unit"],
            is_service=p["service"],
            is_active=True
        )
        db.add(prod)
        db.flush()
        prod_objs[p["name"]] = prod

    # 3. Create Customers
    customers_data = [
        {"serial": "CUST-0001", "name": "Ravi Kumar", "phone": "9876543210", "address": "Indiranagar, Bengaluru"},
        {"serial": "CUST-0002", "name": "Suresh Patel", "phone": "9812345678", "address": "Koramangala 4th Block, Bengaluru"},
        {"serial": "CUST-0003", "name": "Anil Mehta", "phone": "9988776655", "address": "HSR Layout Sector 2, Bengaluru"},
        {"serial": "CUST-0004", "name": "Priya Sundaram", "phone": "9765432109", "address": "Whitefield, Bengaluru"},
        {"serial": "CUST-0005", "name": "Rajesh Verma", "phone": "9123456780", "address": "Jayanagar 9th Block, Bengaluru"},
    ]

    cust_objs = {}
    for c in customers_data:
        cust = Customer(
            user_id=user.id,
            customer_serial_number=c["serial"],
            name=c["name"],
            phone=c["phone"],
            address=c["address"],
            is_active=True
        )
        db.add(cust)
        db.flush()
        cust_objs[c["name"]] = cust

    db.commit()

    # 4. Generate Realistic Historical Bills & Transactions
    # 4a. Ravi Kumar: Has purchases & payments resulting in ₹2,500 outstanding
    c_ravi = cust_objs["Ravi Kumar"]
    # Bill 1: 5 days ago: ₹1,500, paid ₹1,000, credit ₹500
    create_bill(db, user, BillCreate(
        customer_id=c_ravi.id,
        items=[
            BillItemCreate(product_id=prod_objs["Royal Basmati Rice"].id, product_name="Royal Basmati Rice", quantity=10, unit_price=85.0),
            BillItemCreate(product_id=prod_objs["Sunflower Cooking Oil 1L"].id, product_name="Sunflower Cooking Oil 1L", quantity=4, unit_price=145.0),
            BillItemCreate(product_id=prod_objs["Refined White Sugar"].id, product_name="Refined White Sugar", quantity=1.5, unit_price=46.0),
        ],
        discount_amount=0.0,
        amount_paid=1000.0,
        payment_method="UPI",
        notes="Monthly grocery supplies",
        bill_date=datetime.datetime.utcnow() - datetime.timedelta(days=6)
    ))

    # Bill 2: 3 days ago: ₹2,000, paid ₹0, credit ₹2,000
    create_bill(db, user, BillCreate(
        customer_id=c_ravi.id,
        items=[
            BillItemCreate(product_id=prod_objs["Premium Cotton Formal Shirt"].id, product_name="Premium Cotton Formal Shirt", quantity=1, unit_price=899.0),
            BillItemCreate(product_id=prod_objs["Bluetooth Neckband Pro"].id, product_name="Bluetooth Neckband Pro", quantity=1, unit_price=1101.0),
        ],
        discount_amount=0.0,
        amount_paid=0.0,
        payment_method="Unpaid",
        notes="Electronics & Shirt purchase on credit",
        bill_date=datetime.datetime.utcnow() - datetime.timedelta(days=3)
    ))

    # 4b. Suresh Patel: Outstanding ₹6,500
    c_suresh = cust_objs["Suresh Patel"]
    create_bill(db, user, BillCreate(
        customer_id=c_suresh.id,
        items=[
            BillItemCreate(product_id=prod_objs["Slim Fit Denim Jeans"].id, product_name="Slim Fit Denim Jeans", quantity=3, unit_price=1399.0),
            BillItemCreate(product_id=prod_objs["Bluetooth Neckband Pro"].id, product_name="Bluetooth Neckband Pro", quantity=2, unit_price=1199.0),
        ],
        discount_amount=95.0,
        amount_paid=0.0,
        payment_method="Unpaid",
        notes="Festival clothing and accessories",
        bill_date=datetime.datetime.utcnow() - datetime.timedelta(days=12)
    ))

    # 4c. Anil Mehta: Outstanding ₹1,200
    c_anil = cust_objs["Anil Mehta"]
    create_bill(db, user, BillCreate(
        customer_id=c_anil.id,
        items=[
            BillItemCreate(product_id=prod_objs["Wireless Optical Mouse"].id, product_name="Wireless Optical Mouse", quantity=2, unit_price=450.0),
            BillItemCreate(product_id=prod_objs["Fast Charging USB-C Cable"].id, product_name="Fast Charging USB-C Cable", quantity=3, unit_price=250.0),
        ],
        discount_amount=50.0,
        amount_paid=400.0,
        payment_method="Cash",
        notes="Office IT peripherals",
        bill_date=datetime.datetime.utcnow() - datetime.timedelta(days=2)
    ))

    # 4d. Priya Sundaram: Fully paid (Outstanding ₹0)
    c_priya = cust_objs["Priya Sundaram"]
    create_bill(db, user, BillCreate(
        customer_id=c_priya.id,
        items=[
            BillItemCreate(product_id=prod_objs["Royal Basmati Rice"].id, product_name="Royal Basmati Rice", quantity=5, unit_price=85.0),
            BillItemCreate(product_id=prod_objs["Sunflower Cooking Oil 1L"].id, product_name="Sunflower Cooking Oil 1L", quantity=2, unit_price=145.0),
        ],
        discount_amount=0.0,
        amount_paid=715.0,
        payment_method="UPI",
        notes="Groceries paid in full via UPI",
        bill_date=datetime.datetime.utcnow() - datetime.timedelta(days=1)
    ))

    # 4e. Today's fresh bill for Rajesh Verma
    c_rajesh = cust_objs["Rajesh Verma"]
    create_bill(db, user, BillCreate(
        customer_id=c_rajesh.id,
        items=[
            BillItemCreate(product_id=prod_objs["Mobile Screen Replacement Service"].id, product_name="Mobile Screen Replacement Service", quantity=1, unit_price=750.0),
            BillItemCreate(product_id=prod_objs["Bluetooth Neckband Pro"].id, product_name="Bluetooth Neckband Pro", quantity=1, unit_price=1199.0),
        ],
        discount_amount=49.0,
        amount_paid=1000.0,
        payment_method="UPI",
        notes="Phone screen repaired + new neckband",
        bill_date=datetime.datetime.utcnow()
    ))

    print("[Seed] Seed data successfully populated.")
