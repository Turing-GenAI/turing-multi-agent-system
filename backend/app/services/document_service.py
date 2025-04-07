import os
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import PyPDF2
from fastapi import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentService:
    """
    Service for managing document operations including listing and retrieving documents.
    """
    
    def __init__(self, documents_dir: str = None):
        """
        Initialize the document service with the directory containing documents.
        
        Args:
            documents_dir: Path to documents directory. If None, uses '../documents' relative to this file
        """
        if documents_dir is None:
            # If no directory provided, use '../documents' relative to this file
            current_file = Path(__file__)
            app_dir = current_file.parent.parent  # app directory
            base_dir = app_dir.parent  # backend directory
            self.documents_dir = os.path.join(base_dir, "documents")
        else:
            self.documents_dir = documents_dir
            
        # Ensure the documents directory exists
        if not os.path.exists(self.documents_dir):
            os.makedirs(self.documents_dir)
            logger.info(f"Created documents directory: {self.documents_dir}")
        
        # Supported file types for document processing
        self.supported_extensions = {
            '.pdf': self._extract_pdf_text,
            '.txt': self._extract_text_file,
            # Add more supported types as needed
        }
    
    def list_documents(self, doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all documents in the documents directory, optionally filtered by type.
        
        Args:
            doc_type: Optional document type filter ('clinical' or 'compliance')
            
        Returns:
            List of document metadata including id, title, type, and file path
        """
        try:
            documents = []
            
            # Walk through the documents directory
            for filename in os.listdir(self.documents_dir):
                file_path = os.path.join(self.documents_dir, filename)
                if not os.path.isfile(file_path):
                    continue
                
                # Get file extension
                _, extension = os.path.splitext(filename)
                if extension.lower() not in self.supported_extensions:
                    continue
                
                # Determine document type based on filename or content analysis
                # This is a simple heuristic - in production, use metadata or a database
                document_type = self._detect_document_type(filename, file_path)
                
                # Skip if filtering by type and this doesn't match
                if doc_type and document_type != doc_type:
                    continue
                
                # Create document metadata
                document = {
                    "id": self._generate_document_id(filename),
                    "title": self._format_document_title(filename),
                    "type": document_type,
                    "filename": filename,
                    "path": file_path,
                    "size": os.path.getsize(file_path)
                }
                
                documents.append(document)
            
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            return []
    
    def get_document_content(self, document_id: str) -> str:
        """
        Get the text content of a document by its ID.
        
        Args:
            document_id: The ID of the document to retrieve
            
        Returns:
            Document text content as string
            
        Raises:
            HTTPException: If document is not found or cannot be processed
        """
        try:
            # Find the document by ID
            documents = self.list_documents()
            document = next((doc for doc in documents if doc["id"] == document_id), None)
            
            if not document:
                raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
            
            # Get file extension
            _, extension = os.path.splitext(document["filename"])
            if extension.lower() not in self.supported_extensions:
                raise HTTPException(status_code=400, 
                                   detail=f"Unsupported file type: {extension}")
            
            # Use the appropriate extraction method
            extraction_method = self.supported_extensions[extension.lower()]
            content = extraction_method(document["path"])
            
            return content
            
        except HTTPException as e:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error retrieving document content: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from a PDF file."""
        try:
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            logger.error(f"Error extracting PDF text from {file_path}: {str(e)}")
            raise
    
    def _extract_text_file(self, file_path: str) -> str:
        """Extract text from a plain text file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as text_file:
                return text_file.read()
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise
    
    def _detect_document_type(self, filename: str, file_path: str) -> str:
        """
        Detect document type based on filename or content.
        This is a simple implementation - in production, use metadata or ML.
        """
        filename_lower = filename.lower()
        
        # Special case for the clinical document with 'guidance' in its name
        if "cct_washout" in filename_lower:
            return "clinical"
            
        # Simple heuristics for document type - customize based on your naming conventions
        if any(term in filename_lower for term in ["guidance", "regulation", "compliance", "ich", "fda", "e6"]):
            return "compliance"
        else:
            return "clinical"
    
    def _generate_document_id(self, filename: str) -> str:
        """Generate a document ID based on filename."""
        # Strip extension and replace spaces with underscores
        base_name = os.path.splitext(filename)[0]
        return base_name.replace(" ", "_").lower()
    
    def _format_document_title(self, filename: str) -> str:
        """Format a human-readable title from filename."""
        # Remove extension and replace underscores with spaces
        base_name = os.path.splitext(filename)[0]
        return base_name


# Create a singleton instance
document_service = DocumentService()
