import json
import logging
import uuid
from typing import List, Optional, Dict, Any
import base64
import os
import tempfile

from google import genai
from pydantic import BaseModel, Field
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.models.compliance import ComplianceIssue, ComplianceReviewInput

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ComplianceIssueSchema(BaseModel):
    """Schema for structured output from Gemini API."""
    clinical_text: str = Field(description="The exact text from clinical document that violates compliance")
    compliance_text: str = Field(description="The exact text from compliance document that is being violated")
    explanation: str = Field(description="A 50-100 word explanation of why this is a violation")
    suggested_edit: str = Field(description="A suggested edit to fix the compliance issue")
    confidence: str = Field(description="Confidence in this finding - high or low")
    regulation: str = Field(description="The specific regulation being violated")


class GeminiService:
    """
    Service for analyzing clinical trial documents for compliance issues using Google's Gemini model.
    """

    def __init__(self):
        """Initialize the Gemini service with the Google AI client."""
        # Create a client
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        
        # Define the model to use
        self.model_id = settings.GEMINI_MODEL_NAME
        
        # Text splitter for chunking documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )

    async def analyze_compliance(self, review_input: ComplianceReviewInput) -> List[ComplianceIssue]:
        """
        Analyze clinical trial documents for compliance issues using Gemini API.

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
        compliance_chunks = self.text_splitter.split_text(compliance_doc_content)

        # Process each chunk pair and collect compliance issues
        all_compliance_issues = []

        # Process a limited combination to optimize API calls
        max_chunks_to_process = min(len(clinical_chunks), 3)  # Process max 3 chunks

        for i in range(max_chunks_to_process):
            clinical_chunk = clinical_chunks[i] if i < len(clinical_chunks) else ""

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
        Apply a suggested edit to non-compliant text using Gemini API to intelligently integrate the change.

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
            
            IMPORTANT: Return ONLY the revised text that would replace the original non-compliant text.
            DO NOT include any explanations, reasoning, or additional comments in your response.
            DO NOT prefix your response with anything - just return the edited text itself.
            DO NOT add quotes or formatting to your response.
            """

            human_prompt = f"""
            Original non-compliant text:
            {clinical_text}
            
            Suggested edit to apply:
            {suggested_edit}
            
            Surrounding context (for reference):
            {surrounding_context}
            
            Revised text (ONLY output the final revised text, no explanations):
            """

            # Call Gemini API with strong temperature control for more deterministic output
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    {"role": "user", "parts": [system_prompt]},
                    {"role": "model", "parts": ["I understand my task."]},
                    {"role": "user", "parts": [human_prompt]}
                ],
                generation_config={
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 1024
                }
            )
            
            # Extract text from response and clean it
            revised_text = response.text.strip()
            
            # Remove any quotes that might have been added
            if revised_text.startswith('"') and revised_text.endswith('"'):
                revised_text = revised_text[1:-1]
            elif revised_text.startswith("'") and revised_text.endswith("'"):
                revised_text = revised_text[1:-1]
                
            # If the model added markdown code blocks, remove them
            if "```" in revised_text:
                code_blocks = revised_text.split("```")
                if len(code_blocks) >= 3:
                    revised_text = code_blocks[1].strip()
            
            # Simple handling for responses that begin with explanatory text
            if "Revised text:" in revised_text:
                revised_text = revised_text.split("Revised text:", 1)[1].strip()
            
            # Log the before and after for debugging
            logger.info(f"Original text: {clinical_text[:50]}...")
            logger.info(f"Suggested edit: {suggested_edit[:50]}...")
            logger.info(f"Final revised text: {revised_text[:50]}...")
            
            # If somehow we got back an empty string, use the suggested edit
            if not revised_text.strip():
                logger.warning("Got empty revised text, using suggested edit as fallback")
                return suggested_edit
                
            return revised_text

        except Exception as e:
            logger.error(f"Error applying suggestion with Gemini API: {str(e)}")
            # Return the suggested edit as fallback if processing fails
            return suggested_edit

    async def _analyze_chunk_pair(self, clinical_chunk: str, compliance_chunk: str) -> List[ComplianceIssue]:
        """
        Analyze a pair of document chunks for compliance issues using structured output from Gemini.

        Args:
            clinical_chunk: The clinical document chunk
            compliance_chunk: The compliance document chunk

        Returns:
            List of compliance issues found in this chunk pair
        """
        # Create prompt for compliance analysis
        system_prompt = """You are an expert in clinical trial documentation and regulatory compliance. 
        Your task is to thoroughly analyze clinical trial documents for potential compliance violations.
        
        IMPORTANT: Be critical and thorough in your analysis. Even minor deviations from compliance standards should be identified.
        
        For each compliance issue identified, provide:
        1. The exact text from the clinical trial document that violates compliance (word/sentence/paragraph level)
        2. The exact text from the compliance document that is being violated (word/sentence/paragraph level)
        3. A 50-100 word explanation of why this is a violation
        4. A suggested edit to fix the compliance issue
        5. Your confidence in this finding (high or low)
        6. The specific regulation being violated (e.g., 21 CFR § 801.109)
        
        If absolutely no compliance issues can be found after thorough analysis, only then return an empty array []
        """

        human_prompt = f"""Analyze the following clinical trial document section for compliance issues against the provided regulatory document section:
        
        CLINICAL TRIAL DOCUMENT SECTION:
        {clinical_chunk}
        
        COMPLIANCE DOCUMENT SECTION:
        {compliance_chunk}
        """

        # Combine prompts
        combined_prompt = f"{system_prompt}\n\n{human_prompt}"
        
        try:
            # Modify the system prompt to explicitly request JSON format
            system_prompt += """
            Format your response as a JSON array of compliance issues. Each issue should have the following structure:
            {{
                "clinical_text": "exact text from clinical document",
                "compliance_text": "exact text from compliance document",
                "explanation": "explanation of the violation",
                "suggested_edit": "suggested fix",
                "confidence": "high or low",
                "regulation": "specific regulation reference"
            }}
            
            If no compliance issues are found, return an empty array []            
            """
            
            combined_prompt = f"{system_prompt}\n\n{human_prompt}"
            
            # Call Gemini API with a regular content generation request
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=combined_prompt
            )
            
            # Parse response and convert to ComplianceIssue objects
            issues = []
            
            # Extract text from response
            response_text = response.text.strip()
            
            # Parse JSON from response
            try:
                # Log the raw response for debugging
                logger.info(f"Raw Gemini response: {response_text[:500]}...")
                
                # Handle different formats the response might come in
                json_str = ""
                
                # Case 1: Response contains markdown json code block
                if "```json" in response_text:
                    json_str = response_text.split("```json")[1].split("```")[0].strip()
                    logger.info("Found JSON in markdown code block")
                # Case 2: Response contains generic markdown code block
                elif "```" in response_text:
                    json_str = response_text.split("```")[1].strip()
                    logger.info("Found JSON in generic code block")
                # Case 3: Response itself might be JSON
                else:
                    # Try to find JSON array pattern [{ ... }] anywhere in the text
                    import re
                    json_match = re.search(r'\[\s*{.*}\s*\]', response_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                        logger.info("Found JSON using regex pattern matching")
                    else:
                        json_str = response_text.strip()
                        logger.info("Using raw response as JSON")
                
                # Add fallback for empty array handling
                if json_str == "[]" or not json_str.strip():
                    logger.warning("Empty JSON array returned - no issues found")
                    return []
                
                # Parse the JSON string into Python objects    
                issue_dicts = json.loads(json_str)
                logger.info(f"Successfully parsed JSON with {len(issue_dicts)} issues")
                
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
            except Exception as json_error:
                logger.error(f"Error parsing JSON response: {str(json_error)}\nResponse: {response_text}")
            
            return issues
            
        except Exception as e:
            logger.error(f"Error analyzing chunk pair with Gemini API: {str(e)}")
            # Return empty list if analysis fails
            return []

    async def analyze_pdf(self, pdf_path: str, prompt: str) -> Dict[str, Any]:
        """
        Analyze a PDF document using Gemini's multimodal capabilities.
        
        Args:
            pdf_path: Path to the PDF file
            prompt: Prompt describing what to extract from the PDF
            
        Returns:
            Dictionary with extracted information
        """
        try:
            # Upload the file to Gemini
            file_data = self.client.files.upload(file=pdf_path, config={'display_name': os.path.basename(pdf_path)})
            
            # Define a basic pydantic model for the output
            class PDFExtraction(BaseModel):
                content: str = Field(description="Extracted content from the PDF")
                section_headers: List[str] = Field(description="List of section headers from the PDF")
                key_points: List[str] = Field(description="Key points or insights from the PDF")
            
            # Call Gemini API with the PDF
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[prompt, file_data],
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': PDFExtraction
                }
            )
            
            # Return the parsed output
            return response.parsed.dict() if hasattr(response, 'parsed') else {"error": "Failed to parse response"}
            
        except Exception as e:
            logger.error(f"Error analyzing PDF with Gemini API: {str(e)}")
            return {"error": str(e)}
            
    async def extract_pdf_table(self, pdf_path: str, table_description: str) -> Dict[str, Any]:
        """
        Extract a table from a PDF document using Gemini.
        
        Args:
            pdf_path: Path to the PDF file
            table_description: Description of the table to extract
            
        Returns:
            Dictionary with the extracted table data
        """
        try:
            # Upload the file to Gemini
            file_data = self.client.files.upload(file=pdf_path, config={'display_name': os.path.basename(pdf_path)})
            
            # Create the prompt
            prompt = f"""
            Please extract the following table from the PDF:
            {table_description}
            
            Format the table as a JSON object with these properties:
            1. headers: Array of column headers
            2. rows: Array of rows, each containing an array of cell values
            """
            
            # Define a table extraction schema
            class TableData(BaseModel):
                headers: List[str] = Field(description="Column headers of the table")
                rows: List[List[str]] = Field(description="Rows of the table with cell values")
            
            # Call Gemini API with the PDF
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[prompt, file_data],
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': TableData
                }
            )
            
            # Return the parsed table
            return response.parsed.dict() if hasattr(response, 'parsed') else {"error": "Failed to parse table"}
            
        except Exception as e:
            logger.error(f"Error extracting table from PDF with Gemini API: {str(e)}")
            return {"error": str(e)}


# Create service instance
gemini_service = GeminiService()
