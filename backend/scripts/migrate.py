import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    from core.config import settings
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    await db.users.update_many(
        {'profile_picture': {'$regex': 'googleusercontent'}},
        {'$set': {'has_custom_password': False}}
    )
    print('Updated Google users successfully!')

if __name__ == "__main__":
    asyncio.run(main())
