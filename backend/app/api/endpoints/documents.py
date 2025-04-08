from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional

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
