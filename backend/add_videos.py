import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from youtubesearchpython import VideosSearch

load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

async def update_products_with_video():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client.iotmart
    products_col = db.products

    cursor = products_col.find({"video_id": {"$exists": False}})
    products = await cursor.to_list(length=50) # Updating first 50 products quickly

    updated = 0
    for p in products:
        name = p.get("name", "")
        if not name: continue
        
        try:
            # Search YouTube for the product name
            videosSearch = VideosSearch(name + " tutorial review electronic", limit=1)
            result = videosSearch.result()
            
            if result and result.get('result') and len(result['result']) > 0:
                video_id = result['result'][0]['id']
                await products_col.update_one({"_id": p["_id"]}, {"$set": {"video_id": video_id}})
                print(f"Added video {video_id} for {name}")
                updated += 1
            else:
                print(f"No video found for {name}")
        except Exception as e:
            print(f"Error on {name}: {e}")
            
    print(f"Updated {updated} products with video IDs.")
    
if __name__ == "__main__":
    asyncio.run(update_products_with_video())
