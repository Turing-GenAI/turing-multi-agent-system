"""
Text Chunking Strategies for Compliance Service

This module provides a flexible architecture for different document chunking techniques.
Each chunker implements a common interface, making it easy to switch between strategies.
"""

# Standard library imports
import re
import logging
from abc import ABC, abstractmethod
from typing import List, Optional

# Third-party imports
from pydantic import BaseModel, Field
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    TokenTextSplitter,
    CharacterTextSplitter,
    NLTKTextSplitter
)

# Conditional imports with fallbacks
# OpenAI for LLM-based chunking
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning(
        "openai package not installed. AgenticChunker will not work.")

# Local application imports
from app.core.config import settings
from app.services.compliance_service.models.pydantic_models import TextWithOffset

# Configure logging
logger = logging.getLogger(__name__)

# Check for optional dependencies
try:
    from rapidfuzz import fuzz as rapidfuzz_fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False
    logger.warning(
        "rapidfuzz not installed. Text verification will use basic 'in' operator.")


class BaseChunker(ABC):
    """
    Base class for all text chunking strategies.

    Defines the common interface that all chunkers must implement.
    """

    @abstractmethod
    def split_text(self, text: str) -> List[str]:
        """
        Split the text into chunks.

        Args:
            text: The text to be split

        Returns:
            List of text chunks
        """
        pass

    @abstractmethod
    def split_with_offsets(self, text: str) -> List[TextWithOffset]:
        """
        Split text and track the character offsets of each chunk in the original text.

        Args:
            text: The text to be split

        Returns:
            List of TextWithOffset objects containing both the text chunks and their positions
        """
        pass

    @staticmethod
    def fuzzy_find_position(chunk_text: str, source_text: str, start_pos: int = 0) -> int:
        """
        Find the position of chunk_text in source_text using multiple strategies.

        Args:
            chunk_text: The text chunk to locate
            source_text: The source text to search in
            start_pos: Starting position for the search

        Returns:
            Position (character index) where the chunk was found
        """
        # Try several approaches, from most to least accurate

        # 1. Direct match (most accurate)
        pos = source_text.find(chunk_text, start_pos)
        if pos >= 0:
            return pos

        # 2. Try with just basic whitespace normalization
        chunk_norm = re.sub(r'\s+', ' ', chunk_text).strip()
        source_norm = re.sub(
            r'\s+', ' ', source_text[start_pos:start_pos + min(20000, len(source_text) - start_pos)])
        pos = source_norm.find(chunk_norm)
        if pos >= 0:
            # Adjust position based on original text
            # Find the real character position in the original text
            real_pos = start_pos
            norm_pos = 0

            for i in range(start_pos, len(source_text)):
                if norm_pos >= pos:
                    real_pos = i
                    break

                # Count normalized positions
                if not source_text[i].isspace() or (source_text[i].isspace() and (i == 0 or not source_text[i-1].isspace())):
                    norm_pos += 1

            return real_pos

        # 3. Try with first N chars (for cases where end is different)
        if len(chunk_text) > 30:
            first_part = chunk_text[:30]
            pos = source_text.find(first_part, start_pos)
            if pos >= 0:
                return pos

            # Also try with normalized whitespace
            first_part_norm = re.sub(r'\s+', ' ', first_part).strip()
            pos = source_norm.find(first_part_norm)
            if pos >= 0:
                # Find real position as above
                real_pos = start_pos
                norm_pos = 0

                for i in range(start_pos, len(source_text)):
                    if norm_pos >= pos:
                        real_pos = i
                        break

                    # Count normalized positions
                    if not source_text[i].isspace() or (source_text[i].isspace() and (i == 0 or not source_text[i-1].isspace())):
                        norm_pos += 1

                return real_pos

        # 4. Try with word boundary matching (split into words and find sequences)
        words = re.sub(r'\s+', ' ', chunk_text).strip().split()
        if len(words) >= 3:
            # Create a pattern to find at least the first few words with flexible spacing
            first_words = words[:min(5, len(words))]
            pattern = r'\b' + r'\s+'.join([re.escape(word)
                                          for word in first_words]) + r'.*?'

            try:
                match = re.search(pattern, source_text[start_pos:], re.DOTALL)
                if match:
                    return start_pos + match.start()
            except Exception as e:
                logger.debug(f"Word boundary matching error: {e}")

        # 5. If available, try rapidfuzz for approximate matching
        if RAPIDFUZZ_AVAILABLE and len(chunk_text) > 5:
            try:
                # Use extract to find best match in a substring of source text
                # This helps with performance by limiting the search space
                search_window = source_text[start_pos:start_pos +
                                            min(10000, len(source_text) - start_pos)]
                match = rapidfuzz_fuzz.partial_ratio_alignment(
                    chunk_text, search_window)

                # Only use results with high enough confidence
                if match.score > 85:
                    return start_pos + match.dest_start

                # For longer texts, lower the threshold slightly
                if len(chunk_text) > 100 and match.score > 75:
                    return start_pos + match.dest_start
            except Exception as e:
                logger.debug(f"Fuzzy matching error: {e}")

        # 6. Last resort: return the starting position
        logger.warning(
            f"Could not find good match for chunk, using start position. First 30 chars: '{chunk_text[:30]}...'")
        return start_pos


