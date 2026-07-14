from bson import ObjectId
from core.database import db

class UserRepository:
    def __init__(self):
        self.collection = db.users

    async def get_all_users(self, limit: int = 1000):
        return await self.collection.find().to_list(length=limit)

    async def get_user_by_id(self, user_id: str):
        return await self.collection.find_one({"_id": ObjectId(user_id)})

    async def get_user_by_email(self, email: str):
        return await self.collection.find_one({"email": email})

    async def update_user(self, user_id: str, update_data: dict):
        return await self.collection.update_one(
            {"_id": ObjectId(user_id)}, 
            {"$set": update_data}
        )

    async def insert_user(self, user_data: dict):
        return await self.collection.insert_one(user_data)

user_repo = UserRepository()
