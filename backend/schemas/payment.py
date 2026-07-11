from pydantic import BaseModel

class PaymentSessionRequest(BaseModel):
    order_amount: float
    customer_id: str
    customer_phone: str
    customer_email: str
    customer_name: str
