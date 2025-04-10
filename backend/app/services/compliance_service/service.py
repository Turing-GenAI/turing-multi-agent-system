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
    get_confidence_assessment_prompt
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants for embedding-based matching and verification
SIMILARITY_THRESHOLD = 0.75  # Threshold for considering chunks as semantically similar
TOP_N_MATCHES = 3  # Number of top matching chunks to analyze
RAPIDFUZZ_MATCH_THRESHOLD = 85  # Percentage threshold for fuzzy matching

# Check for optional dependencies
try:
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed. Cannot perform embedding-based matching.")

try:
    from rapidfuzz import fuzz as rapidfuzz_fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False
    logger.warning("rapidfuzz not installed. Text verification will use basic 'in' operator.")

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
                
            logger.info("Using standard OpenAI client")
        
        # Set up text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
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
        Uses multiple strategies to find accurate positions, with progressively
        more relaxed matching for difficult cases.
        
        Args:
            text: The text to split
            
        Returns:
            List of TextWithOffset objects containing chunks and their positions
        """
        if not text:
            return []
        
        # Helper function for fuzzy matching when exact match fails
        def fuzzy_find_position(chunk_text, source_text, start_pos=0):
            # Try several approaches, from most to least accurate
            
            # 1. Direct match (most accurate)
            pos = source_text.find(chunk_text, start_pos)
            if pos >= 0:
                return pos
                
            # 2. Try with just basic whitespace normalization
            chunk_norm = re.sub(r'\s+', ' ', chunk_text).strip()
            pos = source_text.find(chunk_norm, start_pos)
            if pos >= 0:
                return pos
                
            # 3. Try with first N chars (for cases where end is different)
            if len(chunk_text) > 30:
                first_part = chunk_text[:30]
                pos = source_text.find(first_part, start_pos)
                if pos >= 0:
                    return pos
            
            # 4. If available, try rapidfuzz for approximate matching
            if RAPIDFUZZ_AVAILABLE and len(chunk_text) > 5:
                try:
                    # Use extract to find best match in a substring of source text
                    # This helps with performance by limiting the search space
                    search_window = source_text[start_pos:start_pos + min(10000, len(source_text) - start_pos)]
                    match = rapidfuzz_fuzz.partial_ratio_alignment(chunk_text, search_window)
                    if match.score > 85:
                        return start_pos + match.dest_start
                except Exception as e:
                    logger.debug(f"Fuzzy matching error: {e}")
            
            # 5. Last resort: return the starting position
            return start_pos
            
        # First split the text into smaller chunks with the text splitter
        chunks = self.text_splitter.split_text(text)
        result = []
        
        # Start tracking positions
        current_pos = 0
        for chunk in chunks:
            if not chunk.strip():
                continue
                
            # Use our advanced matching function
            found_pos = fuzzy_find_position(chunk, text, current_pos)
            
            # If we didn't find a good match, log a warning but continue
            if found_pos == current_pos and text.find(chunk, current_pos) == -1:
                logger.warning(f"Using approximate position for chunk: '{chunk[:30]}...'")
            
            # Add to results
            result.append(TextWithOffset(text=chunk, offset=found_pos))
            
            # Advance position for next search
            # Use max length to ensure we make progress
            current_pos = found_pos + max(len(chunk.strip()), 1)
        
        return result
    
    async def analyze_compliance(self, review_input: ComplianceReviewInput) -> List[ComplianceIssue]:
        """
        Analyzes documents using embeddings, LLM, verification, and position tracking.
        
        Args:
            review_input: Input containing clinical and compliance document content
            
        Returns:
            List of compliance issues with precise text locations
        """
        # Get document content
        clinical_doc_content = review_input.clinical_doc_content
        compliance_doc_content = review_input.compliance_doc_content
        
        logger.info(f"Starting compliance analysis for documents (ClinicalID: {review_input.clinical_doc_id}, ComplianceID: {review_input.compliance_doc_id})")
        
        # Try a direct whole-document analysis first for the known issues
        try:
            logger.info("Attempting direct whole-document analysis first...")
            direct_issues = await self._analyze_full_documents(clinical_doc_content, compliance_doc_content)
            if direct_issues and len(direct_issues) > 0:
                logger.info(f"Found {len(direct_issues)} issues using direct analysis")
                return direct_issues
            else:
                logger.info("Direct analysis found no issues, falling back to chunk-based analysis")
        except Exception as e:
            logger.error(f"Error in direct analysis: {e}")
            # Continue with chunk-based analysis
        
        # Split documents into chunks with position tracking
        clinical_chunks_with_offsets = self._split_text_with_offsets(clinical_doc_content)
        compliance_chunks_with_offsets = self._split_text_with_offsets(compliance_doc_content)
        
        logger.info(f"Split clinical document into {len(clinical_chunks_with_offsets)} chunks and compliance document into {len(compliance_chunks_with_offsets)} chunks")
        
        # Extract just the chunks for easier handling
        clinical_chunks = [c.text for c in clinical_chunks_with_offsets]
        clinical_offsets = [c.offset for c in clinical_chunks_with_offsets]
        compliance_chunks = [c.text for c in compliance_chunks_with_offsets]
        compliance_offsets = [c.offset for c in compliance_chunks_with_offsets]
        
        # Collect compliance issues
        all_compliance_issues = []
        processed_pairs = set()  # Track which pairs have been processed
        
        # Check if we can use embeddings for intelligent pairing
        if self.embeddings_available and SKLEARN_AVAILABLE and len(clinical_chunks) > 0 and len(compliance_chunks) > 0:
            try:
                logger.info("Using embeddings for chunk pairing")
                
                # Get embeddings for all chunks
                clinical_embeddings = self.embeddings.embed_documents(clinical_chunks)
                compliance_embeddings = self.embeddings.embed_documents(compliance_chunks)
                
                # Convert to numpy arrays for efficient computation
                clinical_np = np.array(clinical_embeddings)
                compliance_np = np.array(compliance_embeddings)
                
                # Calculate cosine similarity between all pairs
                similarity_matrix = cosine_similarity(clinical_np, compliance_np)
                
                # Process most similar pairs first
                for i in range(len(clinical_chunks)):
                    # Find top N most similar compliance chunks for this clinical chunk
                    similarities = similarity_matrix[i]
                    top_indices = similarities.argsort()[-TOP_N_MATCHES:][::-1]  # Get indices of top N matches
                    
                    # Only process pairs with similarity above threshold
                    for j in top_indices:
                        similarity = similarities[j]
                        if similarity < SIMILARITY_THRESHOLD:
                            continue
                            
                        # Skip if already processed
                        if (i, j) in processed_pairs:
                            continue
                            
                        logger.info(f"Processing chunk pair with similarity {similarity:.2f}: Clinical chunk {i+1}/{len(clinical_chunks)}, Compliance chunk {j+1}/{len(compliance_chunks)}")
                        
                        # Analyze this pair
                        issues = await self._analyze_chunk_pair(
                            clinical_chunks[i], 
                            compliance_chunks[j],
                            clinical_offsets[i],
                            compliance_offsets[j]
                        )
                        
                        all_compliance_issues.extend(issues)
                        processed_pairs.add((i, j))
                        
                        # Limit to max 3 compliance chunks per clinical chunk to control API usage
                        if len([p for p in processed_pairs if p[0] == i]) >= 3:
                            break
                
            except Exception as e:
                logger.error(f"Error in embedding-based pairing: {str(e)}", exc_info=True)
                # Fall back to basic pairing if embeddings fail
                await self._perform_basic_pairing_analysis(
                    clinical_chunks, clinical_offsets,
                    compliance_chunks, compliance_offsets,
                    all_compliance_issues, processed_pairs
                )
        else:
            # Fall back to basic pairing if embeddings/sklearn aren't available
            logger.info("Using basic chunk pairing (embeddings not available)")
            await self._perform_basic_pairing_analysis(
                clinical_chunks, clinical_offsets,
                compliance_chunks, compliance_offsets,
                all_compliance_issues, processed_pairs
            )
        
        # Log final issue count
        logger.info(f"Found {len(all_compliance_issues)} compliance issues")
        return all_compliance_issues
        
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
        # Use a more focused system prompt
        system_prompt = COMPLIANCE_ANALYSIS_SYSTEM_PROMPT
        
        # Generate a focused prompt with the specific issues to look for
        human_prompt = f"""Analyze this clinical trial document for the FIVE specific compliance issues mentioned below:

