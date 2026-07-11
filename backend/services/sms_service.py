import os
from twilio.rest import Client

def send_otp_sms(phone: str, otp: str) -> bool:
    print(f"🚀 [SMS OUTGOING] To: {phone}")
    
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    if not twilio_sid or not twilio_token or not twilio_phone:
        print("❌ Missing Twilio credentials in .env")
        return False
        
    try:
        client = Client(twilio_sid, twilio_token)
        body = f"Your IoTMart verification code is: {otp}. Do not share this with anyone."
        
        message = client.messages.create(
            body=body,
            from_=twilio_phone,
            to=phone
        )
        print(f"✅ SMS sent successfully. Message SID: {message.sid}")
        return True
    except Exception as e:
        print(f"❌ Failed to send SMS: {e}")
        return False
