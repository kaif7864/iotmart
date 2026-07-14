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
