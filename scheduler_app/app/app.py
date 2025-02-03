import json
import logging
import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional
import base64
import tempfile


from app.config import REDIS_DB, REDIS_HOST, REDIS_PORT, REDIS_PWD, agent_outputs_path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from redis import Redis
from app.setup_redis import connect_to_redis, initialize_redis_structure
from app.middle_parser import parse_ai_messages, filter_parsed_messages_by_name, add_content, summarize_content, filter_json_keys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, can specify a list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# Connect to Redis
redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
# redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PWD, ssl=True, decode_responses=True)

# Define the lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to Redis during the startup phase
    redis_client = connect_to_redis()
    initialize_redis_structure(redis_client)
    # Yield the application lifespan
    yield
    # You can add any shutdown logic here if needed
    logging.info("Shutting down...")
    print("Shutting down....")


@app.get("/")
async def home():
    """
    Root endpoint to verify API is running.
    """
    return "API is running"


# Pydantic model for job scheduling input
class JobInput(BaseModel):
    site_id: str
    trial_id: str
    date: str  # Expected format: "%Y-%m-%d"
    # Optional: Datetime string for future scheduling in "YYYY-MM-DD HH:MM:SS" format
    run_at: Optional[str] = Field(default=None)

# Run core/agent app in headless mode...!
def run_script_headless():
    # Change directory to jnj_audit_copilot
    os.chdir("/app/jnj_audit_copilot")  # Directly specify the relative path
    script_path = "run_app_redis.py"
    subprocess.Popen(["python3", script_path]) #, creationflags=subprocess.CREATE_NO_WINDOW)
    os.chdir("/app/scheduler_app")

# Route to schedule a job
@app.post("/schedule-job/")
async def schedule_job(job_input: JobInput):
    """
    Endpoint to schedule a new job.
    Stores job details in a Redis hash and adds the job_id to the sorted set for scheduling.
    """

    # Check for existing jobs with specified statuses
    job_ids = redis_client.zrange("job_queue", 0, -1)
    # blocked_statuses = ["processing", "queued", "take_human_feedback", "got_human_feedback"]
    blocked_statuses = []
    for job_id in job_ids:
        job_hash_key = f"job_status:{job_id}"
        job_data = redis_client.hgetall(job_hash_key)
        if job_data and job_data.get("status") in blocked_statuses:
            raise HTTPException(
                status_code=400, 
                detail="Cannot schedule new job. Another job is currently in progress or awaiting feedback."
            )
            
    current_time = datetime.now()
    job_id = current_time.strftime("%Y%m%d%H%M%S")

    # Determine the run_at time
    if not job_input.run_at:
        run_at = current_time.strftime("%Y-%m-%d %H:%M:%S")
    else:
        try:
            # Validate and parse the run_at format
            run_at_time = datetime.strptime(job_input.run_at, "%Y-%m-%d %H:%M:%S")
            run_at = job_input.run_at
        except ValueError:
            raise HTTPException(status_code=400, detail="run_at must be in 'YYYY-MM-DD HH:MM:SS' format")

    # Create a job payload with status "queued"
    job_data = {
        "job_id": job_id,
        "site_id": job_input.site_id,
        "date": job_input.date,
        "trial_id": job_input.trial_id,
        "run_at": run_at,
        "status": "queued",
        "feedback": "",  # Initialize feedback as an empty string
    }

    # Store job data as a Redis hash
    job_hash_key = f"job_status:{job_id}"
    redis_client.hset(job_hash_key, mapping=job_data)
    logger.info(f"Stored job data in hash: {job_hash_key}")

    # Add job_id to the sorted set with run_at as the score (for scheduling)
    run_at_timestamp = run_at_time.timestamp() if job_input.run_at else current_time.timestamp()
    redis_client.zadd("job_queue", {job_id: run_at_timestamp})
    logger.info(f"Added job_id {job_id} to 'job_queue' with score {run_at_timestamp}")
    run_script_headless() ### run the jnj core app....!
    return {"message": "Job scheduled", "job_id": job_id, "run_at": run_at}


# Route to view all jobs
@app.get("/jobs/")
async def get_jobs(status: Optional[str] = Query(None, description="Filter jobs by status")):
    """
    Endpoint to retrieve scheduled jobs.
    If 'status' is provided, returns only jobs matching that status.
    If 'status' is None, returns all jobs.
    """
    # Get all job_ids from the sorted set
    job_ids = redis_client.zrange("job_queue", 0, -1)
    jobs_list: List[Dict[str, str]] = []

    for job_id in job_ids:
        job_hash_key = f"job_status:{job_id}"
        job_data = redis_client.hgetall(job_hash_key)

        if job_data:
            if status:
                if job_data.get("status") == status:
                    jobs_list.append(job_data)
                    logger.debug(f"Retrieved job data for {job_id}: {job_data}")
            else:
                jobs_list.append(job_data)
                logger.debug(f"Retrieved job data for {job_id}: {job_data}")
        else:
            logger.warning(f"No job data found for {job_id}. Removing from 'job_queue'.")
            # Clean up: Remove job_id from sorted set if hash does not exist
            redis_client.zrem("job_queue", job_id)

    return {"jobs": jobs_list}


