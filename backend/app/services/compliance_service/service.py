"""
Enhanced Compliance Service Implementation

This service analyzes clinical trial documents for compliance issues using:
1. Text chunking with position tracking
2. Embedding-based semantic matching
3. LLM-powered compliance issue detection
4. Verification and confidence scoring
"""

import json
import logging
import uuid
import re
from typing import List, Optional, Tuple

# Math/similarity libraries
import numpy as np

# LangChain components
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import AzureChatOpenAI, ChatOpenAI, AzureOpenAIEmbeddings, OpenAIEmbeddings
from langchain.schema import HumanMessage, SystemMessage
from langchain.output_parsers import PydanticOutputParser

# Local imports
from app.core.config import settings
from app.models.compliance import ComplianceIssue, ComplianceReviewInput
from app.services.compliance_service.models.pydantic_models import LLMComplianceIssue, ComplianceIssueList, TextWithOffset
from app.services.compliance_service.utils import find_text_offsets, verify_text_in_source
from app.services.compliance_service.prompts import (
    COMPLIANCE_ANALYSIS_SYSTEM_PROMPT,
    get_compliance_analysis_human_prompt,
    APPLY_SUGGESTION_SYSTEM_PROMPT,
    get_apply_suggestion_human_prompt,
    get_confidence_assessment_prompt,
    WHOLE_DOCUMENT_ANALYSIS_PROMPT,
    get_whole_document_analysis_prompt,
    INSERTION_CONTENT_SYSTEM_PROMPT,
    get_insertion_content_human_prompt
)

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants for embedding-based matching and verification
# Threshold for considering chunks as semantically similar
SIMILARITY_THRESHOLD = 0.75
TOP_N_MATCHES = 3  # Number of top matching chunks to analyze
RAPIDFUZZ_MATCH_THRESHOLD = 85  # Percentage threshold for fuzzy matching

# Check for optional dependencies
try:
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning(
        "scikit-learn not installed. Cannot perform embedding-based matching.")

try:
    from rapidfuzz import fuzz as rapidfuzz_fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False
    logger.warning(
        "rapidfuzz not installed. Text verification will use basic 'in' operator.")

# No counter file needed for UUID-based IDs


