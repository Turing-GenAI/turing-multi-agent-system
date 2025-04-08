from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import List, Dict, Any, Optional
import os
from datetime import datetime

from app.services.document_service import document_service

router = APIRouter()


@router.get("/list/")
async def list_documents(doc_type: Optional[str] = Query(None, description="Filter by document type: 'clinical' or 'compliance'")):
    """
    List all available documents, optionally filtered by type.
    
    Args:
        doc_type: Optional filter for document type ('clinical' or 'compliance')
    
    Returns:
        List of document metadata including id, title, type, and file info
    """
    try:
        documents = document_service.list_documents(doc_type)
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/content")
async def get_document_content(document_id: str):
    """
    Get the full text content of a document by its ID.
    
    Args:
        document_id: Document identifier
    
    Returns:
        Document text content
    """
    try:
        content = document_service.get_document_content(document_id)
        return {"document_id": document_id, "content": content}
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
async def get_document_metadata(document_id: str):
    """
    Get metadata about a specific document.
    
    Args:
        document_id: Document identifier
    
    Returns:
        Document metadata
    """
    try:
        documents = document_service.list_documents()
        document = next((doc for doc in documents if doc["id"] == document_id), None)
        
        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
            
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(..., description="Document type: 'clinical' or 'compliance'")
):
    """
    Upload a new document.
    
    Args:
        file: The document file to upload
        doc_type: Type of document ('clinical' or 'compliance')
    
    Returns:
        Document metadata
    """
    try:
        # Validate document type
        if doc_type.lower() not in ['clinical', 'compliance']:
            raise HTTPException(
                status_code=400,
                detail="Document type must be either 'clinical' or 'compliance'"
            )

        # Validate file extension
        filename = file.filename
        _, extension = os.path.splitext(filename)
        if extension.lower() not in ['.pdf', '.txt', '.doc', '.docx']:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Only PDF, TXT, DOC, and DOCX files are supported."
            )

        # Generate a unique filename to avoid conflicts
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_filename = f"{doc_type}_{timestamp}{extension}"
        file_path = os.path.join(document_service.documents_dir, new_filename)

        # Save the uploaded file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Create document metadata
        document = {
            "id": document_service._generate_document_id(new_filename),
            "title": os.path.splitext(filename)[0],
            "type": doc_type.lower(),
            "filename": new_filename,
            "format": extension[1:],  # Remove the dot
            "created": datetime.now().isoformat(),
            "updated": datetime.now().isoformat(),
            "size": len(contents)
        }

        return document
    except Exception as e:
        # If there was an error, try to clean up the file if it was created
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))
