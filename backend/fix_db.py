import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['iot_ecommerce']
    await db.users.update_many(
        {'profile_picture': {'$regex': 'googleusercontent'}},
        {'$set': {'has_custom_password': False}}
    )
    print('Updated Google users successfully!')

if __name__ == "__main__":
    asyncio.run(main())
