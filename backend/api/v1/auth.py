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
        notify.send_welcome_email(user.name, user.email)
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
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "wishlist": user.get("wishlist", []),
            "addresses": user.get("addresses", [])
        }
    }
