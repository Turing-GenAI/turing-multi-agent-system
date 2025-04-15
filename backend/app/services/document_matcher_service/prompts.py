"""
Document Matcher Service - LLM Prompts

This module contains the prompts used by the document matcher service to guide
the LLM in analyzing clinical and compliance documents for matching purposes.
"""

# System prompt for document regulatory content analysis
DOCUMENT_ANALYSIS_SYSTEM_PROMPT = """
You are an expert AI assistant specialized in analyzing clinical trial documents and regulatory compliance requirements.
Your task is to analyze a document and identify key regulatory concepts, requirements, and domains present.

Guidelines:
1. Focus on extracting regulatory terminology, requirements, and specific domains
2. Identify industry standards, regulations, and compliance frameworks mentioned
3. Recognize specific procedures, protocols, and requirements
4. Look for numerical thresholds, timing requirements, and specific criteria
5. Note any cross-references to other regulations or requirements
"""


def get_document_analysis_prompt(document_content: str) -> str:
    """
    Generate a prompt for analyzing document content to extract regulatory concepts.

    Args:
        document_content: The document text to analyze

    Returns:
        Formatted prompt for the LLM
    """
    return f"""
Analyze the following document and extract key regulatory concepts, requirements, and domains.
Extract content that would be relevant for compliance matching with other regulatory documents.

Document content:
{document_content}

Please structure your response as JSON using this format:
```json
{{
  "primary_domains": ["domain1", "domain2", ...],
  "regulations_referenced": ["ICH GCP", "21 CFR Part 11", ...],
  "key_requirements": [
    {{
      "description": "Requirement description",
      "domain": "Domain this requirement belongs to",
      "criticality": "high/medium/low"
    }},
    ...
  ],
  "numerical_thresholds": [
    {{
      "description": "Description of the threshold",
      "value": "The numerical value or range",
      "unit": "Time unit or measurement unit"
    }},
    ...
  ]
}}
```
"""


# System prompt for document similarity assessment
DOCUMENT_SIMILARITY_SYSTEM_PROMPT = """
You are an expert AI assistant specialized in assessing the similarity and relevance between clinical trial documents and regulatory compliance documents.
Your task is to evaluate how well a clinical document matches a compliance document for regulatory review purposes.

Guidelines:
1. Consider the regulatory domains covered in both documents
2. Evaluate the overlap in specific requirements and procedures
3. Assess whether the compliance document addresses the regulatory needs of the clinical document
4. Consider the specificity and applicability of the compliance document to the clinical scenario
5. Provide a similarity score from 0.0 to 1.0 and explain your reasoning
"""


def get_document_similarity_prompt(clinical_doc_content: str, compliance_doc_content: str) -> str:
    """
    Generate a prompt for assessing similarity between clinical and compliance documents.

    Args:
        clinical_doc_content: Content of the clinical document
        compliance_doc_content: Content of the compliance document

    Returns:
        Formatted prompt for the LLM
    """
    return f"""
Evaluate the similarity and relevance between the following clinical trial document and compliance document.
Assess how well the compliance document addresses the regulatory needs of the clinical document.

Clinical document:
{clinical_doc_content[:2000]}...

Compliance document:
{compliance_doc_content[:2000]}...

Please structure your response as JSON using this format:
```json
{{
  "similarity_score": 0.85,
  "rationale": "Explanation of why these documents match or don't match",
  "matching_domains": ["domain1", "domain2", ...],
  "missing_domains": ["domain3", "domain4", ...],
  "recommendation": "Use this compliance document" or "Find a better compliance document"
}}
```
"""

# Add more prompts as needed for the document matcher service
