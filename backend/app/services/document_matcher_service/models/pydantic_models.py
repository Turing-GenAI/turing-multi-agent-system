"""
Document Matcher Service - Pydantic Models

This module defines Pydantic models used for structured data handling in the document matcher service.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RegulationReference(BaseModel):
    """Reference to a regulation or standard mentioned in a document."""
    name: str = Field(..., description="Name or identifier of the regulation")
    section: Optional[str] = Field(
        None, description="Specific section of the regulation, if mentioned")


class Requirement(BaseModel):
    """Regulatory requirement identified in a document."""
    description: str = Field(..., description="Description of the requirement")
    domain: str = Field(...,
                        description="Regulatory domain this requirement belongs to")
    criticality: str = Field(...,
                             description="Importance level: high, medium, or low")


class NumericalThreshold(BaseModel):
    """Numerical threshold or limit identified in a document."""
    description: str = Field(..., description="Description of the threshold")
    value: str = Field(..., description="The numerical value or range")
    unit: Optional[str] = Field(None, description="Unit of measurement")


class DocumentAnalysis(BaseModel):
    """Results of regulatory content analysis for a document."""
    document_id: str = Field(..., description="ID of the analyzed document")
    primary_domains: List[str] = Field(
        default_factory=list, description="Primary regulatory domains covered")
    regulations_referenced: List[RegulationReference] = Field(
        default_factory=list, description="Regulations referenced")
    key_requirements: List[Requirement] = Field(
        default_factory=list, description="Key regulatory requirements")
    numerical_thresholds: List[NumericalThreshold] = Field(
        default_factory=list, description="Numerical thresholds identified")


class DocumentSimilarity(BaseModel):
    """Similarity assessment between two documents."""
    clinical_doc_id: str = Field(...,
                                 description="ID of the clinical document")
    compliance_doc_id: str = Field(...,
                                   description="ID of the compliance document")
    similarity_score: float = Field(...,
                                    description="Similarity score from 0.0 to 1.0")
    matching_domains: List[str] = Field(
        default_factory=list, description="Matching regulatory domains")
    missing_domains: List[str] = Field(
        default_factory=list, description="Missing regulatory domains")
    recommendation: str = Field(
        ..., description="Recommendation for using this compliance document")
    rationale: str = Field(...,
                           description="Explanation of the similarity assessment")
