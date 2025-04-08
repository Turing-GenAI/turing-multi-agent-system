import logging
from typing import Union

from app.core.config import settings
from app.services.compliance_service import ComplianceService
from app.services.gemini_service import GeminiService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComplianceServiceFactory:
    """
    Factory for creating compliance service instances based on configuration.
    """
    
    @staticmethod
    def get_service() -> Union[ComplianceService, GeminiService]:
        """
        Get the appropriate compliance service based on configuration.
        
        Returns:
            A compliance service instance (either Azure-based or Gemini-based)
        """
        processor = settings.PDF_PROCESSOR.lower()
        
        logger.info(f"Using PDF processor: {processor}")
        
        if processor == "azure":
            from app.services.compliance_service import compliance_service
            return compliance_service
        elif processor == "gemini":
            from app.services.gemini_service import gemini_service
            return gemini_service
        else:
            logger.warning(f"Unknown PDF processor: {processor}, falling back to Azure")
            from app.services.compliance_service import compliance_service
            return compliance_service


# Create the factory instance
compliance_service_factory = ComplianceServiceFactory()