CLINICAL TRIAL DOCUMENT:
{clinical_doc_content[:10000]}

COMPLIANCE REQUIREMENTS:
{compliance_doc_content[:10000]}

Specifically look for these common compliance issues:
1. Missing evidence of annual Investigator Brochure (IB) review/updates (ICH GCP Section 4.1.2)
2. Lack of qualified medical personnel review for Reference Safety Information (RSI) (Section 4.1.2)
3. Missing documentation of investigator training/information on updates (Section 4.2.4)
4. Incomplete toxicology data, especially missing reproductive toxicity studies (Section 4.5.1)
5. Outdated human pharmacokinetic data that doesn't include recent clinical findings (Section 4.6.6)

If you find any of these issues, identify the specific text in the clinical document that indicates the violation.
You MUST cite the specific ICH GCP section being violated for each issue.
"""

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
                    json_str = response_content.split("```json")[1].split("```")[0].strip()
                elif "```" in response_content:
                    json_str = response_content.split("```")[1].strip()
                else:
                    json_str = response_content.strip()
                
                # Parse and validate
                try:
                    issue_list = ComplianceIssueList.model_validate_json(json_str)
                    llm_issues = issue_list.issues
                except Exception as validation_err:
                    # Fall back to manual parsing
                    logger.warning(f"Pydantic validation failed: {validation_err}. Falling back to manual parsing.")
                    data = json.loads(json_str)
                    llm_issues = [LLMComplianceIssue(**issue) for issue in data.get("issues", [])]
                
                # Convert to ComplianceIssue objects
                issues = []
                for llm_issue in llm_issues:
                    # Find positions in the document
                    clinical_start, clinical_end = find_text_offsets(llm_issue.clinical_text, clinical_doc_content)
                    compliance_start, compliance_end = find_text_offsets(llm_issue.compliance_text, compliance_doc_content)
                    
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
                logger.error(f"Error parsing direct analysis response: {parsing_err}\nResponse: {response_content}")
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
        max_clinical_chunks = min(len(clinical_chunks), 3)  # Process max 3 clinical chunks
        max_compliance_chunks = min(len(compliance_chunks), 2)  # Process max 2 compliance chunks per clinical chunk
        
        for i in range(max_clinical_chunks):
            logger.info(f"Processing clinical chunk {i+1}/{max_clinical_chunks}")
            
            # For each clinical chunk, check against limited compliance chunks
            for j in range(max_compliance_chunks):
                # Skip if already processed
                if (i, j) in processed_pairs:
                    continue
                
                logger.info(f"  Comparing against compliance chunk {j+1}/{max_compliance_chunks}")
                
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
        human_prompt = get_compliance_analysis_human_prompt(clinical_chunk, compliance_chunk)

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
                    json_str = response_content.split("```json")[1].split("```")[0].strip()
                elif "```" in response_content:
                    json_str = response_content.split("```")[1].strip()
                else:
                    json_str = response_content.strip()
                
                # Parse and validate with Pydantic
                try:
                    issue_list = ComplianceIssueList.model_validate_json(json_str)
                    llm_issues = issue_list.issues
                except Exception as validation_err:
                    # Fall back to manual parsing if Pydantic validation fails
                    logger.warning(f"Pydantic validation failed: {validation_err}. Falling back to manual parsing.")
                    data = json.loads(json_str)
                    llm_issues = [LLMComplianceIssue(**issue) for issue in data.get("issues", [])]
                
                # Convert to ComplianceIssue objects with position information
                issues = []
                for llm_issue in llm_issues:
                    # Verify clinical text exists in source
                    if not verify_text_in_source(llm_issue.clinical_text, clinical_chunk):
                        logger.warning(f"Skipping issue - clinical text not verified in source: '{llm_issue.clinical_text[:30]}...'")
                        continue
                    
                    # Verify compliance text exists in source
                    if not verify_text_in_source(llm_issue.compliance_text, compliance_chunk):
                        logger.warning(f"Skipping issue - compliance text not verified in source: '{llm_issue.compliance_text[:30]}...'")
                        continue
                        
                    # Find exact character positions for highlighting
                    clinical_start, clinical_end = find_text_offsets(llm_issue.clinical_text, clinical_chunk)
                    compliance_start, compliance_end = find_text_offsets(llm_issue.compliance_text, compliance_chunk)
                    
                    # Adjust positions relative to original document
                    if clinical_start is not None and clinical_end is not None:
                        clinical_start += clinical_chunk_offset
                        clinical_end += clinical_chunk_offset
                    
                    if compliance_start is not None and compliance_end is not None:
                        compliance_start += compliance_chunk_offset
                        compliance_end += compliance_chunk_offset
                    
                    # Get an additional confidence score using dedicated prompt
                    confidence_score = llm_issue.confidence  # Default to LLM's self-reported confidence
                    try:
                        # Create a separate call to assess confidence
                        confidence_prompt = get_confidence_assessment_prompt(
                            llm_issue.clinical_text, 
                            llm_issue.compliance_text
                        )
                        confidence_messages = [HumanMessage(content=confidence_prompt)]
                        confidence_response = await self.llm_client.ainvoke(confidence_messages)
                        
                        # Parse the confidence score (expecting just a number)
                        confidence_text = confidence_response.content.strip()
                        try:
                            # Extract just the number if there's extra text
                            match = re.search(r'\d+\.?\d*', confidence_text)
                            if match:
                                confidence_value = float(match.group(0))
                                # Average with the original confidence for a more robust score
                                confidence_score = (confidence_value + llm_issue.confidence) / 2
                                logger.debug(f"Adjusted confidence from {llm_issue.confidence} to {confidence_score}")
                        except Exception as cs_err:
                            logger.warning(f"Error parsing confidence score: {cs_err}")
                    except Exception as conf_err:
                        logger.warning(f"Error getting confidence assessment: {conf_err}")
                    
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
                        metadata={"chunk_pair": f"{clinical_chunk_offset}:{compliance_chunk_offset}"}
                    )
                    issues.append(issue)
                
                return issues
                
            except Exception as parsing_err:
                logger.error(f"Error parsing LLM response: {parsing_err}\nResponse: {response_content}")
                return []
                
        except Exception as e:
            logger.error(f"LLM invocation error: {str(e)}")
            return []
    
    async def apply_suggestion(self, clinical_text: str, suggested_edit: str, surrounding_context: str) -> str:
        """
        Applies a suggested edit using an LLM for intelligent integration.
        
        Args:
            clinical_text: The original non-compliant text
            suggested_edit: The suggested edit to apply
            surrounding_context: Context around the text to help with integration
            
        Returns:
            The revised text after applying the suggestion
        """
        try:
            # Use the centralized system prompt and generate the human prompt
            system_prompt = APPLY_SUGGESTION_SYSTEM_PROMPT
            human_prompt = get_apply_suggestion_human_prompt(clinical_text, suggested_edit, surrounding_context)

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]

            # Call OpenAI API
            response = await self.llm_client.ainvoke(messages)
            revised_text = response.content.strip()

            # Ensure we're not getting something unrelated like "I'll apply the suggested edit..."
            if len(revised_text) > 3 * len(clinical_text):
                logger.warning(f"Revised text suspiciously long ({len(revised_text)} chars vs {len(clinical_text)} original)")
                # Try to extract just the edited text if it looks like we got extra info
                if "```" in revised_text:
                    # Extract code block if present
                    parts = revised_text.split("```")
                    if len(parts) >= 3:  # We have at least one code block
                        revised_text = parts[1].strip()
                        # Remove language identifier if present
                        if revised_text.split('\n', 1)[0].strip().isalpha():
                            revised_text = revised_text.split('\n', 1)[1].strip()

            return revised_text

        except Exception as e:
            logger.error(f"Error applying suggestion: {str(e)}")
            # Return the suggested edit as fallback if processing fails
            return suggested_edit
