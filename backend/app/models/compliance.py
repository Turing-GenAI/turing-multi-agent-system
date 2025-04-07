from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ComplianceReviewInput(BaseModel):
    """
    Input model for compliance review requests.
    """
    clinical_doc_id: str = Field(...,
                                 description="ID of the clinical trial document")
    compliance_doc_id: str = Field(...,
                                   description="ID of the compliance document")
    clinical_doc_content: str = Field(...,
                                      description="Content of the clinical trial document")
    compliance_doc_content: str = Field(...,
                                        description="Content of the compliance document")


class ComplianceIssue(BaseModel):
    """
    Model for a single compliance issue.
    """
    id: str = Field(..., description="Unique identifier for the issue")
    clinical_text: str = Field(
        ..., description="Text from clinical document that violates compliance")
    compliance_text: str = Field(
        ..., description="Text from compliance document that is being violated")
    explanation: str = Field(...,
                             description="Explanation of why this is a violation")
    suggested_edit: str = Field(...,
                                description="Suggested edit to fix the compliance issue")
    confidence: str = Field(..., description="Confidence level (high or low)")
    regulation: str = Field(...,
                            description="Specific regulation being violated")


class ComplianceReviewResponse(BaseModel):
    """
    Response model for compliance review results.
    """
    clinical_doc_id: str
    compliance_doc_id: str
    issues: List[ComplianceIssue]


class DocumentOwnerNotification(BaseModel):
    """
    Model for document owner notification requests.
    """
    document_id: str
    owner_email: str
    issues: List[ComplianceIssue]
    message: Optional[str] = None


class ComplianceReview(BaseModel):
    """
    Model for storing compliance review data.
    """
    id: str = Field(..., description="Unique identifier for the review")
    clinical_doc_id: str = Field(...,
                                 description="ID of the clinical document")
    compliance_doc_id: str = Field(...,
                                   description="ID of the compliance document")
    clinicalDoc: str = Field(..., description="Title of the clinical document")
    complianceDoc: str = Field(...,
                               description="Title of the compliance document")
    status: str = Field(...,
                        description="Status of the review (completed, in-progress)")
    issues: int = Field(0, description="Total number of issues found")
    highConfidenceIssues: int = Field(
        0, description="Number of high confidence issues")
    lowConfidenceIssues: int = Field(
        0, description="Number of low confidence issues")
    created: str = Field(..., description="Creation timestamp")


class ApplySuggestionRequest(BaseModel):
    """
    Model for applying a suggested edit to non-compliant text.
    """
    clinical_text: str = Field(...,
                               description="The non-compliant text from clinical document")
    suggested_edit: str = Field(..., description="The suggested edit to apply")
    surrounding_context: str = Field(
        ..., description="Surrounding context to help with applying the edit")


class ApplySuggestionResponse(BaseModel):
    """
    Response model for applied suggestion.
    """
    original_text: str = Field(...,
                               description="The original non-compliant text")
    revised_text: str = Field(...,
                              description="The revised text after applying the suggestion")
