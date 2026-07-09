class NotificationEngine:
    def send_welcome_email(self, name: str, email: str):
        print(f"Mock: Sending welcome email to {name} ({email})")

notify = NotificationEngine()
