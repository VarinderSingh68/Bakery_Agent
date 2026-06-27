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

FLAVOR_PROFILES = [
    ("Classic", "timeless bakery favorite", 0),
    ("Signature", "house special with rich layered flavor", 18),
    ("Chocolate", "deep cocoa notes and smooth finish", 26),
    ("Vanilla", "light vanilla aroma with balanced sweetness", 14),
    ("Berry", "fruity finish with bright berry accents", 22),
    ("Caramel", "buttery caramel notes and silky texture", 28),
]

CATEGORY_SPECS = {
    "Cakes": {
        "base_price": 620,
        "images": [
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
            "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800",
            "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800",
        ],
        "items": ["Celebration Cake", "Layer Cake", "Cream Cake", "Truffle Cake", "Sponge Cake", "Mousse Cake", "Fusion Cake", "Party Cake", "Premium Cake", "Bakery Cake"],
    },
    "Cupcakes": {
        "base_price": 180,
        "images": [
            "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800",
            "https://images.unsplash.com/photo-1519869325930-281384150729?w=800",
            "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800",
        ],
        "items": ["Cupcake Box", "Buttercream Cupcake", "Celebration Cupcake", "Mini Cupcake Pack", "Swirl Cupcake", "Filled Cupcake", "Frosted Cupcake", "Party Cupcake", "Bakery Cupcake", "Delight Cupcake"],
    },
    "Pastries": {
        "base_price": 210,
        "images": [
            "https://images.unsplash.com/photo-1555507036-ab794f4afe5b?w=800",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
            "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800",
        ],
        "items": ["Croissant", "Danish Pastry", "Butter Pastry", "Cream Pastry", "Filled Pastry", "Twist Pastry", "Flaky Pastry", "Morning Pastry", "Bakehouse Pastry", "Tea-Time Pastry"],
    },
    "Donuts": {
        "base_price": 140,
        "images": [
            "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
            "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800",
        ],
        "items": ["Ring Donut", "Filled Donut", "Glazed Donut", "Bakery Donut", "Party Donut", "Premium Donut", "Soft Donut", "Sprinkle Donut", "Cream Donut", "Fresh Donut"],
    },
    "Cookies": {
        "base_price": 160,
        "images": [
            "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
            "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800",
            "https://images.unsplash.com/photo-1590080877777-95d9b6b67166?w=800",
        ],
        "items": ["Cookie Tin", "Crunch Cookie", "Butter Cookie", "Loaded Cookie", "Bakery Cookie", "Crisp Cookie", "Soft Cookie", "Snack Cookie", "Tea Cookie", "Chunk Cookie"],
    },
    "Muffins": {
        "base_price": 170,
        "images": [
            "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800",
            "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=800",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
        ],
        "items": ["Muffin Pack", "Bakery Muffin", "Soft Muffin", "Filled Muffin", "Classic Muffin", "Breakfast Muffin", "Golden Muffin", "Fresh Muffin", "Tea Muffin", "Delight Muffin"],
    },
    "Breads": {
        "base_price": 190,
        "images": [
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
            "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800",
            "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800",
        ],
        "items": ["Bread Loaf", "Artisan Bread", "Sandwich Bread", "Farmhouse Bread", "Soft Bread", "Daily Bread", "Baker's Bread", "Table Bread", "Toast Bread", "Fresh Bread"],
    },
    "Macarons": {
        "base_price": 320,
        "images": [
            "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800",
            "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800",
            "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800",
        ],
        "items": ["Macaron Box", "Paris Macaron", "Gift Macaron", "Classic Macaron", "Silk Macaron", "Deluxe Macaron", "Pastel Macaron", "Sweet Macaron", "Party Macaron", "Signature Macaron"],
    },
    "Pies & Tarts": {
        "base_price": 280,
        "images": [
            "https://images.unsplash.com/photo-1464306076886-debede6a1938?w=800",
            "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800",
            "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800",
        ],
        "items": ["Fruit Tart", "Bakery Pie", "Cream Tart", "Signature Pie", "Tea Tart", "Classic Pie", "Golden Tart", "Filled Tart", "Delight Pie", "Fresh Tart"],
    },
    "Brownies & Bars": {
        "base_price": 190,
        "images": [
            "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
            "https://images.unsplash.com/photo-1603532648955-039e59e5fd7d?w=800",
            "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800",
        ],
        "items": ["Fudge Brownie", "Dessert Bar", "Bakery Brownie", "Loaded Brownie", "Crunch Bar", "Premium Brownie", "Soft Bar", "Party Brownie", "Tea Bar", "Delight Brownie"],
    },
    "Ice Cream & Frozen": {
        "base_price": 240,
        "images": [
            "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
            "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
            "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800",
        ],
        "items": ["Frozen Dessert", "Cheesecake Jar", "Ice Cream Tub", "Chilled Treat", "Cold Delight", "Frozen Mousse", "Creamy Dessert", "Sundae Box", "Summer Treat", "Cool Cup"],
    },
    "Beverages": {
        "base_price": 150,
        "images": [
            "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
        ],
        "items": ["Cold Coffee", "Cafe Drink", "Bakery Beverage", "Latte Blend", "Refreshment Cup", "Iced Drink", "Signature Beverage", "Shake Glass", "Morning Brew", "Cafe Cooler"],
    },
    "Gift Hampers": {
        "base_price": 780,
        "images": [
            "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800",
            "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=800",
            "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800",
        ],
        "items": ["Gift Hamper", "Celebration Box", "Premium Hamper", "Bakery Basket", "Festive Hamper", "Corporate Hamper", "Treat Box", "Curated Hamper", "Sweet Box", "Occasion Hamper"],
    },
    "Savory": {
        "base_price": 260,
        "images": [
            "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800",
        ],
        "items": ["Savory Platter", "Stuffed Roll", "Snack Box", "Baked Bite", "Tea Savory", "Warm Snack", "Bakery Savory", "Fresh Snack", "Party Bite", "Chef Special"],
    },
    "Custom Cakes": {
        "base_price": 960,
        "images": [
            "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800",
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
            "https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=800",
        ],
        "items": ["Custom Theme Cake", "Photo Cake", "Designer Cake", "Event Cake", "Celebration Cake", "Fondant Cake", "Party Cake", "Premium Custom Cake", "Made-to-Order Cake", "Signature Custom Cake"],
    },
}


def build_catalog():
    rows = []
    for category, spec in CATEGORY_SPECS.items():
        for item_index, item_name in enumerate(spec["items"]):
            for flavor_index, (flavor, note, flavor_price) in enumerate(FLAVOR_PROFILES):
                sequence = item_index * len(FLAVOR_PROFILES) + flavor_index + 1
                rows.append(
                    {
                        "id": str(uuid.uuid4()),
                        "name": f"{flavor} {item_name} {sequence}",
                        "category": category,
                        "price": spec["base_price"] + (item_index * 17) + flavor_price,
                        "description": (
                            f"{flavor} {item_name.lower()} with a {note}. "
                            f"Freshly prepared by our bakery team for {category.lower()} lovers."
                        ),
                        "image": spec["images"][sequence % len(spec["images"])],
                        "stock": 8 + ((item_index * 5 + flavor_index * 3) % 28),
                        "rating": round(4.1 + ((sequence % 9) * 0.1), 1),
                        "reviews_count": 18 + (sequence * 4),
                        "variants": WEIGHT_VARIANTS,
                    }
                )
    return rows


async def seed_products():
    rows = build_catalog()
    await db.products.delete_many({})
    await db.products.insert_many(rows)
    print(f"Seeded {len(rows)} products")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_products())
