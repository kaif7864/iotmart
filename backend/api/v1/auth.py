from fastapi import APIRouter, HTTPException, Body, Request
from core.database import db
from schemas.user import UserCreate
from core.security import get_password_hash, verify_password, create_access_token
from bson import ObjectId

router = APIRouter()

@router.post("/signup")
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Account already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["role"] = "user" # Default role
    user_dict["status"] = "active"
    
    result = await db.users.insert_one(user_dict)
    
    # Trigger Welcome Email
    try:
        from services.email_service import send_welcome_email
        send_welcome_email(user.first_name, user.email)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        
    return {"message": "Identity initialized", "id": str(result.inserted_id)}

@router.post("/login")
async def login(email: str = Body(...), password: str = Body(...)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    if user.get("status") == "inactive":
        # Auto-reactivate account
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"status": "active"}})
        user["status"] = "active"
    
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "user")})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "_id": str(user["_id"]),
            "first_name": user.get("first_name", user.get("name", "").split(" ")[0] if user.get("name") else ""),
            "last_name": user.get("last_name", user.get("name", "").split(" ")[-1] if user.get("name") and " " in user.get("name") else ""),
            "phone": user.get("phone", ""),
            "email": user["email"],
            "role": user.get("role", "user"),
            "wishlist": user.get("wishlist", []),
            "addresses": user.get("addresses", []),
            "email_verified": user.get("email_verified", False),
            "mobile_verified": user.get("mobile_verified", False),
            "has_custom_password": user.get("has_custom_password", True)
        }
    }

from google.oauth2 import id_token
from google.auth.transport import requests
import os
import httpx

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "dummy-client-id.apps.googleusercontent.com")

@router.post("/google")
async def google_login(credential: str = Body(..., embed=True)):
    try:
        # Credential here is the Google Access Token returned by useGoogleLogin
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credential}"}
            )
            
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google access token")
            
        idinfo = response.json()
        
        email = idinfo.get('email')
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
        
        # Check if user already exists
        user = await db.users.find_one({"email": email})
        
        if user and user.get("status") == "inactive":
            # Auto-reactivate
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"status": "active"}})
            user["status"] = "active"
        
        if not user:
            # Create new user automatically
            user_dict = {
                "email": email,
                "first_name": name.split(" ")[0] if name else "",
                "last_name": name.split(" ")[-1] if name and " " in name else "",
                "password": get_password_hash(os.urandom(16).hex()), # Random secure password
                "role": "user",
                "status": "active",
                "profile_picture": picture,
                "wishlist": [],
                "addresses": [],
                "has_custom_password": False
            }
            result = await db.users.insert_one(user_dict)
            user = await db.users.find_one({"_id": result.inserted_id})
            
            # Trigger Welcome Email
            try:
                from services.email_service import send_welcome_email
                send_welcome_email(user.get("first_name", ""), user["email"])
            except Exception as e:
                pass
                
        # Generate our JWT token for the user
        access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "user")})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "_id": str(user["_id"]),
                "first_name": user.get("first_name", user.get("name", "").split(" ")[0] if user.get("name") else ""),
                "last_name": user.get("last_name", user.get("name", "").split(" ")[-1] if user.get("name") and " " in user.get("name") else ""),
                "phone": user.get("phone", ""),
                "email": user["email"],
                "role": user.get("role", "user"),
                "wishlist": user.get("wishlist", []),
                "addresses": user.get("addresses", []),
                "profile_picture": user.get("profile_picture", ""),
                "email_verified": user.get("email_verified", False),
                "mobile_verified": user.get("mobile_verified", False),
                "has_custom_password": user.get("has_custom_password", False)
            }
        }
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

import random
import uuid

@router.post("/send-verification")
async def send_verification(email: str = Body(...), type: str = Body(...)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from services.email_service import send_verification_email
    from services.sms_service import send_otp_sms
    
    email_sent = False
    sms_sent = False
    
    if type == 'email':
        email_token = str(uuid.uuid4())
        await db.users.update_one({"email": email}, {"$set": {"email_verify_token": email_token}})
        email_sent = send_verification_email(email, email_token)
    elif type == 'mobile':
        otp = str(random.randint(100000, 999999))
        await db.users.update_one({"email": email}, {"$set": {"mobile_otp": otp}})
        phone = user.get("phone")
        if phone:
            if not phone.startswith("+"):
                phone = "+91" + phone[-10:]
            sms_sent = send_otp_sms(phone, otp)
    else:
        raise HTTPException(status_code=400, detail="Invalid verification type")
        
    if type == 'email' and not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please check your configuration.")
    elif type == 'mobile' and not sms_sent:
        raise HTTPException(status_code=500, detail="Failed to send SMS. Your number might be unverified on Twilio Trial account.")

    return {
        "success": True, 
        "message": f"Verification code sent to {type}", 
        "email_sent": email_sent, 
        "sms_sent": sms_sent
    }

@router.post("/verify-mobile")
async def verify_mobile(email: str = Body(...), otp: str = Body(...)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("mobile_otp") != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    await db.users.update_one(
        {"email": email},
        {
            "$set": {"mobile_verified": True},
            "$unset": {"mobile_otp": ""}
        }
    )
    return {"success": True, "message": "Mobile number verified successfully"}

@router.post("/verify-email")
async def verify_email(token: str = Body(..., embed=True)):
    user = await db.users.find_one({"email_verify_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
        
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"email_verified": True},
            "$unset": {"email_verify_token": ""}
        }
    )
    return {"success": True, "message": "Email verified successfully"}

from core.security import get_password_hash

@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)):
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal if user exists or not for security
        return {"success": True, "message": "If an account exists, a reset link was sent."}
        
    reset_token = str(uuid.uuid4())
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"reset_password_token": reset_token}}
    )
    
    from services.email_service import send_password_reset_email
    send_password_reset_email(email, reset_token)
    
    return {"success": True, "message": "If an account exists, a reset link was sent."}

@router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    user = await db.users.find_one({"reset_password_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
        
    hashed_password = get_password_hash(new_password)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_password_token": ""}
        }
    )
    return {"success": True, "message": "Password has been reset successfully"}

@router.put("/update-identity")
async def update_identity(email: str = Body(None), phone: str = Body(None), user_id: str = Body(...)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = {}
    
    if email and email != user.get("email"):
        update_data["email"] = email
        update_data["email_verified"] = False
        
    if phone and phone != user.get("phone"):
        update_data["phone"] = phone
        update_data["mobile_verified"] = False
        
    if update_data:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        # Fetch updated user
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        return {
            "success": True, 
            "message": "Identity updated",
            "user": {
                "_id": str(updated_user["_id"]),
                "first_name": updated_user.get("first_name", ""),
                "last_name": updated_user.get("last_name", ""),
                "phone": updated_user.get("phone", ""),
                "email": updated_user.get("email", ""),
                "role": updated_user.get("role", "user"),
                "email_verified": updated_user.get("email_verified", False),
                "mobile_verified": updated_user.get("mobile_verified", False),
                "has_custom_password": updated_user.get("has_custom_password", True)
            }
        }
    
    return {"success": True, "message": "No changes made"}
