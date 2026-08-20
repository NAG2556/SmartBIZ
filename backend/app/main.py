import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    HAS_APSCHEDULER = True
except ImportError:
    BackgroundScheduler = None
    CronTrigger = None
    HAS_APSCHEDULER = False


from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database_if_empty
from app.services.reminder_service import process_daily_payment_reminders

from app.api.auth import router as auth_router
from app.api.customers import router as customers_router
from app.api.products import router as products_router
from app.api.bills import router as bills_router
from app.api.payments import router as payments_router
from app.api.transactions import router as transactions_router
from app.api.analytics import router as analytics_router
from app.api.ai import router as ai_router
from app.api.messaging import router as messaging_router
from app.api.campaigns import router as campaigns_router
from app.api.reminders import router as reminders_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartbiz-ai")

# Scheduler setup
scheduler = BackgroundScheduler() if HAS_APSCHEDULER else None

def scheduled_morning_reminder_job():
    logger.info("[Scheduler] Running daily automated payment reminders job...")
    db = SessionLocal()
    try:
        result = process_daily_payment_reminders(db)
        logger.info(f"[Scheduler] Reminders sent: {result.get('reminders_sent')}, Amount: {result.get('total_outstanding_reminded')}")
    except Exception as e:
        logger.error(f"[Scheduler Error]: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Create tables
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # 2. Seed database
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

    # 3. Start background scheduler if enabled
    if settings.AUTOMATED_REMINDERS_ENABLED and scheduler and CronTrigger:
        trigger = CronTrigger(
            hour=settings.REMINDER_CHECK_HOUR,
            minute=settings.REMINDER_CHECK_MINUTE
        )
        scheduler.add_job(
            scheduled_morning_reminder_job,
            trigger=trigger,
            id="daily_payment_reminder",
            name="Daily Payment Reminder",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"[Scheduler] Started. Daily morning reminders scheduled for {settings.REMINDER_CHECK_HOUR:02d}:{settings.REMINDER_CHECK_MINUTE:02d} UTC")

    yield

    # Shutdown
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("[Scheduler] Shutdown completed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Business Assistant for Small & Medium Enterprises",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for seamless frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(customers_router, prefix=api_v1)
app.include_router(products_router, prefix=api_v1)
app.include_router(bills_router, prefix=api_v1)
app.include_router(payments_router, prefix=api_v1)
app.include_router(transactions_router, prefix=api_v1)
app.include_router(analytics_router, prefix=api_v1)
app.include_router(ai_router, prefix=api_v1)
app.include_router(messaging_router, prefix=api_v1)
app.include_router(campaigns_router, prefix=api_v1)
app.include_router(reminders_router, prefix=api_v1)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "tagline": "Your business remembers everything, so you don't have to.",
        "docs_url": "/docs"
    }

@app.get(f"{api_v1}/health")
def health_check():
    return {"status": "healthy"}
