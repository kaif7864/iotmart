from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import motor.motor_asyncio
import os

router = APIRouter()

from core.database import db

circuits_collection = db["circuits"]

class CircuitComponent(BaseModel):
    instanceId: str
    id: str
    type: str
    name: str
    x: float
    y: float
    label: str
    pins: Optional[List[Any]] = None
    pinsLeft: Optional[List[Any]] = None
    pinsRight: Optional[List[Any]] = None
    nexarData: Optional[Any] = None

class Wire(BaseModel):
    fromInstance: str
    fromPin: str
    toInstance: str
    toPin: str
    points: List[float]

class CircuitSchema(BaseModel):
    name: str
    description: Optional[str] = ""
    userId: str
    components: List[CircuitComponent]
    wires: List[Wire]
    code: Optional[str] = ""

@router.post("/")
async def save_circuit(circuit: CircuitSchema):
    circuit_data = circuit.dict()
    circuit_data["updatedAt"] = datetime.utcnow()
    
    # Simple upsert logic by name and userId
    result = await circuits_collection.update_one(
        {"name": circuit.name, "userId": circuit.userId},
        {"$set": circuit_data},
        upsert=True
    )
    return {"message": "Circuit saved successfully", "id": str(result.upserted_id or "")}

@router.get("/{user_id}")
async def get_user_circuits(user_id: str):
    cursor = circuits_collection.find({"userId": user_id}).sort("updatedAt", -1)
    circuits = await cursor.to_list(length=20)
    for c in circuits:
        c["_id"] = str(c["_id"])
    return circuits

@router.delete("/{circuit_name}/{user_id}")
async def delete_circuit(circuit_name: str, user_id: str):
    result = await circuits_collection.delete_one({"name": circuit_name, "userId": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Circuit not found")
    return {"message": "Circuit deleted"}
