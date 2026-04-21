# app/services/email_service.py
import logging
import os
import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

def send_collaborator_email(to_email: str, project_title: str):
    """
    Sends an email notification via SMTP, falling back to console mock
    if credentials are not provided.
    """
    subject = f"Collaboration Update - {project_title}"
    body = f"""
Congrats! You have been selected as a collaborator for '{project_title}'.
Make sure to reach out to the project creator to share your details and proceed further.
    """

    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD")

    if not smtp_server or not smtp_user or not smtp_pass:
        logger.warning("SMTP credentials missing. Simulating sending email...")
        print("\n" + "="*50)
        print(f"MOCK EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"BODY:\n{body.strip()}")
        print("="*50 + "\n")
        return True

    msg = MIMEText(body.strip())
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info(f"Successfully sent standard email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        # Fallback to mock log so it doesn't crash the api call
        return False

