import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings

def send_verification_email(to_email: str, token: str):
    subject = "Verify your IoTMart Account"
    link = f"http://localhost:5173/verify-email?token={token}"
    
    plain_text = f"Hello,\n\nPlease verify your email address by clicking the link below:\n{link}\n\nIf you did not request this, please ignore this email.\n\n- The IoTMart Team"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0070f3; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">IoTMart</h1>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Verify Your Email Address</h2>
                <p style="color: #52525b; line-height: 1.6; font-size: 16px;">Hello,</p>
                <p style="color: #52525b; line-height: 1.6; font-size: 16px;">Thank you for registering with IoTMart! Please confirm your email address to unlock all features of your account.</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{link}" style="background-color: #0070f3; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email Now</a>
                </div>
                
                <p style="color: #52525b; line-height: 1.6; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #0070f3; font-size: 13px; word-break: break-all;">{link}</p>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #f4f4f5;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">&copy; 2026 IoTMart. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return _send_email(to_email, subject, plain_text, html_content)


def send_password_reset_email(to_email: str, token: str):
    subject = "Reset Your IoTMart Password"
    link = f"http://localhost:5173/reset-password?token={token}"
    
    plain_text = f"Hello,\n\nYou requested to reset your password. Click the link below:\n{link}\n\nIf you did not request this, please ignore this email.\n\n- The IoTMart Team"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #18181b; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">IoTMart</h1>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #52525b; line-height: 1.6; font-size: 16px;">We received a request to reset your password. Click the button below to choose a new password.</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{link}" style="background-color: #0070f3; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
                </div>
                
                <p style="color: #52525b; line-height: 1.6; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #0070f3; font-size: 13px; word-break: break-all;">{link}</p>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return _send_email(to_email, subject, plain_text, html_content)


def send_welcome_email(name: str, to_email: str):
    subject = "Welcome to IoTMart! 🎉"
    
    plain_text = f"Hello {name},\n\nWelcome to IoTMart! We are thrilled to have you on board. Start exploring the best IoT devices today.\n\n- The IoTMart Team"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0070f3; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">IoTMart</h1>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Welcome, {name}! 🎉</h2>
                <p style="color: #52525b; line-height: 1.6; font-size: 16px;">We are thrilled to have you on board. At IoTMart, you will find the best smart devices to automate your life.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="http://localhost:5173" style="background-color: #0070f3; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Start Exploring</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return _send_email(to_email, subject, plain_text, html_content)

def _send_email(to_email: str, subject: str, plain_text: str, html_content: str) -> bool:
    print(f"🚀 [EMAIL OUTGOING] To: {to_email} | Sub: {subject}")
    
    if not settings.GMAIL_USER or not settings.GMAIL_PASSWORD:
        print("❌ Missing Gmail credentials in .env")
        return False
        
    try:
        import email.utils
        msg = MIMEMultipart('alternative')
        msg['From'] = f"IoTMart Support <{settings.GMAIL_USER}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg['Date'] = email.utils.formatdate(localtime=True)
        msg['Message-ID'] = email.utils.make_msgid(domain='iotmart.local')
        msg['Reply-To'] = settings.GMAIL_USER
        
        # Attach both plain and HTML versions to reduce spam likelihood
        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(settings.GMAIL_USER, settings.GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print("✅ Email sent successfully.")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False
