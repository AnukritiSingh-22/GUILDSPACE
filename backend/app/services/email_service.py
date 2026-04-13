# app/services/email_service.py
import logging

logger = logging.getLogger(__name__)

def send_collaborator_email(to_email: str, project_title: str):
    """
    Mock email sender that prints the email to the console.
    This fulfills the requirement to notify accepted applicants.
    """
    subject = "Collaboration Update!!"
    body = f"""
    Congrats! You have been selected as a collaborator for this project.
    Share your details to proceed further.
    """

    # Print to console (simulating send)
    print("\n" + "="*50)
    print(f"MOCK EMAIL DISPATCHED TO: {to_email}")
    print(f"SUBJECT: {subject}")
    print(f"BODY:\n{body.strip()}")
    print("="*50 + "\n")
    
    # Also log it for debugging
    logger.info(f"Sent mock email to {to_email} for project: {project_title}")
    
    return True
