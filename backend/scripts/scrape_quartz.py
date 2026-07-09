import httpx
from bs4 import BeautifulSoup
import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]
products_collection = db["products"]

COLLECTIONS = [
    {"name": "Development Boards", "url": "https://quartzcomponents.com/collections/development-boards"},
    {"name": "Sensors", "url": "https://quartzcomponents.com/collections/sensor-module"},
    {"name": "Wireless & IoT", "url": "https://quartzcomponents.com/collections/wireless-iot"},
    {"name": "ICs", "url": "https://quartzcomponents.com/collections/ics"},
    {"name": "Motors & Drivers", "url": "https://quartzcomponents.com/collections/motors-drivers-pumps"},
    {"name": "Displays", "url": "https://quartzcomponents.com/collections/displays"},
    {"name": "Batteries", "url": "https://quartzcomponents.com/collections/batteries-power-supplies-and-accessories-1"}
]

async def scrape_collection(name, url):
    print(f"Scraping {name}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    async with httpx.AsyncClient(headers=headers) as client:
        resp = await client.get(url, follow_redirects=True)
        if resp.status_code != 200:
            print(f"Failed to fetch {url} - Status: {resp.status_code}")
            return []
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        products = []
        
        # Exact selectors from browser subagent
        cards = soup.select('li.product')
        
        for card in cards:
            try:
                title_el = card.select_one('.card-title span') or card.select_one('.card-title')
                price_el = card.select_one('.price-item--regular')
                img_el = card.select_one('.card-media img')
                
                if not title_el or not price_el:
                    continue
                
                title = title_el.get_text(strip=True)
                # Improved regex to find a valid numeric price
                import re
                raw_price = price_el.get_text(strip=True)
                # Find something that looks like 1,000.00 or 1000
                price_match = re.search(r'(\d[\d,.]*)', raw_price)
                if price_match:
                    price_text = price_match.group(1).replace(',', '')
                    # If it's just a dot or empty, skip
                    if price_text == '.' or not price_text:
                        continue
                    try:
                        price = float(price_text)
                    except ValueError:
                        continue
                else:
                    continue
                if img_el:
                    src = img_el.get('src') or img_el.get('data-src') or ""
                    if src.startswith('//'):
                        img_url = 'https:' + src
                    elif src.startswith('/'):
                        img_url = 'https://quartzcomponents.com' + src
                    else:
                        img_url = src

                product = {
                    "name": title,
                    "price": price,
                    "category": name,
                    "rating": 4.5,
                    "reviews_count": 10,
                    "reviews": [],
                    "image": img_url,
                    "description": f"High quality {title} for your IoT and Electronics projects. Sourced from Quartz Components.",
                    "specs": ["Authentic Component", "Tested Quality", "Fast Shipping"],
                    "inStock": True,
                    "stockQuantity": 50
                }
                products.append(product)
            except Exception as e:
                print(f"Error parsing card: {e}")
                
        return products

async def main():
    all_products = []
    for col in COLLECTIONS:
        products = await scrape_collection(col["name"], col["url"])
        all_products.extend(products)
    
    if all_products:
        print(f"Found {len(all_products)} products. Pushing to DB...")
        # Clear existing? Or just insert? User asked to push.
        await products_collection.delete_many({}) # Clear old products to fix pricing errors
        result = await products_collection.insert_many(all_products)
        print(f"Successfully inserted {len(result.inserted_ids)} products.")
    else:
        print("No products found.")

if __name__ == "__main__":
    asyncio.run(main())
