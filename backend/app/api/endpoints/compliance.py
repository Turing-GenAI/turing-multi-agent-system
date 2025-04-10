from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
import copy
import logging
import uuid
import datetime
import os
import json
from sqlalchemy.orm import Session

# Import database modules
from app.db.database import get_db
from app.db.models.models import Base, Review, ComplianceIssue as DbComplianceIssue
from app.db.repositories.compliance_repository import ComplianceRepository

from app.models.compliance import (
    ComplianceReviewInput,
    ComplianceReviewResponse,
    ComplianceIssue,
    DocumentOwnerNotification,
    ComplianceReview,
    ApplySuggestionRequest,
    ApplySuggestionResponse
)
# Import both implementations (original and enhanced)
from app.services.compliance_service import compliance_service as enhanced_compliance_service
# Keep original service for reference but don't use it
# from app.services.compliance_service import compliance_service as original_compliance_service
from app.services.document_service import document_service

# Configure logging
logger = logging.getLogger(__name__)

# Initialize the database on startup - this creates tables based on our models
from app.db.database import engine
Base.metadata.create_all(bind=engine)

# Document content storage is a core part of the design
# The Review model includes clinical_doc_content and compliance_doc_content fields

# For caching analysis results and document content temporarily to avoid duplicate API calls
analysis_results_cache: Dict[str, Any] = {}
document_content_cache: Dict[str, str] = {}

router = APIRouter()


@router.post("/analyze-compliance/", response_model=ComplianceReviewResponse)
async def analyze_compliance(review_input: ComplianceReviewInput):
    """
    Analyze clinical trial documents for compliance issues using document content provided directly.
    Uses enhanced LLM analysis with verification and position tracking for more accurate results.
    """
    try:
        logger.info(f"Analyzing compliance for docs: {review_input.clinical_doc_id}:{review_input.compliance_doc_id}")
        
        # Use the enhanced compliance service to perform the analysis
        issues = await enhanced_compliance_service.analyze_compliance(review_input)
        
        logger.info(f"Analysis complete: Found {len(issues)} issues")

        result = {
            "clinical_doc_id": review_input.clinical_doc_id,
            "compliance_doc_id": review_input.compliance_doc_id,
            "issues": issues
        }

        # Store result in our temporary cache until saved to database with a review
        cache_key = f"{review_input.clinical_doc_id}:{review_input.compliance_doc_id}"
        analysis_results_cache[cache_key] = result

        return result
    except Exception as e:
        logger.error(f"Error in compliance analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-by-ids/", response_model=ComplianceReviewResponse)
async def analyze_compliance_by_ids(clinical_doc_id: str, compliance_doc_id: str, force_refresh: bool = False, db: Session = Depends(get_db)):
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
            if cache_key in analysis_results_cache and analysis_results_cache[cache_key].get('issues'):
                issues = analysis_results_cache[cache_key].get('issues')
                # Validate that the cached results contain actual issues
                if isinstance(issues, list) and len(issues) > 0:
                    logger.info(
                        f"Returning cached analysis for documents {clinical_doc_id} and {compliance_doc_id} with {len(issues)} issues")
                    return analysis_results_cache[cache_key]
                else:
                    logger.info(f"Cached analysis has no issues, forcing refresh")

            # Check existing reviews in the database for valid issues
            # Query database for reviews matching these document IDs
            db_reviews = db.query(Review).filter(
                Review.clinical_doc_id == clinical_doc_id,
                Review.compliance_doc_id == compliance_doc_id
            ).all()
            
            # If any matching reviews exist
            if db_reviews:
                # Get the latest review
                latest_review = db_reviews[0]  # Assuming sorted by created_at desc
                
                # Get the issues for this review
                db_issues = ComplianceRepository.get_issues_for_review(db, latest_review.id)
                
                if db_issues and len(db_issues) > 0:
                    logger.info(f"Returning analysis from existing review {latest_review.id} with {len(db_issues)} issues")
                    
                    # Convert issues to the expected format
                    issues_list = [issue.to_dict() for issue in db_issues]
                    
                    return {
                        "clinical_doc_id": clinical_doc_id,
                        "compliance_doc_id": compliance_doc_id,
                        "issues": issues_list
                    }
        else:
            logger.info(f"Force refreshing analysis for documents {clinical_doc_id} and {compliance_doc_id}")

        # Either no valid cached results, or force_refresh is true - create a new analysis
        logger.info(f"Creating new analysis for documents {clinical_doc_id} and {compliance_doc_id}")

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

        # Use the enhanced compliance service to perform the analysis
        issues = await enhanced_compliance_service.analyze_compliance(review_input)

        # Store the results in our cache
        result = {
            "clinical_doc_id": clinical_doc_id,
            "compliance_doc_id": compliance_doc_id,
            "issues": issues
        }

        # Always store results in cache, even if there are no issues
        # This ensures consistency when retrieving reviews later
        if isinstance(issues, list):
            if len(issues) > 0:
                logger.info(f"Caching analysis with {len(issues)} issues")
            else:
                logger.info(f"Caching analysis with 0 issues (compliant document)")
            analysis_results_cache[cache_key] = result
        else:
            logger.warning(f"Warning: Analysis completed but issues is not a list")

        return result
    except Exception as e:
        logger.error(f"Error in analyze_compliance_by_ids: {str(e)}")
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
async def get_compliance_reviews(db: Session = Depends(get_db)):
    """
    Get a list of all compliance reviews from the database.

    Returns:
        List of compliance review records
    """
    try:
        # Get all reviews from the database
        db_reviews = ComplianceRepository.get_all_reviews(db)
        
        # Convert to dictionary format for API response
        reviews = [review.to_dict() for review in db_reviews]
        
        return {"reviews": reviews}
    except Exception as e:
        logger.error(f"Error getting reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/{review_id}", response_model=dict)
