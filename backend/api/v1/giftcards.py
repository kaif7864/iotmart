from fastapi import APIRouter, Depends, HTTPException, status
from core.database import db
from api.deps import get_current_user
import uuid
import datetime
from bson import ObjectId
from services.email_service import send_giftcard_email

router = APIRouter()

DEFAULT_TIERS = [
    {"pay": 500, "get": 500, "label": ""},
    {"pay": 1000, "get": 1100, "label": "10% Extra"},
    {"pay": 2000, "get": 2300, "label": "15% Extra"},
    {"pay": 5000, "get": 6000, "label": "20% Extra"}
]

@router.get("/settings")
async def get_giftcard_settings():
    settings = await db.settings.find_one({"type": "giftcard"})
    if not settings:
        return {"tiers": DEFAULT_TIERS}
    return {"tiers": settings.get("tiers", DEFAULT_TIERS)}

@router.post("/settings")
async def update_giftcard_settings(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    tiers = data.get("tiers", DEFAULT_TIERS)
    await db.settings.update_one(
        {"type": "giftcard"},
        {"$set": {"tiers": tiers}},
        upsert=True
    )
    return {"success": True, "message": "Gift card settings updated"}

@router.post("/redeem")
async def redeem_gift_card(data: dict, current_user: dict = Depends(get_current_user)):
    code = data.get("code", "")
    if not code or len(code) != 16:
        raise HTTPException(status_code=400, detail="Invalid gift card code. Must be 16 characters.")
    
    # Check if code already used
    used_card = await db.giftcards.find_one({"code": code, "redeemed_by": {"$exists": True}})
    if used_card:
        raise HTTPException(status_code=400, detail="Gift card already redeemed")
        
    # See if it exists (from purchase)
    card = await db.giftcards.find_one({"code": code})
    if not card:
        raise HTTPException(status_code=404, detail="Invalid gift card code. Please check and try again.")
        
    amount = float(card.get("amount", 0.0))
    await db.giftcards.update_one(
        {"_id": card["_id"]},
        {"$set": {"redeemed_by": current_user["_id"], "redeemed_at": datetime.datetime.utcnow()}}
    )
    
    # Update user's wallet balance
    new_balance = current_user.get("wallet_balance", 0.0) + float(amount)
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"wallet_balance": new_balance}}
    )
    
    return {"success": True, "message": f"₹ {amount} added to your wallet!", "new_balance": new_balance}

@router.post("/purchase")
async def purchase_gift_card(data: dict, current_user: dict = Depends(get_current_user)):
    pay_amount = float(data.get("amount", 0))
    email = data.get("recipient_email", "")
    name = data.get("recipient_name", "")
    message = data.get("message", "")
    
    if pay_amount <= 0 or not email:
        raise HTTPException(status_code=400, detail="Invalid purchase details")
        
    # Get the actual value they get based on tiers
    settings = await db.settings.find_one({"type": "giftcard"})
    tiers = settings.get("tiers", DEFAULT_TIERS) if settings else DEFAULT_TIERS
    
    # Find matching tier
    actual_amount = pay_amount
    for tier in tiers:
        if float(tier.get("pay", 0)) == pay_amount:
            actual_amount = float(tier.get("get", pay_amount))
            break
            
    code = uuid.uuid4().hex[:16].upper()
    
    await db.giftcards.insert_one({
        "code": code,
        "amount": actual_amount,
        "paid_amount": pay_amount,
        "amount": actual_amount,
        "purchased_by": current_user["_id"],
        "recipient_email": email,
        "recipient_name": name,
        "message": message,
        "created_at": datetime.datetime.utcnow()
    })
    
    sender_name = current_user.get("first_name", "Someone") + " " + current_user.get("last_name", "")
    send_giftcard_email(
        to_email=email,
        recipient_name=name,
        sender_name=sender_name.strip(),
        amount=actual_amount,
        code=code,
        message=message
    )
    
    return {"success": True, "message": "Gift card purchased successfully! Email sent to recipient.", "code": code}
