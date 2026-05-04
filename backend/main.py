from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from routes_products import router as product_router
from routes_orders import router as order_router
from routes_users import router as user_router
from routes_analytics import router as analytics_router
from routes_ai import router as ai_router
from routes_auth import router as auth_router

load_dotenv()

app = FastAPI(title="IoTMart API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(product_router, prefix="/api/products", tags=["Products"])
app.include_router(order_router, prefix="/api/orders", tags=["Orders"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

@app.get("/")
async def root():
    return {"message": "Welcome to IoTMart API", "status": "online"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

