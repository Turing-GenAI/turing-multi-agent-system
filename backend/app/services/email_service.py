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
        system_prompt = """You are generating automated compliance review notification emails.
        Create a concise, system-generated email that clearly presents compliance findings.
        Use minimal text, avoid greetings/signatures, and highlight key statistics in bold."""

        human_prompt = f"""
        Create a system-generated compliance review notification email.
        
        Document Details:
        - Clinical Document: {review_data.get('clinical_doc')}
        - Compliance Document: {review_data.get('compliance_doc')}
        - Total Issues Found: {review_data.get('issues', 0)}
        - High Confidence Issues: {review_data.get('high_confidence_issues', 0)}
        - Low Confidence Issues: {review_data.get('low_confidence_issues', 0)}
        - Decision History: {review_data.get('decision_history', 'Not available')}
        
        Requirements:
        1. Use format "Subject: Compliance Review: [Clinical Doc]"
        2. Skip traditional greetings and signatures
        3. Start directly with "COMPLIANCE REVIEW NOTIFICATION"
        4. Present all statistics using bold formatting (use ** for bold)
        5. If decision history is available, include a section with key decisions
        6. Keep all sections short and direct
        7. Use bullet points for clarity
        8. No need for polite language, signatures, or contact details
        """

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]
            response = await compliance_service.llm_client.ainvoke(messages)
            return response.content.strip()
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to generate email content: {str(e)}")

    async def send_email(self,
                         to_emails: List[str],
                         subject: str,
                         content: str = None,
                         review_data: Optional[dict] = None) -> bool:
        """Send email to recipients"""
        if not all([self.smtp_username, self.smtp_password, self.sender_email]):
            raise HTTPException(
                status_code=500, detail="Email configuration not set")

        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = ", ".join(to_emails)
            msg['Subject'] = subject

            # If content is not provided, generate it using LLM
            if not content and review_data:
                content = await self.generate_email_content(review_data)

            # Convert markdown-style bold (**text**) to HTML bold (<strong>text</strong>)
            content = content.replace('**', '<strong>', 1)
            while '**' in content:
                content = content.replace('**', '</strong>', 1)
                if '**' in content:
                    content = content.replace('**', '<strong>', 1)

            # Create both plain text and HTML versions
            plain_part = MIMEText(content.replace(
                '<strong>', '').replace('</strong>', ''), 'plain')
            html_part = MIMEText(
                f"<html><body>{content}</body></html>", 'html')

            # Add both parts to the message
            msg.attach(plain_part)
            msg.attach(html_part)

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            return True

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to send email: {str(e)}")
