import os
import httpx
import json
from datetime import datetime

class ShiprocketLogistics:
    def __init__(self):
        self.base_url = "https://apiv2.shiprocket.in/v1/external"
        self.email = os.getenv("SHIPROCKET_EMAIL", "mock_email@iotmart.com")
        self.password = os.getenv("SHIPROCKET_PASSWORD", "mock_pass")
        self.token = None
        
        # If no real keys are provided, we run in MOCK mode to prevent crashes
        self.mock_mode = self.email == "mock_email@iotmart.com"

    async def authenticate(self):
        if self.mock_mode:
            self.token = "mock_shiprocket_token_123"
            return True
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.base_url}/auth/login", json={
                    "email": self.email,
                    "password": self.password
                })
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("token")
                    return True
                else:
                    print(f"Shiprocket Auth Failed: {response.text}")
                    return False
            except Exception as e:
                print(f"Shiprocket API Error: {e}")
                return False

    async def create_shipment(self, order_data: dict, user_data: dict):
        """Creates an order in Shiprocket and returns the AWB/Tracking ID"""
        if self.mock_mode:
            # Generate a realistic looking Mock AWB
            mock_awb = f"AWB{str(int(datetime.now().timestamp()))[-8:]}IN"
            print(f"📦 [MOCK SHIPROCKET] Order pushed to logistics system. Generated AWB: {mock_awb}")
            return {"success": True, "tracking_id": mock_awb, "shiprocket_order_id": "SR123456"}

        if not self.token:
            await self.authenticate()

        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # Format payload according to Shiprocket API docs
        payload = {
            "order_id": str(order_data.get("_id", "UNKNOWN")),
            "order_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "pickup_location": "Primary_Warehouse",
            "billing_customer_name": user_data.get("name", "Guest"),
            "billing_last_name": "",
            "billing_address": order_data.get("shippingAddress", "Digital Delivery"),
            "billing_city": "New Delhi",
            "billing_pincode": "110001",
            "billing_state": "Delhi",
            "billing_country": "India",
            "billing_email": user_data.get("email", "contact@iotmart.com"),
            "billing_phone": "+919876543210",
            "shipping_is_billing": True,
            "order_items": [
                {
                    "name": item.get("name", "IoT Hardware"),
                    "sku": str(item.get("product", "SKU01")),
                    "units": item.get("quantity", 1),
                    "selling_price": item.get("price", 0)
                } for item in order_data.get("items", [])
            ],
            "payment_method": "Prepaid",
            "sub_total": order_data.get("total", 0),
            "length": 10,
            "breadth": 10,
            "height": 10,
            "weight": 0.5
        }

        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(f"{self.base_url}/orders/create/adhoc", json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    # AWB is usually generated in a secondary step or returned if auto-assign is on
                    return {
                        "success": True, 
                        "shiprocket_order_id": data.get("order_id"), 
                        "tracking_id": data.get("awb_code", f"AWB-PENDING-{data.get('order_id')}")
                    }
                return {"success": False, "error": res.text}
            except Exception as e:
                return {"success": False, "error": str(e)}

    async def get_live_tracking(self, tracking_id: str):
        """Fetches live tracking status of an AWB"""
        if self.mock_mode:
            return {
                "success": True,
                "current_status": "In Transit",
                "estimated_delivery": "2026-05-10",
                "scans": [
                    {"date": "2026-05-04 10:00 AM", "location": "Noida Hub", "activity": "Manifest Generated"},
                    {"date": "2026-05-04 14:30 PM", "location": "Delhi Sorting Center", "activity": "Package received at facility"},
                    {"date": "2026-05-05 08:15 AM", "location": "In Transit", "activity": "Out for delivery"}
                ]
            }

        if not self.token:
            await self.authenticate()

        headers = {"Authorization": f"Bearer {self.token}"}
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(f"{self.base_url}/courier/track/awb/{tracking_id}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    track_info = data.get("tracking_data", {})
                    return {
                        "success": True,
                        "current_status": track_info.get("shipment_status"),
                        "estimated_delivery": track_info.get("etd"),
                        "scans": track_info.get("shipment_track_activities", [])
                    }
                return {"success": False, "error": "Tracking unavailable"}
            except Exception as e:
                return {"success": False, "error": str(e)}

logistics = ShiprocketLogistics()
