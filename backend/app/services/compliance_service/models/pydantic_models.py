"""
Pydantic models for the enhanced compliance service.

These models provide structure for LLM output parsing and validation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, validator

class LLMComplianceIssue(BaseModel):
    """Pydantic model for a single issue expected from the LLM."""
    clinical_text: str = Field(description="Exact text from clinical document that potentially violates compliance (word/sentence/paragraph level)")
    compliance_text: str = Field(description="Exact text from compliance document that is being violated (word/sentence/paragraph level)")
    explanation: str = Field(description="50-100 word explanation of why this is a violation")
    suggested_edit: str = Field(description="Specific changes to make the text compliant")
    confidence: str = Field(description="Assessment of confidence in this finding: 'high' or 'low'")
    regulation: Optional[str] = Field(default="", description="Specific regulation being violated, if identifiable (e.g., 21 CFR § 801.109)")

    @validator('confidence')
    def confidence_must_be_high_or_low(cls, v):
        """Ensure confidence is either 'high' or 'low'."""
        lowered = v.lower().strip()
        if lowered not in ['high', 'low']:
            # Default to 'low' confidence if invalid value provided
            return 'low'
        return lowered

class ComplianceIssueList(BaseModel):
    """Pydantic model for the list of issues expected from the LLM."""
    issues: List[LLMComplianceIssue] = Field(description="A list of identified potential compliance issues.")

class TextWithOffset(BaseModel):
    """Represents a chunk of text with its offset in the original document."""
    text: str
    offset: int
