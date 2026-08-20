from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services.ai_agent_service import process_ai_command

router = APIRouter(prefix="/ai", tags=["AI Business Assistant"])

@router.post("/chat", response_model=AIChatResponse)
def ai_assistant_chat(
    data: AIChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    AI Business Agent: Executes natural language instructions with tool calling against business database.
    """
    return process_ai_command(db, user, data.message)
