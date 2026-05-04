from fastapi import APIRouter, HTTPException, Body
from database import db
from models import UserCreate
from passlib.context import CryptContext
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Security config
SECRET_KEY = os.getenv("SECRET_KEY", "your-neural-link-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup")
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Neural identity already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["role"] = "user" # Default role
    user_dict["status"] = "active"
    
    result = await db.users.insert_one(user_dict)
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
