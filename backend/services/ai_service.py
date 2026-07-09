import httpx
from core.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async def get_ai_chat_response(message: str) -> str:
    key = settings.GROQ_API_KEY
    if not key:
        raise ValueError("GROQ_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192",
        "messages": [
            {
                "role": "system",
                "content": "You are the IoTMart Engineering Assistant. You are an expert in IoT hardware (ESP32, Arduino, Raspberry Pi, Sensors). Provide technically accurate and concise help."
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "temperature": 0.6,
        "max_tokens": 800
    }

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload, timeout=40.0)
            
            if response.status_code == 429:
                return "Wait, our system is overloaded (Rate Limit). Please give me 10 seconds to cool down."
            
            if response.status_code == 401:
                return "Security Breach: API key invalid. Please contact the administrator."

            if response.status_code != 200:
                print(f"Groq API Error: {response.status_code} - {response.text}")
                return "The AI core is recalibrating. This usually happens during heavy load. Please try your query again in a moment."
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException:
            return "Connection timed out. The data stream is too thick. Please try a shorter question."
        except Exception as e:
            print(f"AI System Error: {str(e)}")
            return "The AI is currently offline for maintenance. Please use our FAQ or Ticket system in the meantime."
