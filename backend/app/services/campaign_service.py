from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Campaign, Customer, Bill, BillItem, Product, User
from app.schemas.schemas import CampaignCreate, CampaignOut, PersonalizedOfferCustomer
from app.services.customer_service import calculate_customer_balance
from app.services.twilio_service import send_message

def create_and_send_campaign(db: Session, user: User, data: CampaignCreate) -> CampaignOut:
    # 1. Determine target audience
    target_customers = []
    
    if data.audience_type == "ALL":
        target_customers = db.query(Customer).filter(
            Customer.user_id == user.id, Customer.is_active == True
        ).all()
    elif data.audience_type == "OUTSTANDING":
        all_c = db.query(Customer).filter(Customer.user_id == user.id, Customer.is_active == True).all()
        target_customers = [c for c in all_c if calculate_customer_balance(db, c.id) > 0]
    elif data.audience_type == "SELECTED" and data.selected_customer_ids:
        target_customers = db.query(Customer).filter(
            Customer.id.in_(data.selected_customer_ids),
            Customer.user_id == user.id,
            Customer.is_active == True
        ).all()
    elif data.audience_type == "PAST_BUYERS" and data.target_product_id:
        c_ids = db.query(Bill.customer_id).join(BillItem, Bill.id == BillItem.bill_id).filter(
            Bill.user_id == user.id,
            BillItem.product_id == data.target_product_id
        ).distinct().all()
        target_customers = db.query(Customer).filter(
            Customer.id.in_([cid[0] for cid in c_ids]),
            Customer.user_id == user.id,
            Customer.is_active == True
        ).all()
    else:
        target_customers = db.query(Customer).filter(
            Customer.user_id == user.id, Customer.is_active == True
        ).all()

    # 2. Create Campaign record
    campaign = Campaign(
        user_id=user.id,
        title=data.title.strip(),
        campaign_type=data.campaign_type,
        channel=data.channel or "WHATSAPP",
        audience_type=data.audience_type or "ALL",
        message_template=data.message_template,
        discount_percentage=data.discount_percentage,
        target_product_id=data.target_product_id,
        status="SENT",
        recipient_count=len(target_customers),
    )
    db.add(campaign)
    db.flush()

    # 3. Dispatch messages to all target customers
    for cust in target_customers:
        # Render template
        custom_content = data.message_template.replace("{{name}}", cust.name).replace("{{business_name}}", user.business_name)
        if data.discount_percentage:
            custom_content = custom_content.replace("{{discount}}", f"{data.discount_percentage}%")

        send_message(
            db=db,
            user=user,
            recipient_phone=cust.phone,
            message_content=custom_content,
            channel=data.channel or "WHATSAPP",
            message_type=data.campaign_type,
            customer_id=cust.id,
            campaign_id=campaign.id,
            recipient_name=cust.name
        )

    db.commit()
    db.refresh(campaign)

    target_prod_name = None
    if campaign.target_product_id:
        p = db.query(Product).filter(Product.id == campaign.target_product_id).first()
        if p:
            target_prod_name = p.name

    return CampaignOut(
        id=campaign.id,
        title=campaign.title,
        campaign_type=campaign.campaign_type,
        channel=campaign.channel,
        audience_type=campaign.audience_type,
        message_template=campaign.message_template,
        discount_percentage=campaign.discount_percentage,
        target_product_id=campaign.target_product_id,
        target_product_name=target_prod_name,
        status=campaign.status,
        recipient_count=campaign.recipient_count,
        created_at=campaign.created_at,
    )

def generate_ai_personalized_offers(
    db: Session, user: User, default_discount: float = 10.0
) -> List[PersonalizedOfferCustomer]:
    customers = db.query(Customer).filter(Customer.user_id == user.id, Customer.is_active == True).all()
    offers = []

    for cust in customers:
        # Find customer's most purchased product
        top_product_row = db.query(
            BillItem.product_name,
            BillItem.product_id,
            func.count(BillItem.id).label("purchase_freq")
        ).join(Bill, Bill.id == BillItem.bill_id).filter(
            Bill.customer_id == cust.id,
            Bill.user_id == user.id
        ).group_by(BillItem.product_name, BillItem.product_id).order_by(func.count(BillItem.id).desc()).first()

        if top_product_row:
            prod_name = top_product_row[0]
            prod_id = top_product_row[1]
            freq = top_product_row[2]

            msg = (
                f"Hi {cust.name}!\n\n"
                f"We noticed that *{prod_name}* is one of your favorites at {user.business_name}. "
                f"Enjoy an exclusive *{default_discount:.0f}% discount* on your next purchase this week!\n\n"
                f"Show this message at checkout. Valid till Sunday."
            )

            offers.append(PersonalizedOfferCustomer(
                customer_id=cust.id,
                customer_name=cust.name,
                customer_phone=cust.phone,
                frequent_product_name=prod_name,
                frequent_product_id=prod_id,
                purchase_count=freq,
                suggested_discount=default_discount,
                personalized_message=msg
            ))

    return offers

def get_campaigns(db: Session, user_id: int, limit: int = 50) -> List[CampaignOut]:
    campaigns = db.query(Campaign).filter(Campaign.user_id == user_id).order_by(Campaign.created_at.desc()).limit(limit).all()
    results = []
    for c in campaigns:
        prod_name = c.target_product.name if c.target_product else None
        results.append(CampaignOut(
            id=c.id,
            title=c.title,
            campaign_type=c.campaign_type,
            channel=c.channel,
            audience_type=c.audience_type,
            message_template=c.message_template,
            discount_percentage=c.discount_percentage,
            target_product_id=c.target_product_id,
            target_product_name=prod_name,
            status=c.status,
            recipient_count=c.recipient_count,
            created_at=c.created_at
        ))
    return results