# Route to delete a specific job
@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Endpoint to delete a specific job.
    Removes the job_id from the sorted set and deletes the corresponding hash.
    """
    # Remove job_id from the sorted set
    result = redis_client.zrem("job_queue", job_id)
    logger.info(f"Attempted to remove job_id {job_id} from 'job_queue'. Result: {result}")

    if result == 0:
        logger.error(f"Job {job_id} not found in 'job_queue'.")
        raise HTTPException(status_code=404, detail="Job not found in queue")

    # Delete the job hash
    job_hash_key = f"job_status:{job_id}"
    redis_client.delete(job_hash_key)
    logger.info(f"Deleted job hash: {job_hash_key}")

    return {"message": f"Job {job_id} removed"}


# Route to view a specific job status
@app.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """
    Endpoint to retrieve the status and details of a specific job.
    """
    job_hash_key = f"job_status:{job_id}"
    job_data = redis_client.hgetall(job_hash_key)

    if not job_data:
        logger.error(f"Job {job_id} not found.")
        raise HTTPException(status_code=404, detail="Job not found")

    logger.debug(f"Retrieved job data for {job_id}: {job_data}")

    return {"job_id": job_id, "status": job_data.get("status"), "job_details": job_data}


class JobUpdateInput(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None
    processing_start_time: Optional[str] = None
    completed_time: Optional[str] = None
    error_details: Optional[str] = None


@app.put("/update-job/{job_id}")
async def update_job(job_id: str, job_update: JobUpdateInput):
    """
    Endpoint to update specific fields of a job.
    Allows updating 'status', 'feedback', 'processing_start_time', 'completed_time', and 'error_details'.
    Only updates fields that are provided (not None).
    """
    job_hash_key = f"job_status:{job_id}"

    # Check if the job exists in Redis
    if not redis_client.exists(job_hash_key):
        logger.error(f"Job {job_id} not found for update.")
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Convert Pydantic model to dict and remove None values
    update_fields = {k: v for k, v in job_update.dict().items() if v is not None}

    if update_fields:
        # Update fields in Redis hash
        redis_client.hset(job_hash_key, mapping=update_fields)
        logger.info(f"Updated job {job_id} with fields: {update_fields}")
    else:
        logger.warning(f"No fields provided to update for job {job_id}.")
        raise HTTPException(status_code=400, detail="No fields to update")

    return {"message": f"Job {job_id} updated successfully", "updated_fields": update_fields}


class JobMessages(BaseModel):
    ai_messages: Optional[bool] = True
    ai_message_type: Optional[str] = 'all'
    findings: Optional[bool] = True
    last_position: Optional[int] = 0


@app.put("/get_ai_messages/{job_id}")
def get_ai_messages(job_id: str, job_details: JobMessages):
    new_messages = []
    current_position = job_details.last_position
    full_messages = "Agent is processing!"


    if job_details.ai_messages:
        local_path = os.path.join(agent_outputs_path, "agent_scratch_pads")
        ai_messages_path = None
        
        
        if job_details.ai_message_type == 'sgr':
            ai_messages_path = os.path.join(local_path, 'sgr_' + job_id + ".txt")
        elif job_details.ai_message_type == 'inspection':
            ai_messages_path = os.path.join(local_path, 'inspection_' + job_id + ".txt")
        elif job_details.ai_message_type == 'trailmaster':
            ai_messages_path = os.path.join(local_path, 'trailmaster_' + job_id + ".txt")
        else:
            ai_messages_path = os.path.join(local_path, job_id + ".txt")

        if ai_messages_path is not None:
            if os.path.exists(ai_messages_path):
                with open(ai_messages_path, "r") as f:
                    full_content = f.read()
                    if full_content:
                        full_messages = full_content.replace("[1m", "").replace("[0m", "")
                

                if current_position < os.path.getsize(ai_messages_path):
                    with open(ai_messages_path, "r") as f:
                        f.seek(current_position)
                        new_content = f.read()
                        if new_content:
                            new_ai_messages = new_content.replace("[1m", "").replace("[0m", "")
                            new_messages = [new_ai_messages]
                        current_position = f.tell()
            
                
    findings = {}
    if job_details.findings:
        local_path = os.path.join(agent_outputs_path, "activity_findings")
        findings_path = os.path.join(local_path, job_id)
        if os.path.exists(findings_path):
            json_files = os.listdir(findings_path)
            for j in json_files:
                if j.endswith(".json"):
                    j1 = os.path.join(findings_path, j)
                    with open(j1, "r") as f:
                        table_data = f.read()
                    table_data = json.loads(table_data)
                    conclusion = ""
                    conclusion_file = 'conclusion_' + j.replace(".json", ".txt").replace("discrepancy_data_", "")
                    conclusion_path = os.path.join(local_path, job_id, conclusion_file)
                    # print(conclusion_path)
                    if os.path.exists(conclusion_path):
                        with open(conclusion_path, "r") as c:
                            conclusion = c.read()
                    json_data = {}
                    json_data["conclusion"] = conclusion
                    json_data["table"] = table_data

                    findings[j.replace(".json", "")] = json_data

    try:
        # Parse and process the latest AI message
        message_parser = parse_ai_messages(new_messages[0] if new_messages else "")
        processed_messages = filter_parsed_messages_by_name(message_parser)
        
        # Add content and summarize
        compressed_data = add_content(processed_messages) if processed_messages else []
        summarized_data = summarize_content(compressed_data) if compressed_data else []
        
        # Filter down to essential keys
        filtered_data = filter_json_keys(summarized_data) if summarized_data else []
    except Exception as e:
        logger.error(f"Error processing AI messages: {str(e)}")
        filtered_data = []

    res = {"ai_messages": full_messages, "new_ai_messages": new_messages, "last_position": current_position, "findings": findings, "filtered_data": filtered_data}
    return res



# Route to view a specific job status
@app.get("/get_sgr_ppt/{job_id}")
def get_sgr_ppt(job_id: str):
    # Construct the path to the PPT file based on the job_id
    ppt_path = os.path.join(agent_outputs_path, f"SGR/{job_id}/combined_presentation.pptx")  # {job_id}
    
    # Check if the PPT file exists
    if not os.path.exists(ppt_path):
        raise HTTPException(status_code=404, detail="PPT file not found")
    
    '''# Read the PPT file in binary mode
    with open(ppt_path, "rb") as ppt_file:
        ppt_data = ppt_file.read()
    
    # Encode the PPT file content to base64
    ppt_base64 = base64.b64encode(ppt_data).decode('utf-8')
    
    # Return the base64-encoded string
    return {"ppt_base64": ppt_base64}'''
    try:
        with tempfile.TemporaryDirectory() as tmpdirname:
            # Convert PPTX to PDF using LibreOffice
            pdf_path = os.path.join(agent_outputs_path, f"SGR/{job_id}")  # f"{job_id}.pdf")
            command = f'libreoffice --headless --convert-to pdf "{ppt_path}" --outdir "{pdf_path}"'
            conversion_result = os.system(command)
            
            # Check if conversion was successful
            pdf_file_path = os.path.join(pdf_path, "combined_presentation.pdf")
            if not os.path.exists(pdf_file_path):
                raise HTTPException(status_code=500, detail="Failed to convert PPTX to PDF")
            
            # Read the PDF file in binary mode
            with open(pdf_file_path, "rb") as pdf_file:
                pdf_data = pdf_file.read()
            
            # Encode the PDF file content to base64
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"pdf_base64": pdf_base64}

class FeedbackInput(BaseModel):
    feedbackType: str
    feedbackMessage: str
    isSGR: bool = False # default is False

@app.post("/user_feedback/{job_id}/{filename:path}")
@app.post("/user_feedback/{job_id}")  # Additional route without filename
async def add_feedback_to_finding(job_id: str,  feedback: FeedbackInput, filename: Optional[str]=None):
    """
    Add feedback to a specific finding file
    """

    # Determine the filename based on input
    actual_filename = "SGR_feedback.json" if feedback.isSGR else f"{filename}_feedback.json"
    
    if not feedback.isSGR and not filename:
        raise HTTPException(status_code=400, detail="Filename is required when not providing SGR feedback")
    
    # Construct the full path to the file
    feedback_file_path = os.path.join(agent_outputs_path, "activity_findings", job_id, actual_filename)
    
    # Prepare feedback data
    feedback_data = {
        "feedbackType": feedback.feedbackType,
        "feedbackMessage": feedback.feedbackMessage
    }

    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(feedback_file_path), exist_ok=True)
        # Write/update feedback file
        with open(feedback_file_path, 'w') as file:
            json.dump(feedback_data, file, indent=4)
        
        logger.info(f"Successfully saved feedback to {feedback_file_path}")
        return {"message": "Feedback saved successfully", "data": feedback_data}
        
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    # # Check if file exists
    # if not os.path.exists(file_path):
    #     logger.error(f"Finding file not found: {file_path}")
    #     raise HTTPException(status_code=404, detail="Finding file not found")
    
    # try:
    #     # Read existing JSON file
    #     with open(file_path, 'r') as file:
    #         existing_data = json.load(file)
        
    #     # Add feedback information
    #     existing_data['feedbackType'] = feedback.feedbackType
    #     existing_data['feedbackMessage'] = feedback.feedbackMessage
        
    #     # Write updated JSON back to file
    #     with open(file_path, 'w') as file:
    #         json.dump(existing_data, file, indent=4)
        
    #     logger.info(f"Successfully added feedback to {filename}")
    #     return {"message": "Feedback added successfully", "data": existing_data}
        
    # except json.JSONDecodeError:
    #     logger.error(f"Invalid JSON in file: {file_path}")
    #     raise HTTPException(status_code=400, detail="Invalid JSON file")
    # except Exception as e:
    #     logger.error(f"Error processing feedback: {str(e)}")
    #     raise HTTPException(status_code=500, detail=str(e))
