from fastapi import APIRouter
from app.api.endpoints import compliance, documents, trial_info

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

# Include trial info endpoints under /api/v1
api_router.include_router(
    trial_info.router, 
    prefix="", 
    tags=["trial-info"]
)
