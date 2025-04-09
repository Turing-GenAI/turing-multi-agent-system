import json
import logging
import re
import uuid
from typing import List, Dict, Any, Optional, Tuple
import threading
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import AzureChatOpenAI, ChatOpenAI, OpenAIEmbeddings
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings
from app.models.compliance import ComplianceIssue, ComplianceReviewInput

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ComplianceService:
    """
    Service for analyzing clinical trial documents for compliance issues.
    """
    
    # Counter for generating sequential issue IDs (always start from 1)
    _issue_counter = 1
    _counter_lock = threading.Lock()

    def __init__(self):
        """Initialize the compliance service with appropriate OpenAI client (Azure or standard)."""
        if settings.USE_AZURE_OPENAI:
            self.llm_client = AzureChatOpenAI(
                model=settings.AZURE_OPENAI_API_MODEL_NAME,
                azure_deployment=settings.AZURE_OPENAI_API_DEPLOYMENT_NAME,
                api_version=settings.AZURE_OPENAI_API_MODEL_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_API_ENDPOINT,
                azure_ad_token_provider=None,
                api_key=settings.AZURE_OPENAI_API_KEY,
                temperature=0.0
            )
            
            # Initialize embeddings client for text similarity
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-ada-002",  # Use appropriate model
                azure_deployment="text-embedding-ada-002",  # Your Azure deployment name
                api_version=settings.AZURE_OPENAI_API_MODEL_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_API_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY
            )
            logger.info("Using Azure OpenAI client and embeddings")
        else:
            self.llm_client = ChatOpenAI(
                model=settings.OPENAI_MODEL_NAME,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.0
            )
            
            # Initialize embeddings client for text similarity
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-ada-002",
                api_key=settings.OPENAI_API_KEY
            )
            logger.info("Using standard OpenAI client and embeddings")

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
        # Track full document texts for verification
        self.clinical_doc_full_text = ""
        self.compliance_doc_full_text = ""
        
    def _generate_issue_id(self) -> str:
        """Generate a short, sequential issue ID in the format R-00000."""
        with self._counter_lock:
            self._issue_counter += 1
            return f"R-{self._issue_counter:05d}"
            
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings using fuzzy matching."""
        if not text1 or not text2:
            return 0.0
            
        # Use fuzzy ratio for initial similarity check
        ratio = fuzz.ratio(text1.lower(), text2.lower()) / 100.0
        
        # For longer texts, also use token sort ratio which handles word order differences
        if len(text1) > 20 and len(text2) > 20:
            token_sort = fuzz.token_sort_ratio(text1.lower(), text2.lower()) / 100.0
            return (ratio + token_sort) / 2
        
        return ratio
        
    def _verify_text_presence(self, text: str, document: str) -> bool:
        """Verify that the text actually exists in the document."""
        if not text or not document:
            return False
            
        # Try exact match first
        if text in document:
            return True
            
        # If not exact match, try fuzzy matching with high threshold
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        cleaned_doc = re.sub(r'\s+', ' ', document).strip()
        similarity = self._calculate_text_similarity(cleaned_text, cleaned_doc)
        
        return similarity > 0.85  # High threshold to ensure accurate matches
        
    def _get_llm_confidence_assessment(self, clinical_text: str, compliance_text: str) -> float:
        """Get LLM's assessment of confidence in this violation."""
        try:
            prompt = f"""On a scale of 0 to 1, assess how confident you are that this clinical trial text:
            \"{clinical_text}\"  
            directly violates this compliance requirement: 
            \"{compliance_text}\"
            
            Output ONLY a number between 0 and 1 representing your confidence. Higher values indicate higher confidence.
            """
            
            response = self.llm_client.invoke(prompt)
            confidence_str = response.content.strip()
            
            # Extract numeric value using regex
            match = re.search(r'(0\.\d+|1\.0|1|0)', confidence_str)
            if match:
                return float(match.group(1))
            else:
                # Default to moderate confidence if parsing fails
                return 0.5
                
        except Exception as e:
            logger.error(f"Error getting LLM confidence assessment: {str(e)}")
            return 0.5  # Default to moderate confidence
            
    def calculate_confidence_score(self, clinical_text: str, compliance_text: str, explanation: str) -> str:
        """Calculate an evidence-based confidence score based on multiple factors."""
        # Initialize score
        score = 0.0
        factors = {}
        
        # Factor 1: Exact text match with compliance document (30%)
        if len(compliance_text) > 10 and compliance_text in self.compliance_doc_full_text:
            score += 0.3
            factors["exact_compliance_match"] = 0.3
        else:
            # Partial credit for fuzzy match
            similarity = self._calculate_text_similarity(compliance_text, self.compliance_doc_full_text)
            partial_score = similarity * 0.3
            score += partial_score
            factors["fuzzy_compliance_match"] = partial_score
        
        # Factor 2: Specific regulation citation (20%)
        if re.search(r'\b\d+\s*CFR\s*[§]?\s*\d+\.\d+\b', explanation) or \
           re.search(r'\bICH\s+[A-Z]\d+\b', explanation):
            score += 0.2
            factors["regulation_citation"] = 0.2
        
        # Factor 3: Contextual relevance using text similarity (25%)
        similarity = self._calculate_text_similarity(clinical_text, compliance_text)
        relevance_score = similarity * 0.25
        score += relevance_score
        factors["contextual_relevance"] = relevance_score
        
        # Factor 4: LLM's own confidence assessment (25%)
        llm_confidence = self._get_llm_confidence_assessment(clinical_text, compliance_text)
        llm_score = llm_confidence * 0.25
        score += llm_score
        factors["llm_confidence"] = llm_score
        
        # Log detailed scoring factors
        logger.info(f"Confidence score details: {factors}, total: {score:.2f}")
        
        # Return final confidence level (high or low)
        return "high" if score >= 0.6 else "low"

    async def analyze_compliance(self, review_input: ComplianceReviewInput) -> List[ComplianceIssue]:
        """
        Analyze clinical trial documents for compliance issues using enhanced verification.

        Args:
            review_input: The compliance review input containing document content

        Returns:
            List of compliance issues found with verified confidence scores
        """
        # Get document content and store for verification
        clinical_doc_content = review_input.clinical_doc_content
        compliance_doc_content = review_input.compliance_doc_content
        
        # Store full document texts for verification purposes
        self.clinical_doc_full_text = clinical_doc_content
        self.compliance_doc_full_text = compliance_doc_content
        
        logger.info(f"Starting compliance analysis for documents (ClinicalID: {review_input.clinical_doc_id}, ComplianceID: {review_input.compliance_doc_id})")

        # Split documents into manageable chunks
        clinical_chunks = self.text_splitter.split_text(clinical_doc_content)
        compliance_chunks = self.text_splitter.split_text(compliance_doc_content)
        
        logger.info(f"Split clinical document into {len(clinical_chunks)} chunks and compliance document into {len(compliance_chunks)} chunks")

        # Process each chunk pair and collect potential compliance issues
        potential_issues = []

        # Process a subset of chunks to optimize API calls
        max_clinical_chunks = min(len(clinical_chunks), 3)  # Process max 3 clinical chunks
        max_compliance_chunks = min(len(compliance_chunks), 2)  # Process max 2 compliance chunks

        for i in range(max_clinical_chunks):
            clinical_chunk = clinical_chunks[i]
            logger.info(f"Processing clinical chunk {i+1}/{max_clinical_chunks} ({len(clinical_chunk)} chars)")

            # For each clinical chunk, check against most relevant compliance chunks
            for j in range(max_compliance_chunks):
                compliance_chunk = compliance_chunks[j]
                logger.info(f"  Comparing against compliance chunk {j+1}/{max_compliance_chunks} ({len(compliance_chunk)} chars)")

                # Get issues for this chunk pair
                chunk_issues = await self._analyze_chunk_pair(clinical_chunk, compliance_chunk)
                potential_issues.extend(chunk_issues)
                
        # Verify and enhance each issue with evidence-based confidence scoring
        verified_issues = []
        for issue in potential_issues:
            # Verify that the clinical text actually exists in the document
            if self._verify_text_presence(issue.clinical_text, clinical_doc_content):
                # Calculate evidence-based confidence score
                original_confidence = issue.confidence
                issue.confidence = self.calculate_confidence_score(
                    issue.clinical_text, 
                    issue.compliance_text, 
                    issue.explanation
                )
                
                # Log confidence adjustments
                if original_confidence != issue.confidence:
                    logger.info(f"Adjusted confidence for issue {issue.id} from {original_confidence} to {issue.confidence}")
                
                # Only include verified issues
                verified_issues.append(issue)
            else:
                logger.warning(f"Rejected issue {issue.id} - clinical text not found in document")

        # Log final issue count
        logger.info(f"Found {len(verified_issues)} verified compliance issues from {len(potential_issues)} candidates")
        return verified_issues

    async def apply_suggestion(self, clinical_text: str, suggested_edit: str, surrounding_context: str) -> str:
        """
        Apply a suggested edit to non-compliant text using AI to intelligently integrate the change.

        Args:
            clinical_text: The original non-compliant text
            suggested_edit: The suggested edit to apply
            surrounding_context: Context around the text to help with integration

        Returns:
            The revised text after applying the suggestion
        """
        try:
            # Create prompt for intelligent edit application
            system_prompt = """You are an expert medical editor specializing in clinical trial documentation.
            Your task is to intelligently apply a suggested edit to a non-compliant section of text.
            
            Consider the context, terminology, grammar, and flow when applying the edit.
            Make only necessary changes that address the compliance issue while preserving the document's tone and style.
            
            Return ONLY the revised text that would replace the original non-compliant text.
            Do not include any explanation, commentary, or anything other than the revised text itself.
            """

            human_prompt = f"""Original non-compliant text:
            ---
            {clinical_text}
            ---
            
            Surrounding context:
            ---
            {surrounding_context}
            ---
            
            Suggested edit:
            ---
            {suggested_edit}
            ---
            
            Apply this edit intelligently and return only the revised text that should replace the original.
            """

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]

            # Call OpenAI API (Azure or standard)
            response = await self.llm_client.ainvoke(messages)
            revised_text = response.content.strip()

            logger.info(
                f"Successfully applied suggestion to text: {clinical_text[:50]}...")

            return revised_text

        except Exception as e:
            logger.error(f"Error applying suggestion: {str(e)}")
            # Return the suggested edit as fallback if processing fails
            return suggested_edit

    async def _analyze_chunk_pair(self, clinical_chunk: str, compliance_chunk: str) -> List[ComplianceIssue]:
        """
        Analyze a pair of document chunks for compliance issues with improved accuracy.

        Args:
            clinical_chunk: The clinical document chunk
            compliance_chunk: The compliance document chunk

        Returns:
            List of compliance issues found in this chunk pair with enhanced detail
        """
        # Create enhanced prompt for more accurate compliance analysis
        system_prompt = """You are an expert regulatory compliance analyst for clinical trials with deep knowledge of FDA, ICH, and other relevant regulations.

ANALYSIS TASK:
Compare the CLINICAL TRIAL DOCUMENT section with the COMPLIANCE DOCUMENT section to identify specific instances where the clinical document violates the compliance requirements.

IDENTIFICATION REQUIREMENTS:
1. You MUST identify SPECIFIC, EXACT text at word/sentence level - no paraphrasing
2. Each identified non-compliant section must have a DIRECT, CLEAR relationship to a specific section in the compliance document
3. Only identify GENUINE compliance issues - if none exist, return an empty array

SCORING CRITERIA (use these to determine confidence):
- HIGH confidence: Clear violation of explicitly stated regulation with direct conflict
- LOW confidence: Potential issues, implicit violations, or when multiple interpretations exist

OUTPUT GUIDELINES:
1. Be PRECISE - use EXACT quotes from both documents
2. Include SPECIFIC regulation citations (e.g., 21 CFR § 801.109, ICH E6 4.1.3)
3. Suggest SPECIFIC corrective edits that would resolve the compliance issue
4. Flag MATERIAL violations only (avoid insignificant formatting/wording issues)

OUTPUT FORMAT:
A JSON array of compliance issues with this structure:
{
    "clinical_text": "EXACT text from clinical document that violates compliance",
    "compliance_text": "EXACT text from compliance document being violated",
    "explanation": "50-100 word explanation with SPECIFIC regulation citation",
    "suggested_edit": "Specific changes to make the text compliant",
    "confidence": "high or low based on scoring criteria",
    "regulation": "specific regulation reference with section and paragraph"
}

If no compliance issues are found, return an empty array []
        """

        human_prompt = f"""Analyze the following clinical trial document section for compliance issues against the provided regulatory document section:
        
        CLINICAL TRIAL DOCUMENT SECTION:
        {clinical_chunk}
        
        COMPLIANCE DOCUMENT SECTION:
        {compliance_chunk}
        """

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]

        # Call OpenAI API (Azure or standard)
        response = await self.llm_client.ainvoke(messages)
        response_content = response.content

        # Parse response to extract compliance issues
        issues = []
        try:
            # Handle cases where response might contain markdown code blocks
            if "```json" in response_content:
                json_str = response_content.split(
                    "```json")[1].split("```")[0].strip()
            elif "```" in response_content:
                json_str = response_content.split("```")[1].strip()
            else:
                json_str = response_content.strip()

            issue_dicts = json.loads(json_str)

            # Convert to ComplianceIssue objects
            for issue_dict in issue_dicts:
                issue = ComplianceIssue(
                    id=self._generate_issue_id(),
                    clinical_text=issue_dict.get("clinical_text", ""),
                    compliance_text=issue_dict.get("compliance_text", ""),
                    explanation=issue_dict.get("explanation", ""),
                    suggested_edit=issue_dict.get("suggested_edit", ""),
                    confidence=issue_dict.get("confidence", "low"),
                    regulation=issue_dict.get("regulation", "")
                )
                issues.append(issue)

        except Exception as e:
            logger.error(
                f"Error parsing LLM response: {str(e)}\nResponse: {response_content}")

        return issues


# Create service instance
compliance_service = ComplianceService()
