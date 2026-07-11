from bson import ObjectId
from core.database import db

class OrderRepository:
    def __init__(self):
        self.collection = db.orders

    async def get_all_orders(self, limit: int = 1000):
        return await self.collection.find().to_list(length=limit)

    async def get_orders_by_user(self, user_id: str):
        return await self.collection.find({"user_id": user_id}).to_list(length=1000)

    async def get_order_by_id(self, order_id: str):
        return await self.collection.find_one({"_id": ObjectId(order_id)})

    async def insert_order(self, order_data: dict):
        return await self.collection.insert_one(order_data)

    async def update_order(self, order_id: str, update_data: dict):
        return await self.collection.update_one(
            {"_id": ObjectId(order_id)}, 
            {"$set": update_data}
        )

order_repo = OrderRepository()
