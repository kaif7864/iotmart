import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv(r"p:\React-Work\iot-ecommerce\backend\.env")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.iotmart

async def main():
    print("Users in DB:")
    async for user in db.users.find():
        print(f"Email: {user.get('email')}, Role: {user.get('role')}")

if __name__ == "__main__":
    asyncio.run(main())
