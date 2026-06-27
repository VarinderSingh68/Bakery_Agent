import subprocess
import sys

print("=== Bakery Products Seed (bcrypt-safe) ===")

# Products only - no passwords
import uuid&#10;&#10;products = [
    {"name": "Chocolate Truffle Cake", "category": "Cakes", "price": 850, "description": "Rich chocolate cake", "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", "stock": 15},
    {"name": "Red Velvet Cake", "category": "Cakes", "price": 900, "description": "Classic red velvet", "image": "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=500", "stock": 12},
    {"name": "Black Forest Cake", "category": "Cakes", "price": 950, "description": "Chocolate cherry cake", "image": "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500", "stock": 10},
    # Add more - full list in seed_data.py
    {"name": "Glazed Donut", "category": "Donuts", "price": 60, "description": "Classic glazed", "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", "stock": 50},
    {"name": "Chocolate Croissant", "category": "Pastries", "price": 80, "description": "Flaky chocolate", "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500", "stock": 30},
]

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed():
    await db.products.delete_many({})
    for p in products:
        p['id'] = str(uuid.uuid4())
        p['rating'] = 4.5
        p['reviews_count'] = 23
        p['variants'] = [{"label": "Regular", "multiplier": 1}]
        await db.products.insert_one(p)
    print(f"✅ Seeded {len(products)} products to MongoDB!")
    client.close()

if __name__ == '__main__':
    import asyncio
    asyncio.run(seed())
print("Run: python backend/fix_deps_seed.py")