class ComplianceService:
    """
    Service for analyzing clinical trial documents for compliance issues,
    using high-performance API embeddings, rapidfuzz verification, and LLM analysis.
    """

    # Using UUIDs for issue IDs - no counter needed

    def __init__(self):
        """Initialize the compliance service."""
        # Initialize the LLM client based on configuration
        if settings.USE_AZURE_OPENAI:
            self.llm_client = AzureChatOpenAI(
                model=settings.AZURE_OPENAI_API_MODEL_NAME,
                azure_deployment=settings.AZURE_OPENAI_API_DEPLOYMENT_NAME,
                api_version=settings.AZURE_OPENAI_API_MODEL_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_API_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                temperature=0.0
            )

            # Initialize embeddings client
            try:
                self.embeddings = AzureOpenAIEmbeddings(
                    model=settings.AZURE_OPENAI_EMBEDDING_MODEL_NAME,
                    azure_deployment=settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
                    api_version=settings.AZURE_OPENAI_API_MODEL_VERSION,
                    azure_endpoint=settings.AZURE_OPENAI_API_ENDPOINT,
                    api_key=settings.AZURE_OPENAI_API_KEY
                )
                self.embeddings_available = True
                logger.info("Using Azure OpenAI embeddings")
            except Exception as e:
                logger.warning(f"Failed to initialize Azure embeddings: {e}")
                self.embeddings_available = False

            logger.info("Using Azure OpenAI client")
        else:
            self.llm_client = ChatOpenAI(
                model=settings.OPENAI_MODEL_NAME,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.0
            )

            # Initialize embeddings client
            try:
                self.embeddings = OpenAIEmbeddings(
                    model="text-embedding-3-large",
                    api_key=settings.OPENAI_API_KEY
                )
                self.embeddings_available = True
                logger.info("Using standard OpenAI embeddings")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI embeddings: {e}")
                self.embeddings_available = False

            # More prominent logging of model information
            logger.info(f"*** OpenAI MODEL: {settings.OPENAI_MODEL_NAME} ***")
            logger.info(f"Using standard OpenAI client...")

        # Import and set up the chunker based on configuration
        from app.services.compliance_service.chunking import ChunkerFactory

        # Get chunking strategy and params from settings
        strategy = settings.CHUNKING_STRATEGY
        params = settings.CHUNKING_PARAMS or {}

        # Create the appropriate chunker
        self.chunker = ChunkerFactory.create_chunker(
            strategy=strategy,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            **params
        )

        logger.info(f"Using chunking strategy: {strategy}")

        # Initialize output parser for structured LLM responses
        self.parser = PydanticOutputParser(pydantic_object=ComplianceIssueList)

        # No counter management needed with UUID-based IDs

    # Counter loading no longer needed with UUID-based IDs

    # Counter saving no longer needed with UUID-based IDs

    def _generate_issue_id(self) -> str:
        """Generate a UUID-based issue ID (e.g., R-a1b2c3d4)."""
        # Create a shortened UUID (first 8 chars) with the 'R-' prefix
        return f"R-{uuid.uuid4().hex[:8]}"

    def _split_text_with_offsets(self, text: str) -> List[TextWithOffset]:
        """
        Splits text and returns chunks with their start character offsets.
        Uses the configured chunker to perform the splitting and position tracking.

        Args:
            text: The text to split

        Returns:
            List of TextWithOffset objects containing chunks and their positions
        """
        if not text:
            return []

        # Use the configured chunker to split the text with offsets
        return self.chunker.split_with_offsets(text)

    async def analyze_compliance(self, review_input: ComplianceReviewInput) -> List[ComplianceIssue]:
        """
        Analyzes documents using a two-phase approach:
        1. First tries agentic chunking for semantic understanding of document parts
        2. Then attempts whole-document analysis for holistic issues

        This comprehensive approach combines the strengths of both methods.

        Args:
            review_input: Input containing clinical and compliance document content

        Returns:
            List of compliance issues with precise text locations
        """
        # Get document content
        clinical_doc_content = review_input.clinical_doc_content
        compliance_doc_content = review_input.compliance_doc_content

        logger.info(
            f"Starting compliance analysis for documents (ClinicalID: {review_input.clinical_doc_id}, ComplianceID: {review_input.compliance_doc_id})")

        # Collect all unique compliance issues
        all_issues = []

        # Phase 1: Use agentic chunking first (better for large documents and detailed analysis)
        chunk_issues = []
        try:
            logger.info("Phase 1: Starting agentic chunk-based analysis...")

            # Split documents into chunks with position tracking (uses AgenticChunker by default now)
            clinical_chunks_with_offsets = self._split_text_with_offsets(
                clinical_doc_content)
            compliance_chunks_with_offsets = self._split_text_with_offsets(
                compliance_doc_content)

            logger.info(
                f"Split clinical document into {len(clinical_chunks_with_offsets)} chunks and compliance document into {len(compliance_chunks_with_offsets)} chunks")

            # Extract just the chunks for easier handling
            clinical_chunks = [c.text for c in clinical_chunks_with_offsets]
            clinical_offsets = [c.offset for c in clinical_chunks_with_offsets]
            compliance_chunks = [
                c.text for c in compliance_chunks_with_offsets]
            compliance_offsets = [
                c.offset for c in compliance_chunks_with_offsets]

            # Collect compliance issues from chunk-based analysis
            processed_pairs = set()  # Track which pairs have been processed

            # Check if we can use embeddings for intelligent pairing
            if self.embeddings_available and SKLEARN_AVAILABLE and len(clinical_chunks) > 0 and len(compliance_chunks) > 0:
                try:
                    logger.info("Using embeddings for chunk pairing")

                    # Get embeddings for all chunks
                    clinical_embeddings = self.embeddings.embed_documents(
                        clinical_chunks)
                    compliance_embeddings = self.embeddings.embed_documents(
                        compliance_chunks)

                    # Convert to numpy arrays for efficient computation
                    clinical_np = np.array(clinical_embeddings)
                    compliance_np = np.array(compliance_embeddings)

                    # Calculate cosine similarity between all pairs
                    similarity_matrix = cosine_similarity(
                        clinical_np, compliance_np)

                    # Process most similar pairs first
                    for i in range(len(clinical_chunks)):
                        # Find top N most similar compliance chunks for this clinical chunk
                        similarities = similarity_matrix[i]
                        # Get indices of top N matches
                        top_indices = similarities.argsort(
                        )[-TOP_N_MATCHES:][::-1]

                        # Only process pairs with similarity above threshold
                        for j in top_indices:
                            similarity = similarities[j]
                            if similarity < SIMILARITY_THRESHOLD:
                                continue

                            # Skip if already processed
                            if (i, j) in processed_pairs:
                                continue

                            logger.info(
                                f"Processing chunk pair with similarity {similarity:.2f}: Clinical chunk {i+1}/{len(clinical_chunks)}, Compliance chunk {j+1}/{len(compliance_chunks)}")

                            # Analyze this pair
                            issues = await self._analyze_chunk_pair(
                                clinical_chunks[i],
                                compliance_chunks[j],
                                clinical_offsets[i],
                                compliance_offsets[j]
                            )

                            chunk_issues.extend(issues)
                            processed_pairs.add((i, j))

                            # Limit to max 3 compliance chunks per clinical chunk to control API usage
                            if len([p for p in processed_pairs if p[0] == i]) >= 3:
                                break

                except Exception as e:
                    logger.error(
                        f"Error in embedding-based pairing: {str(e)}", exc_info=True)
                    # Fall back to basic pairing if embeddings fail
                    await self._perform_basic_pairing_analysis(
                        clinical_chunks, clinical_offsets,
                        compliance_chunks, compliance_offsets,
                        chunk_issues, processed_pairs
                    )
            else:
                # Fall back to basic pairing if embeddings/sklearn aren't available
                logger.info(
                    "Using basic chunk pairing (embeddings not available)")
                await self._perform_basic_pairing_analysis(
                    clinical_chunks, clinical_offsets,
                    compliance_chunks, compliance_offsets,
                    chunk_issues, processed_pairs
                )

            # Add all chunk-based issues to our final collection
            if chunk_issues and len(chunk_issues) > 0:
                logger.info(
                    f"Found {len(chunk_issues)} issues using agentic chunk-based analysis")
                all_issues.extend(chunk_issues)
            else:
                logger.info("Chunk-based analysis found no issues")
        except Exception as e:
            logger.error(f"Error in chunk-based analysis: {e}")

        # Phase 2: Also try whole-document analysis for holistic issues and patterns
        try:
            logger.info("Phase 2: Starting whole-document analysis...")
            direct_issues = await self._analyze_full_documents(clinical_doc_content, compliance_doc_content)

            if direct_issues and len(direct_issues) > 0:
                logger.info(
                    f"Found {len(direct_issues)} issues using whole-document analysis")

                # Add whole document analysis issues, avoiding duplicates
                for issue in direct_issues:
                    # Add if not a duplicate (checking for similar text and explanation)
                    if not any(self._is_similar_issue(issue, existing) for existing in all_issues):
                        all_issues.append(issue)
            else:
                logger.info(
                    "Whole-document analysis found no additional issues")
        except Exception as e:
            logger.error(f"Error in whole-document analysis: {e}")

        # Apply enhanced deduplication to reduce multiple issues on the same text
        deduplicated_issues = self._deduplicate_issues(all_issues)

        # Log final issue count
        logger.info(
            f"Found {len(deduplicated_issues)} compliance issues after deduplication (from {len(all_issues)} original issues)")
        return deduplicated_issues

    def _deduplicate_issues(self, issues: List[ComplianceIssue]) -> List[ComplianceIssue]:
        """
        Smart deduplication of compliance issues, prioritizing higher confidence issues
        when multiple issues are flagged for the same clinical text.

        Args:
            issues: List of compliance issues to deduplicate

        Returns:
            Deduplicated list of compliance issues
        """
        if not issues or len(issues) <= 1:
            return issues

        # Group issues by clinical text (after stripping whitespace)
        text_groups = {}
        for issue in issues:
            clean_text = issue.clinical_text.strip()
            if clean_text not in text_groups:
                text_groups[clean_text] = []
            text_groups[clean_text].append(issue)

        # Process groups to select the best issue from each group
        deduplicated = []
        for text, group in text_groups.items():
            if len(group) == 1:
                # Only one issue for this text, no deduplication needed
                deduplicated.append(group[0])
            else:
                # Multiple issues for the same text - select the best one
                logger.info(
                    f"Found {len(group)} issues for the same clinical text: '{text[:30]}...'")

                # Prioritize high confidence issues
                high_confidence = [i for i in group if i.confidence == 'high']
                if high_confidence:
                    # Use the first high confidence issue
                    selected = high_confidence[0]
                    logger.info(
                        f"Selected high confidence issue out of {len(group)} duplicates")
                else:
                    # No high confidence issues, use the first one
                    selected = group[0]
                    logger.info(
                        f"Selected first issue (all are low confidence) out of {len(group)} duplicates")

                deduplicated.append(selected)

        logger.info(
            f"Deduplication reduced {len(issues)} issues to {len(deduplicated)} unique issues")
        return deduplicated

    def _is_similar_issue(self, issue1: ComplianceIssue, issue2: ComplianceIssue) -> bool:
        """
        Determines if two compliance issues are similar enough to be considered duplicates.
        Prioritizes exact clinical text matches (non-compliant text).

        Args:
            issue1: First compliance issue to compare
            issue2: Second compliance issue to compare

        Returns:
            True if issues are similar (likely duplicates), False otherwise
        """
        # Check for exact clinical text match - this is the strongest indicator of a duplicate
        if issue1.clinical_text.strip() == issue2.clinical_text.strip():
            logger.debug(
                f"Found exact clinical text match - marking as duplicate")
            return True

        # Check if clinical text segments have significant overlap
        clinical_overlap = self._calculate_text_overlap(
            issue1.clinical_text,
            issue2.clinical_text
        )

        # Check if compliance text segments have significant overlap
        compliance_overlap = self._calculate_text_overlap(
            issue1.compliance_text,
            issue2.compliance_text
        )

        # Check if regulations cited are the same or similar
        regulation_match = False
        if issue1.regulation and issue2.regulation:
            # Extract section numbers for comparison (e.g., '4.1.2' from 'ICH GCP Section 4.1.2')
            reg1 = re.sub(r'[^0-9.]', '', issue1.regulation)
            reg2 = re.sub(r'[^0-9.]', '', issue2.regulation)
            regulation_match = reg1 == reg2

        # Calculate similarity in suggestions
        suggestion_overlap = self._calculate_text_overlap(
            issue1.suggested_edit,
            issue2.suggested_edit
        )

        # Define thresholds for similarity
        TEXT_SIMILARITY_THRESHOLD = 0.8  # Increased from 0.6 to be more strict

        # Strong similarity indicators
        exact_clinical_overlap = clinical_overlap > 0.95  # Almost exact match

        # Issue is similar if clinical texts have significant overlap
        # This prioritizes the non-compliant text over other factors
        if exact_clinical_overlap:
            logger.debug(
                f"Found high clinical text overlap ({clinical_overlap:.2f}) - marking as duplicate")
            return True

        # Otherwise, require significant overlap in multiple criteria
        return (clinical_overlap > TEXT_SIMILARITY_THRESHOLD and
                (compliance_overlap > TEXT_SIMILARITY_THRESHOLD or suggestion_overlap > TEXT_SIMILARITY_THRESHOLD)) or \
               (clinical_overlap > TEXT_SIMILARITY_THRESHOLD and regulation_match)

    def _calculate_text_overlap(self, text1: str, text2: str) -> float:
        """
        Calculates the degree of overlap between two text segments.

        Args:
            text1: First text segment
            text2: Second text segment

        Returns:
            Similarity score between 0.0 and 1.0
        """
        if not text1 or not text2:
            return 0.0

        # Normalize texts for comparison
        t1 = text1.lower().strip()
        t2 = text2.lower().strip()

        # Handle empty strings
        if not t1 or not t2:
            return 0.0

        # Simple Jaccard similarity based on word sets
        words1 = set(t1.split())
        words2 = set(t2.split())

        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))

        if union == 0:  # Handle edge case
            return 0.0

        return intersection / union

    async def _analyze_full_documents(self, clinical_doc_content: str, compliance_doc_content: str) -> List[ComplianceIssue]:
        """
        Analyzes the full documents directly without chunking.
        This is specifically designed to catch issues that might be missed by chunking.

        Args:
            clinical_doc_content: The full clinical document content
            compliance_doc_content: The full compliance document content

        Returns:
            List of compliance issues with position information
        """
        # Use comprehensive whole document analysis prompt
        system_prompt = WHOLE_DOCUMENT_ANALYSIS_PROMPT

        # Generate a comprehensive analysis prompt that's not limited to specific issues
        human_prompt = get_whole_document_analysis_prompt(
            clinical_doc_content, compliance_doc_content)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]

        # Call OpenAI API
        try:
            response = await self.llm_client.ainvoke(messages)
            response_content = response.content

            # Parse response to extract compliance issues
            try:
                # Try to extract JSON
                if "```json" in response_content:
                    json_str = response_content.split(
                        "```json")[1].split("```")[0].strip()
                elif "```" in response_content:
                    json_str = response_content.split("```")[1].strip()
                else:
                    json_str = response_content.strip()

                # Parse and validate
                try:
                    issue_list = ComplianceIssueList.model_validate_json(
                        json_str)
                    llm_issues = issue_list.issues
                except Exception as validation_err:
                    # Fall back to manual parsing
                    logger.warning(
                        f"Pydantic validation failed: {validation_err}. Falling back to manual parsing.")
                    data = json.loads(json_str)

                    # Check if we have a category-based structure (any key other than 'issues' that contains a list)
                    found_categories = [key for key in data.keys(
                    ) if key != 'issues' and isinstance(data[key], list)]

                    if found_categories:
                        logger.info(
                            f"Found category-based structure with {len(found_categories)} categories")
                        combined_issues = []

                        # Collect issues from all categories dynamically
                        for category in found_categories:
                            category_issues = data[category]
                            logger.info(
                                f"Found '{category}' with {len(category_issues)} issues")
                            combined_issues.extend(category_issues)

                        llm_issues = [LLMComplianceIssue(
                            **issue) for issue in combined_issues]
                        logger.info(
                            f"Combined {len(llm_issues)} issues from all categories")
                    else:
                        # Standard structure with 'issues' key
                        llm_issues = [LLMComplianceIssue(
                            **issue) for issue in data.get("issues", [])]

                # Convert to ComplianceIssue objects
                issues = []
                for llm_issue in llm_issues:
                    # Find positions in the document
                    clinical_start, clinical_end = find_text_offsets(
                        llm_issue.clinical_text, clinical_doc_content)
                    compliance_start, compliance_end = find_text_offsets(
                        llm_issue.compliance_text, compliance_doc_content)

                    # Create issue with position information
                    issue = ComplianceIssue(
                        id=self._generate_issue_id(),
                        clinical_text=llm_issue.clinical_text,
                        compliance_text=llm_issue.compliance_text,
                        explanation=llm_issue.explanation,
                        suggested_edit=llm_issue.suggested_edit,
                        confidence=llm_issue.confidence,
                        regulation=llm_issue.regulation,
                        clinical_text_start_char=clinical_start,
                        clinical_text_end_char=clinical_end,
                        compliance_text_start_char=compliance_start,
                        compliance_text_end_char=compliance_end,
                        metadata={"analysis": "direct"}
                    )
                    issues.append(issue)

                return issues

            except Exception as parsing_err:
                logger.error(
                    f"Error parsing direct analysis response: {parsing_err}\nResponse: {response_content}")
                return []

        except Exception as e:
            logger.error(f"Error in direct document analysis: {str(e)}")
            return []

    async def _perform_basic_pairing_analysis(self, clinical_chunks, clinical_offsets,
                                              compliance_chunks, compliance_offsets,
                                              all_compliance_issues, processed_pairs):
        """
        Helper for basic (limited, sequential) chunk pairing analysis fallback.
        Used when embedding-based pairing is not available.
        """
        # Process a limited combination to optimize API calls
        # Process max 3 clinical chunks
        max_clinical_chunks = min(len(clinical_chunks), 3)
        # Process max 2 compliance chunks per clinical chunk
        max_compliance_chunks = min(len(compliance_chunks), 2)

        for i in range(max_clinical_chunks):
            logger.info(
                f"Processing clinical chunk {i+1}/{max_clinical_chunks}")

            # For each clinical chunk, check against limited compliance chunks
            for j in range(max_compliance_chunks):
                # Skip if already processed
                if (i, j) in processed_pairs:
                    continue

                logger.info(
                    f"  Comparing against compliance chunk {j+1}/{max_compliance_chunks}")

                # Analyze this pair
                issues = await self._analyze_chunk_pair(
                    clinical_chunks[i],
                    compliance_chunks[j],
                    clinical_offsets[i],
                    compliance_offsets[j]
                )

                all_compliance_issues.extend(issues)
                processed_pairs.add((i, j))

    async def _analyze_chunk_pair(self, clinical_chunk: str, compliance_chunk: str,
                                  clinical_chunk_offset: int, compliance_chunk_offset: int) -> List[ComplianceIssue]:
        """
        Analyzes a specific chunk pair using LLM, verifies, and calculates positions.

        Args:
            clinical_chunk: The clinical document chunk
            compliance_chunk: The compliance document chunk
            clinical_chunk_offset: Character offset of clinical chunk in original document
            compliance_chunk_offset: Character offset of compliance chunk in original document

        Returns:
            List of compliance issues with position information
        """
        # Use the centralized system prompt and generate the human prompt
        system_prompt = COMPLIANCE_ANALYSIS_SYSTEM_PROMPT
        human_prompt = get_compliance_analysis_human_prompt(
            clinical_chunk, compliance_chunk)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]

        # Call OpenAI API (Azure or standard)
        try:
            response = await self.llm_client.ainvoke(messages)
            response_content = response.content

            # Parse response to extract compliance issues
            try:
                # Handle cases where response might contain markdown code blocks
                if "```json" in response_content:
                    json_str = response_content.split(
                        "```json")[1].split("```")[0].strip()
                elif "```" in response_content:
                    json_str = response_content.split("```")[1].strip()
                else:
                    json_str = response_content.strip()

                # Parse and validate with Pydantic
                try:
                    # First try: Check if we can directly adapt the input by mapping alternate keys to 'issues'
                    if ('"compliance_issues":' in json_str or '"findings":' in json_str) and '"issues":' not in json_str:
                        fixed_json_str = json_str
                        if '"compliance_issues":' in json_str:
                            fixed_json_str = json_str.replace(
                                '"compliance_issues":', '"issues":')
                            logger.info(
                                f"Adapting JSON structure: changing 'compliance_issues' key to 'issues'")
                        elif '"findings":' in json_str:
                            fixed_json_str = json_str.replace(
                                '"findings":', '"issues":')
                            logger.info(
                                f"Adapting JSON structure: changing 'findings' key to 'issues'")

                        try:
                            issue_list = ComplianceIssueList.model_validate_json(
                                fixed_json_str)
                            llm_issues = issue_list.issues
                            logger.info(
                                f"Successfully adapted JSON structure with {len(llm_issues)} issues found")
                        except Exception as adapt_err:
                            # If adaptation fails, fall through to original attempt
                            logger.warning(
                                f"Adaptation failed: {adapt_err}. Trying original validation.")
                            issue_list = ComplianceIssueList.model_validate_json(
                                json_str)
                            llm_issues = issue_list.issues
                    else:
                        # Original attempt as fallback
                        issue_list = ComplianceIssueList.model_validate_json(
                            json_str)
                        llm_issues = issue_list.issues
                except Exception as validation_err:
                    # Fall back to manual parsing if Pydantic validation fails
                    logger.warning(
                        f"Pydantic validation failed: {validation_err}. Falling back to manual parsing.")
                    try:
                        data = json.loads(json_str)
                        logger.info(
                            f"Parsed JSON keys: {', '.join(data.keys())}")

                        # Check for all possible keys LLM might use
                        if 'compliance_issues' in data:
                            logger.info(
                                f"Found 'compliance_issues' key with {len(data['compliance_issues'])} issues")
                            llm_issues = [LLMComplianceIssue(
                                **issue) for issue in data['compliance_issues']]
                        elif 'findings' in data:
                            logger.info(
                                f"Found 'findings' key with {len(data['findings'])} issues")
                            llm_issues = [LLMComplianceIssue(
                                **issue) for issue in data['findings']]
                        else:
                            # Fall back to the original approach
                            issues_array = data.get("issues", [])
                            logger.info(
                                f"Found 'issues' key with {len(issues_array)} issues")
                            llm_issues = [LLMComplianceIssue(
                                **issue) for issue in issues_array]

                    except Exception as json_err:
                        logger.error(
                            f"JSON parsing failed: {json_err}. Unable to extract issues.")
                        llm_issues = []

                # Convert to ComplianceIssue objects with position information
                issues = []
                for llm_issue in llm_issues:
                    # Verify clinical text exists in source
                    if not verify_text_in_source(llm_issue.clinical_text, clinical_chunk):
                        logger.warning(
                            f"Skipping issue - clinical text not verified in source: '{llm_issue.clinical_text[:30]}...'")
                        continue

                    # Verify compliance text exists in source
                    if not verify_text_in_source(llm_issue.compliance_text, compliance_chunk):
                        logger.warning(
                            f"Skipping issue - compliance text not verified in source: '{llm_issue.compliance_text[:30]}...'")
                        continue

                    # Find exact character positions for highlighting
                    clinical_start, clinical_end = find_text_offsets(
                        llm_issue.clinical_text, clinical_chunk)
                    compliance_start, compliance_end = find_text_offsets(
                        llm_issue.compliance_text, compliance_chunk)

                    # Adjust positions relative to original document
                    if clinical_start is not None and clinical_end is not None:
                        clinical_start += clinical_chunk_offset
                        clinical_end += clinical_chunk_offset

                    if compliance_start is not None and compliance_end is not None:
                        compliance_start += compliance_chunk_offset
                        compliance_end += compliance_chunk_offset

                    # Use dedicated numerical confidence assessment prompt
                    confidence_score = llm_issue.confidence  # Default fallback
                    try:
                        # Create a call to assess confidence numerically
                        confidence_prompt = get_confidence_assessment_prompt(
                            llm_issue.clinical_text,
                            llm_issue.compliance_text
                        )
                        confidence_messages = [
                            HumanMessage(content=confidence_prompt)]
                        confidence_response = await self.llm_client.ainvoke(confidence_messages)

                        # Parse the confidence score (expecting just a number)
                        confidence_text = confidence_response.content.strip()
                        try:
                            # Extract just the number if there's extra text
                            match = re.search(r'\d+\.?\d*', confidence_text)
                            if match:
                                confidence_value = float(match.group(0))
                                # Convert numerical score to high/low string format
                                confidence_score = 'high' if confidence_value >= 0.5 else 'low'
                                logger.debug(
                                    f"Set confidence to {confidence_score} based on numerical value {confidence_value}")
                            else:
                                logger.warning(
                                    f"No numerical confidence value found in response: '{confidence_text}'")
                        except Exception as cs_err:
                            logger.warning(
                                f"Error parsing confidence score: {cs_err}")
                    except Exception as conf_err:
                        logger.warning(
                            f"Error getting confidence assessment: {conf_err}")

                    # Create issue with position information and enhanced confidence
                    issue = ComplianceIssue(
                        id=self._generate_issue_id(),
                        clinical_text=llm_issue.clinical_text,
                        compliance_text=llm_issue.compliance_text,
                        explanation=llm_issue.explanation,
                        suggested_edit=llm_issue.suggested_edit,
                        confidence=confidence_score,
                        regulation=llm_issue.regulation,
                        clinical_text_start_char=clinical_start,
                        clinical_text_end_char=clinical_end,
                        compliance_text_start_char=compliance_start,
                        compliance_text_end_char=compliance_end,
                        metadata={
                            "chunk_pair": f"{clinical_chunk_offset}:{compliance_chunk_offset}"}
                    )
                    issues.append(issue)

                return issues

            except Exception as parsing_err:
                logger.error(
                    f"Error parsing LLM response: {parsing_err}\nResponse: {response_content}")
                return []

        except Exception as e:
            logger.error(f"LLM invocation error: {str(e)}")
            return []

    async def apply_suggestion(self, clinical_text: str, suggested_edit: str, surrounding_context: str, edit_type: str = "modification") -> str:
        """
        Applies a suggested edit using an LLM for intelligent integration.

        Args:
            clinical_text: The original non-compliant text
            suggested_edit: The suggested edit to apply
            surrounding_context: Context around the text to help with integration
            edit_type: Type of edit - 'modification' or 'insertion'

        Returns:
            The revised text after applying the suggestion
        """
        # Check if this is an insertion request
        if edit_type.lower() == "insertion":
            return await self._apply_insertion(clinical_text, suggested_edit, surrounding_context)

        # Regular modification case
        try:
            # Use the centralized system prompt and generate the human prompt
            system_prompt = APPLY_SUGGESTION_SYSTEM_PROMPT
            human_prompt = get_apply_suggestion_human_prompt(
                clinical_text, suggested_edit, surrounding_context)

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]

            # Call OpenAI API
            response = await self.llm_client.ainvoke(messages)
            revised_text = response.content.strip()

            # Ensure we're not getting something unrelated like "I'll apply the suggested edit..."
            if len(revised_text) > 3 * len(clinical_text):
                logger.warning(
                    f"Revised text suspiciously long ({len(revised_text)} chars vs {len(clinical_text)} original)")
                # Try to extract just the edited text if it looks like we got extra info
                if "```" in revised_text:
                    # Extract code block if present
                    parts = revised_text.split("```")
                    if len(parts) >= 3:  # We have at least one code block
                        revised_text = parts[1].strip()
                        # Remove language identifier if present
                        if revised_text.split('\n', 1)[0].strip().isalpha():
                            revised_text = revised_text.split('\n', 1)[
                                1].strip()

            return revised_text

        except Exception as e:
            logger.error(f"Error applying suggestion: {str(e)}")
            # Return the suggested edit as fallback if processing fails
            return suggested_edit

    async def _apply_insertion(self, target_text: str, content_to_insert: str, surrounding_context: str) -> str:
        """
        Creates new content to be inserted based on the suggested edit.

        This handles cases where entirely new sections need to be added rather than
        modifying existing text. The LLM is prompted to create properly formatted content
        that can be inserted at the appropriate location.

        Args:
            target_text: The text near where content should be inserted (reference point)
            content_to_insert: Description of what content should be inserted
            surrounding_context: Context from the document to help with proper formatting

        Returns:
            Formatted content ready to be inserted
        """
        try:
            # Use the prompts from the centralized prompts.py file
            system_prompt = INSERTION_CONTENT_SYSTEM_PROMPT
            human_prompt = get_insertion_content_human_prompt(
                target_text, content_to_insert, surrounding_context)

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]

            # Call OpenAI API
            response = await self.llm_client.ainvoke(messages)
            new_content = response.content.strip()

            # Clean up any markdown or commentary
            if "```" in new_content:
                # Extract content from code block if present
                parts = new_content.split("```")
                if len(parts) >= 3:  # We have at least one code block
                    new_content = parts[1].strip()
                    # Remove language identifier if present
                    if new_content.split('\n', 1)[0].strip().isalpha():
                        new_content = new_content.split('\n', 1)[1].strip()

            return new_content

        except Exception as e:
            logger.error(f"Error creating insertion content: {str(e)}")
            # Return a basic formatted version of the suggested content as fallback
            return f"\n\n{content_to_insert.strip()}\n\n"
