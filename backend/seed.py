import asyncio
from database import db
from motor.motor_asyncio import AsyncIOMotorClient

initial_products = [
  {
    "name": "ESP32-WROOM-32 DevKitC",
    "price": 8.99,
    "category": "Microcontrollers",
    "rating": 4.8,
    "reviews": 124,
    "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    "description": "A powerful, generic Wi-Fi+BT+BLE MCU module that targets a wide variety of applications. Features a dual-core 32-bit CPU.",
    "specs": ["Wi-Fi 802.11 b/g/n", "Bluetooth v4.2 BR/EDR and BLE", "Clock speed up to 240 MHz", "520 KB SRAM", "4 MB Flash"],
    "inStock": True
  },
  {
    "name": "Raspberry Pi 4 Model B",
    "price": 45.00,
    "category": "SBCs",
    "rating": 4.9,
    "reviews": 892,
    "image": "https://images.unsplash.com/photo-1601462904263-432243ccb467?auto=format&fit=crop&q=80&w=800",
    "description": "Your tiny, dual-display, desktop computer and robot brains, smart home hub, media centre, networked AI core, factory controller, and much more.",
    "specs": ["Broadcom BCM2711, Quad core Cortex-A72", "4GB/8GB LPDDR4-3200 SDRAM", "2.4 GHz and 5.0 GHz IEEE 802.11ac wireless", "Bluetooth 5.0, BLE", "Gigabit Ethernet"],
    "inStock": True
  },
  {
    "name": "DHT22 Temperature & Humidity Sensor",
    "price": 5.49,
    "category": "Sensors",
    "rating": 4.6,
    "reviews": 312,
    "image": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800",
    "description": "A basic, low-cost digital temperature and humidity sensor. It uses a capacitive humidity sensor and a thermistor to measure the surrounding air.",
    "specs": ["3 to 5V power and I/O", "2.5mA max current use", "Good for 0-100% humidity readings with 2-5% accuracy", "Good for -40 to 80°C temperature readings ±0.5°C accuracy", "No more than 0.5 Hz sampling rate"],
    "inStock": True
  },
  {
    "name": "Arduino Uno R3",
    "price": 23.50,
    "category": "Microcontrollers",
    "rating": 4.7,
    "reviews": 540,
    "image": "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&q=80&w=800",
    "description": "The Arduino UNO is the best board to get started with electronics and coding. If this is your first experience tinkering with the platform, the UNO is the most robust board you can start playing with.",
    "specs": ["Microcontroller: ATmega328P", "Operating Voltage: 5V", "Digital I/O Pins: 14", "Analog Input Pins: 6", "Clock Speed: 16 MHz"],
    "inStock": False
  },
  {
    "name": "Smart Home Starter Kit",
    "price": 89.99,
    "category": "Starter Kits",
    "rating": 4.9,
    "reviews": 56,
    "image": "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=800",
    "description": "Everything you need to build your first smart home project. Includes ESP32, Relay modules, DHT22, and jumper wires.",
    "specs": ["1x ESP32 Dev Board", "4x 5V Relay Modules", "1x DHT22 Sensor", "60x Jumper Wires", "1x Breadboard"],
    "inStock": True,
    "isBundle": True
  },
  {
    "name": "Industrial IoT Gateway Kit",
    "price": 199.00,
    "category": "Starter Kits",
    "rating": 5.0,
    "reviews": 12,
    "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    "description": "Professional grade gateway kit for industrial monitoring. Features LoRaWAN and 4G connectivity.",
    "specs": ["1x Raspberry Pi 4 (8GB)", "1x LoRaWAN Gateway Hat", "1x 4G LTE Module", "1x External Antenna", "1x Aluminum Enclosure"],
    "inStock": True,
    "isBundle": True
  }
]

async def seed():
    print("Cleaning database...")
    await db.products.delete_many({})
    await db.users.delete_many({})
    await db.orders.delete_many({})
    
    # Update products with new schema
    for p in initial_products:
        p["reviews_count"] = p.pop("reviews", 0)
        p["reviews"] = []
        p["stockQuantity"] = 15 if p.get("inStock") else 0

    print("Seeding products...")
    await db.products.insert_many(initial_products)
    
    print("Seeding users...")
    initial_users = [
        {
            "name": "Admin User",
            "email": "admin@iotmart.com",
            "password": "hashed_password", # Simplified for demo
            "role": "admin",
            "status": "active",
            "wishlist": [],
            "addresses": [
                {"id": "addr_1", "type": "Main Office", "address": "IoT Headquarters, Silicon Valley, CA"}
            ]
        },
        {
            "name": "Kaif Ansari",
            "email": "kaif@example.com",
            "password": "hashed_password",
            "role": "user",
            "status": "active",
            "wishlist": [],
            "addresses": [
                {"id": "addr_2", "type": "Home", "address": "123 Tech Lane, New Delhi, India"}
            ]
        }
    ]
    await db.users.insert_many(initial_users)
    
    print("Successfully seeded database!")

if __name__ == "__main__":
    asyncio.run(seed())
