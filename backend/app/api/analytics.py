from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import DashboardStats, SalesTrendItem, TopCustomerItem, TopProductItem
from app.services.analytics_service import (
    get_dashboard_stats, get_sales_trends, get_top_customers, get_top_products, get_credit_aging_report
)

router = APIRouter(prefix="/analytics", tags=["Business Analytics & Reports"])

@router.get("/dashboard", response_model=DashboardStats)
def dashboard_overview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_dashboard_stats(db, user)

@router.get("/sales-trends", response_model=List[SalesTrendItem])
def sales_trends(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_sales_trends(db, user, days=days)

@router.get("/top-customers", response_model=List[TopCustomerItem])
def top_customers(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_top_customers(db, user, limit=limit)

@router.get("/top-products", response_model=List[TopProductItem])
def top_products(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_top_products(db, user, limit=limit)

@router.get("/credit-aging", response_model=List[Dict[str, Any]])
def credit_aging(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_credit_aging_report(db, user)