class RecursiveChunker(BaseChunker):
    """
    Chunker that uses LangChain's RecursiveCharacterTextSplitter.

    This is the default strategy currently employed by the compliance service.
    It recursively splits by different separators, attempting to preserve semantic structure.
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        """
        Initialize the RecursiveChunker.

        Args:
            chunk_size: Size of each chunk in characters
            chunk_overlap: Overlap between chunks in characters
        """
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )

    def split_text(self, text: str) -> List[str]:
        """
        Split text using the recursive character splitter.

        Args:
            text: Text to split

        Returns:
            List of text chunks
        """
        if not text:
            return []

        return self.text_splitter.split_text(text)

    def split_with_offsets(self, text: str) -> List[TextWithOffset]:
        """
        Split text and track character offsets using fuzzy matching.

        Args:
            text: Text to split

        Returns:
            List of TextWithOffset objects with text and position
        """
        if not text:
            return []

        # First split the text into smaller chunks
        chunks = self.split_text(text)
        result = []

        # Start tracking positions
        current_pos = 0
        for chunk in chunks:
            if not chunk.strip():
                continue

            # Use the advanced matching function
            found_pos = self.fuzzy_find_position(chunk, text, current_pos)

            # If we didn't find a good match, log a warning but continue
            if found_pos == current_pos and text.find(chunk, current_pos) == -1:
                logger.warning(
                    f"Using approximate position for chunk: '{chunk[:30]}...'")

            # Add to results
            result.append(TextWithOffset(text=chunk, offset=found_pos))

            # Advance position for next search
            # Use max length to ensure we make progress
            current_pos = found_pos + max(len(chunk.strip()), 1)

        return result


class TokenChunker(BaseChunker):
    """
    Chunker that uses LangChain's TokenTextSplitter.

    This strategy splits text based on token counts rather than character counts,
    which can be useful for working within token limitations of language models.
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 100):
        """
        Initialize the TokenChunker.

        Args:
            chunk_size: Maximum number of tokens per chunk
            chunk_overlap: Number of overlapping tokens between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.text_splitter = TokenTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )

    def split_text(self, text: str) -> List[str]:
        """
        Split text using the token-based splitter.

        Args:
            text: Text to split

        Returns:
            List of text chunks
        """
        if not text:
            return []

        return self.text_splitter.split_text(text)

    def split_with_offsets(self, text: str) -> List[TextWithOffset]:
        """
        Split text and track character offsets using fuzzy matching.

        Args:
            text: Text to split

        Returns:
            List of TextWithOffset objects with text and position
        """
        if not text:
            return []

        # First split the text
        chunks = self.split_text(text)
        result = []

        # Track positions using the same algorithm as RecursiveChunker
        current_pos = 0
        for chunk in chunks:
            if not chunk.strip():
                continue

            found_pos = self.fuzzy_find_position(chunk, text, current_pos)

            if found_pos == current_pos and text.find(chunk, current_pos) == -1:
                logger.warning(
                    f"Using approximate position for token-based chunk: '{chunk[:30]}...'")

            result.append(TextWithOffset(text=chunk, offset=found_pos))
            current_pos = found_pos + max(len(chunk.strip()), 1)

        return result


class SentenceChunker(BaseChunker):
    """
    Chunker that uses NLTK's sentence tokenizer for more semantically-aware splits.

    This strategy attempts to split text along sentence boundaries, which can preserve
    more meaning in each chunk compared to character-based approaches.
    """

    def __init__(self, chunk_size: int = 3500, chunk_overlap: int = 250):
        """
        Initialize the SentenceChunker.

        Args:
            chunk_size: Approximate size of each chunk in characters
            chunk_overlap: Approximate overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Check NLTK availability - will raise error if nltk not installed
        self.text_splitter = NLTKTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )

    def split_text(self, text: str) -> List[str]:
        """
        Split text using NLTK sentence boundaries.

        Args:
            text: Text to split

        Returns:
            List of text chunks divided at sentence boundaries
        """
        if not text:
            return []

        try:
            return self.text_splitter.split_text(text)
        except Exception as e:
            logger.error(
                f"NLTK chunking failed: {e}. Falling back to recursive chunking.")
            # Fallback to recursive chunking
            fallback = RecursiveChunker(self.chunk_size, self.chunk_overlap)
            return fallback.split_text(text)

    def split_with_offsets(self, text: str) -> List[TextWithOffset]:
        """
        Split text along sentence boundaries and track character offsets.

        Args:
            text: Text to split

        Returns:
            List of TextWithOffset objects with text and position
        """
        if not text:
            return []

        try:
            chunks = self.split_text(text)
            result = []

            current_pos = 0
            for chunk in chunks:
                if not chunk.strip():
                    continue

                found_pos = self.fuzzy_find_position(chunk, text, current_pos)

                if found_pos == current_pos and text.find(chunk, current_pos) == -1:
                    logger.warning(
                        f"Using approximate position for sentence chunk: '{chunk[:30]}...'")

                result.append(TextWithOffset(text=chunk, offset=found_pos))
                current_pos = found_pos + max(len(chunk.strip()), 1)

            return result

        except Exception as e:
            logger.error(
                f"NLTK chunking with offsets failed: {e}. Falling back to recursive chunking.")
            # Fallback to recursive chunking
            fallback = RecursiveChunker(self.chunk_size, self.chunk_overlap)
            return fallback.split_with_offsets(text)


