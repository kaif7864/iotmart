from fastapi import APIRouter, HTTPException, Body
from database import db
from models import Order, OrderCreate
from bson import ObjectId
from typing import List

router = APIRouter()

@router.post("/", response_model=Order)
async def create_order(order: OrderCreate = Body(...)):
    order_dict = order.model_dump()
    result = await db.orders.insert_one(order_dict)
    new_order = await db.orders.find_one({"_id": result.inserted_id})
    new_order["_id"] = str(new_order["_id"])
    return new_order

@router.get("/user/{user_id}", response_model=List[Order])
async def get_user_orders(user_id: str):
    orders = []
    async for order in db.orders.find({"user_id": user_id}):
        order["_id"] = str(order["_id"])
        orders.append(order)
    return orders

@router.get("/", response_model=List[Order])
async def get_all_orders():
    orders = []
    async for order in db.orders.find():
        order["_id"] = str(order["_id"])
        orders.append(order)
    return orders

@router.put("/{id}/status")
async def update_order_status(id: str, status: str = Body(..., embed=True)):
    result = await db.orders.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": status}}
    )
    if result.modified_count:
        return {"message": "Status updated"}
    raise HTTPException(status_code=404, detail="Order not found")

@router.put("/{id}/tracking")
async def update_order_tracking(id: str, tracking_id: str = Body(..., embed=True)):
    result = await db.orders.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"tracking_id": tracking_id}}
    )
    if result.modified_count:
        return {"message": "Tracking ID updated"}
    raise HTTPException(status_code=404, detail="Order not found")
