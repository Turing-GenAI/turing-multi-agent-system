from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import copy

from app.models.compliance import (
    ComplianceReviewInput,
    ComplianceReviewResponse,
    ComplianceIssue,
    DocumentOwnerNotification,
    ComplianceReview,
    ApplySuggestionRequest,
    ApplySuggestionResponse
)
from app.services.compliance_service import compliance_service
from app.services.document_service import document_service

# In-memory storage for reviews (in a real app, this would be in a database)
reviews_db: List[Dict[str, Any]] = []
# Separate storage for analysis results to avoid mixing with reviews
analysis_results: Dict[str, Any] = {}

router = APIRouter()


@router.post("/analyze-compliance/", response_model=ComplianceReviewResponse)
async def analyze_compliance(review_input: ComplianceReviewInput):
    """
    Analyze clinical trial documents for compliance issues using document content provided directly.
    Uses LLM to identify non-compliant sections and returns detailed analysis.
    """
    try:
        # Use the compliance service to perform the analysis
        issues = await compliance_service.analyze_compliance(review_input)

        result = {
            "clinical_doc_id": review_input.clinical_doc_id,
            "compliance_doc_id": review_input.compliance_doc_id,
            "issues": issues
        }

        # Store result in our cache
        cache_key = f"{review_input.clinical_doc_id}:{review_input.compliance_doc_id}"
        analysis_results[cache_key] = result

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-by-ids/", response_model=ComplianceReviewResponse)
async def analyze_compliance_by_ids(clinical_doc_id: str, compliance_doc_id: str, force_refresh: bool = False):
    """
    Analyze clinical trial documents for compliance issues using document IDs.
    Loads document content from the document service and performs compliance analysis.

    Args:
        clinical_doc_id: ID of the clinical trial document
        compliance_doc_id: ID of the compliance document
        force_refresh: If true, forces a new analysis even if cached results exist

    Returns:
        ComplianceReviewResponse with identified compliance issues
    """
    try:
        cache_key = f"{clinical_doc_id}:{compliance_doc_id}"

        # Only check cache if not forcing a refresh
        if not force_refresh:
            # Check if we already have valid results for this document pair
            if cache_key in analysis_results and analysis_results[cache_key].get('issues'):
                issues = analysis_results[cache_key].get('issues')
                # Validate that the cached results contain actual issues
                if isinstance(issues, list) and len(issues) > 0:
                    print(
                        f"Returning cached analysis for documents {clinical_doc_id} and {compliance_doc_id} with {len(issues)} issues")
                    return analysis_results[cache_key]
                else:
                    print(f"Cached analysis has no issues, forcing refresh")

            # Check existing reviews for valid issues
            for review in reviews_db:
                if (review.get('clinical_doc_id') == clinical_doc_id and
                        review.get('compliance_doc_id') == compliance_doc_id):
                    issues = review.get('issues_data') or review.get('issues')
                    if isinstance(issues, list) and len(issues) > 0:
                        print(
                            f"Returning analysis from existing review with {len(issues)} issues")
                        return {
                            "clinical_doc_id": clinical_doc_id,
                            "compliance_doc_id": compliance_doc_id,
                            "issues": issues
                        }
        else:
            print(
                f"Force refreshing analysis for documents {clinical_doc_id} and {compliance_doc_id}")

        # Either no valid cached results, or force_refresh is true - create a new analysis
        print(
            f"Creating new analysis for documents {clinical_doc_id} and {compliance_doc_id}")

        # Get document content from document service
        clinical_doc_content = document_service.get_document_content(
            clinical_doc_id)
        compliance_doc_content = document_service.get_document_content(
            compliance_doc_id)

        # Create a review input with the document content
        review_input = ComplianceReviewInput(
            clinical_doc_id=clinical_doc_id,
            compliance_doc_id=compliance_doc_id,
            clinical_doc_content=clinical_doc_content,
            compliance_doc_content=compliance_doc_content
        )

        # Use the compliance service to perform the analysis
        issues = await compliance_service.analyze_compliance(review_input)

        # Store the results in our cache
        result = {
            "clinical_doc_id": clinical_doc_id,
            "compliance_doc_id": compliance_doc_id,
            "issues": issues
        }

        # Only store if we have real issues
        if isinstance(issues, list) and len(issues) > 0:
            print(f"Caching analysis with {len(issues)} issues")
            analysis_results[cache_key] = result
        else:
            print(f"Warning: Analysis completed but generated no issues")

        return result
    except Exception as e:
        print(f"Error in analyze_compliance_by_ids: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify-document-owner/", status_code=202)
async def notify_document_owner(notification: DocumentOwnerNotification):
    """
    Send a notification to a document owner about compliance issues.
    """
    try:
        # This is a placeholder for actual email notification logic
        # In a real implementation, we would use an email service

        # Log the notification for now
        issue_count = len(notification.issues)
        return {
            "message": f"Notification sent to {notification.owner_email} about {issue_count} compliance issues.",
            "document_id": notification.document_id,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/", response_model=dict)
async def get_compliance_reviews():
    """
    Get a list of all compliance reviews.

    Returns:
        List of compliance review records
    """
    try:
        # In a real implementation, this would fetch from a database
        return {"reviews": reviews_db}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reviews/", response_model=ComplianceReview)
async def create_compliance_review(review: ComplianceReview):
    """
    Create a new compliance review record.

    Args:
        review: The compliance review data

    Returns:
        The created compliance review record
    """
    try:
        # Convert to dict for easier manipulation
        review_dict = review.dict()

        # Look for existing review to update
        for i, existing_review in enumerate(reviews_db):
            if (existing_review.get('id') == review_dict['id'] or
                (existing_review.get('clinical_doc_id') == review_dict['clinical_doc_id'] and
                 existing_review.get('compliance_doc_id') == review_dict['compliance_doc_id'])):
                # Update the existing review
                print(f"Updating existing review {existing_review.get('id')}")
                reviews_db[i] = review_dict
                return review

        # Check if we have analysis results for this document pair
        cache_key = f"{review_dict['clinical_doc_id']}:{review_dict['compliance_doc_id']}"
        if cache_key in analysis_results and 'issues' in analysis_results[cache_key]:
            # Include the issues in the review
            issues_data = analysis_results[cache_key]['issues']
            if isinstance(issues_data, list):
                review_dict['issues_data'] = copy.deepcopy(issues_data)

        # Add the review to our database
        print(f"Creating new review {review_dict['id']}")
        reviews_db.append(review_dict)
        return review
    except Exception as e:
        print(f"Error creating review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply-suggestion/", response_model=ApplySuggestionResponse)
async def apply_suggestion(request: ApplySuggestionRequest):
    """
    Apply a suggested edit to non-compliant text using AI to intelligently integrate the change.

    Args:
        request: ApplySuggestionRequest containing original text, suggested edit, and context

    Returns:
        ApplySuggestionResponse with the revised text after applying the suggestion
    """
    try:
        # Use the compliance service to intelligently apply the edit
        revised_text = await compliance_service.apply_suggestion(
            clinical_text=request.clinical_text,
            suggested_edit=request.suggested_edit,
            surrounding_context=request.surrounding_context
        )

        return ApplySuggestionResponse(
            original_text=request.clinical_text,
            revised_text=revised_text
        )
    except Exception as e:
        print(f"Error applying suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
