from fastapi import APIRouter, HTTPException, Body, BackgroundTasks
from schemas.order import Order, OrderCreate
from bson import ObjectId
from typing import List
from repositories.order_repo import order_repo
from repositories.transaction_repo import transaction_repo
from repositories.user_repo import user_repo
from fastapi.responses import StreamingResponse
import io
import csv

router = APIRouter()

@router.get("/export")
async def export_orders_csv():
    orders = await order_repo.get_all_orders(limit=10000)
    
    # Create a string buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Order ID", "Date", "Customer ID", "Status", "Total (INR)", "Payment Method", "Items"])
    
    for order in orders:
        items_str = ", ".join([f"{i.get('quantity', 1)}x {i.get('name', 'Unknown')}" for i in order.get("items", [])])
        writer.writerow([
            str(order.get("_id", "")),
            str(order.get("created_at", "")),
            order.get("user_id", ""),
            order.get("status", ""),
            order.get("total", 0),
            order.get("payment_method", ""),
            items_str
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"}
    )


@router.post("/", response_model=Order)
async def create_order(order: OrderCreate = Body(...), background_tasks: BackgroundTasks = None):
    order_dict = order.model_dump()
    
    from core.database import db
    
    # Check and Decrement Stock
    products_to_update = []
    for item in order_dict.get("items", []):
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)
        if product_id:
            try:
                product = await db.products.find_one({"_id": ObjectId(product_id)})
                if not product:
                    raise HTTPException(status_code=400, detail=f"Product {product_id} not found")
                if product.get("stockQuantity", 0) < quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.get('name', 'Product')}")
                
                # Prevent cart spoofing: overwrite with DB true price
                item["price"] = product.get("price", 0)
                products_to_update.append({"id": ObjectId(product_id), "qty": quantity, "name": product.get("name")})
            except HTTPException:
                raise
            except Exception as e:
                pass
                
    # Basic Total validation (prevent 1 rupee hack)
    true_subtotal = sum(i["price"] * i.get("quantity", 1) for i in order_dict.get("items", []))
    if true_subtotal > 0 and order_dict.get("total", 0) < (true_subtotal * 0.1): # total must be at least 10% of subtotal (allowing heavy coupons but not zero)
        raise HTTPException(status_code=400, detail="Invalid order total detected")
                
    # Proceed to decrement stock atomically
    for p in products_to_update:
        res = await db.products.update_one(
            {"_id": p["id"], "stockQuantity": {"$gte": p["qty"]}},
            {"$inc": {"stockQuantity": -p["qty"]}}
        )
        if res.modified_count == 0:
            raise HTTPException(status_code=400, detail=f"Stock just ran out for {p.get('name')}")
        
    # Invalidate products cache so frontend sees updated stock immediately
    try:
        from core.redis_cache import delete_cache
        await delete_cache("products:page:*")
    except Exception as e:
        print("Failed to invalidate cache:", e)
    
    
    # Initialize Logistics (Shiprocket)
    from services.logistics_engine import logistics
    # Real app would pass user details, using mock user here
    logistics_res = await logistics.create_shipment(order_dict, {"name": "IoT Customer"})
    if logistics_res.get("success"):
        order_dict["tracking_id"] = logistics_res.get("tracking_id")
        order_dict["status"] = "Processing"
    # Force status to Pending initially to prevent frontend fake "Paid" status
    order_dict["status"] = "Pending"
    if order_dict.get("payment_method") == "COD":
        order_dict["status"] = "Processing"
        
    result = await order_repo.insert_order(order_dict)
    new_order = await order_repo.get_order_by_id(str(result.inserted_id))
    new_order["_id"] = str(new_order["_id"])
    
    # Track Coupon Usage
    promo_code = order_dict.get("promo_code")
    if promo_code:
        try:
            discount_given = max(0, true_subtotal - order_dict.get("total", 0))
            await db.coupons.update_one(
                {"code": promo_code},
                {
                    "$addToSet": {"used_by": order_dict.get("user_id")},
                    "$inc": {"usage_count": 1, "total_discount_given": discount_given}
                }
            )
        except Exception as e:
            print(f"Failed to track coupon usage: {e}")
            
    # Create Transaction Record
    from datetime import datetime
    transaction_doc = {
        "user_id": new_order["user_id"],
        "order_id": new_order["_id"],
        "amount": new_order.get("total", 0),
        "currency": "INR",
        "status": "Pending", # Always pending initially
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
        if order_dict.get("user_id"):
            background_tasks.add_task(notify.send_in_app_notification, order_dict["user_id"], "Order Placed Successfully", f"Your order #{str(new_order['_id'])[:8]} has been placed and is being processed.", "order")
            
        # Notify admins
        async def notify_admins():
            admins = await db.users.find({"role": "admin"}).to_list(100)
            for admin in admins:
                await notify.send_in_app_notification(str(admin["_id"]), "New Order Received", f"Order #{str(new_order['_id'])[:8]} was placed by {user_email}.", "alert")
        background_tasks.add_task(notify_admins)
    else:
        notify.send_order_placed_email(user_email, new_order["_id"], new_order.get("total", 0))
        
    return new_order

@router.get("/user/{user_id}", response_model=List[Order])
async def get_user_orders(user_id: str):
    orders = await order_repo.get_orders_by_user(user_id)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@router.get("/", response_model=List[dict])
async def get_all_orders():
    orders = await order_repo.get_all_orders()
    from core.database import db
    
    for order in orders:
        order["_id"] = str(order["_id"])
        # Fetch global user_id
        user_id_str = order.get("user_id")
        order["global_user_id"] = "GUEST"
        if user_id_str and user_id_str != "guest":
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id_str)})
                if user and "user_id" in user:
                    order["global_user_id"] = user["user_id"]
            except Exception:
                pass
                
    return orders

