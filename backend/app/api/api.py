from fastapi import APIRouter
from app.api.endpoints import compliance, documents

api_router = APIRouter()

# Include compliance endpoints
api_router.include_router(
    compliance.router, 
    prefix="/compliance", 
    tags=["compliance"]
)

# Include document management endpoints
api_router.include_router(
    documents.router, 
    prefix="/documents", 
    tags=["documents"]
)