class ChunkerFactory:
    """
    Factory class to instantiate different chunking strategies.

    This provides a simple way to get the appropriate chunker based on configuration.
    """

    @staticmethod
    def create_chunker(strategy: str = "recursive", **kwargs) -> BaseChunker:
        """
        Create and return a chunker based on the specified strategy.

        Args:
            strategy: The chunking strategy to use:
                - "recursive": RecursiveCharacterTextSplitter (default)
                - "token": TokenTextSplitter
                - "sentence": NLTKTextSplitter
            **kwargs: Additional parameters to pass to the chunker constructor

        Returns:
            An instance of the specified chunker

        Raises:
            ValueError: If an invalid chunking strategy is specified
        """
        if strategy == "recursive":
            return RecursiveChunker(**kwargs)
        elif strategy == "token":
            return TokenChunker(**kwargs)
        elif strategy == "sentence":
            return SentenceChunker(**kwargs)
        else:
            raise ValueError(f"Unknown chunking strategy: {strategy}")


# Pydantic models for the LLM response parsing
class ChunkContent(BaseModel):
    """Represents a single rewritten chunk from the LLM."""
    rewritten: str = Field(
        ..., description="The rewritten text that combines and improves the grouped sentences")


class ChunkGroupsDirect(BaseModel):
    """Represents the structured output from the LLM chunking."""
    chunks: List[ChunkContent] = Field(...,
                                       description="List of rewritten text chunks")


