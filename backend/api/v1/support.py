from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from core.database import db
from datetime import datetime

router = APIRouter()

@router.post("/")
async def create_support_ticket(ticket: dict = Body(...), background_tasks: BackgroundTasks = None):
    name = ticket.get("name")
    email = ticket.get("email")
    message = ticket.get("message")
    
    if not email or not message:
        raise HTTPException(status_code=400, detail="Email and message are required")
        
    ticket_doc = {
        "name": name,
        "email": email,
        "message": message,
        "status": "Open",
        "created_at": datetime.utcnow()
    }
    
    result = await db.support_tickets.insert_one(ticket_doc)
    
    # Notify admin via email and in-app
    try:
        from services.notification_service import notify
        from core.config import settings
        admin_email = settings.GMAIL_USER or "admin@iotmart.com"
        
        async def notify_admins():
            # Send Email
            notify.send_email(admin_email, f"New Support Ticket from {name}", message)
            
            # Send In-App Notification to all admins
            admins = await db.users.find({"role": "admin"}).to_list(100)
            for admin in admins:
                await notify.send_in_app_notification(
                    str(admin["_id"]),
                    "New Support Ticket",
                    f"{name} submitted a new query: {message[:50]}...",
                    "info"
                )
                
        if background_tasks:
            background_tasks.add_task(notify_admins)
    except Exception as e:
        print(f"Support notification failed: {e}")
        
    return {"success": True, "ticket_id": str(result.inserted_id), "message": "Ticket created successfully"}

from fastapi import Depends
from api.deps import get_current_active_admin
from bson import ObjectId

@router.get("/")
async def get_support_tickets(current_user: dict = Depends(get_current_active_admin)):
    tickets = await db.support_tickets.find().sort("created_at", -1).to_list(100)
    for t in tickets:
        t["_id"] = str(t["_id"])
    return tickets

@router.put("/{id}/resolve")
async def resolve_ticket(id: str, current_user: dict = Depends(get_current_active_admin)):
    result = await db.support_tickets.update_one({"_id": ObjectId(id)}, {"$set": {"status": "Resolved"}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True, "message": "Ticket resolved"}
