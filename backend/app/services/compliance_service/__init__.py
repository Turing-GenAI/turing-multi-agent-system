"""
Enhanced Compliance Service Module

This module provides advanced functionality for analyzing clinical trial documents
for compliance issues, using a combination of LLM analysis, text embeddings, and 
verification techniques.
"""

from app.services.compliance_service.service import ComplianceService
from app.services.compliance_service.models.pydantic_models import LLMComplianceIssue, ComplianceIssueList

# Create and export the service instance
compliance_service = ComplianceService()

__all__ = ["compliance_service", "ComplianceService", "LLMComplianceIssue", "ComplianceIssueList"]
