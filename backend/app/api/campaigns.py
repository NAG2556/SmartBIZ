from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import CampaignCreate, CampaignOut, PersonalizedOfferCustomer
from app.services.campaign_service import create_and_send_campaign, generate_ai_personalized_offers, get_campaigns

router = APIRouter(prefix="/campaigns", tags=["Marketing & Campaigns"])

@router.get("/", response_model=List[CampaignOut])
def list_campaigns(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_campaigns(db, user.id, limit=limit)

@router.post("/", response_model=CampaignOut)
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return create_and_send_campaign(db, user, data)

@router.get("/ai-personalized-offers", response_model=List[PersonalizedOfferCustomer])
def get_personalized_offers_preview(
    discount: float = Query(10.0, ge=1.0, le=100.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    AI Recommendation: Analyzes each customer's past purchase habits and prepares tailored discount messages.
    """
    return generate_ai_personalized_offers(db, user, default_discount=discount)