@router.put("/{id}/status")
async def update_order_status(id: str, status: str = Body(..., embed=True)):
    order = await order_repo.get_order_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Prevent duplicate restoring
    if order.get("status") not in ["Cancelled", "Refunded"] and status in ["Cancelled", "Refunded"]:
        from core.database import db
        from bson import ObjectId
        for item in order.get("items", []):
            product_id = item.get("product_id")
            if product_id:
                try:
                    await db.products.update_one(
                        {"_id": ObjectId(product_id)},
                        {"$inc": {"stockQuantity": item.get("quantity", 1)}}
                    )
                except Exception as e:
                    print(f"Failed to restore stock for {product_id}: {e}")

    result = await order_repo.update_order(id, {"status": status})
    if result.modified_count:
        # Log activity
        try:
            from api.v1.logs import log_activity
            await log_activity("ORDER_STATUS_UPDATE", f"Order #{id[:8].upper()}", "admin", f"Status changed to {status}")
        except Exception:
            pass
        # Trigger WhatsApp Alert
        try:
            from services.notification_service import notify
            from core.database import db
            from bson import ObjectId
            
            user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
            if user and user.get("phone"):
                notify.send_whatsapp_alert(user["phone"], str(id), status, order.get("tracking_id"))
            else:
                print(f"Warning: No phone number found for user {order['user_id']}")
        except Exception as e:
            print(f"Failed to send WhatsApp alert: {e}")
            
        return {"message": "Status updated"}
    raise HTTPException(status_code=500, detail="Failed to update status")

@router.put("/{id}/dispute")
async def report_order_issue(id: str, issue: str = Body(..., embed=True)):
    order = await order_repo.get_order_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    result = await order_repo.update_order(id, {"dispute_status": "Open", "dispute_reason": issue})
    
    # Create support ticket automatically
    try:
        from core.database import db
        from datetime import datetime
        await db.support_tickets.insert_one({
            "order_id": id,
            "user_id": order.get("user_id"),
            "subject": f"Order Issue: {id}",
            "message": issue,
            "status": "Open",
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to create support ticket for dispute: {e}")
        
    if result.modified_count:
        return {"message": "Issue reported successfully"}
    raise HTTPException(status_code=500, detail="Failed to report issue")

@router.put("/{id}/tracking")
async def update_order_tracking(id: str, tracking_id: str = Body(..., embed=True)):
    result = await order_repo.update_order(id, {"tracking_id": tracking_id})
    if result.matched_count:
        try:
            from api.v1.logs import log_activity
            await log_activity("TRACKING_ASSIGNED", f"Order #{id[:8].upper()}", "admin", f"Tracking ID: {tracking_id}")
        except Exception:
            pass
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
        
    if order.get("status") in ["Delivered", "Cancelled", "Refunded"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status: {order.get('status')}")
        
    result = await order_repo.update_order(id, {"status": "Cancelled"})
    if result.modified_count:
        from core.database import db
        # Restore stock
        for item in order.get("items", []):
            product_id = item.get("product_id")
            if product_id:
                try:
                    await db.products.update_one({"_id": ObjectId(product_id)}, {"$inc": {"stockQuantity": item.get("quantity", 1)}})
                except Exception:
                    pass
        
        try:
            from core.redis_cache import delete_cache
            await delete_cache("products:page:*")
        except Exception:
            pass
            
        return {"message": "Order cancelled successfully"}
    raise HTTPException(status_code=500, detail="Failed to cancel order")

@router.put("/{id}/refund")
async def refund_order(id: str):
    order = await order_repo.get_order_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.get("status") == "Refunded":
        raise HTTPException(status_code=400, detail="Order is already refunded")
        
    if order.get("payment_status") != "Paid" and order.get("payment_status") != "SUCCESS":
        raise HTTPException(status_code=400, detail="Order is not paid, cannot refund")
        
    from services.payment_service import payment_service
    refund_result = await payment_service.initiate_refund(
        order_id=order.get("payment_order_id") or id,
        amount=order.get("total", 0)
    )
    
    if refund_result.get("status") == "success":
        await order_repo.update_order(id, {"status": "Refunded"})
        
        # Restore stock
        from core.database import db
        for item in order.get("items", []):
            product_id = item.get("product_id")
            if product_id:
                try:
                    from bson import ObjectId
                    await db.products.update_one({"_id": ObjectId(product_id)}, {"$inc": {"stockQuantity": item.get("quantity", 1)}})
                except Exception:
                    pass
                    
        try:
            from core.redis_cache import delete_cache
            await delete_cache("products:page:*")
        except Exception:
            pass
        
        # Notify user (if phone exists)
        try:
            from services.notification_service import notify
            from core.database import db
            from bson import ObjectId
            user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
            if user and user.get("phone"):
                notify.send_whatsapp_alert(user["phone"], str(id), "Refunded")
        except Exception as e:
            print(f"Failed to notify refund: {e}")
            
        return {"message": "Refund initiated successfully", "refund_id": refund_result.get("refund_id")}
    else:
        raise HTTPException(status_code=400, detail=f"Refund failed: {refund_result.get('error')}")
