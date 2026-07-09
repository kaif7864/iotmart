from fastapi import APIRouter, HTTPException, Body
from core.database import db
from schemas.order import Order, OrderCreate
from bson import ObjectId
from typing import List

router = APIRouter()

@router.post("/", response_model=Order)
async def create_order(order: OrderCreate = Body(...)):
    order_dict = order.model_dump()
    
    # Initialize Logistics (Shiprocket)
    from services.logistics_engine import logistics
    # Real app would pass user details, using mock user here
    logistics_res = await logistics.create_shipment(order_dict, {"name": "IoT Customer"})
    if logistics_res.get("success"):
        order_dict["tracking_id"] = logistics_res.get("tracking_id")
        order_dict["status"] = "Processing"
        
    result = await db.orders.insert_one(order_dict)
    new_order = await db.orders.find_one({"_id": result.inserted_id})
    new_order["_id"] = str(new_order["_id"])
    
    # Trigger Order Email
    try:
        from services.notification_engine import notify
        # In a real app, you'd fetch the user's email from db.users using user_id
        user = await db.users.find_one({"_id": ObjectId(order.user_id)}) if hasattr(order, 'user_id') else None
        user_email = user["email"] if user else "engineer@iotmart.com"
        notify.send_order_placed_email(user_email, new_order["_id"], new_order.get("total", 0))
    except Exception as e:
        print(f"Failed to send order email: {e}")
        
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
        # Trigger WhatsApp Alert
        try:
            from services.notification_engine import notify
            order = await db.orders.find_one({"_id": ObjectId(id)})
            if order:
                # In real app, fetch user's phone from db.users. Using a mock phone here.
                notify.send_whatsapp_alert("+919876543210", str(id), status, order.get("tracking_id"))
        except Exception as e:
            print(f"Failed to send WhatsApp alert: {e}")
            
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

@router.get("/tracking/{tracking_id}")
async def get_live_tracking(tracking_id: str):
    from services.logistics_engine import logistics
    result = await logistics.get_live_tracking(tracking_id)
    if result.get("success"):
        return result
    raise HTTPException(status_code=400, detail="Unable to fetch tracking data")
