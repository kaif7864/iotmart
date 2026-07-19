from fastapi import APIRouter, HTTPException, Body, UploadFile, File
import os
import shutil
import uuid
from typing import List
from schemas.product import Product, ProductCreate
from repositories.product_repo import product_repo
from bson import ObjectId
from fastapi import Depends
from api.deps import get_current_active_admin

router = APIRouter()

from core.redis_cache import get_cache, set_cache, delete_cache
from services.ai_service import get_ai_chat_response
import json
import random
import re
from core.database import db
from pydantic import BaseModel

class AIChatRequest(BaseModel):
    message: str

@router.post("/ai/chat")
async def post_ai_chat_products(req: AIChatRequest):
    prompt = f"""
    You are a helpful hardware engineering AI assistant for an IoT store.
    The user wants to build: "{req.message}"
    
    First, write a friendly 1-2 sentence response acknowledging their project.
    Second, provide a list of exactly 4 to 6 generic IoT component names (e.g., 'Arduino', 'Motor', 'Relay', 'Sensor') that are required for this project. Keep the names very concise (1-3 words max) so they can be used as search database keywords.
    Third, provide a short 1-sentence reason for why each component is needed.
    
    Return ONLY a raw JSON object (no markdown).
    Format:
    {{
      "ai_message": "Your friendly response here.",
      "components": [
        {{ "keyword": "DC Motor", "reason": "Used to drive the wheels of the robot." }}
      ]
    }}
    """
    
    try:
        reply = await get_ai_chat_response(prompt)
        
        # Safely extract JSON block
        json_match = re.search(r'\{[\s\S]*\}', reply)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = json.loads(reply)
            
        result_products = []
        components = data.get("components", [])
        
        # Search the database for each keyword the AI suggested
        for comp in components:
            keyword = comp.get("keyword", "")
            reason = comp.get("reason", "Highly recommended for your build.")
            
            if keyword:
                # Search by name or category using regex (case-insensitive)
                # Split keyword into terms to make search more robust (e.g. "DC Motor" -> "Motor")
                search_term = keyword.split()[-1] if len(keyword.split()) > 1 else keyword
                
                cursor = db.products.find({
                    "$or": [
                        {"name": {"$regex": search_term, "$options": "i"}},
                        {"category": {"$regex": search_term, "$options": "i"}},
                        {"description": {"$regex": search_term, "$options": "i"}}
                    ]
                }).limit(1)
                matched = await cursor.to_list(length=1)
                
                if matched:
                    prod = matched[0]
                    prod["_id"] = str(prod["_id"])
                    prod["ai_reason"] = reason
                    # Avoid duplicates
                    if prod["_id"] not in [p["_id"] for p in result_products]:
                        result_products.append(prod)
                
        # If DB search didn't yield enough results, pad with random fallback products
        if len(result_products) < 4:
            cursor = db.products.aggregate([{"$sample": {"size": 4 - len(result_products)}}])
            fallback = await cursor.to_list(length=4)
            for f in fallback:
                f["_id"] = str(f["_id"])
                f["ai_reason"] = "A highly versatile component for your build."
                if f["_id"] not in [p["_id"] for p in result_products]:
                    result_products.append(f)
                
        return {
            "response": data.get("ai_message", "I have found some excellent components for your project:"),
            "products": result_products
        }
    except Exception as e:
        print(f"Groq Chat Failed: {e}")
        error_msg = str(e)
        raw_reply = reply if 'reply' in locals() else "No reply"
        
        # Fallback if completely failed
        cursor = db.products.aggregate([{"$sample": {"size": 4}}])
        fallback = await cursor.to_list(length=4)
        for f in fallback:
            f["_id"] = str(f["_id"])
            f["ai_reason"] = "This might be useful for your project."
        return {
            "response": f"I've compiled a list of generic recommendations while my brain recalibrates.",
            "products": fallback
        }

@router.get("/ai/curated")
async def get_ai_curated_products():
    # Cache for 1 hour to prevent hitting Groq limits
    cache_key = "ai_curated_products"
    cached = await get_cache(cache_key)
    if cached:
        return cached

    # Fetch random 8 products
    cursor = db.products.aggregate([{"$sample": {"size": 8}}])
    db_products = await cursor.to_list(length=8)
    
    if not db_products:
        return []
        
    product_mapping = {str(p["_id"]): p for p in db_products}
    product_text = "\n".join([f"- ID: {p['_id']} | Name: {p['name']}" for p in db_products])
    
    prompt = f"""
    You are an advanced AI recommendation engine for an IoT hardware store.
    Here are some available products:
    {product_text}
    
    Select exactly 4 products that would form an excellent IoT project together.
    Return ONLY a raw JSON array (no markdown code blocks, just the JSON).
    Format:
    [
      {{"id": "product_id_here", "ai_reason": "A short, exciting 1-sentence reason why AI picked this for the project."}}
    ]
    """
    
    try:
        reply = await get_ai_chat_response(prompt)
        # Strip markdown if groq added it
        reply = reply.strip().removeprefix("```json").removesuffix("```").strip()
        selections = json.loads(reply)
        
        result = []
        for s in selections:
            pid = s.get("id")
            if pid in product_mapping:
                prod = product_mapping[pid]
                prod["_id"] = str(prod["_id"])
                prod["ai_reason"] = s.get("ai_reason", "AI selected this for your next build.")
                result.append(prod)
                
        if len(result) >= 4:
            await set_cache(cache_key, result, 3600)
            return result
    except Exception as e:
        print(f"Groq Curated Failed: {e}")
        
    # Fallback if AI fails
    fallback = db_products[:4]
    for f in fallback:
        f["_id"] = str(f["_id"])
        f["ai_reason"] = "Highly recommended for your tech stack."
    return fallback

