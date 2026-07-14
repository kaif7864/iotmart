from fastapi import APIRouter, Depends
from core.database import db
from api.deps import get_current_active_admin
from datetime import datetime

router = APIRouter()

@router.get("/")
async def get_system_logs(current_user: dict = Depends(get_current_active_admin), limit: int = 100):
    logs_cursor = db.activity_logs.find().sort("timestamp", -1).limit(limit)
    logs = await logs_cursor.to_list(limit)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

async def log_activity(action: str, target: str, user_email: str, details: str = ""):
    """Helper function to log system activities"""
    try:
        await db.activity_logs.insert_one({
            "action": action,
            "target": target,
            "user": user_email,
            "details": details,
            "timestamp": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to write log: {e}")
