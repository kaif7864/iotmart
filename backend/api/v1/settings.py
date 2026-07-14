from fastapi import APIRouter, HTTPException, Depends, Body
from core.database import db
from api.deps import get_current_active_admin

router = APIRouter()

@router.get("/")
async def get_settings():
    settings_doc = await db.site_settings.find_one({"_id": "global_settings"})
    if not settings_doc:
        # Return default settings
        return {
            "shipping_cost": 50,
            "free_shipping_threshold": 500,
            "tax_rate": 18,
            "maintenance_mode": False,
            "store_name": "IoTMart",
            "support_email": "support@iotmart.com",
            "order_prefix": "ORD-",
            "low_stock_threshold": 5
        }
    return settings_doc

@router.put("/")
async def update_settings(settings: dict = Body(...), current_user: dict = Depends(get_current_active_admin)):
    settings_data = {
        "shipping_cost": settings.get("shipping_cost", 50),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 500),
        "tax_rate": settings.get("tax_rate", 18),
        "maintenance_mode": settings.get("maintenance_mode", False),
        "store_name": settings.get("store_name", "IoTMart"),
        "support_email": settings.get("support_email", "support@iotmart.com"),
        "order_prefix": settings.get("order_prefix", "ORD-"),
        "low_stock_threshold": settings.get("low_stock_threshold", 5)
    }
    
    await db.site_settings.update_one(
        {"_id": "global_settings"},
        {"$set": settings_data},
        upsert=True
    )
    
    # Log the activity
    try:
        from api.v1.logs import log_activity
        await log_activity(
            action="UPDATE_SETTINGS",
            target="Global Config",
            user_email=current_user.get("email", "Admin")
        )
    except Exception as e:
        print(f"Failed to log: {e}")
    
    return {"message": "Settings updated successfully"}
