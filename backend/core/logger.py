import logging
import sys
import uuid
from contextvars import ContextVar
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Context variable to store the request ID for the current async task
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        req_id = request_id_ctx_var.get()
        record.request_id = req_id if req_id else "-"
        return True

def setup_logger(name: str = "iotmart") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | [%(request_id)s] | %(module)s:%(funcName)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.addFilter(RequestIdFilter())
        
        logger.addHandler(console_handler)
        
    return logger

logger = setup_logger()

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_ctx_var.set(req_id)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
