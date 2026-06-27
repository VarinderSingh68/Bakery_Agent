import asyncio
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

WEIGHT_VARIANTS = [
    {"label": "0.5kg", "multiplier": 0.5},
    {"label": "1kg", "multiplier": 1},
    {"label": "2kg", "multiplier": 2},
    {"label": "3kg", "multiplier": 3},
    {"label": "4kg", "multiplier": 4},
]

products = [
    {
        "name": "Chocolate Truffle Cake",
        "category": "Cakes",
        "price": 899,
        "description": "Rich chocolate sponge layered with silky truffle ganache.",
        "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
        "stock": 12,
        "rating": 4.8,
        "reviews_count": 124,
    },
    {
        "name": "Red Velvet Cake",
        "category": "Cakes",
        "price": 949,
        "description": "Classic red velvet cake finished with cream cheese frosting.",
        "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800",
        "stock": 9,
        "rating": 4.7,
        "reviews_count": 98,
    },
    {
        "name": "Vanilla Cupcake Box",
        "category": "Cupcakes",
        "price": 349,
        "description": "Soft vanilla cupcakes topped with whipped buttercream swirls.",
        "image": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800",
        "stock": 20,
        "rating": 4.6,
        "reviews_count": 76,
    },
    {
        "name": "Choco Chip Cookies",
        "category": "Cookies",
        "price": 249,
        "description": "Golden cookies loaded with premium dark chocolate chips.",
        "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
        "stock": 30,
        "rating": 4.9,
        "reviews_count": 143,
    },
    {
        "name": "Butter Croissant",
        "category": "Pastries",
        "price": 129,
        "description": "Flaky, buttery croissant baked fresh every morning.",
        "image": "https://images.unsplash.com/photo-1555507036-ab794f4afe5b?w=800",
        "stock": 18,
        "rating": 4.5,
        "reviews_count": 51,
    },
    {
        "name": "Classic Glazed Donut",
        "category": "Donuts",
        "price": 89,
        "description": "Light yeast donut glazed with a sweet vanilla finish.",
        "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
        "stock": 25,
        "rating": 4.4,
        "reviews_count": 63,
    },
    {
        "name": "Blueberry Muffin",
        "category": "Muffins",
        "price": 119,
        "description": "Moist bakery-style muffin filled with juicy blueberries.",
        "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800",
        "stock": 16,
        "rating": 4.6,
        "reviews_count": 47,
    },
    {
        "name": "Garlic Bread Loaf",
        "category": "Breads",
        "price": 159,
        "description": "Toasted artisan loaf brushed with garlic herb butter.",
        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
        "stock": 14,
        "rating": 4.5,
        "reviews_count": 36,
    },
    {
        "name": "Macaron Gift Box",
        "category": "Macarons",
        "price": 499,
        "description": "Assorted pastel macarons with crisp shells and soft centers.",
        "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800",
        "stock": 11,
        "rating": 4.8,
        "reviews_count": 82,
    },
    {
        "name": "Lemon Tart",
        "category": "Pies & Tarts",
        "price": 289,
        "description": "Buttery tart shell filled with bright lemon custard.",
        "image": "https://images.unsplash.com/photo-1464306076886-debede6a1938?w=800",
        "stock": 10,
        "rating": 4.7,
        "reviews_count": 41,
    },
    {
        "name": "Fudge Brownie",
        "category": "Brownies & Bars",
        "price": 149,
        "description": "Dense cocoa brownie with a glossy, fudgy center.",
        "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
        "stock": 22,
        "rating": 4.9,
        "reviews_count": 88,
    },
    {
        "name": "Cold Coffee",
        "category": "Beverages",
        "price": 179,
        "description": "Chilled creamy coffee blended smooth with a frothy top.",
        "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800",
        "stock": 19,
        "rating": 4.3,
        "reviews_count": 29,
    },
    {
        "name": "Mango Cheesecake Jar",
        "category": "Ice Cream & Frozen",
        "price": 219,
        "description": "Layered chilled cheesecake jar with mango compote.",
        "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
        "stock": 13,
        "rating": 4.6,
        "reviews_count": 34,
    },
    {
        "name": "Savory Sandwich Platter",
        "category": "Savory",
        "price": 549,
        "description": "Chef-made assorted mini sandwiches for tea-time gatherings.",
        "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
        "stock": 7,
        "rating": 4.4,
        "reviews_count": 22,
    },
    {
        "name": "Bakery Gift Hamper",
        "category": "Gift Hampers",
        "price": 1299,
        "description": "Curated hamper with cookies, brownies, tea cake, and treats.",
        "image": "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800",
        "stock": 6,
        "rating": 4.8,
        "reviews_count": 19,
    },
    {
        "name": "Custom Photo Cake",
        "category": "Custom Cakes",
        "price": 1499,
        "description": "Personalized celebration cake with edible photo printing.",
        "image": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800",
        "stock": 5,
        "rating": 4.7,
        "reviews_count": 57,
    },
]


async def seed_products():
    await db.products.delete_many({})
    rows = []
    for product in products:
        rows.append(
            {
                "id": str(uuid.uuid4()),
                **product,
                "variants": WEIGHT_VARIANTS,
            }
        )

    await db.products.insert_many(rows)
    print(f"Seeded {len(rows)} products")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_products())
