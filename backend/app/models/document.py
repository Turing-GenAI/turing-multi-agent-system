"""
Document model for representing documents in the system.
"""

from pydantic import BaseModel
from typing import Optional


class Document(BaseModel):
    """
    Model for representing a document in the system.
    """
    id: str
    content: str
    title: Optional[str] = None
    type: Optional[str] = None
    format: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None