async def get_review_by_id(review_id: str, db: Session = Depends(get_db)):
    """
    Get a review by ID, including its document content.
    This helps avoiding repeated API calls for document content.
    
    Args:
        review_id: The ID of the review to retrieve
        
    Returns:
        The review with document content
    """
    try:
        # Get the review from the database
        review = ComplianceRepository.get_review_by_id(db, review_id)
        
        if not review:
            raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
            
        # Get the issues for this review
        issues = ComplianceRepository.get_issues_for_review(db, review_id)
        
        # Create the complete review response with issues
        review_dict = review.to_dict()
        review_dict["issues"] = [issue.to_dict() for issue in issues]
        
        # Add document content from cache or fetch it
        clinical_doc_id = review.clinical_doc_id
        compliance_doc_id = review.compliance_doc_id
        
        # Check if we need to fetch and cache document content
        if clinical_doc_id not in document_content_cache:
            try:
                logger.info(f"Fetching clinical document content for {clinical_doc_id}")
                content = document_service.get_document_content(clinical_doc_id)
                document_content_cache[clinical_doc_id] = content
            except Exception as e:
                logger.error(f"Error fetching clinical document content: {str(e)}")
                document_content_cache[clinical_doc_id] = ""  # Cache empty string to prevent repeated failures
        
        if compliance_doc_id not in document_content_cache:
            try:
                logger.info(f"Fetching compliance document content for {compliance_doc_id}")
                content = document_service.get_document_content(compliance_doc_id)
                document_content_cache[compliance_doc_id] = content
            except Exception as e:
                logger.error(f"Error fetching compliance document content: {str(e)}")
                document_content_cache[compliance_doc_id] = ""  # Cache empty string to prevent repeated failures
        
        # Add content to the response
        review_dict["clinical_doc_content"] = document_content_cache.get(clinical_doc_id, "")
        review_dict["compliance_doc_content"] = document_content_cache.get(compliance_doc_id, "")
        
        logger.info(f"Returning review {review_id} with document content")
        return review_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting review {review_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/{review_id}/issues", response_model=dict)
async def get_review_issues(review_id: str, db: Session = Depends(get_db)):
    """
    Get all issues for a specific review ID.
    
    Args:
        review_id: The ID of the review to get issues for
        
    Returns:
        List of compliance issues for the review
    """
    try:
        # Get the issues for this review from the database
        issues = ComplianceRepository.get_issues_for_review(db, review_id)
        
        # Convert to dictionary format for API response
        issues_dict = [issue.to_dict() for issue in issues]
        
        return {"issues": issues_dict}
    except Exception as e:
        logger.error(f"Error getting issues for review {review_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Issues not found for review {review_id}")


@router.post("/reviews/", response_model=ComplianceReview)
async def create_compliance_review(review: ComplianceReview, db: Session = Depends(get_db)):
    """
    Create or update a compliance review record in the database.
    Also fetches and stores document content to prevent repeated API calls.

    Args:
        review: The compliance review data
        db: Database session dependency

    Returns:
        The created or updated compliance review record
    """
    try:
        # Convert to dict for easier manipulation
        review_dict = review.dict()
        
        # Check if there's an existing review for these documents to avoid duplicates
        existing_review = None
        
        # If it's a processing -> completed transition, try to find the existing review
        if review_dict.get('status') == 'completed' and review_dict.get('clinical_doc_id') and review_dict.get('compliance_doc_id'):
            # Look for any review with the same document IDs that might be in 'processing' status
            existing_reviews = db.query(Review).filter(
                Review.clinical_doc_id == review_dict['clinical_doc_id'],
                Review.compliance_doc_id == review_dict['compliance_doc_id']
            ).all()
            
            if existing_reviews:
                # Use the most recent one (likely the 'processing' review we want to update)
                existing_review = existing_reviews[0]
                logger.info(f"Found existing review {existing_review.id} to update from processing to completed")
                # Use the existing review ID
                review_dict['id'] = existing_review.id
                
        # Fetch and store document content to avoid repeated API calls
        # Now that we have proper database columns thanks to our migration system,
        # we can store the content properly in the database
        
        # First check if document is already in the cache to avoid API calls
        clinical_doc_id = review_dict['clinical_doc_id']
        compliance_doc_id = review_dict['compliance_doc_id']
        
        # Determine if we need to fetch content
        should_fetch_clinical = clinical_doc_id not in document_content_cache
        should_fetch_compliance = compliance_doc_id not in document_content_cache
        
        # If existing review has content, check if we can use it instead of fetching
        if existing_review:
            if existing_review.clinical_doc_content and not should_fetch_clinical:
                logger.info(f"Using clinical document content from existing review {existing_review.id}")
                document_content_cache[clinical_doc_id] = existing_review.clinical_doc_content
                should_fetch_clinical = False
            
            if existing_review.compliance_doc_content and not should_fetch_compliance:
                logger.info(f"Using compliance document content from existing review {existing_review.id}")
                document_content_cache[compliance_doc_id] = existing_review.compliance_doc_content
                should_fetch_compliance = False
        
        # Fetch clinical document content if needed
        if should_fetch_clinical:
            try:
                logger.info(f"Fetching clinical document content for {clinical_doc_id}")
                clinical_content = document_service.get_document_content(clinical_doc_id)
                document_content_cache[clinical_doc_id] = clinical_content
            except Exception as e:
                logger.error(f"Error fetching clinical document content: {str(e)}")
                document_content_cache[clinical_doc_id] = ""  # Cache empty string to prevent repeated failures
        
        # Fetch compliance document content if needed
        if should_fetch_compliance:
            try:
                logger.info(f"Fetching compliance document content for {compliance_doc_id}")
                compliance_content = document_service.get_document_content(compliance_doc_id)
                document_content_cache[compliance_doc_id] = compliance_content
            except Exception as e:
                logger.error(f"Error fetching compliance document content: {str(e)}")
                document_content_cache[compliance_doc_id] = ""  # Cache empty string to prevent repeated failures
        
        # Set the document content in the review data for database storage
        review_dict['clinical_doc_content'] = document_content_cache.get(clinical_doc_id, "")
        review_dict['compliance_doc_content'] = document_content_cache.get(compliance_doc_id, "")
        
        logger.info(f"Successfully prepared document content for review")
        
        # Create or update the review
        if existing_review:
            # Update the existing review
            updated_review = ComplianceRepository.update_review(db, existing_review.id, review_dict)
            logger.info(f"Updated existing review {updated_review.id}")
            new_review = updated_review
        else:
            # Create a new review
            new_review = ComplianceRepository.create_review(db, review_dict)
            logger.info(f"Creating new review {new_review.id}")
        
        # Check if we have cached analysis results for this document pair
        cache_key = f"{review_dict['clinical_doc_id']}:{review_dict['compliance_doc_id']}"
        
        if review_dict.get('status') == 'completed' and cache_key in analysis_results_cache and 'issues' in analysis_results_cache[cache_key]:
            # Get the issues from the cache
            issues_data = analysis_results_cache[cache_key]['issues']
            
            # Always store issues in the database, even if the list is empty
            # This ensures we can retrieve reviews with zero issues consistently
            if isinstance(issues_data, list):
                # For empty lists (no issues found), we still want to store the record
                # to indicate the document was analyzed and found compliant
                if len(issues_data) > 0:
                    logger.info(f"Adding {len(issues_data)} issues to review {new_review.id}")
                else:
                    logger.info(f"Storing review {new_review.id} with 0 issues (compliant document)")
                
                # Add the issues (or empty list) to the review in the database
                ComplianceRepository.add_issues_to_review(db, new_review.id, issues_data)
                # Clear from cache once stored in the database
                del analysis_results_cache[cache_key]
        
        # Return the review as a dictionary
        return new_review.to_dict()
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply-suggestion/", response_model=ApplySuggestionResponse)
async def apply_suggestion(request: ApplySuggestionRequest):
    """
    Apply a suggested edit to non-compliant text using AI to intelligently integrate the change.
    Uses the enhanced compliance service with better prompt engineering for higher quality edits.

    Args:
        request: ApplySuggestionRequest containing original text, suggested edit, and context

    Returns:
        ApplySuggestionResponse with the revised text after applying the suggestion
    """
    try:
        logger.info(f"Applying suggested edit to text of length {len(request.clinical_text)}")
        
        # Use the enhanced compliance service to intelligently apply the edit
        revised_text = await enhanced_compliance_service.apply_suggestion(
            clinical_text=request.clinical_text,
            suggested_edit=request.suggested_edit,
            surrounding_context=request.surrounding_context
        )
        
        logger.info(f"Successfully applied suggestion, revised text length: {len(revised_text)}")

        return ApplySuggestionResponse(
            original_text=request.clinical_text,
            revised_text=revised_text
        )
    except Exception as e:
        logger.error(f"Error applying suggestion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
