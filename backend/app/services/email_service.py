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

            # Create only the HTML version
            html_content = f"""
            <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <style type="text/css">
                    /* Base styles that most email clients will honor */
                    body {{ font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 15px; }}
                    strong {{ font-weight: bold; }}
                    h2 {{ font-size: 20px; font-weight: bold; margin-top: 20px; margin-bottom: 15px; color: #2c3e50; background-color: #f8f9fa; padding: 10px; border-left: 4px solid #4a6da7; }}
                    h4 {{ font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; }}
                    .issue {{ margin-bottom: 20px; padding: 10px; border: 1px solid #dee2e6; background-color: #f8f9fa; border-radius: 4px; }}
                    .original-text {{ background-color: #ffeeee; padding: 8px; border: 1px solid #ffcccc; border-radius: 4px; margin: 5px 0; }}
                    .applied-change {{ background-color: #eeffee; padding: 8px; border: 1px solid #ccffcc; border-radius: 4px; margin: 5px 0; }}
                    .issue-prop {{ margin-bottom: 8px; }}
                    .stats {{ font-weight: bold; color: #2c3e50; }}
                    .divider {{ border-top: 1px solid #e9ecef; margin: 15px 0; height: 0; }}
                </style>
            </head>
            <body>
                <!-- Main Notification Header -->
                <div style="font-size: 20px; font-weight: bold; margin-top: 20px; margin-bottom: 15px; color: #2c3e50; background-color: #f8f9fa; padding: 10px; border-left: 4px solid #4a6da7;">
                    COMPLIANCE REVIEW NOTIFICATION
                </div>
"""

            # Add review details if review_data is provided
            if review_data is not None:
                html_content += f"""
                <!-- Document and Issue Stats -->
                <div style="margin-bottom: 20px;">
                    <div style="margin-bottom: 8px;"><strong>Clinical Document:</strong> {review_data.get('clinical_doc', 'N/A')}</div>
                    <div style="margin-bottom: 8px;"><strong>Compliance Document:</strong> {review_data.get('compliance_doc', 'N/A')}</div>
                    <div style="margin-bottom: 8px;"><strong>Total Issues Found:</strong> <span style="font-weight: bold; color: #2c3e50;">{review_data.get('issues', 0)}</span></div>
                    <div style="margin-bottom: 8px;"><strong>High Confidence Issues:</strong> <span style="font-weight: bold; color: #2c3e50;">{review_data.get('high_confidence_issues', 0)}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Low Confidence Issues:</strong> <span style="font-weight: bold; color: #2c3e50;">{review_data.get('low_confidence_issues', 0)}</span></div>
                </div>
                
                <div style="border-top: 1px solid #e9ecef; margin: 15px 0; height: 0;"></div>
"""

                # Add decision history if available
                decision_history = review_data.get('decision_history', [])
                if decision_history:
                    html_content += f"""
                    <!-- Decision History Section -->
                    <div style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">
                        DECISION HISTORY:
                    </div>
"""

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

                        html_content += f"""
                        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #dee2e6; background-color: #f8f9fa; border-radius: 4px;">
                            <div style="margin-bottom: 8px;"><strong>Issue ID:</strong> {issue_id}</div>
                            <div style="margin-bottom: 8px;"><strong>Original Text:</strong> 
                                <div style="background-color: #ffeeee; padding: 8px; border: 1px solid #ffcccc; border-radius: 4px; margin: 5px 0;">
                                    {clinical_text}
                                </div>
                            </div>
                            <div style="margin-bottom: 8px;"><strong>Action:</strong> {action}</div>
                            <div style="margin-bottom: 8px;"><strong>Change Applied:</strong> 
                                <div style="background-color: #eeffee; padding: 8px; border: 1px solid #ccffcc; border-radius: 4px; margin: 5px 0;">
                                    {applied_change}
                                </div>
                            </div>
                            <div style="margin-bottom: 8px;"><strong>Regulation:</strong> {regulation}</div>
                            <div style="margin-bottom: 8px;"><strong>Timestamp:</strong> {timestamp}</div>
                        </div>
"""
            else:
                # If review_data is None, just include the content as-is
                html_content += f"""
                <div style="margin-bottom: 20px;">
                    {content}
                </div>
                """

            # Close the HTML
            html_content += """
            </body>
            </html>
            """

            # Set content type to HTML only
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
