from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    user_id: str
    order_id: str
    amount: float
    currency: str = "INR"
    status: str = "Success" # Pending, Success, Failed, Refunded
    payment_method: str
    payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
