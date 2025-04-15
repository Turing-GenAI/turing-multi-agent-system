"""
Document Matcher Service - Automatic compliance document selection

This service package provides functionality to automatically match clinical
documents with the most relevant compliance documents based on content analysis.
"""

# Re-export the public interface
from app.services.document_matcher_service.service import (
    get_matching_compliance_document,
    document_matcher
)

__all__ = [
    "get_matching_compliance_document",
    "document_matcher"
]
