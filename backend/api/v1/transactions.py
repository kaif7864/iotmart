from fastapi import APIRouter, HTTPException, Body, Depends
from schemas.transaction import Transaction, TransactionCreate
from api.deps import get_current_user
from bson import ObjectId
from typing import List
from repositories.transaction_repo import transaction_repo

router = APIRouter()

@router.post("/", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate = Body(...)):
    transaction_dict = transaction.model_dump()
    
    result = await transaction_repo.insert_transaction(transaction_dict)
    new_txn = await transaction_repo.get_transaction_by_id(str(result.inserted_id))
    new_txn["_id"] = str(new_txn["_id"])
    
    return new_txn

@router.get("/user/{user_id}", response_model=List[Transaction])
async def get_user_transactions(user_id: str):
    transactions = await transaction_repo.get_transactions_by_user(user_id)
    for txn in transactions:
        txn["_id"] = str(txn["_id"])
    return transactions

@router.get("/", response_model=List[Transaction])
async def get_all_transactions():
    transactions = await transaction_repo.get_all_transactions()
    for txn in transactions:
        txn["_id"] = str(txn["_id"])
    return transactions

@router.get("/{id}", response_model=Transaction)
async def get_transaction(id: str):
    txn = await transaction_repo.get_transaction_by_id(id)
    if txn:
        txn["_id"] = str(txn["_id"])
        return txn
    raise HTTPException(status_code=404, detail="Transaction not found")
