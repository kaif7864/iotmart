from fastapi import APIRouter, HTTPException, Body, BackgroundTasks
from schemas.order import Order, OrderCreate
from bson import ObjectId
from typing import List
from repositories.order_repo import order_repo
from repositories.transaction_repo import transaction_repo
from repositories.user_repo import user_repo

router = APIRouter()

@router.post("/", response_model=Order)
async def create_order(order: OrderCreate = Body(...), background_tasks: BackgroundTasks = None):
    order_dict = order.model_dump()
    
    # Initialize Logistics (Shiprocket)
    from services.logistics_engine import logistics
    # Real app would pass user details, using mock user here
    logistics_res = await logistics.create_shipment(order_dict, {"name": "IoT Customer"})
    if logistics_res.get("success"):
        order_dict["tracking_id"] = logistics_res.get("tracking_id")
        order_dict["status"] = "Processing"
        
    result = await order_repo.insert_order(order_dict)
    new_order = await order_repo.get_order_by_id(str(result.inserted_id))
    new_order["_id"] = str(new_order["_id"])
    
    # Create Transaction Record
    from datetime import datetime
    transaction_doc = {
        "user_id": new_order["user_id"],
        "order_id": new_order["_id"],
        "amount": new_order.get("total", 0),
        "currency": "INR",
        "status": "Success" if new_order.get("payment_id") else "Pending",
        "payment_method": new_order.get("payment_method", "COD"),
        "payment_id": new_order.get("payment_id"),
        "created_at": datetime.utcnow()
    }
    await transaction_repo.insert_transaction(transaction_doc)
    
    # Trigger Order Email (Async)
    from services.notification_service import notify
    # In a real app, you'd fetch the user's email from db.users using user_id
    user = await user_repo.get_user_by_id(order.user_id) if hasattr(order, 'user_id') else None
    user_email = user["email"] if user else "engineer@iotmart.com"
    if background_tasks:
        background_tasks.add_task(notify.send_order_placed_email, user_email, new_order["_id"], new_order.get("total", 0))
    else:
        notify.send_order_placed_email(user_email, new_order["_id"], new_order.get("total", 0))
        
    return new_order

@router.get("/user/{user_id}", response_model=List[Order])
async def get_user_orders(user_id: str):
    orders = await order_repo.get_orders_by_user(user_id)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@router.get("/", response_model=List[Order])
async def get_all_orders():
    orders = await order_repo.get_all_orders()
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@router.put("/{id}/status")
async def update_order_status(id: str, status: str = Body(..., embed=True)):
    result = await order_repo.update_order(id, {"status": status})
    if result.modified_count:
        # Trigger WhatsApp Alert
        try:
            from services.notification_service import notify
            order = await order_repo.get_order_by_id(id)
            if order:
                # In real app, fetch user's phone from db.users. Using a mock phone here.
                notify.send_whatsapp_alert("+919876543210", str(id), status, order.get("tracking_id"))
        except Exception as e:
            print(f"Failed to send WhatsApp alert: {e}")
            
        return {"message": "Status updated"}
    raise HTTPException(status_code=404, detail="Order not found")

@router.put("/{id}/tracking")
async def update_order_tracking(id: str, tracking_id: str = Body(..., embed=True)):
    result = await order_repo.update_order(id, {"tracking_id": tracking_id})
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

@router.put("/{id}/cancel")
async def cancel_order(id: str):
    order = await order_repo.get_order_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.get("status") in ["Delivered", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status: {order.get('status')}")
        
    result = await order_repo.update_order(id, {"status": "Cancelled"})
    if result.modified_count:
        return {"message": "Order cancelled successfully"}
    raise HTTPException(status_code=500, detail="Failed to cancel order")
