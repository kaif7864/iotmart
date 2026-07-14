from core.database import db

class CircuitRepository:
    def __init__(self):
        self.collection = db.circuits

    async def get_circuits_by_user(self, user_id: str, limit: int = 20):
        return await self.collection.find({"userId": user_id}).sort("updatedAt", -1).to_list(length=limit)

    async def upsert_circuit(self, name: str, user_id: str, circuit_data: dict):
        return await self.collection.update_one(
            {"name": name, "userId": user_id},
            {"$set": circuit_data},
            upsert=True
        )

    async def delete_circuit(self, name: str, user_id: str):
        return await self.collection.delete_one({"name": name, "userId": user_id})

circuit_repo = CircuitRepository()
