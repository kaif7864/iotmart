from bson import ObjectId
from core.database import db

class TransactionRepository:
    def __init__(self):
        self.collection = db.transactions

    async def get_all_transactions(self, limit: int = 1000):
        return await self.collection.find().to_list(length=limit)

    async def get_transactions_by_user(self, user_id: str):
        return await self.collection.find({"user_id": user_id}).to_list(length=1000)

    async def get_transaction_by_id(self, transaction_id: str):
        return await self.collection.find_one({"_id": ObjectId(transaction_id)})

    async def insert_transaction(self, transaction_data: dict):
        return await self.collection.insert_one(transaction_data)

transaction_repo = TransactionRepository()
