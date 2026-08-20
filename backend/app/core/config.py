import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartBiz AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "smartbiz-ai-super-secret-production-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database: SQLite default, compatible with PostgreSQL
    DATABASE_URL: str = "sqlite:///./smartbiz.db"

    # Twilio (SMS & WhatsApp)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"

    # AI API keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Automated Reminders
    AUTOMATED_REMINDERS_ENABLED: bool = True
    REMINDER_CHECK_HOUR: int = 9
    REMINDER_CHECK_MINUTE: int = 0

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
