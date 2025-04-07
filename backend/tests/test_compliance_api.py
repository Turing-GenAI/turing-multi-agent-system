import json
import requests
import os
import PyPDF2
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
COMPLIANCE_ENDPOINT = "/compliance/analyze-compliance/"

# Document paths
DOCUMENTS_DIR = Path(__file__).parent.parent / "documents"

# Document file names
CLINICAL_DOC_FILENAME = "cct_washout_pd_and_concomitant_meds_draft_guidance_april_2024.pdf"
COMPLIANCE_DOC_FILENAME = "E6(R2) Good Clinical Practice_ Integrated Addendum to ICH E6(R1) _ Guidance for Industry.pdf"


def get_document_paths():
    """Get the paths to the clinical and compliance documents."""
    clinical_doc_path = DOCUMENTS_DIR / CLINICAL_DOC_FILENAME
    compliance_doc_path = DOCUMENTS_DIR / COMPLIANCE_DOC_FILENAME
    
    # Verify that the documents exist
    if not clinical_doc_path.exists():
        raise FileNotFoundError(f"Clinical document not found: {clinical_doc_path}")
    if not compliance_doc_path.exists():
        raise FileNotFoundError(f"Compliance document not found: {compliance_doc_path}")
        
    return clinical_doc_path, compliance_doc_path


def extract_pdf_text(file_path):
    """Extract text from a PDF file."""
    try:
        with open(file_path, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Error extracting PDF text from {file_path}: {str(e)}")
        raise

def test_compliance_endpoint():
    """Test the analyze-compliance endpoint with real documents."""
    print("Testing compliance review API...")
    
    try:
        # Get document paths
        clinical_doc_path, compliance_doc_path = get_document_paths()
        
        # Create document IDs based on filenames
        clinical_doc_id = f"CLINICAL-{os.path.splitext(CLINICAL_DOC_FILENAME)[0][:20]}"
        compliance_doc_id = f"COMPLIANCE-{os.path.splitext(COMPLIANCE_DOC_FILENAME)[0][:20]}"
        
        print(f"Using clinical document: {clinical_doc_path}")
        print(f"Using compliance document: {compliance_doc_path}")
        
        # Extract text content from PDF files
        print("Extracting text from PDFs...")
        clinical_doc_content = extract_pdf_text(clinical_doc_path)
        compliance_doc_content = extract_pdf_text(compliance_doc_path)
        
        print(f"Extracted {len(clinical_doc_content)} characters from clinical document")
        print(f"Extracted {len(compliance_doc_content)} characters from compliance document")
        
        # Test data - using document content
        test_data = {
            "clinical_doc_id": clinical_doc_id,
            "compliance_doc_id": compliance_doc_id,
            "clinical_doc_content": clinical_doc_content,
            "compliance_doc_content": compliance_doc_content
        }
        
        # Make POST request to endpoint
        response = requests.post(
            f"{BASE_URL}{COMPLIANCE_ENDPOINT}",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Check response status
        if response.status_code == 200:
            print("Request successful!")
            result = response.json()
            
            # Print summary of compliance issues
            issues = result.get("issues", [])
            print(f"\nFound {len(issues)} compliance issues:")
            
            for i, issue in enumerate(issues, 1):
                print(f"\nIssue {i}:")
                print(f"Confidence: {issue.get('confidence', 'unknown')}")
                print(f"Regulation: {issue.get('regulation', 'unknown')}")
                print(f"Clinical text: \"{issue.get('clinical_text', '')[:50]}...\"")
                print(f"Explanation: {issue.get('explanation', '')[:100]}...")
                
            # Save full response to file for detailed review
            with open("compliance_analysis_result.json", "w") as f:
                json.dump(result, f, indent=2)
                print(f"\nFull results saved to compliance_analysis_result.json")
                
        else:
            print(f"Request failed with status code: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error testing endpoint: {str(e)}")

if __name__ == "__main__":
    test_compliance_endpoint()
