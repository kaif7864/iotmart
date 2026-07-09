from fastapi import APIRouter, HTTPException, Body
from typing import List
from core.database import db
from schemas.user import User, UserCreate, Address
from bson import ObjectId

router = APIRouter()

def user_helper(user) -> dict:
    return {
        "_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "status": user.get("status", "active"),
        "wishlist": user.get("wishlist", []),
        "addresses": user.get("addresses", [])
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
