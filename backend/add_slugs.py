import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import re

async def add_slugs():
    load_dotenv()
    uri = os.environ.get('MONGODB_URL')
    db_name = os.environ.get('DATABASE_NAME')
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    products = await db.products.find({}).to_list(None)
    for p in products:
        name = p.get('name', 'product')
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        await db.products.update_one({'_id': p['_id']}, {'$set': {'slug': slug}})
    print(f'Updated {len(products)} products with slugs.')

if __name__ == '__main__':
    asyncio.run(add_slugs())
