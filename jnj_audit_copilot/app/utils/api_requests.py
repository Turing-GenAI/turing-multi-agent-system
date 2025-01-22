import requests

from app.common.config import SCHEDULER_API_URL
from app.utils.log_setup import get_logger

logger = get_logger()


def get_job_status(job_id):
    url = f"{SCHEDULER_API_URL}/job-status/{job_id}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            job = response.json()
            return job
        logger.error(f"Failed to fetch job status for {job_id}: {response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"An error occurred: {e}")
        return None


def update_job_status(job_id, payload):
    url = f"{SCHEDULER_API_URL}/update-job/{job_id}"
    try:
        response = requests.put(url, json=payload, timeout=10)
        if response.status_code == 200:
            return response.json()
        logger.error(f"Failed to update job status for {job_id}: {response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"An error occurred: {e}")
        return None
