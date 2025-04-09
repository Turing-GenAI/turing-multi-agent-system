import json
import logging
import uuid
from typing import List

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import AzureChatOpenAI, ChatOpenAI
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
                # Removed azure_region parameter as it's not supported
            )
            logger.info("Using Azure OpenAI client")
        else:
            self.llm_client = ChatOpenAI(
                model=settings.OPENAI_MODEL_NAME,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.0
            )
            logger.info("Using standard OpenAI client")

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )

    async def analyze_compliance(self, review_input: ComplianceReviewInput) -> List[ComplianceIssue]:
        """
        Analyze clinical trial documents for compliance issues.

        Args:
            review_input: The compliance review input containing document content

        Returns:
            List of compliance issues found
        """
        # Get document content
        clinical_doc_content = review_input.clinical_doc_content
        compliance_doc_content = review_input.compliance_doc_content

        # Split documents into manageable chunks
        clinical_chunks = self.text_splitter.split_text(clinical_doc_content)
        compliance_chunks = self.text_splitter.split_text(
            compliance_doc_content)

        # Process each chunk pair and collect compliance issues
        all_compliance_issues = []

        # Process a limited combination to optimize API calls
        max_chunks_to_process = min(
            len(clinical_chunks), 3)  # Process max 3 chunks

        for i in range(max_chunks_to_process):
            clinical_chunk = clinical_chunks[i] if i < len(
                clinical_chunks) else ""

            # For each clinical chunk, check against most relevant compliance chunks
            # Check against max 2 compliance chunks
            for j in range(min(len(compliance_chunks), 2)):
                compliance_chunk = compliance_chunks[j]

                # Get issues for this chunk pair
                chunk_issues = await self._analyze_chunk_pair(clinical_chunk, compliance_chunk)
                all_compliance_issues.extend(chunk_issues)

        return all_compliance_issues

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
        Analyze a pair of document chunks for compliance issues.

        Args:
            clinical_chunk: The clinical document chunk
            compliance_chunk: The compliance document chunk

        Returns:
            List of compliance issues found in this chunk pair
        """
        # Create prompt for compliance analysis
        system_prompt = """You are an expert in clinical trial documentation and regulatory compliance. 
        Your task is to identify sections in clinical trial documents that may violate compliance standards.
        
        For each compliance issue identified, provide:
        1. The exact text from the clinical trial document that violates compliance (word/sentence/paragraph level)
        2. The exact text from the compliance document that is being violated (word/sentence/paragraph level)
        3. A 50-100 word explanation of why this is a violation
        4. A suggested edit to fix the compliance issue
        5. Your confidence in this finding (high or low)
        6. The specific regulation being violated (e.g., 21 CFR § 801.109)
        
        Format your response as a JSON array of compliance issues. Each issue should have the following structure:
        {
            "clinical_text": "exact text from clinical document",
            "compliance_text": "exact text from compliance document",
            "explanation": "explanation of the violation",
            "suggested_edit": "suggested fix",
            "confidence": "high or low",
            "regulation": "specific regulation reference"
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
                    id=str(uuid.uuid4()),
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