class AgenticChunker(BaseChunker):
    """
    A chunker that uses an LLM to create semantically meaningful chunks for compliance analysis.

    This chunker is specifically designed for compliance review, focusing on preserving regulatory
    context and identifying sections that might contain compliance issues.
    """

    def __init__(self, chunk_size: int = 3500, chunk_overlap: int = 250, batch_size: int = 10):
        """
        Initialize the AgenticChunker.

        Args:
            chunk_size: Approximate target size for each chunk (used as guidance)
            chunk_overlap: Not directly used, maintained for API compatibility
            batch_size: Number of sentences to process in each LLM call
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.batch_size = batch_size
        self.sentences = []

        # Fallback chunker in case of errors
        self.fallback_chunker = RecursiveChunker(chunk_size, chunk_overlap)

        if not OPENAI_AVAILABLE:
            logging.warning(
                "OpenAI package not installed, using fallback chunker instead.")

    def split_text_with_llm(self, text: str) -> List[str]:
        """
        Use the LLM to split text into paragraphs/sections directly, bypassing the need for 
        sentence detection libraries. This approach is optimized for regulatory and clinical documents.

        Args:
            text: The text to process

        Returns:
            List of processed text sections
        """
        if not text or not OPENAI_AVAILABLE:
            # Fallback to simple paragraph splitting if no text or OpenAI not available
            return [p.strip() for p in text.split('\n\n') if p.strip()]

        # Break large texts into manageable chunks first
        # This is a simple paragraph-based pre-splitting to handle very large documents
        prelim_chunks = []
        paragraphs = text.split('\n\n')

        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) > 10000:  # OpenAI context limit consideration
                if current_chunk:
                    prelim_chunks.append(current_chunk)
                current_chunk = para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para

        if current_chunk:
            prelim_chunks.append(current_chunk)

    def split_into_sentences(self, text: str) -> List[str]:
        """
        Split the input text into semantic chunks directly using paragraph breaks.
        This is a simple approach before sending to the LLM for more sophisticated chunking.

        Args:
            text: The text to split into preliminary chunks

        Returns:
            List of text chunks
        """
        if not text:
            return []

        # Simple paragraph-based splitting - the LLM will do the heavy lifting
        # This just breaks down very large texts into manageable pieces first
        chunks = []

        # Split by paragraph breaks
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

        # Handle paragraphs that might still be too long
        for paragraph in paragraphs:
            if len(paragraph) > 3000:  # Long paragraph
                # Break by single line breaks
                sections = [s.strip()
                            for s in paragraph.split('\n') if s.strip()]
                chunks.extend(sections)
            else:
                chunks.append(paragraph)

        # Store for later use and return
        self.sentences = chunks
        return chunks

    def _process_batch(self, paragraphs: List[str]) -> Optional[ChunkGroupsDirect]:
        """
        Process a batch of text paragraphs using the LLM to create semantic chunks optimized for compliance analysis.

        Args:
            paragraphs: List of text paragraphs to process

        Returns:
            Parsed response from the LLM with rewritten chunks
        """
        # Join paragraphs with clear separators for the LLM to understand structure
        combined_text = "\n\n".join(paragraphs)

        # Create a prompt focused on compliance-aware chunking
        prompt = (
            "You are an expert at analyzing clinical trial and regulatory documents. "
            "Below is text from a compliance document that needs to be split into logical, self-contained chunks "
            "that are optimized for compliance review and analysis.\n\n"

            "Your task:\n"
            "1. Read and understand the text below\n"
            "2. Identify logical sections based on regulatory topics, requirements, or procedural steps\n"
            "3. Rewrite each section into clear, self-contained chunks\n"
            "4. Ensure each chunk retains ALL original information, especially:\n"
            "   - Exact numerical values and dates (e.g., '17 years', '3 weeks')\n"
            "   - Regulatory terms and specific procedures\n"
            "   - Timing and sequence information\n"
            "   - Requirements and conditions\n"
            "   - Potential typos or errors (these are critical for compliance checking)\n\n"

            "Text to process:\n"
            f"{combined_text}\n\n"

            "Return ONLY structured JSON with this format:\n"
            "{\n"
            "  'chunks': [\n"
            "    {\n"
            "      'rewritten': 'Complete self-contained chunk with all relevant information'\n"
            "    }\n"
            "  ]\n"
            "}\n"
        )

        try:
            if not OPENAI_AVAILABLE:
                logging.warning("OpenAI not available, skipping LLM chunking")
                return None

            # Use the configured model from settings
            model = settings.OPENAI_MODEL_NAME
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

            try:
                # Try with newer structured parse method first
                completion = client.beta.chat.completions.parse(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an expert compliance document analyst specializing in clinical trial regulatory document analysis."},
                        {"role": "user", "content": prompt},
                    ],
                    response_format=ChunkGroupsDirect,
                )
                return completion.choices[0].message.parsed
            except AttributeError:
                # Fall back to regular completion and manual parsing for older SDK versions
                completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an expert compliance document analyst specializing in clinical trial regulatory document analysis."},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"}
                )
                response_text = completion.choices[0].message.content
                # Parse the JSON response manually
                response_json = json.loads(response_text)
                return ChunkGroupsDirect(chunks=[ChunkContent(rewritten=c["rewritten"]) for c in response_json["chunks"]])
        except Exception as e:
            logging.error(f"An error occurred while calling the LLM: {e}")
            return None

    def process_with_llm(self, text: str) -> List[str]:
        """
        Process the entire text with the LLM to create compliance-optimized chunks.

        Args:
            text: The text to process

        Returns:
            List of rewritten text chunks
        """
        # First do initial paragraph-based splitting to handle large documents
        chunks = self.split_text_with_llm(text)
        if not chunks:
            return self.fallback_chunker.split_text(text)

        # Process these initial chunks with the LLM
        all_results = []

        # Process in batches based on batch_size
        for start in range(0, len(chunks), self.batch_size):
            end = start + self.batch_size
            batch_chunks = chunks[start:end]
            result = self._process_batch(batch_chunks)

            if result and result.chunks:
                all_results.extend(
                    [chunk.rewritten for chunk in result.chunks])
            else:
                # If LLM processing fails, include the original text
                all_results.extend(batch_chunks)

        if not all_results:
            logging.warning(
                "No chunks produced by LLM, falling back to basic chunking")
            return self.fallback_chunker.split_text(text)

        return all_results

    def split_text(self, text: str) -> List[str]:
        """
        Split text using fully LLM-guided semantic chunking optimized for compliance documents.

        Args:
            text: Text to split

        Returns:
            List of semantically coherent text chunks optimized for compliance analysis
        """
        if not text:
            return []

        try:
            # Use LLM for complete chunking process
            return self.process_with_llm(text)
        except Exception as e:
            logging.error(
                f"Error in agentic chunking: {e}, falling back to recursive chunking")
            # Fallback to traditional chunking if LLM approach fails
            return self.fallback_chunker.split_text(text)

    def split_with_offsets(self, text: str) -> List[TextWithOffset]:
        """
        Split text with LLM and track character offsets for UI highlighting of compliance issues.

        Args:
            text: Text to split

        Returns:
            List of TextWithOffset objects with text chunks and their positions
        """
        if not text:
            return []

        try:
            # Get LLM-optimized chunks
            chunks = self.split_text(text)
            result = []

            # Start tracking positions
            current_pos = 0
            for chunk in chunks:
                if not chunk.strip():
                    continue

                # Try exact match first (fastest approach)
                exact_pos = text.find(chunk, current_pos)
                if exact_pos >= 0:
                    # Found an exact match
                    found_pos = exact_pos
                else:
                    # Use fuzzy matching for LLM-rewritten chunks
                    found_pos = self.fuzzy_find_position(
                        chunk, text, current_pos)

                # Log a warning if position tracking is uncertain
                if found_pos == current_pos and text.find(chunk, current_pos) == -1:
                    logging.warning(
                        f"Using approximate position for LLM-generated chunk: '{chunk[:30]}...'")

                # Add to results
                result.append(TextWithOffset(text=chunk, offset=found_pos))

                # Advance position for next search
                current_pos = found_pos + max(len(chunk.strip()), 1)

            return result
        except Exception as e:
            logging.error(
                f"Error in agentic chunking with offsets: {e}, falling back to recursive chunking")
            return self.fallback_chunker.split_with_offsets(text)


# Update the factory to support the agentic chunker
ChunkerFactory.create_chunker = lambda strategy="agentic", **kwargs: {
    "recursive": lambda: RecursiveChunker(**kwargs),
    "token": lambda: TokenChunker(**kwargs),
    "sentence": lambda: SentenceChunker(**kwargs),
    "agentic": lambda: AgenticChunker(**kwargs)
}.get(strategy, lambda: RecursiveChunker(**kwargs))()

# Default chunker now uses the agentic approach
default_chunker = ChunkerFactory.create_chunker("agentic")
