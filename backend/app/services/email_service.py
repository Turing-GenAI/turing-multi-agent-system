from typing import List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException
from app.core.config import settings
from app.services.compliance_service import compliance_service
from app.services.compliance_service.prompts import EMAIL_SYSTEM_PROMPT, get_email_human_prompt
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
        try:
            messages = [
                SystemMessage(content=EMAIL_SYSTEM_PROMPT),
                HumanMessage(content=get_email_human_prompt(review_data))
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

        # Check if sending to the same email as sender (potential SMTP security block)
        if any(email.lower().strip() == self.sender_email.lower().strip() for email in to_emails):
            raise HTTPException(
                status_code=400,
                detail="Cannot send to the same email address as the sender. This is often blocked by SMTP servers."
            )

        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender_email
            msg['To'] = ", ".join(to_emails)
            msg['Subject'] = subject

            # If content is not provided, generate it using LLM
            if not content and review_data:
                content = await self.generate_email_content(review_data)

            # Create formatted content with asterisks to indicate importance
            formatted_text = ""

            # Add review details if review_data is provided
            if review_data is not None:
                clinical_doc = review_data.get('clinical_doc', 'N/A')
                total_issues = review_data.get('issues', 0)
                high_confidence = review_data.get('high_confidence_issues', 0)
                low_confidence = review_data.get('low_confidence_issues', 0)

                formatted_text += "COMPLIANCE REVIEW NOTIFICATION\n\n"
                formatted_text += f"- **Total Issues Found:** {total_issues}\n"
                formatted_text += f"- **High Confidence Issues:** {high_confidence}\n"
                formatted_text += f"- **Low Confidence Issues:** {low_confidence}\n\n"

                # Add decision history if available
                decision_history = review_data.get('decision_history', [])
                if decision_history:
                    formatted_text += "DECISION HISTORY:\n"

                    # Add each decision
                    for decision in decision_history:
                        if decision is None:
                            continue

                        issue = decision.get('issue', {}) or {}
                        decision_data = decision.get('decision', {}) or {}

                        issue_id = issue.get('id', 'N/A')
                        clinical_text = issue.get('clinical_text', 'N/A')
                        action = decision_data.get('action', 'N/A')
                        applied_change = decision_data.get(
                            'applied_change', 'None')
                        regulation = issue.get('regulation', 'N/A')
                        timestamp = decision_data.get('timestamp', 'N/A')

                        formatted_text += f"- **Issue ID:** {issue_id}\n"
                        formatted_text += f"  - **Original Text:** {clinical_text}\n"
                        formatted_text += f"  - **Action:** {action}\n"
                        formatted_text += f"  - **Change Applied:** {applied_change}\n"
                        formatted_text += f"  - **Regulation:** {regulation}\n"
                        formatted_text += f"  - **Timestamp:** {timestamp}\n\n"
            elif content:
                # If review_data is None but content is provided, just include it
                formatted_text = content

            # Process text for the HTML version - convert markdown-style bold to HTML
            html_text = formatted_text
            # Replace markdown-style bold with HTML bold
            while '**' in html_text:
                html_text = html_text.replace('**', '<strong>', 1)
                if '**' in html_text:
                    html_text = html_text.replace('**', '</strong>', 1)

            # Create HTML version with proper formatting and monospace font
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <style>
                    pre {{ font-family: monospace; white-space: pre-wrap; word-wrap: break-word; margin: 0; }}
                    strong {{ font-weight: bold; }}
                </style>
            </head>
            <body>
                <pre>{html_text}</pre>
            </body>
            </html>
            """

            # First attach the plain text version (basic fallback)
            msg.attach(MIMEText(formatted_text, 'plain'))

            # Then attach the HTML version with proper formatting
            msg.attach(MIMEText(html_content, 'html'))

            try:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                return True
            except smtplib.SMTPServerDisconnected:
                raise HTTPException(
                    status_code=500,
                    detail="SMTP server disconnected unexpectedly. If you're sending to the same email as the sender, this may be blocked."
                )
            except smtplib.SMTPAuthenticationError:
                raise HTTPException(
                    status_code=500, detail="SMTP authentication failed. Check your username and password.")
            except smtplib.SMTPRecipientsRefused:
                raise HTTPException(
                    status_code=400, detail="One or more recipients were refused by the SMTP server.")
            except smtplib.SMTPSenderRefused:
                raise HTTPException(
                    status_code=400, detail="The sender address was refused by the SMTP server.")
            except smtplib.SMTPDataError:
                raise HTTPException(
                    status_code=400, detail="The SMTP server refused to accept the message data.")

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to send email: {str(e)}")
