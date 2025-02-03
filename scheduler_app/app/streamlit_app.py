import json
import os
import sys

import pandas as pd
import requests
import streamlit as st
from config import API_URL

headers = {}

if "check_status_button" not in st.session_state:
    st.session_state["check_status_button"] = False  # To track if feedback has been submitted


# Helper function to interact with FastAPI API with exception handling
def schedule_job(site_id, trial_id, date, run_at=""):
    payload = {"site_id": site_id, "trial_id": trial_id, "date": date, "run_at": run_at}
    try:
        response = requests.post(f"{API_URL}/schedule-job/", json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        st.success("Job scheduled successfully.")
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        st.error(f"HTTP error occurred while scheduling job: {http_err} - {response.text}")
    except requests.exceptions.ConnectionError:
        st.error("Failed to connect to the FastAPI server. Please ensure it's running.")
    except requests.exceptions.Timeout:
        st.error("The request timed out. Please try again later.")
    except requests.exceptions.RequestException as err:
        st.error(f"An error occurred while scheduling job: {err}")
    return None


def get_jobs():
    try:
        response = requests.get(f"{API_URL}/jobs/", headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("jobs", [])
    except requests.exceptions.HTTPError as http_err:
        st.error(f"HTTP error occurred while fetching jobs: {http_err} - {response.text}")
    except requests.exceptions.ConnectionError:
        st.error("Failed to connect to the FastAPI server. Please ensure it's running.")
    except requests.exceptions.Timeout:
        st.error("The request timed out. Please try again later.")
    except requests.exceptions.RequestException as err:
        st.error(f"An error occurred while fetching jobs: {err}")
    return []


def delete_job(job_id):
    try:
        response = requests.delete(f"{API_URL}/jobs/{job_id}", headers=headers, timeout=10)
        response.raise_for_status()
        st.success(f"Deleted Job {job_id} successfully.")
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        st.error(f"HTTP error occurred while deleting job: {http_err} - {response.text}")
    except requests.exceptions.ConnectionError:
        st.error("Failed to connect to the FastAPI server. Please ensure it's running.")
    except requests.exceptions.Timeout:
        st.error("The request timed out. Please try again later.")
    except requests.exceptions.RequestException as err:
        st.error(f"An error occurred while deleting job: {err}")
    return {}


def get_job_status(job_id):
    try:
        response = requests.get(f"{API_URL}/job-status/{job_id}", headers=headers, timeout=10)
        response.raise_for_status()
        job_status = response.json()
        # Update session state with the current job details
        st.session_state["current_job"] = job_status.get("job_details", {})
        st.session_state["feedback_submitted"] = False  # Reset feedback submission status
        return job_status
    except requests.exceptions.HTTPError as http_err:
        if response.status_code == 404:
            st.error(f"Job ID {job_id} not found.")
        else:
            st.error(f"HTTP error occurred while fetching job status: {http_err} - {response.text}")
    except requests.exceptions.ConnectionError:
        st.error("Failed to connect to the FastAPI server. Please ensure it's running.")
    except requests.exceptions.Timeout:
        st.error("The request timed out. Please try again later.")
    except requests.exceptions.RequestException as err:
        st.error(f"An error occurred while fetching job status: {err}")
    return {}


def update_job_fields(job_id, status, feedback):
    update_payload = {"status": str(status), "feedback": str(feedback)}
    st.write(f"Preparing to update Job ID: {job_id} with status: {status} and feedback: {feedback}")
    try:
        response = requests.put(f"{API_URL}/update-job/{job_id}", json=update_payload, headers=headers, timeout=10)
        response.raise_for_status()  # Raises HTTPError for bad responses (4xx or 5xx)
        st.success("Job status updated successfully.")
        # Update session state with the new job details
        updated_job = response.json().get("updated_fields", {})
        st.session_state["current_job"].update(updated_job)
        st.session_state["feedback_submitted"] = True  # Mark feedback as submitted
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        st.error(f"HTTP error occurred: {http_err} - {response.text}")
    except requests.exceptions.ConnectionError:
        st.error("Failed to connect to the FastAPI server. Please ensure it's running.")
    except requests.exceptions.Timeout:
        st.error("The request timed out. Please try again later.")
    except requests.exceptions.RequestException as err:
        st.error(f"An error occurred: {err}")
    return None


# Streamlit UI
st.title("JnJ Copilot Agent Run")

# Sidebar input for scheduling job using a form
with st.sidebar.form(key="schedule_job_form"):
    st.subheader("Schedule a New Job")
    site_id = st.text_input("Site ID")
    trial_id = st.text_input("Trial ID")
    date = st.text_input("Date (YYYY-MM-DD)")
    run_at = st.text_input("Run At (optional, format: YYYY-MM-DD HH:MM:SS)", value="")
    schedule_job_button = st.form_submit_button(label="Run Agent")

if schedule_job_button:
    st.session_state["check_status_button"] = False
    if not site_id or not trial_id or not date:
        st.error("Please fill in all required fields: Site ID, Trial ID, and Date.")
    else:
        st.write("Scheduling the job...")
        result = schedule_job(site_id, trial_id, date, run_at)
        if result and "job_id" in result:
            st.success(f"Agent Scheduled: {result.get('job_id')}")
        else:
            st.error("Failed to schedule the job. Please check the inputs and try again.")

# Sidebar button to view scheduled jobs using a form
with st.sidebar.form(key="view_jobs_form"):
    st.subheader("View Scheduled Agents")
    view_jobs_button = st.form_submit_button(label="View Jobs")

if view_jobs_button:
    st.session_state["check_status_button"] = False
    st.write("Fetching scheduled jobs...")
    jobs = get_jobs()
    if jobs:
        st.markdown("### Scheduled Jobs")
        for job in jobs:
            st.markdown("---")
            st.markdown(
                f"""
                **Job ID**: {job['job_id']}  
                **Status**: {job['status']}  
                **Run At**: {job['run_at']}  
                """
            )
    else:
        st.write("No jobs scheduled.")

# Sidebar form to check job status by job_id
with st.sidebar.form(key="check_status_form"):
    st.subheader("Check Job Status")
    job_id_for_status = st.text_input("Enter Job ID to Check Status")
    check_status_button = st.form_submit_button(label="Check Status")

if check_status_button and job_id_for_status:
    st.session_state["check_status_button"] = True

if st.session_state["check_status_button"]:
    st.write(f"Fetching status for Job ID: {job_id_for_status.strip()}...")
    status = get_job_status(job_id_for_status.strip())
    if status:
        st.markdown(f"### Status for Job {job_id_for_status.strip()}")
        st.markdown("---")
        st.json(status.get("job_details", {}))
        st.markdown("---")

        payload = {
        "ai_messages": True,
        "ai_message_type": "all",
        "findings": True
        }
        messages_findings_res = requests.put(f"{API_URL}/get_ai_messages/"+status['job_details']['job_id'], json=payload, 
                                             headers=headers, timeout=10)
        messages_findings = messages_findings_res.json()

        # ai_message_line = "================================== Ai Message =================================="
        # ai_messages = ('\n\n' + ai_message_line).join(messages_findings['ai_messages'].split(ai_message_line))
        st.text_area(label="AI Messages:", value=messages_findings['ai_messages'], height=450)

        # Conditionally render the feedback form based on job status
        current_status = status["job_details"].get("status", "")
        if current_status == "take_human_feedback":
            st.markdown("---")
            with st.form(key="submit_feedback_form"):
                feedback = st.text_input(
                    "Do you approve of the above generated findings? Type 'y' to continue; otherwise, explain your requested changes."
                )
                submit_feedback_button = st.form_submit_button(label="Submit Feedback")

            if submit_feedback_button:
                st.write("Submit button clicked")  # Debugging statement
                if not feedback:
                    st.error("Please provide your feedback before submitting.")
                else:
                    st.write(
                        f"Updating job {status['job_details']['job_id']} with status 'got_human_feedback' and feedback: {feedback}"
                    )
                    update_res = update_job_fields(status["job_details"]["job_id"], "got_human_feedback", feedback)
                    if update_res:
                        st.success("Job status updated to 'got_human_feedback' successfully.")
                        st.write(update_res)
                        st.session_state["feedback_submitted"] = True
                    else:
                        st.error("Failed to update job status.")
        if len(messages_findings)>0:
            for k,v in messages_findings['findings'].items():
                st.write('-------------------------------------------------------')
                st.markdown(v['conclusion'])
                st.dataframe(pd.DataFrame(v['table']), use_container_width=True)


# Sidebar form to delete a specific job by job_id
with st.sidebar.form(key="delete_job_form"):
    st.subheader("Delete a Job")
    job_id_for_deletion = st.text_input("Enter Job ID to Delete")
    delete_job_button = st.form_submit_button(label="Delete Job")

if delete_job_button and job_id_for_deletion:
    st.session_state["check_status_button"] = False
    st.write(f"Deleting Job ID: {job_id_for_deletion.strip()}...")
    result = delete_job(job_id_for_deletion.strip())
    expected_message = f"Job {job_id_for_deletion.strip()} removed"
    if result.get("message") == expected_message:
        st.success(f"Deleted Job {job_id_for_deletion.strip()}")
    else:
        st.error(f"Failed to delete Job {job_id_for_deletion.strip()}: {result.get('detail', 'Unknown error')}")