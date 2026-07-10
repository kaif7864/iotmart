import redis.asyncio as redis
import os
import json
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
        await redis_client.ping()
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
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        print(f"Redis get error: {e}")
        return None

async def set_cache(key: str, data: dict, expire: int = 300):
    if not redis_client:
        return False
    try:
        await redis_client.setex(key, expire, json.dumps(data))
        return True
    except Exception as e:
        print(f"Redis set error: {e}")
        return False

async def delete_cache(pattern: str):
    if not redis_client:
        return
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
    except Exception as e:
        print(f"Redis delete error: {e}")
