from fastapi import APIRouter, HTTPException, Body, Request, BackgroundTasks
import os
from core.database import db
from schemas.user import UserCreate
from core.security import get_password_hash, verify_password, create_access_token
from bson import ObjectId
from services.user_service import serialize_user
from repositories.user_repo import user_repo

router = APIRouter()

@router.post("/signup")
async def signup(user: UserCreate, background_tasks: BackgroundTasks):
    # Check if user exists
    existing_user = await user_repo.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Account already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["role"] = "user" # Default role
    user_dict["status"] = "active"
    
    result = await user_repo.insert_user(user_dict)
    
    # Trigger Welcome Email (Async)
    from services.email_service import send_welcome_email
    background_tasks.add_task(send_welcome_email, user.first_name, user.email)
        
    return {"message": "Identity initialized", "id": str(result.inserted_id)}

@router.post("/login")
async def login(email: str = Body(...), password: str = Body(...)):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    if user.get("status") == "inactive":
        # Auto-reactivate account
        await user_repo.update_user(str(user["_id"]), {"status": "active"})
        user["status"] = "active"
    
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if user.get("is_2fa_enabled"):
        # If email type, generate and send OTP
        if user.get("two_factor_type") == "email":
            import random
            from services.email_service import send_verification_email
            otp = str(random.randint(100000, 999999))
            await user_repo.collection.update_one({"email": email}, {"$set": {"email_token": otp}})
            # Send OTP email
            # We use the existing verification template or a generic one
            send_verification_email(email, otp)
            
        return {
            "requires_2fa": True,
            "two_factor_type": user.get("two_factor_type", "email"),
            "email": user["email"]
        }
    
    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "user")})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(user)
    }

from google.oauth2 import id_token
from google.auth.transport import requests
import httpx
from core.config import settings

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID or "dummy-client-id.apps.googleusercontent.com"

@router.post("/google")
async def google_login(credential: str = Body(..., embed=True), isSignup: bool = Body(False, embed=True), background_tasks: BackgroundTasks = None):
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
        user = await user_repo.get_user_by_email(email)
        
        if user and user.get("status") == "inactive":
            # Auto-reactivate
            await user_repo.update_user(str(user["_id"]), {"status": "active"})
            user["status"] = "active"
        
        if not user:
            if not isSignup:
                raise HTTPException(status_code=400, detail="Account not found. Please sign up first.")
            # Create new user automatically
            user_dict = {
                "email": email,
                "first_name": name.split(" ")[0] if name else "",
                "last_name": name.split(" ")[-1] if name and " " in name else "",
                "password": "$2b$12$1diXF/RSJ9EnwmWeM9MNBuI6afXcfcMrd.5pBcac/gUUyCyIdPEs.", # Hardcoded secure hash
                "role": "user",
                "status": "active",
                "profile_picture": picture,
                "wishlist": [],
                "addresses": [],
                "has_custom_password": False
            }
            result = await user_repo.insert_user(user_dict)
            user = await user_repo.get_user_by_id(str(result.inserted_id))
            
            # Trigger Welcome Email (Async)
            from services.email_service import send_welcome_email
            if background_tasks:
                background_tasks.add_task(send_welcome_email, user.get("first_name", ""), user["email"])
            else:
                send_welcome_email(user.get("first_name", ""), user["email"])
                
        if user.get("is_2fa_enabled"):
            # If email type, generate and send OTP
            if user.get("two_factor_type") == "email":
                import random
                from services.email_service import send_verification_email
                otp = str(random.randint(100000, 999999))
                await user_repo.collection.update_one({"email": email}, {"$set": {"email_token": otp}})
                send_verification_email(email, otp)
                
            return {
                "requires_2fa": True,
                "two_factor_type": user.get("two_factor_type", "email"),
                "email": user["email"]
            }

        # Generate our JWT token for the user
        access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "user")})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": serialize_user(user)
        }
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

import random
import uuid

@router.post("/send-verification")
async def send_verification(email: str = Body(...), type: str = Body(...), background_tasks: BackgroundTasks = None):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from services.email_service import send_verification_email
    from services.sms_service import send_otp_sms
    
    email_sent = False
    sms_sent = False
    
    if type == 'email':
        email_token = str(random.randint(100000, 999999))
        await user_repo.collection.update_one({"email": email}, {"$set": {"email_token": email_token}})
        if background_tasks:
            background_tasks.add_task(send_verification_email, email, email_token)
            email_sent = True
        else:
            email_sent = send_verification_email(email, email_token)
    elif type == 'mobile':
        otp = str(random.randint(100000, 999999))
        await user_repo.collection.update_one({"email": email}, {"$set": {"mobile_otp": otp}})
        phone = user.get("phone")
        if not phone:
            raise HTTPException(status_code=400, detail="No phone number linked to this account. Please update profile.")
            
        if not phone.startswith("+"):
            phone = "+91" + phone.lstrip("0")[-10:]
            
        if background_tasks:
            background_tasks.add_task(send_otp_sms, phone, otp)
            sms_sent = True
        else:
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