@router.get("/")
async def get_products(page: int = 1, limit: int = 100, search: str = None, category: str = None):
    print("DEBUG: Inside get_products")
    cache_key = f"products:page:{page}:limit:{limit}:search:{search}:cat:{category}"
    print("DEBUG: Checking cache")
    cached_data = await get_cache(cache_key)
    print("DEBUG: Cache check done")
    if cached_data:
        return cached_data

    skip = (page - 1) * limit
    print("DEBUG: Querying DB")
    
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if category:
        query["category"] = category
        
    products = await product_repo.get_all_products(skip, limit, query)
    print("DEBUG: Query done")
    for product in products:
        product["_id"] = str(product["_id"])
    
    total = await product_repo.count_products(query)
    result = {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }
    
    await set_cache(cache_key, result, expire=300) # cache for 5 mins
    return result

@router.post("/", response_model=Product)
async def create_product(product: ProductCreate = Body(...), current_user: dict = Depends(get_current_active_admin)):
    new_product = await product_repo.insert_product(product.model_dump())
    created_product = await product_repo.get_product_by_id(str(new_product.inserted_id))
    created_product["_id"] = str(created_product["_id"])
    try:
        from api.v1.logs import log_activity
        await log_activity("PRODUCT_CREATED", product.name, current_user.get("email", "admin"), f"New product added")
    except Exception:
        pass
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
        try:
            from api.v1.logs import log_activity
            await log_activity("PRODUCT_UPDATED", product.name, current_user.get("email", "admin"), f"Product details updated")
        except Exception:
            pass
        await delete_cache("products:page:*")
        return product_data
    raise HTTPException(status_code=404, detail="Product not found or no changes made")

@router.delete("/{id}")
async def delete_product(id: str, current_user: dict = Depends(get_current_active_admin)):
    result = await product_repo.delete_product(id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        from api.v1.logs import log_activity
        await log_activity("PRODUCT_DELETED", f"Product #{id[:8].upper()}", current_user.get("email", "admin"), "Product removed from inventory")
    except Exception:
        pass
    await delete_cache("products:page:1:limit:100")
    return {"success": True, "message": "Product deleted successfully"}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        from PIL import Image
        import io
        import cloudinary
        import cloudinary.uploader
        from core.config import settings
        
        # Read image
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB (in case of RGBA/PNG) and compress
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Resize if too large (max 1024x1024)
        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
        # Save to buffer as WebP
        buffer = io.BytesIO()
        img.save(buffer, format="WEBP", quality=80)
        buffer.seek(0)
        
        if settings.CLOUDINARY_URL:
            # Upload to Cloudinary
            cloudinary.config(url=settings.CLOUDINARY_URL)
            res = cloudinary.uploader.upload(buffer, folder="iotmart_products")
            image_url = res.get("secure_url")
        else:
            # Fallback to local
            filename = f"{uuid.uuid4()}.webp"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(buffer.read())
            image_url = f"/uploads/{filename}"
            
        return {"success": True, "image_url": image_url}
        
    except Exception as e:
        print(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail="Image upload failed")

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
        "rating": round(avg_rating, 1) if reviews else 0
    })
    return {"message": "Review added"}

@router.delete("/{id}/reviews/{review_index}")
async def delete_review(id: str, review_index: int, current_user: dict = Depends(get_current_active_admin)):
    product = await product_repo.get_product_by_id(id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    reviews = product.get("reviews", [])
    if review_index < 0 or review_index >= len(reviews):
        raise HTTPException(status_code=400, detail="Invalid review index")
        
    reviews.pop(review_index)
    
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if len(reviews) > 0 else 0
    
    await product_repo.update_product(id, {
        "reviews": reviews,
        "reviews_count": len(reviews),
        "rating": round(avg_rating, 1)
    })
    return {"message": "Review deleted", "rating": avg_rating}

@router.get("/reviews/all")
async def get_all_reviews():
    try:
        from core.database import db
        # Aggregate all reviews from all products, unwind them, sort by highest rating and newest, limit to 6
        pipeline = [
            {"$unwind": "$reviews"},
            {"$match": {"reviews.rating": {"$gte": 4}}},
            {"$sort": {"reviews.date": -1, "reviews.rating": -1}},
            {"$limit": 6},
            {"$project": {
                "_id": 0,
                "product_id": {"$toString": "$_id"},
                "product_name": "$name",
                "name": "$reviews.user_name",
                "role": {"$cond": [{"$eq": ["$reviews.verified_buyer", True]}, "Verified Buyer", "IoT Enthusiast"]},
                "text": "$reviews.comment",
                "rating": "$reviews.rating",
                "avatar": {"$substr": ["$reviews.user_name", 0, 1]}
            }}
        ]
        cursor = db.products.aggregate(pipeline)
        reviews = await cursor.to_list(length=6)
        return reviews
    except Exception as e:
        print(f"Failed to fetch global reviews: {e}")
        return []
