from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductOut, PriceHikeNotificationPreview
)
from app.services.product_service import (
    create_product, get_products, get_product_by_id, update_product, delete_product, get_product_categories, get_past_buyers_for_product
)

router = APIRouter(prefix="/products", tags=["Product & Service Management"])

@router.get("/", response_model=List[ProductOut])
def list_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_products(db, user.id, category=category, search=search)

@router.get("/categories", response_model=List[str])
def list_categories(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_product_categories(db, user.id)

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def add_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return create_product(db, user.id, data)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    product = get_product_by_id(db, user.id, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductOut)
def edit_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    product = update_product(db, user.id, product_id, data)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.delete("/{product_id}")
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    success = delete_product(db, user.id, product_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return {"message": "Product removed successfully"}

@router.get("/{product_id}/price-hike-preview", response_model=PriceHikeNotificationPreview)
def preview_price_hike_alert(
    product_id: int,
    new_price: float = Query(..., description="Proposed new price"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Finds all past buyers of this product and prepares a price change message preview."""
    return get_past_buyers_for_product(db, user, product_id, new_price)
