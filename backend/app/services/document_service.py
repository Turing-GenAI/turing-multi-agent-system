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

        # Document ID mapping dictionary to ensure consistent IDs
        self._document_id_map = {}
        self._initialize_document_ids()

    def _initialize_document_ids(self):
        """Initialize document IDs for all documents in the subdirectories."""
        clinical_index = 1
        compliance_index = 1
        
        # Check if subdirectories exist, create them if they don't
        clinical_dir = os.path.join(self.documents_dir, "clinical")
        compliance_dir = os.path.join(self.documents_dir, "compliance")
        
        for dir_path in [clinical_dir, compliance_dir]:
            if not os.path.exists(dir_path):
                os.makedirs(dir_path)
                logger.info(f"Created directory: {dir_path}")
        
        # Process clinical documents
        if os.path.exists(clinical_dir):
            filenames = sorted(os.listdir(clinical_dir))
            for filename in filenames:
                file_path = os.path.join(clinical_dir, filename)
                if not os.path.isfile(file_path):
                    continue
                    
                # Get file extension
                _, extension = os.path.splitext(filename)
                if extension.lower() not in self.supported_extensions:
                    continue
                    
                # Store the document ID
                self._document_id_map[os.path.join("clinical", filename)] = f"CLIN_{clinical_index:03d}"
                clinical_index += 1
                
        # Process compliance documents
        if os.path.exists(compliance_dir):
            filenames = sorted(os.listdir(compliance_dir))
            for filename in filenames:
                file_path = os.path.join(compliance_dir, filename)
                if not os.path.isfile(file_path):
                    continue
                    
                # Get file extension
                _, extension = os.path.splitext(filename)
                if extension.lower() not in self.supported_extensions:
                    continue
                    
                # Store the document ID
                self._document_id_map[os.path.join("compliance", filename)] = f"COMP_{compliance_index:03d}"
                compliance_index += 1
                
        logger.info(f"Initialized document IDs: {self._document_id_map}")

    def _generate_document_id(self, relative_path: str) -> str:
        """Get a consistent document ID for the filename."""
        # If we don't have an ID for this file yet, generate one
        if relative_path not in self._document_id_map:
            # Determine document type from folder
            if relative_path.startswith("clinical/") or relative_path.startswith("clinical\\"):
                doc_type = "clinical"
            elif relative_path.startswith("compliance/") or relative_path.startswith("compliance\\"):
                doc_type = "compliance"
            else:
                # If the path doesn't contain a subfolder, default to clinical
                doc_type = "clinical"
                
            # Count existing IDs of this type to determine the next index
            existing_ids = [id for file, id in self._document_id_map.items()
                            if (file.startswith("clinical/") or file.startswith("clinical\\")) == (doc_type == "clinical")]

            next_index = len(existing_ids) + 1
            prefix = "CLIN" if doc_type == "clinical" else "COMP"

            # Store the new ID in the map
            self._document_id_map[relative_path] = f"{prefix}_{next_index:03d}"

            logger.info(
                f"Generated new document ID for {relative_path}: {self._document_id_map[relative_path]}")

        # Return the consistent ID
        return self._document_id_map[relative_path]

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

            # Define which folders to scan based on doc_type
            if doc_type == "clinical":
                subdirs = ["clinical"]
            elif doc_type == "compliance":
                subdirs = ["compliance"]
            else:
                subdirs = ["clinical", "compliance"]
                
            # Scan each subdirectory for documents
            for subdir in subdirs:
                subdir_path = os.path.join(self.documents_dir, subdir)
                if not os.path.exists(subdir_path) or not os.path.isdir(subdir_path):
                    continue
                    
                # Process all files in this subdirectory
                for filename in os.listdir(subdir_path):
                    file_path = os.path.join(subdir_path, filename)
                    if not os.path.isfile(file_path):
                        continue
                        
                    # Get file extension
                    _, extension = os.path.splitext(filename)
                    if extension.lower() not in self.supported_extensions:
                        continue
                        
                    # Document type is determined by folder
                    document_type = subdir
                    
                    # Get relative path for the document ID lookup
                    relative_path = os.path.join(subdir, filename)
                    
                    # Create document metadata
                    document = {
                        "id": self._generate_document_id(relative_path),
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
            document = next(
                (doc for doc in documents if doc["id"] == document_id), None)

            if not document:
                raise HTTPException(
                    status_code=404, detail=f"Document with ID {document_id} not found")

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
            logger.error(
                f"Error extracting PDF text from {file_path}: {str(e)}")
            raise

    def _extract_text_file(self, file_path: str) -> str:
        """Extract text from a plain text file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as text_file:
                return text_file.read()
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise

    def _detect_document_type(self, relative_path: str, file_path: str = None) -> str:
        """
        Detect document type based on folder location.
        """
        # Determine document type from the folder structure
        if relative_path.startswith("clinical/") or relative_path.startswith("clinical\\"):
            return "clinical"
        elif relative_path.startswith("compliance/") or relative_path.startswith("compliance\\"):
            return "compliance"
        else:
            # If can't determine from path, fall back to filename heuristics (legacy support)
            filename = os.path.basename(relative_path)
            filename_lower = filename.lower()
            
            # Use simple heuristics as fallback
            if any(term in filename_lower for term in ["guidance", "regulation", "compliance", "ich", "fda", "e6"]):
                return "compliance"
            else:
                return "clinical"

    def _format_document_title(self, filename: str) -> str:
        """Format a human-readable title from filename."""
        # Remove extension and replace underscores with spaces
        base_name = os.path.splitext(filename)[0]
        return base_name


# Create a singleton instance
document_service = DocumentService()
