from fastapi import APIRouter
from core.database import db
from schemas.analytics import DashboardStats
from typing import List
import datetime

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    # Real logic to fetch from MongoDB
    orders = await db.orders.find().to_list(1000)
    users = await db.users.find().to_list(1000)
    products = await db.products.find().to_list(1000)
    
    total_revenue = sum(order.get("total", 0) for order in orders)
    low_stock = [p for p in products if p.get("stockQuantity", 10) < 5] 
    
    # Mock chart data for now, but linked to real totals
    revenue_data = [
        {"name": "Mon", "revenue": 4000},
        {"name": "Tue", "revenue": 3000},
        {"name": "Wed", "revenue": 2000},
        {"name": "Thu", "revenue": 2780},
        {"name": "Fri", "revenue": 1890},
        {"name": "Sat", "revenue": 2390},
        {"name": "Sun", "revenue": 3490}
    ]
    
    top_selling = [
        {"name": "ESP32-WROOM", "sales": 482, "growth": "+12%"},
        {"name": "Arduino Nano", "sales": 324, "growth": "+8%"},
        {"name": "Ultrasonic Sensor", "sales": 298, "growth": "+15%"}
    ]
    
    # Fetch recent reviews from all products
    recent_reviews = []
    for p in products:
        for r in p.get("reviews", []):
            recent_reviews.append({
                "product": p["name"],
                "user": r["user"],
                "rating": r["rating"],
                "comment": r["comment"]
            })
    
    # Sort by recent (mocked for now, but list is generated)
    recent_reviews = recent_reviews[:5]
    
    return {
        "totalRevenue": total_revenue,
        "newOrders": len(orders),
        "activeUsers": len(users),
        "liveTraffic": 42, # Simulated
        "lowStockCount": len(low_stock),
        "revenueData": revenue_data,
        "topSelling": top_selling,
        "recentReviews": recent_reviews
    }
