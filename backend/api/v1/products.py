from fastapi import APIRouter, HTTPException, Body
from typing import List
from core.database import db
from schemas.product import Product, ProductCreate
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[Product])
async def get_products():
    products = await db.products.find().to_list(1000)
    for product in products:
        product["_id"] = str(product["_id"])
    return products

@router.post("/", response_model=Product)
async def create_product(product: ProductCreate = Body(...)):
    new_product = await db.products.insert_one(product.model_dump())
    created_product = await db.products.find_one({"_id": new_product.inserted_id})
    created_product["_id"] = str(created_product["_id"])
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
        return product_data
    raise HTTPException(status_code=404, detail="Product not found or no changes made")

@router.delete("/{id}")
async def delete_product(id: str):
    delete_result = await db.products.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Product deleted successfully"}
    raise HTTPException(status_code=404, detail="Product not found")

@router.post("/{id}/reviews")
async def add_review(id: str, review: dict = Body(...)):
    product = await db.products.find_one({"_id": ObjectId(id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
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
