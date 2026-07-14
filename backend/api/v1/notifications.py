from fastapi import APIRouter, Depends, HTTPException
from api.deps import get_current_user
from core.database import db
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    notifs = await cursor.to_list(length=50)
    
    result = []
    for n in notifs:
        n["id"] = str(n["_id"])
        del n["_id"]
        result.append(n)
        
    return result

@router.put("/{notif_id}/read")
async def mark_as_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    res = await db.notifications.update_one(
        {"_id": ObjectId(notif_id), "user_id": str(current_user["_id"])},
        {"$set": {"read": True}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found or already read")
    return {"success": True}

@router.put("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": str(current_user["_id"]), "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}
