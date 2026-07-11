from fastapi import APIRouter, HTTPException, Body
from typing import List
from core.database import db
from schemas.user import User, UserCreate, Address
from pydantic import BaseModel
from bson import ObjectId
from repositories.user_repo import user_repo
from services.user_service import serialize_user

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_all_users():
    users = await user_repo.get_all_users()
    return [serialize_user(user) for user in users]

@router.get("/{id}", response_model=dict)
async def get_user(id: str):
    user = await user_repo.get_user_by_id(id)
    if user:
        return serialize_user(user)
    raise HTTPException(status_code=404, detail="User not found")

@router.put("/{id}/role")
async def update_user_role(id: str, role: str = Body(..., embed=True)):
    await user_repo.update_user(id, {"role": role})
    return {"message": "Role updated"}

@router.put("/{id}/status")
async def update_user_status(id: str, status: str = Body(..., embed=True)):
    await user_repo.update_user(id, {"status": status})
    return {"message": "Status updated"}

class ProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone: str

@router.put("/{id}/profile")
async def update_user_profile(id: str, profile: dict = Body(...)):
    await user_repo.update_user(id, {
        "first_name": profile.get("first_name", ""),
        "last_name": profile.get("last_name", ""),
        "phone": profile.get("phone", "")
    })
    user = await user_repo.get_user_by_id(id)
    return {"success": True, "message": "Profile updated", "user": serialize_user(user)}

@router.post("/{id}/wishlist")
async def toggle_wishlist(id: str, product_id: str = Body(..., embed=True)):
    user = await user_repo.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    wishlist = user.get("wishlist", [])
    if product_id in wishlist:
        wishlist.remove(product_id)
    else:
        wishlist.append(product_id)
        
    await user_repo.update_user(id, {"wishlist": wishlist})
    return {"wishlist": wishlist}

@router.post("/{id}/addresses")
async def add_address(id: str, address: Address):
    address_dict = address.dict()
    if not address_dict.get("id"):
        address_dict["id"] = str(ObjectId())
        
    await user_repo.collection.update_one(
        {"_id": ObjectId(id)}, 
        {"$push": {"addresses": address_dict}}
    )
    return address_dict

@router.delete("/{id}/addresses/{address_id}")
async def remove_address(id: str, address_id: str):
    await user_repo.collection.update_one(
        {"_id": ObjectId(id)},
        {"$pull": {"addresses": {"id": address_id}}}
    )
    return {"message": "Address removed"}

from core.security import verify_password, get_password_hash

@router.put("/{id}/password")
async def change_password(id: str, payload: dict = Body(...)):
    current_password = payload.get("current_password")
    new_password = payload.get("new_password")
    
    if not new_password:
        raise HTTPException(status_code=400, detail="Missing new password")
        
    user = await user_repo.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    has_custom = user.get("has_custom_password", True)
    
    if has_custom:
        if not current_password:
            raise HTTPException(status_code=400, detail="Missing current password")
        if not verify_password(current_password, user.get("password", "")):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_password = get_password_hash(new_password)
    await user_repo.update_user(id, {"password": hashed_password, "has_custom_password": True})
    return {"success": True, "message": "Password updated successfully"}

@router.put("/{id}/deactivate")
async def deactivate_account(id: str):
    user = await user_repo.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check for pending/active orders
    active_orders_count = await db.orders.count_documents({
        "user_id": id,
        "status": {"$in": ["Pending", "Processing", "Shipped"]}
    })
    
    if active_orders_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Deactivation failed: You have {active_orders_count} active/pending order(s). Please cancel them or wait for delivery before deleting your account."
        )
        
    # Delete user permanently instead of just making them inactive
    await user_repo.collection.delete_one({"_id": ObjectId(id)})
    
    return {"success": True, "message": "Account completely deleted successfully"}
