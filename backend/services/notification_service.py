class NotificationService:
    def send_order_placed_email(self, email: str, order_id: str, total_amount: float):
        # We can implement a specific order email template later.
        print(f"Mock: Sending order placed email to {email} for Order {order_id}, Total: {total_amount}")
        pass

    def send_whatsapp_alert(self, phone: str, order_id: str, status: str, tracking_id: str = None):
        # Mock WhatsApp alert
        print(f"Mock: Sending WhatsApp alert to {phone} - Order {order_id} status changed to {status}. Tracking: {tracking_id}")
        pass

notify = NotificationService()
