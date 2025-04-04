"""
Document compliance review functionality.
"""
import json
import os
import re
import logging
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import HTTPException
from pydantic import BaseModel

# Import the Azure OpenAI client
from .utils.azure_openai import get_azure_openai_client

# Configure logging
logger = logging.getLogger(__name__)

# Constants
COMPLIANCE_REVIEWS_DIR = os.environ.get("COMPLIANCE_REVIEWS_DIR", "compliance_reviews")
os.makedirs(COMPLIANCE_REVIEWS_DIR, exist_ok=True)

# Get Azure OpenAI client
client = get_azure_openai_client()

class ComplianceViolation(BaseModel):
    trial_text: str
    compliance_text: str
    trial_location: Dict[str, int]  # {start: int, end: int}
    compliance_location: Dict[str, int]  # {start: int, end: int}
    explanation: str
    suggested_edit: str
    confidence: str  # "high" or "low"
    status: Optional[str] = "pending"  # "accepted", "rejected", "pending"

class ComplianceReviewResult(BaseModel):
    document_id: str
    document_title: str
    compliance_doc_id: str
    compliance_doc_title: str
    violations: List[ComplianceViolation]
    timestamp: str
    status: str  # "complete", "in_progress"

def detect_compliance_violations(trial_document: str, compliance_document: str, 
                               trial_doc_id: str, compliance_doc_id: str, 
                               trial_doc_title: str, compliance_doc_title: str) -> ComplianceReviewResult:
    """
    Detects compliance violations between trial document and compliance document.
    
    Returns:
        ComplianceReviewResult object with violations
    """
    try:
        # Format the system prompt
        system_prompt = """You are a compliance expert specializing in clinical trial documentation. 
Your task is to identify violations where the clinical trial document doesn't comply with regulations.
Analyze the trial document against the compliance document with high precision."""

        # Format the user prompt
        user_prompt = f"""
Compare these documents and identify specific violations:

TRIAL DOCUMENT (ID: {trial_doc_id}):
```
{trial_document}
```

COMPLIANCE DOCUMENT (ID: {compliance_doc_id}):
```
{compliance_document}
```

For each violation:
1. Extract exactly the text in the trial document that violates compliance (including entire relevant sentence or paragraph)
2. Extract exactly the text in the compliance document that is being violated
3. Provide the character position (start and end indices) of each violation in both documents
4. Explain why this is a violation (50-100 words)
5. Suggest a specific edit to fix the violation
6. Indicate confidence level (high/low)

Format your response as JSON like this:
{{
  "violations": [
    {{
      "trial_text": "exact text from trial document",
      "compliance_text": "exact text from compliance document",
      "trial_location": {{"start": start_index, "end": end_index}},
      "compliance_location": {{"start": start_index, "end": end_index}},
      "explanation": "explanation of violation",
      "suggested_edit": "suggested edit to fix violation",
      "confidence": "high or low"
    }}
  ]
}}

If there are no violations, return an empty array for "violations".
"""

        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )

        # Parse the JSON response
        try:
            result = json.loads(response.choices[0].message.content)
            violations = result.get("violations", [])
            
            # Create and return the ComplianceReviewResult
            return ComplianceReviewResult(
                document_id=trial_doc_id,
                document_title=trial_doc_title,
                compliance_doc_id=compliance_doc_id,
                compliance_doc_title=compliance_doc_title,
                violations=[
                    ComplianceViolation(
                        trial_text=v["trial_text"],
                        compliance_text=v["compliance_text"],
                        trial_location=v["trial_location"],
                        compliance_location=v["compliance_location"],
                        explanation=v["explanation"],
                        suggested_edit=v["suggested_edit"],
                        confidence=v["confidence"]
                    ) for v in violations
                ],
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                status="complete"
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to parse compliance review results: {e}")
            
    except Exception as e:
        logger.error(f"Error in compliance review: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing compliance review: {str(e)}")

def save_compliance_review(review_id: str, review_result: ComplianceReviewResult) -> str:
    """
    Saves compliance review results to a file based on the review_id.
    Returns the path to the saved file.
    """
    file_path = os.path.join(COMPLIANCE_REVIEWS_DIR, f"{review_id}.json")
    
    with open(file_path, 'w') as file:
        file.write(review_result.json())
    
    logger.info(f"Saved compliance review results to {file_path}")
    return file_path

def get_compliance_review(review_id: str) -> ComplianceReviewResult:
    """
    Retrieves a saved compliance review result by ID.
    """
    file_path = os.path.join(COMPLIANCE_REVIEWS_DIR, f"{review_id}.json")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Compliance review not found")
    
    try:
        with open(file_path, "r") as file:
            return ComplianceReviewResult.parse_raw(file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading compliance review: {str(e)}")

def update_violation_status(review_id: str, violation_index: int, status: str) -> ComplianceReviewResult:
    """
    Updates the status of a specific violation in a compliance review.
    """
    review = get_compliance_review(review_id)
    
    if violation_index < 0 or violation_index >= len(review.violations):
        raise HTTPException(status_code=400, detail="Invalid violation index")
    
    if status not in ["accepted", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'accepted', 'rejected', or 'pending'")
    
    review.violations[violation_index].status = status
    save_compliance_review(review_id, review)
    
    return review

def list_compliance_reviews() -> List[Dict]:
    """
    Lists all saved compliance reviews with basic metadata.
    """
    try:
        reviews = []
        for filename in os.listdir(COMPLIANCE_REVIEWS_DIR):
            if filename.endswith(".json"):
                review_id = filename[:-5]  # Remove .json extension
                try:
                    review = get_compliance_review(review_id)
                    reviews.append({
                        "review_id": review_id,
                        "document_title": review.document_title,
                        "violations_count": len(review.violations),
                        "timestamp": review.timestamp,
                        "status": review.status
                    })
                except Exception as e:
                    logger.error(f"Error processing review {review_id}: {e}")
        
        return reviews
    except Exception as e:
        logger.error(f"Error listing compliance reviews: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing compliance reviews: {str(e)}")
