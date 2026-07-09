"""
Nexar API Proxy — keeps credentials server-side
Uses OAuth2 Client Credentials to get fresh tokens automatically
"""
import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

NEXAR_TOKEN_URL = "https://identity.nexar.com/connect/token"
NEXAR_API_URL   = "https://api.nexar.com/graphql"

from core.config import settings

CLIENT_ID     = settings.NEXAR_CLIENT_ID
CLIENT_SECRET = settings.NEXAR_CLIENT_SECRET

# Simple in-memory token cache
_token_cache = {"token": None, "expires_at": 0}

import time

async def get_nexar_token() -> str:
    """Get a valid Nexar access token, refreshing if expired."""
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    async with httpx.AsyncClient() as client:
        resp = await client.post(NEXAR_TOKEN_URL, data={
            "grant_type":    "client_credentials",
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scope":         "supply.domain",
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Nexar auth failed: {resp.text}")

        data = resp.json()
        _token_cache["token"] = data["access_token"]
        _token_cache["expires_at"] = now + data.get("expires_in", 3600)
        return _token_cache["token"]


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


SEARCH_QUERY = """
query Search($q: String!, $limit: Int!) {
  supSearchMpn(q: $q, limit: $limit) {
    results {
      part {
        mpn
        shortDescription
        manufacturer { name }
        category { name }
        specs { attribute { name } displayValue }
        bestDatasheet { url }
        bestImage { url }
        sellers(authorizedOnly: false) {
          company { name }
          offers {
            inventoryLevel
            prices { quantity price currency }
          }
        }
      }
    }
  }
}
"""


MOCK_DB = [
    {"mpn":"ESP32-WROOM-32","name":"ESP32 Wi-Fi+BT Module","manufacturer":"Espressif","category":"Microcontroller","datasheet":"https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf","image":"https://cdn-icons-png.flaticon.com/512/900/900382.png","price":3.50,"stock":48000,"seller":"Digikey","specs":{"CPU":"Xtensa LX6 240MHz","Flash":"4MB","RAM":"520KB","GPIO":"34","WiFi":"802.11 b/g/n","BT":"Bluetooth 4.2","Voltage":"3.3V"}},
    {"mpn":"ATMEGA328P-PU","name":"ATmega328P 8-bit Microcontroller","manufacturer":"Microchip","category":"Microcontroller","datasheet":"https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf","image":"","price":2.15,"stock":120000,"seller":"Mouser","specs":{"CPU":"AVR 8-bit 16MHz","Flash":"32KB","RAM":"2KB","GPIO":"23","Voltage":"1.8-5.5V"}},
    {"mpn":"BC547","name":"BC547 NPN Transistor","manufacturer":"ON Semi","category":"Transistor","datasheet":"https://www.onsemi.com/pdf/datasheet/bc547-d.pdf","image":"","price":0.05,"stock":2000000,"seller":"Digikey","specs":{"Type":"NPN","Vceo":"45V","Ic":"100mA","Hfe":"110-800","Package":"TO-92"}},
    {"mpn":"LM358","name":"LM358 Dual Op-Amp","manufacturer":"TI","category":"Op-Amp","datasheet":"https://www.ti.com/lit/ds/symlink/lm358.pdf","image":"","price":0.45,"stock":850000,"seller":"Arrow","specs":{"Channels":"2","Supply":"3-32V","GBW":"1MHz","Package":"DIP-8","Input Offset":"2mV"}},
    {"mpn":"HC-SR04","name":"HC-SR04 Ultrasonic Sensor","manufacturer":"Generic","category":"Sensor","datasheet":"","image":"","price":1.20,"stock":95000,"seller":"Digikey","specs":{"Range":"2cm-400cm","Accuracy":"3mm","Voltage":"5V","Current":"15mA","Frequency":"40kHz"}},
    {"mpn":"SSD1306","name":"SSD1306 OLED Display Driver","manufacturer":"Solomon Systech","category":"Display Driver","datasheet":"https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf","image":"","price":1.80,"stock":34000,"seller":"Mouser","specs":{"Resolution":"128x64","Interface":"I2C/SPI","Voltage":"1.65-3.3V","Colors":"Monochrome"}},
    {"mpn":"L298N","name":"L298N Dual H-Bridge Motor Driver","manufacturer":"STMicro","category":"Motor Driver","datasheet":"https://www.st.com/resource/en/datasheet/l298.pdf","image":"","price":2.30,"stock":67000,"seller":"Digikey","specs":{"Output Current":"2A","Supply":"5-46V","Logic":"5V","Package":"Multiwatt15"}},
    {"mpn":"AMS1117-3.3","name":"AMS1117 3.3V LDO Regulator","manufacturer":"AMS","category":"Voltage Regulator","datasheet":"","image":"","price":0.15,"stock":5000000,"seller":"LCSC","specs":{"Output":"3.3V","Current":"1A","Dropout":"1.1V","Package":"SOT-223"}},
]

def _mock_search(query: str):
    q = query.lower()
    results = [c for c in MOCK_DB if q in c["mpn"].lower() or q in c["name"].lower() or q in c["category"].lower() or q in c["manufacturer"].lower()]
    if not results:
        results = MOCK_DB[:3]
    return {"results": results[:5], "count": len(results[:5]), "mock": True, "note": "Upgrade Nexar plan for live data"}


@router.post("/nexar/search")

async def search_components(req: SearchRequest):
    """Search electronic components via Nexar/Octopart."""
    token = await get_nexar_token()

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            NEXAR_API_URL,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"query": SEARCH_QUERY, "variables": {"q": req.query, "limit": req.limit}},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Nexar API error: {resp.text}")

    data = resp.json()
    if "errors" in data:
        err_msg = str(data["errors"])
        # Plan limit hit — return curated mock components so UI still works
        if "part limit" in err_msg or "exceeded" in err_msg.lower():
            return _mock_search(req.query)
        raise HTTPException(status_code=400, detail=err_msg)

    raw_results = data.get("data", {}).get("supSearchMpn", {}).get("results", [])
    
    # Normalize response for frontend
    components = []
    for r in raw_results:
        part = r.get("part", {})
        
        # Best price
        best_price = None
        best_stock = 0
        seller_name = None
        for seller in part.get("sellers", []):
            for offer in seller.get("offers", []):
                stock = offer.get("inventoryLevel", 0)
                best_stock += stock
                prices = offer.get("prices", [])
                if prices and best_price is None:
                    best_price = prices[0].get("price")
                    seller_name = seller.get("company", {}).get("name")

        # Specs dict
        specs = {}
        for spec in part.get("specs", [])[:8]:
            key = spec.get("attribute", {}).get("name", "")
            val = spec.get("displayValue", "")
            if key and val:
                specs[key] = val

        components.append({
            "mpn":          part.get("mpn", ""),
            "name":         part.get("shortDescription", part.get("mpn", "")),
            "manufacturer": part.get("manufacturer", {}).get("name", ""),
            "category":     part.get("category", {}).get("name", ""),
            "datasheet":    part.get("bestDatasheet", {}).get("url", "") if part.get("bestDatasheet") else "",
            "image":        part.get("bestImage", {}).get("url", "") if part.get("bestImage") else "",
            "price":        best_price,
            "stock":        best_stock,
            "seller":       seller_name,
            "specs":        specs,
        })

    return {"results": components, "count": len(components)}
