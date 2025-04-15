"""
Document Matcher Service - Core Implementation

This service analyzes clinical documents and automatically selects the most relevant
compliance document based on semantic similarity and regulatory content matching.
"""

import logging
from typing import List, Dict, Optional, Tuple
from uuid import UUID
import re

# Math/similarity libraries
try:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning(
        "scikit-learn not installed. Using basic similarity matching.")

# LangChain components
from langchain_openai import AzureChatOpenAI, ChatOpenAI, AzureOpenAIEmbeddings, OpenAIEmbeddings

# Local application imports
from app.core.config import settings
from app.services.compliance_service.chunking import AgenticChunker
from app.services.document_service import document_service
from app.models.document import Document
from app.services.document_matcher_service.prompts import (
    DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
    get_document_analysis_prompt
)

# Configure logging
logger = logging.getLogger(__name__)

# Constants for similarity matching
# Threshold for considering documents as semantically similar
SIMILARITY_THRESHOLD = 0.70


class DocumentMatcher:
    """
    Service for automatically matching clinical trial documents to relevant compliance documents
    based on content analysis and semantic similarity.
    """

    def __init__(self):
        """Initialize the document matcher with necessary components."""
        # Use the existing AgenticChunker for semantic document understanding
        self.chunker = AgenticChunker()
        # Cache of analyzed compliance documents to improve performance
        self.compliance_cache = {}

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
                logger.info(
                    "Using Azure OpenAI embeddings for document matching")
            except Exception as e:
                logger.warning(f"Failed to initialize Azure embeddings: {e}")
                self.embeddings_available = False
        else:
            # Standard OpenAI
            self.llm_client = ChatOpenAI(
                model=settings.OPENAI_MODEL_NAME,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.0
            )

            try:
                self.embeddings = OpenAIEmbeddings(
                    model="text-embedding-ada-002",
                    openai_api_key=settings.OPENAI_API_KEY
                )
                self.embeddings_available = True
                logger.info("Using OpenAI embeddings for document matching")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI embeddings: {e}")
                self.embeddings_available = False

    async def find_matching_compliance_document(self, clinical_doc_id: str) -> Optional[str]:
        """
        Find the most relevant compliance document for a given clinical document.

        Args:
            clinical_doc_id: ID of the clinical document to analyze

        Returns:
            ID of the best matching compliance document, or None if no match found
        """
        try:
            # Get the clinical document content
            clinical_doc_content = document_service.get_document_content(
                clinical_doc_id)
            if not clinical_doc_content:
                logger.error(
                    f"Clinical document not found or has no content: {clinical_doc_id}")
                return None

            # Get clinical document metadata for document object
            all_docs = document_service.list_documents()
            clinical_doc_metadata = next(
                (doc for doc in all_docs if doc["id"] == clinical_doc_id), None)

            if not clinical_doc_metadata:
                logger.error(
                    f"Clinical document metadata not found: {clinical_doc_id}")
                return None

            # Create a Document object for analysis
            clinical_doc = Document(
                id=clinical_doc_id,
                content=clinical_doc_content,
                title=clinical_doc_metadata.get("title", ""),
                type="clinical"
            )

            # Get all available compliance documents
            compliance_docs = document_service.list_documents(
                doc_type="compliance")
            if not compliance_docs:
                logger.warning(
                    "No compliance documents available for matching")
                return None

            # Convert to Document objects with content
            compliance_doc_objects = []
            for doc_metadata in compliance_docs:
                try:
                    doc_content = document_service.get_document_content(
                        doc_metadata["id"])
                    doc_obj = Document(
                        id=doc_metadata["id"],
                        content=doc_content,
                        title=doc_metadata.get("title", ""),
                        type="compliance"
                    )
                    compliance_doc_objects.append(doc_obj)
                except Exception as e:
                    logger.warning(
                        f"Could not load content for document {doc_metadata['id']}: {e}")

            # Analyze the clinical document to extract key concepts and requirements
            clinical_concepts = await self._analyze_document_content(clinical_doc)

            # Find the best matching compliance document
            best_match_id, score = await self._find_best_match(clinical_concepts, compliance_doc_objects)

            logger.info(
                f"Selected compliance document {best_match_id} with score {score:.2f} for clinical document {clinical_doc_id}")
            return best_match_id

        except Exception as e:
            logger.error(f"Error finding matching compliance document: {e}")
            # Return the first available compliance document as a fallback
            try:
                compliance_docs = document_service.list_documents(
                    doc_type="compliance")
                if compliance_docs:
                    logger.info(
                        f"Using fallback compliance document: {compliance_docs[0]['id']}")
                    return str(compliance_docs[0]["id"])
            except Exception as fallback_error:
                logger.error(
                    f"Error with fallback compliance document: {fallback_error}")
            return None

    async def _analyze_document_content(self, document: Document) -> Dict:
        """
        Analyze document content to extract key concepts, requirements, and regulatory domains.

        Args:
            document: The document to analyze

        Returns:
            Dictionary of extracted concepts and features
        """
        try:
            # First, check for explicit document references
            compliance_doc_reference = self._find_explicit_reference(
                document.content)

            # Use the AgenticChunker to split the document into semantic chunks
            chunks = self.chunker.split_text(document.content)

            # Generate embeddings if available
            if self.embeddings_available:
                # Calculate embeddings for document chunks
                chunk_embeddings = self.embeddings.embed_documents(chunks)

                # Average the chunk embeddings to get document-level embedding
                if chunk_embeddings:
                    doc_embedding = np.mean(chunk_embeddings, axis=0)

                    return {
                        "document_id": str(document.id),
                        "chunks": chunks,
                        "embedding": doc_embedding,
                        "concepts": [],  # Will be populated in future implementation
                        "compliance_doc_reference": compliance_doc_reference
                    }

            # Fallback if embeddings aren't available
            return {
                "document_id": str(document.id),
                "chunks": chunks,
                "concepts": [],  # Will be populated in future implementation
                "compliance_doc_reference": compliance_doc_reference
            }
        except Exception as e:
            logger.error(f"Error analyzing document content: {e}")
            return {"document_id": str(document.id), "concepts": []}

    def _find_explicit_reference(self, content: str) -> Optional[str]:
        """
        Find explicit references to compliance documents in the text.

        Args:
            content: The document content to search

        Returns:
            The referenced compliance document ID if found, None otherwise
        """
        # Simple pattern matching to find references like "compliance document comp_1.txt"
        import re

        # Look for patterns like "compliance document comp_X" or similar
        patterns = [
            r"compliance\s+document\s+(comp_\d+)\.txt",
            r"compliance\s+document\s+(comp_\d+)",
            r"document\s+(comp_\d+)\.txt",
            r"refer\s+to\s+(comp_\d+)\.txt"
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                # Extract the document identifier (e.g., "comp_1")
                doc_id = match.group(1)
                logger.info(
                    f"Found explicit reference to compliance document: {doc_id}")
                return doc_id

        return None

    async def _find_best_match(self, clinical_concepts: Dict, compliance_docs: List[Document]) -> Tuple[str, float]:
        """
        Find the best matching compliance document based on similarity to clinical document.

        Args:
            clinical_concepts: Extracted concepts from clinical document
            compliance_docs: List of available compliance documents (as Document objects)

        Returns:
            Tuple of (best_match_id, similarity_score)
        """
        try:
            # Check for explicit reference first - this overrides embedding similarity
            if "compliance_doc_reference" in clinical_concepts and clinical_concepts["compliance_doc_reference"]:
                # Find the compliance document with this ID
                reference_id = clinical_concepts["compliance_doc_reference"]
                for doc in compliance_docs:
                    # Check for IDs like COMP_001, COMP_002, etc. that match our reference (comp_1, comp_2, etc.)
                    doc_number = re.search(r'COMP_0+(\d+)', doc.id)
                    ref_number = re.search(r'comp_(\d+)', reference_id)

                    if doc_number and ref_number and doc_number.group(1) == ref_number.group(1):
                        logger.info(
                            f"Using explicitly referenced compliance document: {doc.id} (matched {reference_id})")
                        # Perfect confidence score for explicit references
                        return str(doc.id), 1.0

                # If we couldn't find the referenced document, log warning and fall back to similarity
                logger.warning(
                    f"Referenced compliance document {reference_id} not found, falling back to similarity matching")

            # Fall back to embedding similarity matching if no explicit reference or reference not found
            if not self.embeddings_available or not SKLEARN_AVAILABLE or "embedding" not in clinical_concepts:
                # Fall back to first document if we can't do embedding comparison
                if compliance_docs:
                    return str(compliance_docs[0].id), 1.0
                return None, 0.0

            best_match_id = None
            highest_score = -1.0

            # Compare the clinical document embedding against each compliance document
            for doc in compliance_docs:
                # Get or compute compliance doc embedding
                if str(doc.id) not in self.compliance_cache:
                    self.compliance_cache[str(doc.id)] = await self._analyze_document_content(doc)

                compliance_data = self.compliance_cache[str(doc.id)]

                # Skip if this compliance doc doesn't have embeddings
                if "embedding" not in compliance_data:
                    continue

                # Calculate cosine similarity
                clinical_embedding = clinical_concepts["embedding"].reshape(
                    1, -1)
                compliance_embedding = compliance_data["embedding"].reshape(
                    1, -1)

                similarity = cosine_similarity(
                    clinical_embedding, compliance_embedding)[0][0]

                # Update best match if this score is higher
                if similarity > highest_score:
                    highest_score = similarity
                    best_match_id = str(doc.id)

            # If we found a good match above threshold, return it
            if best_match_id and highest_score >= SIMILARITY_THRESHOLD:
                return best_match_id, highest_score

            # Otherwise default to first document as fallback
            if compliance_docs:
                return str(compliance_docs[0].id), highest_score if highest_score > -1 else 0.0

            return None, 0.0

        except Exception as e:
            logger.error(f"Error in finding best match: {e}")
            # Fall back to first compliance document
            if compliance_docs:
                return str(compliance_docs[0].id), 0.0
            return None, 0.0


# Create singleton instance
document_matcher = DocumentMatcher()


async def get_matching_compliance_document(clinical_doc_id: str) -> Optional[str]:
    """
    Public interface to find a matching compliance document for a clinical document.

    Args:
        clinical_doc_id: ID of the clinical document

    Returns:
        ID of the best matching compliance document
    """
    return await document_matcher.find_matching_compliance_document(clinical_doc_id)
