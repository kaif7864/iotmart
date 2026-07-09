import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def debug():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME")]
    products = await db.products.find({"price": {"$gt": 15000, "$lt": 20000}}).to_list(None)
    for p in products:
        print(f"Name: {p['name']} | Price: {p['price']}")

if __name__ == "__main__":
    asyncio.run(debug())
