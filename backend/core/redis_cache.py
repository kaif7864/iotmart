import redis.asyncio as redis
import os
import json
import asyncio
from core.config import settings

redis_client = None

async def get_redis():
    return redis_client

async def init_redis():
    global redis_client
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL, 
            decode_responses=True, 
            socket_timeout=3,
            socket_connect_timeout=3
        )
        # Test connection so it fails fast
        await asyncio.wait_for(redis_client.ping(), timeout=3.0)
        print("Connected to Redis")
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
        redis_client = None

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()

async def get_cache(key: str):
    if not redis_client:
        return None
    try:
        data = await asyncio.wait_for(redis_client.get(key), timeout=2.0)
        return json.loads(data) if data else None
    except Exception as e:
        print(f"Redis get error: {e}")
        return None

async def set_cache(key: str, data: dict, expire: int = 300):
    if not redis_client:
        return False
    try:
        await asyncio.wait_for(redis_client.setex(key, expire, json.dumps(data)), timeout=2.0)
        return True
    except Exception as e:
        print(f"Redis set error: {e}")
        return False

async def delete_cache(pattern: str):
    if not redis_client:
        return
    try:
        keys = await asyncio.wait_for(redis_client.keys(pattern), timeout=2.0)
        if keys:
            await asyncio.wait_for(redis_client.delete(*keys), timeout=2.0)
    except Exception as e:
        print(f"Redis delete error: {e}")
