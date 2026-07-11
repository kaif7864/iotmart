from fastapi import APIRouter, HTTPException, Body
from typing import List
from schemas.product import Product, ProductCreate
from repositories.product_repo import product_repo
from bson import ObjectId
from fastapi import Depends
from api.deps import get_current_active_admin

router = APIRouter()

from core.redis_cache import get_cache, set_cache, delete_cache

@router.get("/")
async def get_products(page: int = 1, limit: int = 100):
    cache_key = f"products:page:{page}:limit:{limit}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data

    skip = (page - 1) * limit
    products = await product_repo.get_all_products(skip, limit)
    for product in products:
        product["_id"] = str(product["_id"])
    
    total = await product_repo.count_products()
    result = {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }
    
    await set_cache(cache_key, result, expire=300) # cache for 5 mins
    return result

@router.post("/", response_model=Product)
async def create_product(product: ProductCreate = Body(...), current_user: dict = Depends(get_current_active_admin)):
    new_product = await product_repo.insert_product(product.model_dump())
    created_product = await product_repo.get_product_by_id(str(new_product.inserted_id))
    created_product["_id"] = str(created_product["_id"])
    
    await delete_cache("products:page:*")
    return created_product

@router.get("/{id}", response_model=Product)
async def get_product(id: str):
    product = await product_repo.get_product_by_id(id)
    if product:
        product["_id"] = str(product["_id"])
        return product
    raise HTTPException(status_code=404, detail="Product not found")

@router.put("/{id}", response_model=Product)
async def update_product(id: str, product: ProductCreate = Body(...), current_user: dict = Depends(get_current_active_admin)):
    updated = await product_repo.update_product(id, product.model_dump())
    if updated.modified_count:
        product_data = await product_repo.get_product_by_id(id)
        product_data["_id"] = str(product_data["_id"])
        
        await delete_cache("products:page:*")
        return product_data
    raise HTTPException(status_code=404, detail="Product not found or no changes made")

@router.delete("/{id}")
async def delete_product(id: str, current_user: dict = Depends(get_current_active_admin)):
    delete_result = await product_repo.delete_product(id)
    if delete_result.deleted_count == 1:
        await delete_cache("products:page:*")
        return {"message": "Product deleted successfully"}
    raise HTTPException(status_code=404, detail="Product not found")

@router.post("/{id}/reviews")
async def add_review(id: str, review: dict = Body(...)):
    product = await product_repo.get_product_by_id(id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    user_id = review.get("user_id")
    verified_buyer = False
    
    if user_id:
        # Check if user has placed an order containing this product
        from core.database import db
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
    
    await product_repo.update_product(id, {
        "reviews": reviews,
        "reviews_count": len(reviews),
        "rating": round(avg_rating, 1)
    })
    return {"message": "Review added", "rating": avg_rating}
