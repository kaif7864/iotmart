from services.email_service import send_order_confirmation_email
from core.database import db
from datetime import datetime

class NotificationService:
    async def send_in_app_notification(self, user_id: str, title: str, message: str, type: str = "alert"):
        try:
            notif = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": type,
                "read": False,
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notif)
            print(f"Success: In-app notification sent to user {user_id}")
        except Exception as e:
            print(f"Error: Failed to insert in-app notification: {e}")

    def send_order_placed_email(self, email: str, order_id: str, total_amount: float):
        try:
            send_order_confirmation_email(email, str(order_id), total_amount)
            print(f"Success: Sent order placed email to {email} for Order {order_id}, Total: {total_amount}")
        except Exception as e:
            print(f"Error: Failed to send order email to {email}: {e}")

    def send_whatsapp_alert(self, phone: str, order_id: str, status: str, tracking_id: str = None):
        try:
            from twilio.rest import Client
            from core.config import settings
            
            if not phone:
                print("Error: No phone number provided for WhatsApp alert")
                return
                
            twilio_sid = settings.TWILIO_ACCOUNT_SID
            twilio_token = settings.TWILIO_AUTH_TOKEN
            twilio_phone = settings.TWILIO_PHONE_NUMBER
            
            if not twilio_sid or not twilio_token or not twilio_phone:
                print("Warning: Twilio credentials missing, falling back to mock WhatsApp alert")
                print(f"Mock: Sending WhatsApp alert to {phone} - Order {order_id} status changed to {status}. Tracking: {tracking_id}")
                return
                
            client = Client(twilio_sid, twilio_token)
            
            body = f"Hello! Your IoTMart order #{order_id[-6:].upper()} status is now: *{status}*."
            if tracking_id:
                body += f"\nTracking ID: {tracking_id}"
                
            # Twilio WhatsApp requires 'whatsapp:' prefix
            if not phone.startswith('whatsapp:'):
                formatted_phone = f"whatsapp:{phone if phone.startswith('+') else '+91' + phone.lstrip('0')}"
            else:
                formatted_phone = phone
                
            from_phone = f"whatsapp:{twilio_phone}" if not twilio_phone.startswith('whatsapp:') else twilio_phone
                
            message = client.messages.create(
                body=body,
                from_=from_phone,
                to=formatted_phone
            )
            print(f"✅ WhatsApp alert sent successfully to {formatted_phone}. Message SID: {message.sid}")
        except Exception as e:
            print(f"❌ Failed to send WhatsApp alert: {e}")

notify = NotificationService()
