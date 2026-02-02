import redis
import json
import fastf1
import os
from typing import Any, Optional

# Setup FastF1 cache
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache')
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

fastf1.Cache.enable_cache(CACHE_DIR)

class RedisCache:
    def __init__(self, host='localhost', port=6379, db=0):
        try:
            self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
            self.redis.ping() # Check connection
            self.enabled = True
            print("Redis connected successfully.")
        except redis.ConnectionError:
            self.enabled = False
            print("Redis connection failed. Caching disabled.")
        self.ttl = 3600 * 24  # 24 hours default TTL

    def get(self, key: str) -> Optional[Any]:
        if not self.enabled:
            return None
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Redis get error: {e}")
        return None

    def set(self, key: str, value: Any, ttl: int = None):
        if not self.enabled:
            return
        if ttl is None:
            ttl = self.ttl
        try:
            self.redis.set(key, json.dumps(value), ex=ttl)
        except Exception as e:
            print(f"Redis set error: {e}")

redis_cache = RedisCache()
