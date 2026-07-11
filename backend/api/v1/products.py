from fastapi import APIRouter, HTTPException, Body
from typing import List
from core.database import db
from schemas.product import Product, ProductCreate
from bson import ObjectId

router = APIRouter()

from core.redis_cache import get_cache, set_cache, delete_cache

@router.get("/")
async def get_products(page: int = 1, limit: int = 100):
    cache_key = f"products:page:{page}:limit:{limit}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data

    skip = (page - 1) * limit
    cursor = db.products.find().skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    for product in products:
        product["_id"] = str(product["_id"])
    
    total = await db.products.count_documents({})
    result = {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }
    
    await set_cache(cache_key, result, expire=300) # cache for 5 mins
    return result

@router.post("/", response_model=Product)
async def create_product(product: ProductCreate = Body(...)):
    new_product = await db.products.insert_one(product.model_dump())
    created_product = await db.products.find_one({"_id": new_product.inserted_id})
    created_product["_id"] = str(created_product["_id"])
    
    await delete_cache("products:page:*")
    return created_product

@router.get("/{id}", response_model=Product)
async def get_product(id: str):
    product = await db.products.find_one({"_id": ObjectId(id)})
    if product:
        product["_id"] = str(product["_id"])
        return product
    raise HTTPException(status_code=404, detail="Product not found")

@router.put("/{id}", response_model=Product)
async def update_product(id: str, product: ProductCreate = Body(...)):
    updated = await db.products.update_one(
        {"_id": ObjectId(id)},
        {"$set": product.model_dump()}
    )
    if updated.modified_count:
        product_data = await db.products.find_one({"_id": ObjectId(id)})
        product_data["_id"] = str(product_data["_id"])
        
        await delete_cache("products:page:*")
        return product_data
    raise HTTPException(status_code=404, detail="Product not found or no changes made")

@router.delete("/{id}")
async def delete_product(id: str):
    delete_result = await db.products.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        await delete_cache("products:page:*")
        return {"message": "Product deleted successfully"}
    raise HTTPException(status_code=404, detail="Product not found")

@router.post("/{id}/reviews")
async def add_review(id: str, review: dict = Body(...)):
    product = await db.products.find_one({"_id": ObjectId(id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    user_id = review.get("user_id")
    verified_buyer = False
    
    if user_id:
        # Check if user has placed an order containing this product
        order = await db.orders.find_one({
            "user_id": user_id, 
            "items.product_id": id
        })
        if order:
            verified_buyer = True
            
    review["verified_buyer"] = verified_buyer
    
    reviews = product.get("reviews", [])
    reviews.append(review)
    
    # Simple average rating calculation
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.products.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "reviews": reviews,
            "reviews_count": len(reviews),
            "rating": round(avg_rating, 1)
        }}
    )
    return {"message": "Review added", "rating": avg_rating}
