from fastapi import APIRouter
from core.database import db
from schemas.analytics import DashboardStats
from typing import List
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(range: str = "7D"):
    # Calculate date threshold
    now = datetime.utcnow()
    if range == "24H":
        threshold = now - timedelta(days=1)
    elif range == "7D":
        threshold = now - timedelta(days=7)
    elif range == "30D":
        threshold = now - timedelta(days=30)
    else:
        threshold = datetime.min
        
    orders_cursor = db.orders.find({"created_at": {"$gte": threshold}})
    orders = await orders_cursor.to_list(10000)
    users = await db.users.find().to_list(10000)
    products = await db.products.find().to_list(10000)
    
    total_revenue = sum(order.get("total", 0) for order in orders)
    low_stock = [p for p in products if p.get("stockQuantity", 10) < 5] 
    
    # Calculate revenue data by day/hour based on range
    revenue_map = {}
    for order in orders:
        if "created_at" in order:
            if range == "24H":
                date_str = order["created_at"].strftime("%I %p") # Hourly
            else:
                date_str = order["created_at"].strftime("%a") # Daily abbreviated
            
            revenue_map[date_str] = revenue_map.get(date_str, 0) + order.get("total", 0)
            
    revenue_data = [{"name": k, "revenue": v} for k, v in revenue_map.items()]
    if not revenue_data:
        revenue_data = [{"name": "No Data", "revenue": 0}]
        
    # Calculate top selling
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id")
            if pid:
                product_sales[pid] = product_sales.get(pid, 0) + item.get("quantity", 1)
                
    # Sort and get top 3
    sorted_sales = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:3]
    top_selling = []
    for pid, sales in sorted_sales:
        product = next((p for p in products if str(p["_id"]) == pid), None)
        if product:
            top_selling.append({
                "name": product.get("name", "Unknown"),
                "sales": sales,
                "growth": "+0%" # Placeholder
            })
            
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
    
    recent_reviews = recent_reviews[:5]
    
    return {
        "total_revenue": total_revenue,
        "total_orders": len(orders),
        "total_users": len(users),
        "liveTraffic": 42, # Simulated
        "lowStockCount": len(low_stock),
        "revenueData": revenue_data,
        "topSelling": top_selling,
        "recentReviews": recent_reviews
    }

