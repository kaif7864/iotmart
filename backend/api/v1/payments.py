from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from api.deps import get_current_user
from services.payment_service import payment_service
from core.database import db

router = APIRouter()

from schemas.payment import PaymentSessionRequest

@router.post("/cashfree/create-session")
async def create_cashfree_session(req: PaymentSessionRequest, user: dict = Depends(get_current_user)):
    result = await payment_service.create_session(
        order_amount=req.order_amount,
        order_currency=req.order_currency,
        customer_id=req.customer_id,
        customer_phone=req.customer_phone,
        customer_email=req.customer_email,
        customer_name=req.customer_name
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=f"Cashfree API Error: {result['error']}")
        
    return result

@router.post("/cashfree/webhook")
async def cashfree_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("x-webhook-signature")
    timestamp = request.headers.get("x-webhook-timestamp")
    
    if not payment_service.verify_webhook_signature(payload, signature, timestamp):
        raise HTTPException(status_code=400, detail="Invalid signature or missing headers")
        
    data = await request.json()
    print("Valid Cashfree Webhook Received:", data)
    
    event_type = data.get("type")
    if event_type == "PAYMENT_SUCCESS_WEBHOOK":
        order_info = data.get("data", {}).get("order", {})
        order_id_string = order_info.get("order_id")
        
        if order_id_string:
            # Note: order_id_string is the Cashfree ORDER_... we generated.
            # In a real app we'd query our db for this Cashfree order_id and update status.
            print(f"Payment successful for {order_id_string}")
            
            # Find the transaction
            transaction = await db.transactions.find_one({"payment_id": order_id_string})
            if transaction:
                # Update transaction
                await db.transactions.update_one({"_id": transaction["_id"]}, {"$set": {"status": "Success"}})
                # Update order
                from bson import ObjectId
                await db.orders.update_one({"_id": ObjectId(transaction["order_id"])}, {"$set": {"status": "Paid", "payment_status": "Paid"}})
            
    return {"status": "OK"}
