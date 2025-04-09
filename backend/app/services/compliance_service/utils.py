"""
Utility functions for the compliance service.

This module provides helper functions for text processing, verification,
and other common operations used by the compliance service.
"""

import re
import logging
from typing import Tuple, Optional

# Configure logging
logger = logging.getLogger(__name__)

# Constants
SIMILARITY_THRESHOLD = 0.75  # May need adjustment based on embedding model
TOP_N_MATCHES = 3
RAPIDFUZZ_MATCH_THRESHOLD = 85  # Percentage for partial ratio verification

def find_text_offsets(text_to_find: str, source_text: str, search_start_offset: int = 0) -> Tuple[Optional[int], Optional[int]]:
    """
    Finds start/end character indices of text_to_find within source_text.
    
    Args:
        text_to_find: The text to locate
        source_text: The source text to search within
        search_start_offset: Starting offset for the search
        
    Returns:
        Tuple of (start_char, end_char) or (None, None) if not found
    """
    if not text_to_find or not source_text:
        return None, None
        
    # Normalize whitespace for more reliable matching
    cleaned_text = re.sub(r'\s+', ' ', text_to_find).strip()
    
    # Try to find exact match first
    pos = source_text.find(cleaned_text, search_start_offset)
    if pos >= 0:
        return pos, pos + len(cleaned_text)
    
    # Try with original text (before cleaning) if exact match fails
    pos = source_text.find(text_to_find, search_start_offset)
    if pos >= 0:
        return pos, pos + len(text_to_find)
    
    return None, None

def verify_text_in_source(text_from_llm: str, source_text: str) -> bool:
    """
    Verify if the text identified by LLM exists in the source text.
    Uses exact matching first, then falls back to fuzzy matching if available.
    
    Args:
        text_from_llm: Text identified by the LLM
        source_text: Source document to verify against
        
    Returns:
        Boolean indicating if text was verified to exist in source
    """
    if not text_from_llm or not source_text:
        return False
        
    # Try direct string matching first
    if text_from_llm in source_text:
        return True
    
    # Normalize whitespace and try again
    cleaned_text = re.sub(r'\s+', ' ', text_from_llm).strip()
    if cleaned_text in source_text:
        return True
    
    # Try fuzzy matching with rapidfuzz (if available)
    try:
        from rapidfuzz import fuzz as rapidfuzz_fuzz
        
        # Get partial ratio (allows for insertions/deletions within the text)
        partial_ratio = rapidfuzz_fuzz.partial_ratio(cleaned_text, source_text)
        logger.debug(f"Fuzzy matching score: {partial_ratio}% for '{cleaned_text[:30]}...'")
        
        # Higher threshold for verification to ensure accuracy
        return partial_ratio >= RAPIDFUZZ_MATCH_THRESHOLD
    except ImportError:
        logger.warning("rapidfuzz not available for fuzzy matching. Using basic verification only.")
        return False  # If fuzzy matching is needed but not available
