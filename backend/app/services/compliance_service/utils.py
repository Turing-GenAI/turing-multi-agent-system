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

    # Try different normalization approaches in order of precision

    # 1. First try direct matching from the offset
    pos = source_text.find(text_to_find, search_start_offset)
    if pos >= 0:
        return pos, pos + len(text_to_find)

    # 2. Normalize whitespace for more reliable matching
    cleaned_text = re.sub(r'\s+', ' ', text_to_find).strip()
    cleaned_source = re.sub(r'\s+', ' ', source_text)

    pos = cleaned_source.find(cleaned_text, search_start_offset)
    if pos >= 0:
        # Map back to original position by counting characters
        original_pos = 0
        normalized_pos = 0

        for i, char in enumerate(source_text):
            if i >= search_start_offset:
                if normalized_pos >= pos:
                    original_pos = i
                    break
                if not char.isspace() or (char.isspace() and (i == 0 or not source_text[i-1].isspace())):
                    normalized_pos += 1

        # Find the end position by adding the normalized length
        end_pos = original_pos
        chars_to_match = len(cleaned_text)
        chars_matched = 0

        for i in range(original_pos, len(source_text)):
            if not source_text[i].isspace() or (source_text[i].isspace() and (i == 0 or not source_text[i-1].isspace())):
                chars_matched += 1

            if chars_matched >= chars_to_match:
                end_pos = i + 1
                break

        return original_pos, end_pos

    # 3. Try fuzzy matching if available
    try:
        from rapidfuzz import fuzz as rapidfuzz_fuzz

        # Search for substring with highest similarity
        search_window = source_text[search_start_offset:search_start_offset + min(
            10000, len(source_text) - search_start_offset)]

        # Use partial ratio alignment to find best approximate match
        match = rapidfuzz_fuzz.partial_ratio_alignment(
            text_to_find, search_window)

        if match.score > 85:  # Only accept high quality matches
            start_pos = search_start_offset + match.dest_start
            end_pos = search_start_offset + match.dest_end

            logger.debug(
                f"Found fuzzy match with score {match.score}: {source_text[start_pos:end_pos]}")
            return start_pos, end_pos
    except ImportError:
        logger.debug("rapidfuzz not available for fuzzy matching")
    except Exception as e:
        logger.error(f"Error in fuzzy matching: {e}")

    # 4. Try matching just the first part of the string (useful for cases where model adds extra text)
    if len(text_to_find) > 30:
        first_part = text_to_find[:30].strip()
        cleaned_first_part = re.sub(r'\s+', ' ', first_part)

        pos = cleaned_source.find(cleaned_first_part, search_start_offset)
        if pos >= 0:
            # Find a reasonable end position - continue until punctuation or ~50 chars
            start_pos = pos
            max_len = min(len(cleaned_first_part) + 50,
                          len(cleaned_source) - pos)

            # Try to find end at sentence boundary
            end_pos = pos + max_len
            for i in range(pos + len(cleaned_first_part), pos + max_len):
                if i >= len(cleaned_source):
                    break
                if cleaned_source[i] in '.!?':
                    end_pos = i + 1
                    break

            logger.debug(f"Found partial match using first part of text")
            return start_pos, end_pos

    return None, None


def verify_text_in_source(text_from_llm: str, source_text: str) -> bool:
    """
    Verify if the text identified by LLM exists in the source text.
    Uses multiple approaches for robust verification.

    Args:
        text_from_llm: Text identified by the LLM
        source_text: Source document to verify against

    Returns:
        Boolean indicating if text was verified to exist in source
    """
    if not text_from_llm or not source_text:
        return False

    # 1. Try exact matching first
    if text_from_llm in source_text:
        return True

    # 2. Try with normalized whitespace
    cleaned_text = re.sub(r'\s+', ' ', text_from_llm).strip()
    cleaned_source = re.sub(r'\s+', ' ', source_text)
    if cleaned_text in cleaned_source:
        return True

    # 3. Try with flexible word boundaries
    # This helps with cases where there might be slight differences in punctuation/whitespace
    try:
        # Create a more flexible regex pattern
        words = cleaned_text.split()
        if len(words) >= 3:  # Only do this for reasonably long texts
            # Build a regex that allows for flexible word boundaries
            pattern = r'\b' + r'\s+'.join([re.escape(word)
                                          for word in words]) + r'\b'
            if re.search(pattern, cleaned_source, re.IGNORECASE):
                logger.debug(
                    f"Verified text using flexible word boundary matching")
                return True
    except Exception as e:
        logger.debug(f"Flexible word matching error: {e}")

    # 4. Try fuzzy matching if available (most lenient)
    try:
        from rapidfuzz import fuzz as rapidfuzz_fuzz

        # Check both partial ratio and token sort ratio
        partial_ratio = rapidfuzz_fuzz.partial_ratio(
            cleaned_text, cleaned_source)
        token_ratio = rapidfuzz_fuzz.token_sort_ratio(
            cleaned_text, cleaned_source)

        logger.debug(
            f"Fuzzy matching scores: partial={partial_ratio}%, token={token_ratio}%")

        # Accept if either score is high enough
        if partial_ratio >= RAPIDFUZZ_MATCH_THRESHOLD:
            logger.debug(f"Verified text using partial ratio fuzzy matching")
            return True

        # For longer texts, also check if a significant part is matched
        if len(cleaned_text) > 50 and partial_ratio >= 75:
            logger.debug(
                f"Verified long text using partial ratio fuzzy matching with lower threshold")
            return True
    except ImportError:
        logger.warning(
            "rapidfuzz not available for fuzzy matching. Using basic verification only.")
    except Exception as e:
        logger.debug(f"Fuzzy matching error: {e}")

    # 5. For longer texts, check if a significant initial portion exists
    if len(cleaned_text) > 30:
        first_part = cleaned_text[:30].strip()
        if first_part in cleaned_source:
            logger.debug(f"Verified text using initial portion matching")
            return True

    # All verification methods failed
    return False
