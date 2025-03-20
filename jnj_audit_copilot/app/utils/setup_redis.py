import logging
from app.common.config import REDIS_HOST, REDIS_PORT, REDIS_PWD, REDIS_DB
import redis

def connect_to_redis():
    try:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
        # redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PWD, ssl=True)
        # Test the connection to Redis
        if redis_client.ping():
            logging.info("Connected to Redis successfully.")
        return redis_client
    except redis.ConnectionError as e:
        logging.error(f"Could not connect to Redis: {str(e)}")
        print(f"Could not connect to Redis: {str(e)}")
        raise RuntimeError("Redis server is not running. Please start Redis.")


# Ensure Redis structure exists
def initialize_redis_structure(redis_client):
    try:
        # Check if job_queue exists. This is optional since sorted sets are
        # created when you first zadd.
        if not redis_client.exists("job_queue"):
            logging.info("Initializing job_queue structure in Redis.")
            # Optionally add an empty sorted set to initialize
            redis_client.zadd("job_queue", {"init": 0})
        else:
            logging.info("job_queue already exists.")
    except Exception as e:
        logging.error(f"Error initializing Redis structure: {str(e)}")
        print(f"Error initializing Redis structure: {str(e)}")
        raise RuntimeError("Failed to initialize Redis structure.")