from pydantic import BaseModel, Field
from typing import List, Optional

class Address(BaseModel):
    id: Optional[str] = None
    type: str
    address: str

class UserBase(BaseModel):
    user_id: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    phone: str
    role: str = "user"
    status: str = "active"
    avatar: Optional[str] = None
    wishlist: List[str] = [] # List of product IDs
    recently_viewed: List[str] = [] # List of product IDs
    addresses: List[Address] = []
    
    # 2FA Fields
    is_2fa_enabled: bool = False
    two_factor_type: str = "email" # "email" or "authenticator"
    two_factor_secret: Optional[str] = None
    wallet_balance: float = 0.0

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
