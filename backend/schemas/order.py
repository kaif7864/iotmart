from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: str

class OrderBase(BaseModel):
    user_id: str
    items: List[OrderItem]
    total: float
    status: str = "Pending"
    address: str
    payment_method: str = "COD"
    payment_id: Optional[str] = None
    tracking_id: Optional[str] = None
    shipping_method: str = "Standard"

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
