from services.email_service import send_order_confirmation_email

class NotificationService:
    def send_order_placed_email(self, email: str, order_id: str, total_amount: float):
        try:
            send_order_confirmation_email(email, str(order_id), total_amount)
            print(f"Success: Sent order placed email to {email} for Order {order_id}, Total: {total_amount}")
        except Exception as e:
            print(f"Error: Failed to send order email to {email}: {e}")

    def send_whatsapp_alert(self, phone: str, order_id: str, status: str, tracking_id: str = None):
        # Mock WhatsApp alert
        print(f"Mock: Sending WhatsApp alert to {phone} - Order {order_id} status changed to {status}. Tracking: {tracking_id}")
        pass

notify = NotificationService()
