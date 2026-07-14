from bson import ObjectId
from core.database import db

class ProductRepository:
    def __init__(self):
        self.collection = db.products

    async def get_all_products(self, skip: int = 0, limit: int = 100):
        return await self.collection.find().skip(skip).limit(limit).to_list(length=limit)

    async def count_products(self):
        return await self.collection.count_documents({})

    async def get_product_by_id(self, product_id: str):
        return await self.collection.find_one({"_id": ObjectId(product_id)})

    async def insert_product(self, product_data: dict):
        return await self.collection.insert_one(product_data)

    async def update_product(self, product_id: str, update_data: dict):
        return await self.collection.update_one(
            {"_id": ObjectId(product_id)}, 
            {"$set": update_data}
        )

    async def delete_product(self, product_id: str):
        return await self.collection.delete_one({"_id": ObjectId(product_id)})

product_repo = ProductRepository()
