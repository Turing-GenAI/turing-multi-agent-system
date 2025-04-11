from typing import List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException
from app.core.config import settings
from app.services.compliance_service import compliance_service
from langchain.schema import HumanMessage, SystemMessage

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.sender_email = settings.SENDER_EMAIL

    async def generate_email_content(self, review_data: dict) -> str:
        """Generate email content using LLM"""
        system_prompt = """You are a professional compliance officer writing an email about compliance review findings.
        Your task is to create a clear, professional email that summarizes the findings and provides next steps."""
        
        human_prompt = f"""
        Create a professional email about compliance review findings for document review.
        
        Document Details:
        - Clinical Document: {review_data.get('clinical_doc')}
        - Compliance Document: {review_data.get('compliance_doc')}
        - Total Issues Found: {review_data.get('issues', 0)}
        - High Confidence Issues: {review_data.get('high_confidence_issues', 0)}
        - Low Confidence Issues: {review_data.get('low_confidence_issues', 0)}
        
        The email should:
        1. Be professional and clear
        2. Summarize the findings
        3. Highlight any critical issues
        4. Include next steps or recommendations

        Format the email with proper subject, greeting, body, and signature.
        """
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]
            response = await compliance_service.llm_client.ainvoke(messages)
            return response.content.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate email content: {str(e)}")

    async def send_email(self, 
                        to_emails: List[str], 
                        subject: str,
                        content: str = None,
                        review_data: Optional[dict] = None) -> bool:
        """Send email to recipients"""
        if not all([self.smtp_username, self.smtp_password, self.sender_email]):
            raise HTTPException(status_code=500, detail="Email configuration not set")

        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = ", ".join(to_emails)
            msg['Subject'] = subject

            # If content is not provided, generate it using LLM
            if not content and review_data:
                content = await self.generate_email_content(review_data)

            msg.attach(MIMEText(content, 'plain'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            return True

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}") 