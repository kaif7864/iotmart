from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from api.router import api_router
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from middleware.logging_middleware import LoggingMiddleware

load_dotenv()

# Rate Limiter setup (100 requests per minute globally)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(title="IoTMart API", version="1.0.0")

from core.database import db
from core.redis_cache import init_redis, close_redis
import pymongo

@app.on_event("startup")
async def startup_db_indexes():
    # Init Redis
    await init_redis()
    
    # Index for fast user lookups
    await db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
    # Index for fast product searching
    await db.products.create_index([("category", pymongo.ASCENDING)])
    await db.products.create_index([("name", pymongo.TEXT)])
    # Index for fast order lookups by user
    await db.orders.create_index([("user_id", pymongo.ASCENDING)])

@app.on_event("shutdown")
async def shutdown_db_clients():
    await close_redis()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(LoggingMiddleware)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to IoTMart API", "status": "online"}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = []
    for error in exc.errors():
        # Handle body/query prefixes in location tuple
        loc = error["loc"]
        field = loc[-1] if len(loc) > 0 else "unknown"
        errors.append(f"{field}: {error['msg']}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": errors}
    )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

