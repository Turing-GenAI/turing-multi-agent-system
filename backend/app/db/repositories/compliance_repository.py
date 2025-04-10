from sqlalchemy.orm import Session
import json
from typing import List, Dict, Any, Optional

from app.db.models.models import Review, ComplianceIssue, Decision
from app.models.compliance import ComplianceIssue as ComplianceIssueModel
from app.db.database import generate_review_id

class ComplianceRepository:
    """
    Repository for handling database operations related to compliance reviews
    """
    
    @staticmethod
    def create_review(db: Session, review_data: Dict[str, Any]) -> Review:
        """
        Create a new review record in the database
        
        Args:
            db: Database session
            review_data: Review data dictionary
            
        Returns:
            The created review object
        """
        # Always generate a sequential review ID in R-00001 format
        # This overrides any ID that might have been provided (e.g., from frontend)
        review_data['id'] = generate_review_id()
            
        # Create the review object
        review = Review(
            id=review_data['id'],
            clinical_doc_id=review_data['clinical_doc_id'],
            compliance_doc_id=review_data['compliance_doc_id'],
            clinicalDoc=review_data['clinicalDoc'],
            complianceDoc=review_data['complianceDoc'],
            status=review_data['status']
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        return review
    
    @staticmethod
    def get_all_reviews(db: Session) -> List[Review]:
        """
        Get all reviews from the database
        
        Args:
            db: Database session
            
        Returns:
            List of review objects
        """
        return db.query(Review).order_by(Review.created_at.desc()).all()
    
    @staticmethod
    def get_review_by_id(db: Session, review_id: str) -> Optional[Review]:
        """
        Get a review by its ID
        
        Args:
            db: Database session
            review_id: ID of the review to get
            
        Returns:
            Review object if found, None otherwise
        """
        return db.query(Review).filter(Review.id == review_id).first()
    
    @staticmethod
    def update_review(db: Session, review_id: str, review_data: Dict[str, Any]) -> Review:
        """
        Update an existing review in the database
        
        Args:
            db: Database session
            review_id: ID of the review to update
            review_data: Updated review data dictionary
            
        Returns:
            The updated review object
        """
        # Get the existing review
        review = ComplianceRepository.get_review_by_id(db, review_id)
        
        if not review:
            return None
        
        # Update fields if they exist in the review_data
        if 'status' in review_data:
            review.status = review_data['status']
            
        if 'clinicalDoc' in review_data:
            review.clinicalDoc = review_data['clinicalDoc']
            
        if 'complianceDoc' in review_data:
            review.complianceDoc = review_data['complianceDoc']
        
        # Update the review
        db.commit()
        db.refresh(review)
        
        return review
    
    @staticmethod
    def add_issues_to_review(db: Session, review_id: str, issues: List[ComplianceIssueModel]) -> Review:
        """
        Add compliance issues to a review
        
        Args:
            db: Database session
            review_id: ID of the review to add issues to
            issues: List of compliance issues
            
        Returns:
            Updated review object
        """
        review = ComplianceRepository.get_review_by_id(db, review_id)
        
        if not review:
            return None
            
        # When we have an empty list of issues, we won't create any marker records
        # The empty list in the database will indicate that the document is compliant
        # We'll handle this at the API layer by checking if the issues list is empty
        if len(issues) == 0:
            # Just log that the document is compliant - no need to create a marker record
            # The empty issues list is enough to indicate compliance
            pass
        else:
            # Add each issue to the review
            for issue in issues:
                # Handle metadata if it exists in the model
                metadata_json = None
                if hasattr(issue, 'metadata') and issue.metadata:
                    metadata_json = json.dumps(issue.metadata)
                    
                # Create the issue object with required fields
                issue_data = {
                    "review_id": review_id,
                    "clinical_text": issue.clinical_text,
                    "compliance_text": issue.compliance_text,
                    "explanation": issue.explanation,
                    "suggested_edit": issue.suggested_edit,
                    "confidence": issue.confidence,
                    "regulation": issue.regulation,
                    "metadata_json": metadata_json
                }
            
                # Add optional position fields if they exist in the model
                for attr in ["clinical_text_start_char", "clinical_text_end_char", 
                              "compliance_text_start_char", "compliance_text_end_char"]:
                    if hasattr(issue, attr) and getattr(issue, attr) is not None:
                        issue_data[attr] = getattr(issue, attr)
                    else:
                        # Default to None for missing positions
                        issue_data[attr] = None
                        
                # Create the database issue object
                db_issue = ComplianceIssue(**issue_data)
                
                db.add(db_issue)
            
        db.commit()
        db.refresh(review)
        
        return review
    
    @staticmethod
    def get_issues_for_review(db: Session, review_id: str) -> List[ComplianceIssue]:
        """
        Get all issues for a specific review
        
        Args:
            db: Database session
            review_id: ID of the review to get issues for
            
        Returns:
            List of compliance issue objects
        """
        return db.query(ComplianceIssue).filter(ComplianceIssue.review_id == review_id).all()
    
    @staticmethod
    def add_decision(db: Session, decision_data: Dict[str, Any]) -> Decision:
        """
        Add a decision for a compliance issue
        
        Args:
            db: Database session
            decision_data: Decision data dictionary
            
        Returns:
            Created decision object
        """
        decision = Decision(
            issue_id=decision_data['issue_id'],
            action=decision_data['action'],
            comments=decision_data.get('comments')
        )
        
        db.add(decision)
        db.commit()
        db.refresh(decision)
        
        return decision
    
    @staticmethod
    def get_decisions_for_issue(db: Session, issue_id: str) -> List[Decision]:
        """
        Get all decisions for a specific issue
        
        Args:
            db: Database session
            issue_id: ID of the issue to get decisions for
            
        Returns:
            List of decision objects
        """
        return db.query(Decision).filter(Decision.issue_id == issue_id).order_by(Decision.timestamp.desc()).all()
