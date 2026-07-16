from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CouponBase(BaseModel):
    code: str
    discount_percentage: float
    max_discount_amount: Optional[float] = None
    min_order_value: float = 0.0
    valid_until: Optional[datetime] = None
    is_active: bool = True
    description: Optional[str] = None
    usage_limit: Optional[int] = None
    per_user_limit: int = 1

class CouponCreate(CouponBase):
    pass

class Coupon(CouponBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
