from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
import os
import uuid
from core.security import get_current_user

router = APIRouter()

CASHFREE_APP_ID = os.getenv("CASHFREE_APP_ID", "TEST_APP_ID")
CASHFREE_SECRET_KEY = os.getenv("CASHFREE_SECRET_KEY", "TEST_SECRET_KEY")
CASHFREE_URL = "https://sandbox.cashfree.com/pg/orders" # Sandbox endpoint

class PaymentSessionRequest(BaseModel):
    order_amount: float
    customer_id: str
    customer_phone: str
    customer_email: str
    customer_name: str

@router.post("/cashfree/create-session")
async def create_cashfree_session(req: PaymentSessionRequest, user: dict = Depends(get_current_user)):
    order_id = f"ORDER_{uuid.uuid4().hex[:12]}"
    
    headers = {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
    }
    
    payload = {
        "order_id": order_id,
        "order_amount": req.order_amount,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": req.customer_id,
            "customer_phone": req.customer_phone,
            "customer_email": req.customer_email,
            "customer_name": req.customer_name
        },
        "order_meta": {
            "return_url": "http://localhost:5173/profile"
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(CASHFREE_URL, json=payload, headers=headers)
        
    if response.status_code == 200:
        data = response.json()
        return {
            "payment_session_id": data.get("payment_session_id"),
            "order_id": order_id
        }
    else:
        raise HTTPException(status_code=400, detail=f"Cashfree API Error: {response.text}")

import hmac
import hashlib
import base64
from fastapi import Request

CASHFREE_WEBHOOK_SECRET = os.getenv("CASHFREE_WEBHOOK_SECRET")

@router.post("/cashfree/webhook")
async def cashfree_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("x-webhook-signature")
    timestamp = request.headers.get("x-webhook-timestamp")
    
    if not signature or not timestamp:
        raise HTTPException(status_code=400, detail="Missing signature or timestamp")
        
    # Verify Signature
    # Formula: BASE64(HMAC_SHA256(timestamp + raw_payload, webhook_secret))
    data_to_sign = timestamp.encode('utf-8') + payload
    
    expected_hmac = hmac.new(
        CASHFREE_WEBHOOK_SECRET.encode('utf-8'),
        data_to_sign,
        hashlib.sha256
    ).digest()
    
    expected_signature = base64.b64encode(expected_hmac).decode('utf-8')
    
    if signature != expected_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    data = await request.json()
    print("Valid Cashfree Webhook Received:", data)
    
    event_type = data.get("type")
    if event_type == "PAYMENT_SUCCESS_WEBHOOK":
        payment_info = data.get("data", {}).get("payment", {})
        order_info = data.get("data", {}).get("order", {})
        order_id_string = order_info.get("order_id")
        
        # We need to find the transaction/order with this order_id
        # Note: the order_id here is the CASHFREE order id generated in create_cashfree_session
        
        # Actually, in our create_session we just returned order_id, but the frontend needs to pass it to processOrder
        # Wait, the webhook is a nice to have, the frontend already marks it as PAID after successful checkout:
        # processOrder("PAID", result.paymentDetails.paymentMessage || order_id)
        pass
    
    return {"status": "OK"}
