from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Any
from datetime import datetime

router = APIRouter()

from schemas.circuit import CircuitSchema
from repositories.circuit_repo import circuit_repo

@router.post("/")
async def save_circuit(circuit: CircuitSchema):
    circuit_data = circuit.dict()
    circuit_data["updatedAt"] = datetime.utcnow()
    
    result = await circuit_repo.upsert_circuit(circuit.name, circuit.userId, circuit_data)
    return {"message": "Circuit saved successfully", "id": str(result.upserted_id or "")}

@router.get("/{user_id}")
async def get_user_circuits(user_id: str):
    circuits = await circuit_repo.get_circuits_by_user(user_id)
    for c in circuits:
        c["_id"] = str(c["_id"])
    return circuits

@router.delete("/{circuit_name}/{user_id}")
async def delete_circuit(circuit_name: str, user_id: str):
    result = await circuit_repo.delete_circuit(circuit_name, user_id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Circuit not found")
    return {"message": "Circuit deleted"}
