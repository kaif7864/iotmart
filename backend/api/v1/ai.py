from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import get_ai_chat_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def ai_chat(request: ChatRequest):
    try:
        reply = await get_ai_chat_response(request.message)
        return {"reply": reply}
    except ValueError as e:
        print(f"CRITICAL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

