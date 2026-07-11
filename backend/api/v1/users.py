from fastapi import APIRouter, HTTPException, Body
from typing import List
from core.database import db
from schemas.user import User, UserCreate, Address
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter()

def user_helper(user) -> dict:
    return {
        "_id": str(user["_id"]),
        "first_name": user.get("first_name", user.get("name", "").split(" ")[0] if user.get("name") else ""),
        "last_name": user.get("last_name", user.get("name", "").split(" ")[-1] if user.get("name") and " " in user.get("name") else ""),
        "phone": user.get("phone", ""),
        "email": user["email"],
        "role": user.get("role", "user"),
        "status": user.get("status", "active"),
        "wishlist": user.get("wishlist", []),
        "addresses": user.get("addresses", []),
        "email_verified": user.get("email_verified", False),
        "mobile_verified": user.get("mobile_verified", False),
        "has_custom_password": user.get("has_custom_password", True)
    }

@router.get("/", response_model=List[dict])
async def get_all_users():
    users = await db.users.find().to_list(1000)
    return [user_helper(user) for user in users]

@router.get("/{id}", response_model=dict)
async def get_user(id: str):
    user = await db.users.find_one({"_id": ObjectId(id)})
    if user:
        return user_helper(user)
    raise HTTPException(status_code=404, detail="User not found")

@router.put("/{id}/role")
async def update_user_role(id: str, role: str = Body(..., embed=True)):
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"role": role}})
    return {"message": "Role updated"}

@router.put("/{id}/status")
async def update_user_status(id: str, status: str = Body(..., embed=True)):
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"status": status}})
    return {"message": "Status updated"}

class ProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone: str

@router.put("/{id}/profile")
async def update_user_profile(id: str, profile: dict = Body(...)):
    await db.users.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": {
            "first_name": profile.get("first_name", ""),
            "last_name": profile.get("last_name", ""),
            "phone": profile.get("phone", "")
        }}
    )
    user = await db.users.find_one({"_id": ObjectId(id)})
    return {"success": True, "message": "Profile updated", "user": user_helper(user)}

@router.post("/{id}/wishlist")
async def toggle_wishlist(id: str, product_id: str = Body(..., embed=True)):
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    wishlist = user.get("wishlist", [])
    if product_id in wishlist:
        wishlist.remove(product_id)
    else:
        wishlist.append(product_id)
        
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"wishlist": wishlist}})
    return {"wishlist": wishlist}

@router.post("/{id}/addresses")
async def add_address(id: str, address: Address):
    address_dict = address.dict()
    if not address_dict.get("id"):
        address_dict["id"] = str(ObjectId())
        
    await db.users.update_one(
        {"_id": ObjectId(id)}, 
        {"$push": {"addresses": address_dict}}
    )
    return address_dict

@router.delete("/{id}/addresses/{address_id}")
async def remove_address(id: str, address_id: str):
    await db.users.update_one(
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
        
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    has_custom = user.get("has_custom_password", True)
    
    if has_custom:
        if not current_password:
            raise HTTPException(status_code=400, detail="Missing current password")
        if not verify_password(current_password, user.get("password", "")):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_password = get_password_hash(new_password)
    await db.users.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"password": hashed_password, "has_custom_password": True}}
    )
    return {"success": True, "message": "Password updated successfully"}

@router.put("/{id}/deactivate")
async def deactivate_account(id: str):
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.users.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "inactive"}}
    )
    return {"success": True, "message": "Account deactivated successfully"}
