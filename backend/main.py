from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from core.config import settings
from api.router import api_router
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from middleware.logging_middleware import LoggingMiddleware
from core.logger import RequestIdMiddleware

load_dotenv()

# Rate Limiter setup (100 requests per minute globally)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

from contextlib import asynccontextmanager
from core.database import db
from core.redis_cache import init_redis, close_redis
import pymongo

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis()
    await db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
    await db.products.create_index([("category", pymongo.ASCENDING)])
    await db.products.create_index([("name", pymongo.TEXT)])
    await db.orders.create_index([("user_id", pymongo.ASCENDING)])
    yield
    # Shutdown
    await close_redis()

app = FastAPI(title="IoTMart API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIdMiddleware)

# CORS Configuration
# Parse comma-separated string into a list of origins
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to IoTMart API", "status": "online"}

from fastapi import Request, HTTPException
from core.logger import logger

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        # Handle body/query prefixes in location tuple
        loc = error["loc"]
        field = loc[-1] if len(loc) > 0 else "unknown"
        errors.append(f"{field}: {error['msg']}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "detail": "Validation error", "errors": errors, "status_code": 422}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.detail,
            "status_code": exc.status_code,
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "An unexpected internal server error occurred.",
            "status_code": 500
        }
    )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
