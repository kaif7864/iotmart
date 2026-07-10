from fastapi import APIRouter, HTTPException, Body, Depends
from core.database import db
from schemas.transaction import Transaction, TransactionCreate
from core.security import get_current_user
from bson import ObjectId
from typing import List

router = APIRouter()

@router.post("/", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate = Body(...)):
    transaction_dict = transaction.model_dump()
    
    result = await db.transactions.insert_one(transaction_dict)
    new_txn = await db.transactions.find_one({"_id": result.inserted_id})
    new_txn["_id"] = str(new_txn["_id"])
    
    return new_txn

@router.get("/user/{user_id}", response_model=List[Transaction])
async def get_user_transactions(user_id: str):
    transactions = []
    async for txn in db.transactions.find({"user_id": user_id}):
        txn["_id"] = str(txn["_id"])
        transactions.append(txn)
    return transactions

@router.get("/", response_model=List[Transaction])
async def get_all_transactions():
    transactions = []
    async for txn in db.transactions.find():
        txn["_id"] = str(txn["_id"])
        transactions.append(txn)
    return transactions

@router.get("/{id}", response_model=Transaction)
async def get_transaction(id: str):
    txn = await db.transactions.find_one({"_id": ObjectId(id)})
    if txn:
        txn["_id"] = str(txn["_id"])
        return txn
    raise HTTPException(status_code=404, detail="Transaction not found")
