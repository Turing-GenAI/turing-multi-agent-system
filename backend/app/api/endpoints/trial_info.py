from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class TrialInfoRequest(BaseModel):
    trial_phase: str
    product_type: str
    geography: str
    risk_level: str
    regulatory_pathway: Optional[str] = None
    trial_title_id: Optional[str] = None

class ComplianceDocument(BaseModel):
    id: str
    name: str
    description: str
    relevance_score: float
    content: Optional[str] = None

class TrialInfoResponse(BaseModel):
    suggested_compliance_docs: List[ComplianceDocument]
    message: Optional[str] = None

# Sample compliance documents database
COMPLIANCE_DOCS = {
    "CFR_812": {
        "id": "CFR_812",
        "name": "21 CFR Part 812",
        "description": "IDE Regulations for Medical Devices",
        "content": """
        Investigational Device Exemptions regulations covering:
        - Requirements for IDE approval
        - Responsibilities of sponsors and investigators
        - IRB review requirements
        - Records and reports
        """
    },
    "ICH_E6": {
        "id": "ICH_E6",
        "name": "ICH E6(R2)",
        "description": "Guidelines for International Phase 3 Trials",
        "content": """
        Good Clinical Practice guidelines covering:
        - Clinical trial principles
        - IRB/IEC review procedures
        - Investigator requirements
        - Sponsor responsibilities
        - Protocol and amendments
        - Investigator's brochure
        """
    },
    "CFR_50": {
        "id": "CFR_50",
        "name": "21 CFR Part 50",
        "description": "Protection of Human Subjects",
        "content": """
        Protection of Human Subjects regulations covering:
        - Informed consent requirements
        - Safeguarding rights of participants
        - IRB requirements
        - Documentation requirements
        """
    },
    "CFR_312": {
        "id": "CFR_312",
        "name": "21 CFR Part 312",
        "description": "Investigational New Drug Application",
        "content": """
        IND regulations covering:
        - IND application requirements
        - Protocol requirements
        - Safety reporting
        - IRB approval requirements
        - Sponsor responsibilities
        """
    }
}

@router.post("/trial-info", response_model=TrialInfoResponse)
async def process_trial_info(request: TrialInfoRequest) -> TrialInfoResponse:
    """
    Process trial information and return suggested compliance documents.
    Uses a rule-based system to determine relevant compliance documents.
    """
    try:
        suggested_docs = []
        relevance_scores = {}

        # Rule-based scoring system
        if request.product_type == "Device":
            relevance_scores["CFR_812"] = 0.9  # High relevance for device trials
            
        if request.product_type == "Drug":
            relevance_scores["CFR_312"] = 0.9  # High relevance for drug trials

        if request.geography == "International" and request.trial_phase == "Phase 3":
            relevance_scores["ICH_E6"] = 0.95  # Very high relevance for international Phase 3

        if request.risk_level == "Significant risk":
            relevance_scores["CFR_50"] = 0.85  # High relevance for significant risk trials
            
            # Increase relevance of device regulations for significant risk devices
            if request.product_type == "Device":
                relevance_scores["CFR_812"] = 0.95

        # Add regulatory pathway-specific rules
        if request.regulatory_pathway:
            if request.regulatory_pathway in ["IDE", "510(k)", "PMA"]:
                relevance_scores["CFR_812"] = 0.95
            elif request.regulatory_pathway in ["IND", "NDA", "BLA"]:
                relevance_scores["CFR_312"] = 0.95

        # Convert scores to suggested documents
        for doc_id, score in relevance_scores.items():
            if doc_id in COMPLIANCE_DOCS:
                doc = COMPLIANCE_DOCS[doc_id]
                suggested_docs.append(
                    ComplianceDocument(
                        id=doc["id"],
                        name=doc["name"],
                        description=doc["description"],
                        relevance_score=score,
                        content=doc["content"]
                    )
                )

        # Sort by relevance score
        suggested_docs.sort(key=lambda x: x.relevance_score, reverse=True)

        return TrialInfoResponse(
            suggested_compliance_docs=suggested_docs,
            message="Successfully processed trial information"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing trial information: {str(e)}"
        ) 