# 2FA ENDPOINTS
import pyotp
import qrcode
import base64
from io import BytesIO

@router.get("/2fa/setup")
async def setup_2fa(email: str):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user["email"], issuer_name="IoTMart")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_b64}"
    }

@router.post("/2fa/enable")
async def enable_2fa(email: str = Body(...), secret: str = Body(...), code: str = Body(...), type: str = Body(...)):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if type == "authenticator":
        totp = pyotp.TOTP(secret)
        if not totp.verify(code):
            raise HTTPException(status_code=400, detail="Invalid Authenticator code")
        
        await user_repo.collection.update_one(
            {"email": email},
            {"$set": {"is_2fa_enabled": True, "two_factor_type": "authenticator", "two_factor_secret": secret}}
        )
    elif type == "email":
        if user.get("email_token") != code:
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        await user_repo.collection.update_one(
            {"email": email},
            {
                "$set": {"is_2fa_enabled": True, "two_factor_type": "email"},
                "$unset": {"email_token": ""}
            }
        )
    
    return {"success": True, "message": "2FA has been successfully enabled."}

@router.post("/2fa/disable")
async def disable_2fa(email: str = Body(...)):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await user_repo.collection.update_one(
        {"email": email},
        {"$set": {"is_2fa_enabled": False, "two_factor_type": "email", "two_factor_secret": None}}
    )
    return {"success": True, "message": "2FA has been disabled."}

@router.post("/login/verify-2fa")
async def verify_login_2fa(email: str = Body(...), code: str = Body(...)):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.get("is_2fa_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")
        
    if user.get("two_factor_type") == "authenticator":
        totp = pyotp.TOTP(user.get("two_factor_secret"))
        if not totp.verify(code):
            raise HTTPException(status_code=400, detail="Invalid Authenticator code")
    else:
        # Email OTP
        if user.get("email_token") != code:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        # Clear token
        await user_repo.collection.update_one({"email": email}, {"$unset": {"email_token": ""}})
        
    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "user")})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(user)
    }

@router.post("/verify-mobile")
async def verify_mobile(email: str = Body(...), otp: str = Body(...)):
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("mobile_otp") != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    await user_repo.collection.update_one(
        {"email": email},
        {
            "$set": {"mobile_verified": True},
            "$unset": {"mobile_otp": ""}
        }
    )
    return {"success": True, "message": "Mobile number verified successfully"}

@router.post("/verify-email")
async def verify_email(token: str = Body(..., embed=True)):
    user = await user_repo.collection.find_one({"email_verify_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
        
    await user_repo.collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"email_verified": True},
            "$unset": {"email_verify_token": ""}
        }
    )
    return {"success": True, "message": "Email verified successfully"}

from core.security import get_password_hash

@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True), background_tasks: BackgroundTasks = None):
    user = await user_repo.get_user_by_email(email)
    if not user:
        # Don't reveal if user exists or not for security
        return {"success": True, "message": "If an account exists, a reset link was sent."}
        
    reset_token = str(uuid.uuid4())
    
    await user_repo.collection.update_one(
        {"email": email},
        {"$set": {"reset_password_token": reset_token}}
    )
    
    from services.email_service import send_password_reset_email
    if background_tasks:
        background_tasks.add_task(send_password_reset_email, email, reset_token)
    else:
        send_password_reset_email(email, reset_token)
    
    return {"success": True, "message": "If an account exists, a reset link was sent."}

@router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    user = await user_repo.collection.find_one({"reset_password_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
        
    hashed_password = get_password_hash(new_password)
    
    await user_repo.collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_password_token": ""}
        }
    )
    return {"success": True, "message": "Password has been reset successfully"}

@router.put("/update-identity")
async def update_identity(email: str = Body(None), phone: str = Body(None), user_id: str = Body(...)):
    user = await user_repo.get_user_by_id(user_id)
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
        await user_repo.update_user(user_id, update_data)
        # Fetch updated user
        updated_user = await user_repo.get_user_by_id(user_id)
        return {
            "success": True, 
            "message": "Identity updated",
            "user": serialize_user(updated_user)
        }
    
    return {"success": True, "message": "No changes made"}
