"""
Document Matcher Service - Utility Functions

This module provides utility functions for document analysis, similarity calculation,
and other common operations used by the document matcher service.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple

import numpy as np

# Configure logging
logger = logging.getLogger(__name__)


def normalize_text(text: str) -> str:
    """
    Normalize text for more consistent matching by removing extra whitespace,
    converting to lowercase, and removing special characters.

    Args:
        text: The text to normalize

    Returns:
        Normalized text
    """
    if not text:
        return ""

    # Convert to lowercase
    text = text.lower()

    # Replace multiple whitespace with single space
    text = re.sub(r'\s+', ' ', text)

    # Remove special characters but keep alphanumeric, spaces, and common punctuation
    text = re.sub(r'[^\w\s.,;:\-\'\"()]', '', text)

    return text.strip()


def calculate_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors.

    Args:
        vec1: First vector
        vec2: Second vector

    Returns:
        Similarity score between 0 and 1
    """
    try:
        # Handle arrays of different shapes
        if vec1.ndim > 1 and vec1.shape[0] == 1:
            vec1 = vec1.flatten()
        if vec2.ndim > 1 and vec2.shape[0] == 1:
            vec2 = vec2.flatten()

        # Calculate dot product and magnitudes
        dot_product = np.dot(vec1, vec2)
        norm_a = np.linalg.norm(vec1)
        norm_b = np.linalg.norm(vec2)

        # Avoid division by zero
        if norm_a == 0 or norm_b == 0:
            return 0.0

        # Calculate and return cosine similarity
        return dot_product / (norm_a * norm_b)
    except Exception as e:
        logger.error(f"Error calculating cosine similarity: {e}")
        return 0.0


def extract_regulatory_domains(text: str) -> List[str]:
    """
    Simple regex-based extraction of common regulatory domains.
    This is a basic implementation that can be enhanced with LLM analysis.

    Args:
        text: Document text to analyze

    Returns:
        List of detected regulatory domains
    """
    domains = []

    # Common clinical trial domains and frameworks
    domain_patterns = {
        "ICH GCP": r"ICH\s+(?:E6|GCP)|Good\s+Clinical\s+Practice",
        "FDA Regulations": r"FDA\s+(?:regulations?|compliance|requirements)|21\s+CFR",
        "HIPAA": r"HIPAA|Health\s+Insurance\s+Portability|PHI|Protected\s+Health\s+Information",
        "Informed Consent": r"Informed\s+Consent|consent\s+form|consent\s+process",
        "Safety Reporting": r"(?:Adverse|Serious)\s+(?:Event|Reaction)\s+Reporting|Safety\s+[Rr]eporting",
        "Data Management": r"Data\s+(?:Management|Handling|Collection|Privacy|Integrity)",
        "Protocol Compliance": r"Protocol\s+(?:Compliance|Adherence|Deviation|Violation)",
        "Documentation": r"Documentation\s+(?:Requirements|Standards|Practices)"
    }

    # Search for each domain pattern
    for domain, pattern in domain_patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            domains.append(domain)

    return domains


def combine_chunk_embeddings(chunk_embeddings: List[np.ndarray]) -> np.ndarray:
    """
    Combine embeddings from multiple chunks into a single document embedding.
    Uses simple averaging as the combination strategy.

    Args:
        chunk_embeddings: List of chunk embedding vectors

    Returns:
        Combined document embedding
    """
    if not chunk_embeddings:
        # Return empty vector with same dimensions as expected embeddings
        return np.array([])

    # Stack embeddings and calculate mean
    return np.mean(chunk_embeddings, axis=0)
