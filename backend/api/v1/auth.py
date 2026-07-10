from fastapi import APIRouter, HTTPException, Body, Request
from core.database import db
from schemas.user import UserCreate
from core.security import get_password_hash, verify_password, create_access_token

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
        from services.notification_engine import notify
        notify.send_welcome_email(user.first_name, user.email)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        
    return {"message": "Identity initialized", "id": str(result.inserted_id)}

@router.post("/login")
async def login(email: str = Body(...), password: str = Body(...)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
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
            "addresses": user.get("addresses", [])
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
                "addresses": []
            }
            result = await db.users.insert_one(user_dict)
            user = await db.users.find_one({"_id": result.inserted_id})
            
            # Trigger Welcome Email
            try:
                from services.notification_engine import notify
                notify.send_welcome_email(user_dict["first_name"], email)
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
                "profile_picture": user.get("profile_picture", "")
            }
        }
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
