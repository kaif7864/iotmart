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
    slug: Optional[str] = None
    video_id: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
