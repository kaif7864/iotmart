from fastapi import APIRouter, HTTPException, Body
from repositories.coupon_repo import coupon_repo
from datetime import datetime

router = APIRouter()

@router.post("/validate")
async def validate_coupon(code: str = Body(..., embed=True), order_value: float = Body(..., embed=True)):
    coupon = await coupon_repo.get_coupon_by_code(code)
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
        
    if not coupon.get("is_active", True):
        raise HTTPException(status_code=400, detail="Coupon is not active")
        
    if coupon.get("valid_until"):
        valid_until = coupon["valid_until"]
        if isinstance(valid_until, str):
            valid_until = datetime.fromisoformat(valid_until.replace("Z", "+00:00"))
        if datetime.utcnow() > valid_until:
            raise HTTPException(status_code=400, detail="Coupon has expired")
            
    if order_value < coupon.get("min_order_value", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order value of {coupon.get('min_order_value')} required")
        
    discount = (order_value * coupon.get("discount_percentage", 0)) / 100
    
    if coupon.get("max_discount_amount") and discount > coupon["max_discount_amount"]:
        discount = coupon["max_discount_amount"]
        
    return {
        "valid": True,
        "discount_percentage": coupon.get("discount_percentage"),
        "discount_amount": discount,
        "code": coupon.get("code")
    }

from fastapi import Depends
from api.deps import get_current_active_admin
from core.database import db
from bson import ObjectId

@router.get("/")
async def get_all_coupons(current_user: dict = Depends(get_current_active_admin)):
    cursor = db.coupons.find({})
    coupons = await cursor.to_list(length=100)
    for c in coupons:
        c["_id"] = str(c["_id"])
    return coupons

@router.post("/")
async def create_coupon(data: dict = Body(...), current_user: dict = Depends(get_current_active_admin)):
    if await coupon_repo.get_coupon_by_code(data["code"]):
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    data["code"] = data["code"].upper()
    result = await db.coupons.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@router.put("/{id}")
async def update_coupon(id: str, data: dict = Body(...), current_user: dict = Depends(get_current_active_admin)):
    data["code"] = data["code"].upper()
    result = await db.coupons.update_one({"_id": ObjectId(id)}, {"$set": data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found or no changes made")
    return {"success": True}

@router.delete("/{id}")
async def delete_coupon(id: str, current_user: dict = Depends(get_current_active_admin)):
    result = await db.coupons.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"success": True}
