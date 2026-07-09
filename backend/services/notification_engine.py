import os
from datetime import datetime
from twilio.rest import Client

class NotificationEngine:
    def __init__(self):
        # We try to use the provided keys as Account SID and Auth Token.
        # If they are API keys, Twilio will still need the main Account SID, but we will try this first.
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "")
        
        try:
            self.twilio_client = Client(self.twilio_sid, self.twilio_token)
        except Exception as e:
            print(f"Twilio init error: {e}")
            self.twilio_client = None

    def _log_to_console(self, channel, to, subject, body):
        """Mock sender that prints beautifully to the backend terminal"""
        print("\n" + "="*60)
        print(f"🚀 [MOCK {channel.upper()} SENT]")
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"👤 To: {to}")
        print(f"📋 Subject: {subject}")
        print("-" * 60)
        print(body)
        print("="*60 + "\n")

    def send_welcome_email(self, user_name: str, user_email: str):
        subject = "Welcome to IoTMart Engineering Hub 🦾"
        body = f"Hello {user_name},\n\Your account has been successfully registered on IoTMart. \nYou now have full access to our B2B marketplace, IoT device dashboard, and engineering support.\n\nHappy Building!\n- The IoTMart System"
        self._log_to_console("Email", user_email, subject, body)
        return True

    def send_order_placed_email(self, user_email: str, order_id: str, total: float):
        subject = f"Order Confirmation: #{order_id[-8:].upper()}"
        body = f"Order Placed Successfully!\n\nYour hardware order has been received and is currently being processed by our logistics team.\nTotal Value: ${total}\n\nYou can track your delivery live on your dashboard.\n"
        self._log_to_console("Email", user_email, subject, body)
        return True

    def send_whatsapp_alert(self, phone: str, order_id: str, status: str, tracking_id: str = None):
        if not phone:
            return False
            
        subject = "WhatsApp Business Alert"
        
        if status.lower() == "shipped":
            body = f"📦 *IoTMart Alert*: Your order #{order_id[-8:].upper()} has been SHIPPED!\n"
            if tracking_id:
                body += f"Track it here: https://shiprocket.co/track/{tracking_id}\n"
            body += "\nReply 'HELP' to connect with an engineer."
        elif status.lower() == "delivered":
            body = f"✅ *IoTMart Alert*: Your order #{order_id[-8:].upper()} has been DELIVERED. Please verify your hardware components."
        else:
            body = f"🔄 *IoTMart Alert*: Order #{order_id[-8:].upper()} status is now: {status}."

        self._log_to_console("WhatsApp", phone, subject, body)
        
        # Real Twilio API Call
        if self.twilio_client:
            try:
                # Format phone number for WhatsApp
                if not phone.startswith('+'):
                    phone = f"+91{phone}" # Assuming India default if no country code
                
                message = self.twilio_client.messages.create(
                    from_=f"whatsapp:{self.twilio_phone}",
                    body=body,
                    to=f"whatsapp:{phone}"
                )
                print(f"✅ Real Twilio WhatsApp Sent! SID: {message.sid}")
                return True
            except Exception as e:
                print(f"❌ Real Twilio API failed: {str(e)}")
                
        return True

# Singleton instance
notify = NotificationEngine()
