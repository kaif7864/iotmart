from fastapi import APIRouter, HTTPException
import httpx
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def ai_chat(request: ChatRequest):
    # Re-load env just in case it wasn't picked up
    load_dotenv()
    key = os.getenv("GROQ_API_KEY")
    
    if not key:
        print("CRITICAL: GROQ_API_KEY is missing from environment variables")
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured in .env")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192", # Higher capacity model
        "messages": [
            {
                "role": "system",
                "content": "You are the IoTMart Engineering Assistant. You are an expert in IoT hardware (ESP32, Arduino, Raspberry Pi, Sensors). Provide technically accurate and concise help."
            },
            {
                "role": "user",
                "content": request.message
            }
        ],
        "temperature": 0.6,
        "max_tokens": 800
    }

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload, timeout=40.0)
            
            if response.status_code == 429:
                return {"reply": "Wait, our neural link is overheating (Rate Limit). Please give me 10 seconds to cool down."}
            
            if response.status_code == 401:
                return {"reply": "Security Breach: Neural key invalid. Please contact the administrator."}

            if response.status_code != 200:
                print(f"Groq API Error: {response.status_code} - {response.text}")
                return {"reply": "The AI core is recalibrating. This usually happens during heavy load. Please try your query again in a moment."}
            
            data = response.json()
            return {"reply": data["choices"][0]["message"]["content"]}
        except httpx.TimeoutException:
            return {"reply": "Neural connection timed out. The hardware data stream is too thick. Please try a shorter question."}
        except Exception as e:
            print(f"AI System Error: {str(e)}")
            return {"reply": "The AI is currently offline for maintenance. Please use our FAQ or Ticket system in the meantime."}
