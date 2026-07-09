from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import jwt
from core.config import settings

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude public routes from middleware auth if needed, or implement it as dependency
        # For FastAPI, auth is usually better handled via Dependencies (Depends)
        # but here we provide a middleware stub as per architecture.
        # We will skip auth checking in middleware for now to avoid breaking existing routes
        # that don't pass tokens.
        response = await call_next(request)
        return response
