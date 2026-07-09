from pydantic import BaseModel
from typing import List

class DashboardStats(BaseModel):
    totalRevenue: float
    newOrders: int
    activeUsers: int
    liveTraffic: int
    lowStockCount: int
    revenueData: List[dict]
    topSelling: List[dict]
    recentReviews: List[dict] = []
