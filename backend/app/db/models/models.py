from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime
import uuid

Base = declarative_base()

class Review(Base):
    """
    Model for compliance reviews
    Stores the main review information and links to the documents being compared
    """
    __tablename__ = "reviews"
    
    id = Column(String, primary_key=True)  # R-00001 format
    clinical_doc_id = Column(String, nullable=False)
    compliance_doc_id = Column(String, nullable=False)
    clinicalDoc = Column(String, nullable=False)  # Document title for display
    complianceDoc = Column(String, nullable=False)  # Document title for display
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    issues = relationship("ComplianceIssue", back_populates="review", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "clinical_doc_id": self.clinical_doc_id,
            "compliance_doc_id": self.compliance_doc_id,
            "clinicalDoc": self.clinicalDoc,
            "complianceDoc": self.complianceDoc,
            "status": self.status,
            "created": self.created_at.strftime("%b %d, %Y, %I:%M %p"),
            "issues": len(self.issues) if self.issues else 0,
            "highConfidenceIssues": sum(1 for issue in self.issues if issue.confidence == "high"),
            "lowConfidenceIssues": sum(1 for issue in self.issues if issue.confidence == "low")
        }

class ComplianceIssue(Base):
    """
    Model for individual compliance issues detected during a review
    Contains details about the violation and its position in the documents
    """
    __tablename__ = "compliance_issues"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("reviews.id"), nullable=False)
    
    # Issue content
    clinical_text = Column(Text, nullable=False)
    compliance_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    suggested_edit = Column(Text)
    confidence = Column(String, nullable=False)
    regulation = Column(String)
    
    # Position information
    clinical_text_start_char = Column(Integer)
    clinical_text_end_char = Column(Integer)
    compliance_text_start_char = Column(Integer)
    compliance_text_end_char = Column(Integer)
    
    # Additional metadata
    metadata_json = Column(Text)  # Stored as JSON
    
    # Relationships
    review = relationship("Review", back_populates="issues")
    decisions = relationship("Decision", back_populates="issue", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "clinical_text": self.clinical_text,
            "compliance_text": self.compliance_text,
            "explanation": self.explanation,
            "suggested_edit": self.suggested_edit,
            "confidence": self.confidence,
            "regulation": self.regulation,
            "clinical_text_start_char": self.clinical_text_start_char,
            "clinical_text_end_char": self.clinical_text_end_char,
            "compliance_text_start_char": self.compliance_text_start_char,
            "compliance_text_end_char": self.compliance_text_end_char,
            "metadata": self.metadata_json
        }

class Decision(Base):
    """
    Model for tracking decisions made on compliance issues
    Records whether an issue was accepted or rejected
    """
    __tablename__ = "decisions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(String, ForeignKey("compliance_issues.id"), nullable=False)
    action = Column(String, nullable=False)  # "accepted" or "rejected"
    comments = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    issue = relationship("ComplianceIssue", back_populates="decisions")

    def to_dict(self):
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "issue_id": self.issue_id,
            "action": self.action,
            "comments": self.comments,
            "timestamp": self.timestamp.strftime("%b %d, %Y, %I:%M %p")
        }
