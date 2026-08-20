from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Product, BillItem, Bill, Customer, User
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductOut, PriceHikeNotificationPreview

def create_product(db: Session, user_id: int, data: ProductCreate) -> ProductOut:
    product = Product(
        user_id=user_id,
        name=data.name.strip(),
        category=data.category.strip() if data.category else "General",
        description=data.description.strip() if data.description else None,
        selling_price=round(data.selling_price, 2),
        cost_price=round(data.cost_price or 0.0, 2),
        stock_quantity=data.stock_quantity or 0.0,
        unit=data.unit.strip() if data.unit else "pcs",
        is_service=data.is_service or False,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)

def get_products(
    db: Session, user_id: int, category: Optional[str] = None, search: Optional[str] = None
) -> List[ProductOut]:
    query = db.query(Product).filter(Product.user_id == user_id, Product.is_active == True)
    if category and category != "ALL":
        query = query.filter(Product.category.ilike(category))
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Product.name.ilike(s)) | (Product.category.ilike(s)))
    products = query.order_by(Product.name.asc()).all()
    return [ProductOut.model_validate(p) for p in products]

def get_product_by_id(db: Session, user_id: int, product_id: int) -> Optional[ProductOut]:
    p = db.query(Product).filter(Product.id == product_id, Product.user_id == user_id).first()
    if not p:
        return None
    return ProductOut.model_validate(p)

def update_product(db: Session, user_id: int, product_id: int, data: ProductUpdate) -> Optional[ProductOut]:
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == user_id).first()
    if not product:
        return None

    if data.name is not None:
        product.name = data.name.strip()
    if data.category is not None:
        product.category = data.category.strip()
    if data.description is not None:
        product.description = data.description.strip() if data.description else None
    if data.selling_price is not None:
        product.selling_price = round(data.selling_price, 2)
    if data.cost_price is not None:
        product.cost_price = round(data.cost_price, 2)
    if data.stock_quantity is not None:
        product.stock_quantity = data.stock_quantity
    if data.unit is not None:
        product.unit = data.unit.strip()
    if data.is_service is not None:
        product.is_service = data.is_service
    if data.is_active is not None:
        product.is_active = data.is_active

    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)

def delete_product(db: Session, user_id: int, product_id: int) -> bool:
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == user_id).first()
    if not product:
        return False
    product.is_active = False
    db.commit()
    return True

def get_product_categories(db: Session, user_id: int) -> List[str]:
    categories = db.query(Product.category).filter(
        Product.user_id == user_id, Product.is_active == True
    ).distinct().all()
    return [c[0] for c in categories if c[0]]

def get_past_buyers_for_product(db: Session, user: User, product_id: int, new_price: float) -> PriceHikeNotificationPreview:
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == user.id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Find customer IDs who bought this product in bill items
    customer_ids = db.query(Bill.customer_id).join(BillItem, Bill.id == BillItem.bill_id).filter(
        Bill.user_id == user.id,
        BillItem.product_id == product.id
    ).distinct().all()

    c_ids = [cid[0] for cid in customer_ids]
    customers = db.query(Customer).filter(Customer.id.in_(c_ids), Customer.is_active == True).all()

    cust_list = [{"id": c.id, "name": c.name, "phone": c.phone} for c in customers]
    
    sample_msg = (
        f"Dear Customer,\n\n"
        f"Please note that the price of *{product.name}* at {user.business_name} "
        f"has been updated from {user.currency}{product.selling_price}/{product.unit} to "
        f"{user.currency}{new_price}/{product.unit}.\n\n"
        f"Thank you for your continuous support!"
    )

    return PriceHikeNotificationPreview(
        product_name=product.name,
        old_price=product.selling_price,
        new_price=new_price,
        target_customers_count=len(cust_list),
        customers=cust_list,
        sample_message=sample_msg
    )
