import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter()

from core.config import settings

GROQ_API_KEY = settings.GROQ_API_KEY
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

class PartGenRequest(BaseModel):
    part_name: str

@router.post("/ai/generate-part")
async def generate_part(req: PartGenRequest):
    """Uses AI to generate a realistic component definition including pinouts."""
    prompt = f"""
    Generate a JSON definition for an electronic component named '{req.part_name}'.
    The definition must follow this exact structure:
    {{
      "name": "Full name (e.g. ESP32-WROOM-32)",
      "shortName": "4-letter identifier (e.g. ESP3)",
      "category": "Microcontroller, IC, Sensor, Output, or Passive",
      "icon": "A relevant technical emoji",
      "color": "A premium hex color (slate, violet, indigo, etc.)",
      "width": 140,
      "height": 0, 
      "pinsLeft": [{{ "id": "p1", "label": "LABEL", "type": "power/gnd/digital/analog/pwm/serial/spi/i2c/special" }}],
      "pinsRight": [{{ "id": "p16", "label": "LABEL", "type": "..." }}],
      "specs": {{ "Technical Param": "Value" }},
      "workflow": "A string containing a JS function: (state, pins) => {{ /* logic here */ }}"
    }}
    IMPORTANT: 
    1. 'height' should be calculated as: max(pinsLeft.length, pinsRight.length) * 20 + 40.
    2. Be technically accurate about REAL pin labels.
    3. 'workflow' should define how the component behaves. Example for a sensor: '(state, pins) => {{ if (pins.vcc > 0) state.out = 3.3; }}'
    4. Return ONLY valid JSON.
    """

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "response_format": { "type": "json_object" }
            }
        )

    if resp.status_code != 200:
        detail_msg = f"Groq API error ({resp.status_code}): {resp.text}"
        print(detail_msg)
        raise HTTPException(status_code=502, detail=detail_msg)

    data = resp.json()
    try:
        content = data["choices"][0]["message"]["content"]
        part_def = json.loads(content)
        return part_def
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
