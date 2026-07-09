import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.iot_mart

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed():
    hashed_password = pwd_context.hash("neural123")
    
    users = [
        {"name": "Admin Operator", "email": "admin@iotmart.com", "role": "admin", "password": hashed_password, "status": "active"},
        {"name": "Field Engineer", "email": "engineer@iotmart.com", "role": "user", "password": hashed_password, "status": "active"}
    ]
    
    for u in users:
        await db.users.update_one(
            {"email": u["email"]},
            {"$set": u},
            upsert=True
        )
    print("Demo users successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
