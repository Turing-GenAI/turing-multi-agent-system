import redis

try:
    r = redis.Redis(host='localhost', port=6379)
    r.ping()
    print("Redis is running!")
except redis.ConnectionError:
    print("Failed to connect to Redis.")
