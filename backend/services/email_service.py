import os
from core.config import settings
from core.logger import logger

def send_verification_email(to_email: str, token: str):
    subject = "Verify your IoTMart Account"
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
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
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
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
                    <a href="{settings.FRONTEND_URL}" style="background-color: #0070f3; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Start Exploring</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return _send_email(to_email, subject, plain_text, html_content)

def send_order_confirmation_email(to_email: str, order_id: str, total_amount: float):
    subject = f"Order Confirmation - #{order_id}"
    
    plain_text = f"Hello,\n\nThank you for your order! Your order #{order_id} for a total of ₹{total_amount} has been placed successfully.\n\nTrack your order in the My Orders section.\n\n- The IoTMart Team"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0070f3; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">IoTMart</h1>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Order Confirmed! ✅</h2>
                <p style="color: #52525b; line-height: 1.6; font-size: 16px;">Thank you for shopping with us! Your order <strong>#{order_id}</strong> has been received and is currently being processed.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #0070f3; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #334155;"><strong>Total Amount:</strong> ₹{total_amount}</p>
                </div>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{settings.FRONTEND_URL}/profile" style="background-color: #0070f3; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Track Order</a>
                </div>
                <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">If you have any questions, reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return _send_email(to_email, subject, plain_text, html_content)

def _send_email(to_email: str, subject: str, plain_text: str, html_content: str) -> bool:
    logger.info(f"🚀 [EMAIL OUTGOING] To: {to_email} | Sub: {subject}")
    
    if not settings.BREVO_API_KEY:
        logger.error("❌ Missing Brevo API Key in .env")
        return False
        
    try:
        import requests
        
        url = "https://api.brevo.com/v3/smtp/email"
        
        payload = {
            "sender": {
                "name": "IoTMart Support",
                "email": settings.GMAIL_USER or "support@iotmart.com"
            },
            "to": [
                {
                    "email": to_email
                }
            ],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": plain_text
        }
        
        headers = {
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201, 202]:
            logger.info("✅ Email sent successfully via Brevo API.")
            return True
        else:
            logger.error(f"❌ Brevo API Error: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")
        return False
