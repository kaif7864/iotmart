import httpx
import uuid
import hmac
import hashlib
import base64
from core.config import settings

class PaymentService:
    def __init__(self):
        self.app_id = settings.CASHFREE_APP_ID or "TEST_APP_ID"
        self.secret_key = settings.CASHFREE_SECRET_KEY or "TEST_SECRET_KEY"
        self.webhook_secret = settings.CASHFREE_WEBHOOK_SECRET
        self.url = "https://sandbox.cashfree.com/pg/orders"
        self.headers = {
            "x-client-id": self.app_id,
            "x-client-secret": self.secret_key,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
        }

    async def create_session(self, order_amount: float, customer_id: str, customer_phone: str, customer_email: str, customer_name: str) -> dict:
        order_id = f"ORDER_{uuid.uuid4().hex[:12]}"
        
        payload = {
            "order_id": order_id,
            "order_amount": order_amount,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": customer_id,
                "customer_phone": customer_phone,
                "customer_email": customer_email,
                "customer_name": customer_name
            },
            "order_meta": {
                "return_url": f"{settings.FRONTEND_URL}/profile"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.url, json=payload, headers=self.headers)
            
        if response.status_code == 200:
            data = response.json()
            return {
                "payment_session_id": data.get("payment_session_id"),
                "order_id": order_id
            }
        else:
            return {"error": response.text}

    def verify_webhook_signature(self, payload: bytes, signature: str, timestamp: str) -> bool:
        if not signature or not timestamp or not self.webhook_secret:
            return False
            
        data_to_sign = timestamp.encode('utf-8') + payload
        
        expected_hmac = hmac.new(
            self.webhook_secret.encode('utf-8'),
            data_to_sign,
            hashlib.sha256
        ).digest()
        
        expected_signature = base64.b64encode(expected_hmac).decode('utf-8')
        return signature == expected_signature

payment_service = PaymentService()
