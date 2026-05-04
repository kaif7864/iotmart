from pydantic import BaseModel, Field
from typing import List, Optional

class Review(BaseModel):
    user: str
    rating: int
    comment: str
    date: str = Field(default_factory=lambda: "Just now")
    images: List[str] = []

class ProductBase(BaseModel):
    name: str
    price: float
    category: str
    rating: float = 0.0
    reviews_count: int = 0
    reviews: List[Review] = []
    image: str
    description: str
    specs: List[str]
    inStock: bool = True
    stockQuantity: int = 10

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

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
    tracking_id: Optional[str] = None
    shipping_method: str = "Standard"

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

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

class DashboardStats(BaseModel):
    totalRevenue: float
    newOrders: int
    activeUsers: int
    liveTraffic: int
    lowStockCount: int
    revenueData: List[dict]
    topSelling: List[dict]
    recentReviews: List[dict] = []
