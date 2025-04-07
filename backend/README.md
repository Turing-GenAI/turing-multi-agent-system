# Compliance Review Backend API

A FastAPI-based backend service for analyzing clinical trial documents against compliance standards. The service uses Azure OpenAI to identify potential compliance issues in clinical trial documents, highlighting exact sentences/paragraphs that may violate regulatory requirements.

## Features

- **Document Compliance Analysis**: Analyze clinical trial documents against compliance standards
- **Smart Text Highlighting**: Identifies specific paragraphs, sentences, or words that violate compliance
- **Confidence Ratings**: Each identified issue includes a confidence rating (high/low)
- **Suggested Edits**: AI provides recommended changes to fix compliance issues
- **Regulation References**: Each issue includes specific regulation citations

## Setup

### Prerequisites

- Python 3.8+
- Azure OpenAI API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/turing-multi-agent-system.git
cd turing-multi-agent-system/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy the example environment file and update with your Azure OpenAI credentials:
```bash
cp .env.example .env
# Edit .env file with your credentials
```

### Running the API

Start the API server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

## API Endpoints

### Analyze Compliance

**Endpoint:** `POST /api/v1/compliance/analyze-compliance/`

Analyzes clinical trial documents for compliance issues against regulatory documents.

**Request Body:**
```json
{
  "clinical_doc_id": "CT-12345",
  "compliance_doc_id": "FDA-50-801",
  "clinical_doc_content": "Full text of clinical document...",
  "compliance_doc_content": "Full text of compliance document..."
}
```

**Response:**
```json
{
  "clinical_doc_id": "CT-12345",
  "compliance_doc_id": "FDA-50-801",
  "issues": [
    {
      "id": "issue_uuid",
      "clinical_text": "Text from clinical document that violates compliance",
      "compliance_text": "Text from compliance document that is being violated",
      "explanation": "Explanation of why this is a violation",
      "suggested_edit": "Suggested edit to fix the compliance issue",
      "confidence": "high",
      "regulation": "21 CFR § 801.109(c)"
    }
  ]
}
```

### Notify Document Owner

**Endpoint:** `POST /api/v1/compliance/notify-document-owner/`

Notifies document owners about compliance issues.

**Request Body:**
```json
{
  "document_id": "CT-12345",
  "owner_email": "owner@example.com",
  "issues": [
    {
      "id": "issue_uuid",
      "clinical_text": "Text from clinical document that violates compliance",
      "compliance_text": "Text from compliance document that is being violated",
      "explanation": "Explanation of why this is a violation",
      "suggested_edit": "Suggested edit to fix the compliance issue",
      "confidence": "high",
      "regulation": "21 CFR § 801.109(c)"
    }
  ],
  "message": "Optional custom message"
}
```

## Testing

Run the test script to verify the API functionality:
```bash
python tests/test_compliance_api.py
```

## Integration with Frontend

This backend API is designed to work with the accompanying compliance review UI frontend. The frontend sends document content to be analyzed and displays the results with smart highlighting of non-compliant sections.
