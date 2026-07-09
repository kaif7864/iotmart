from pydantic import BaseModel, Field
from typing import List, Optional

class Address(BaseModel):
    id: Optional[str] = None
    type: str
    address: str

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "user"
    status: str = "active"
    wishlist: List[str] = [] # List of product IDs
    addresses: List[Address] = []

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
