import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    print("Seeding database...")
    
    # Clear existing data
    await db.products.delete_many({})
    await db.users.delete_many({})
    await db.coupons.delete_many({})
    
    # Create admin user
    admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@bakery.com",
        "password": pwd_context.hash("1234"),
        "name": "Admin User",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    print(f"Created admin user: admin / 1234")
    
    # Create test customer
    customer = {
        "id": str(uuid.uuid4()),
        "email": "customer@test.com",
        "password": pwd_context.hash("customer123"),
        "name": "Test Customer",
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(customer)
    print(f"Created test customer: customer@test.com / customer123")
    
    # ==========================================
    # 150+ PRODUCTS across 13 CATEGORIES
    # ==========================================
    products = [
        # ====== CAKES (20) ======
        {"name": "Chocolate Truffle Cake", "category": "Cakes", "price": 850, "description": "Rich chocolate cake with smooth ganache truffle coating and dark cocoa layers", "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", "stock": 15},
        {"name": "Red Velvet Cake", "category": "Cakes", "price": 900, "description": "Classic red velvet sponge with cream cheese frosting", "image": "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=500", "stock": 12},
        {"name": "Black Forest Cake", "category": "Cakes", "price": 950, "description": "Chocolate sponge layered with cherries and whipped cream", "image": "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500", "stock": 10},
        {"name": "Vanilla Sponge Cake", "category": "Cakes", "price": 650, "description": "Light and fluffy vanilla bean sponge cake", "image": "https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=500", "stock": 20},
        {"name": "Strawberry Shortcake", "category": "Cakes", "price": 800, "description": "Fresh strawberries on vanilla sponge with whipped cream", "image": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500", "stock": 8},
        {"name": "Pineapple Cake", "category": "Cakes", "price": 750, "description": "Tropical pineapple flavored cake with candied pineapple rings", "image": "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=500", "stock": 14},
        {"name": "Butterscotch Cake", "category": "Cakes", "price": 780, "description": "Caramel butterscotch delight with praline crunch", "image": "https://images.unsplash.com/photo-1567327519087-98314644ce35?w=500", "stock": 11},
        {"name": "Blueberry Cheesecake", "category": "Cakes", "price": 1100, "description": "New York style cheesecake with fresh blueberry compote", "image": "https://images.unsplash.com/photo-1533134242820-d10baa5d3e2e?w=500", "stock": 7},
        {"name": "Tiramisu Cake", "category": "Cakes", "price": 1050, "description": "Italian coffee-flavored layered dessert cake", "image": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500", "stock": 9},
        {"name": "Carrot Cake", "category": "Cakes", "price": 820, "description": "Moist carrot cake with walnuts and cream cheese frosting", "image": "https://images.unsplash.com/photo-1623428187425-5b2247072f11?w=500", "stock": 13},
        {"name": "Rainbow Cake", "category": "Cakes", "price": 980, "description": "Six colorful layers of vanilla sponge with cream cheese frosting", "image": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500", "stock": 6},
        {"name": "Lemon Drizzle Cake", "category": "Cakes", "price": 720, "description": "Zesty lemon sponge with sweet lemon glaze drizzle", "image": "https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?w=500", "stock": 15},
        {"name": "Oreo Chocolate Cake", "category": "Cakes", "price": 880, "description": "Chocolate cake loaded with Oreo cookie chunks and cream", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 10},
        {"name": "Ferrero Rocher Cake", "category": "Cakes", "price": 1200, "description": "Luxurious hazelnut chocolate cake with Ferrero toppings", "image": "https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=500", "stock": 5},
        {"name": "Mango Mousse Cake", "category": "Cakes", "price": 850, "description": "Tropical Alphonso mango mousse on a sponge base", "image": "https://images.unsplash.com/photo-1587241321921-91a834d82fae?w=500", "stock": 12},
        {"name": "Coffee Walnut Cake", "category": "Cakes", "price": 790, "description": "Rich espresso sponge with crunchy walnut pieces", "image": "https://images.unsplash.com/photo-1591135851127-1ec3ff24a72e?w=500", "stock": 14},
        {"name": "Nutella Dream Cake", "category": "Cakes", "price": 920, "description": "Hazelnut chocolate spread layered sponge cake", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", "stock": 8},
        {"name": "Salted Caramel Cake", "category": "Cakes", "price": 860, "description": "Buttery caramel cake with sea salt flakes", "image": "https://images.unsplash.com/photo-1588195538326-c5b1e5b94d1e?w=500", "stock": 11},
        {"name": "Banana Walnut Cake", "category": "Cakes", "price": 680, "description": "Moist ripe banana cake with toasted walnuts", "image": "https://images.unsplash.com/photo-1603532648955-039e59e5fd7d?w=500", "stock": 16},
        {"name": "Triple Chocolate Fudge", "category": "Cakes", "price": 950, "description": "Dark, milk, and white chocolate layers of pure indulgence", "image": "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500", "stock": 9},

        # ====== CUPCAKES (15) ======
        {"name": "Vanilla Buttercream Cupcake", "category": "Cupcakes", "price": 120, "description": "Fluffy vanilla cupcake with swirled buttercream frosting", "image": "https://images.unsplash.com/photo-1519869325930-281384150729?w=500", "stock": 40},
        {"name": "Chocolate Fudge Cupcake", "category": "Cupcakes", "price": 130, "description": "Rich chocolate cupcake with fudge frosting and sprinkles", "image": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500", "stock": 35},
        {"name": "Red Velvet Cupcake", "category": "Cupcakes", "price": 140, "description": "Classic red velvet with cream cheese swirl topping", "image": "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=500", "stock": 30},
        {"name": "Strawberry Cupcake", "category": "Cupcakes", "price": 130, "description": "Fresh strawberry puree cupcake with pink frosting", "image": "https://images.unsplash.com/photo-1603532648955-039e59e5fd7d?w=500", "stock": 28},
        {"name": "Lemon Zest Cupcake", "category": "Cupcakes", "price": 125, "description": "Tangy lemon cupcake with lemon curd center", "image": "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500", "stock": 32},
        {"name": "Salted Caramel Cupcake", "category": "Cupcakes", "price": 150, "description": "Caramel-filled cupcake with salted caramel buttercream", "image": "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500", "stock": 25},
        {"name": "Oreo Cupcake", "category": "Cupcakes", "price": 145, "description": "Cookies and cream cupcake with Oreo crumble topping", "image": "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500", "stock": 30},
        {"name": "Blueberry Cupcake", "category": "Cupcakes", "price": 135, "description": "Bursting blueberry cupcake with cream cheese frosting", "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500", "stock": 26},
        {"name": "Peanut Butter Cupcake", "category": "Cupcakes", "price": 140, "description": "Rich peanut butter cupcake with chocolate ganache drizzle", "image": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=500", "stock": 22},
        {"name": "Espresso Cupcake", "category": "Cupcakes", "price": 145, "description": "Strong espresso cupcake with mocha buttercream frosting", "image": "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=500", "stock": 24},
        {"name": "Carrot Cupcake", "category": "Cupcakes", "price": 130, "description": "Spiced carrot cupcake with cream cheese frosting", "image": "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=500", "stock": 27},
        {"name": "Funfetti Cupcake", "category": "Cupcakes", "price": 120, "description": "Colorful sprinkle-filled vanilla cupcake for celebrations", "image": "https://images.unsplash.com/photo-1519869325930-281384150729?w=500", "stock": 35},
        {"name": "Coconut Cupcake", "category": "Cupcakes", "price": 135, "description": "Coconut cream cupcake topped with toasted coconut flakes", "image": "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500", "stock": 20},
        {"name": "Mint Chocolate Cupcake", "category": "Cupcakes", "price": 140, "description": "Cool mint chocolate cupcake with chocolate chip frosting", "image": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500", "stock": 22},
        {"name": "Pistachio Cupcake", "category": "Cupcakes", "price": 155, "description": "Aromatic pistachio cupcake with rosewater cream topping", "image": "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500", "stock": 18},

        # ====== PASTRIES (15) ======
        {"name": "Chocolate Croissant", "category": "Pastries", "price": 80, "description": "Buttery flaky croissant with rich chocolate filling", "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500", "stock": 30},
        {"name": "Blueberry Danish", "category": "Pastries", "price": 90, "description": "Flaky puff pastry with sweet blueberry cream cheese filling", "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", "stock": 25},
        {"name": "Almond Croissant", "category": "Pastries", "price": 85, "description": "Twice-baked croissant with almond frangipane cream", "image": "https://images.unsplash.com/photo-1549312186-1f5e5a7e7c3b?w=500", "stock": 28},
        {"name": "Cheese Puff Pastry", "category": "Pastries", "price": 70, "description": "Light golden puff pastry with melted Gruyere cheese", "image": "https://images.unsplash.com/photo-1560180445-d3e19fad9d92?w=500", "stock": 35},
        {"name": "Apple Cinnamon Turnover", "category": "Pastries", "price": 95, "description": "Cinnamon spiced apple filling in flaky golden pastry", "image": "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=500", "stock": 22},
        {"name": "Classic Cinnamon Roll", "category": "Pastries", "price": 75, "description": "Warm cinnamon swirl roll with vanilla cream cheese glaze", "image": "https://images.unsplash.com/photo-1509365390695-33aee754301f?w=500", "stock": 32},
        {"name": "Chocolate Eclair", "category": "Pastries", "price": 100, "description": "Choux pastry filled with vanilla cream, topped with chocolate", "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500", "stock": 20},
        {"name": "Strawberry Tart", "category": "Pastries", "price": 110, "description": "Buttery tart shell with custard and fresh glazed strawberries", "image": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=500", "stock": 18},
        {"name": "Lemon Meringue Tart", "category": "Pastries", "price": 105, "description": "Tangy lemon curd tart with torched Swiss meringue", "image": "https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?w=500", "stock": 19},
        {"name": "Tiramisu Cup", "category": "Pastries", "price": 120, "description": "Individual tiramisu cup with mascarpone and espresso layers", "image": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500", "stock": 15},
        {"name": "Vanilla Custard Puff", "category": "Pastries", "price": 65, "description": "Crispy choux puff filled with silky vanilla custard", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 30},
        {"name": "Mixed Fruit Tart", "category": "Pastries", "price": 115, "description": "Shortcrust tart with pastry cream and seasonal fresh fruits", "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500", "stock": 16},
        {"name": "Chocolate Puff", "category": "Pastries", "price": 85, "description": "Crispy puff pastry filled with Belgian chocolate mousse", "image": "https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=500", "stock": 26},
        {"name": "Raspberry Danish", "category": "Pastries", "price": 95, "description": "Sweet raspberry jam danish with almond flakes", "image": "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=500", "stock": 21},
        {"name": "Pain au Chocolat", "category": "Pastries", "price": 90, "description": "French chocolate-filled laminated breakfast pastry", "image": "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=500", "stock": 24},

        # ====== COOKIES (12) ======
        {"name": "Chocolate Chip Cookies", "category": "Cookies", "price": 180, "description": "Classic chewy cookies loaded with chocolate chips (6 pcs)", "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500", "stock": 40},
        {"name": "Oatmeal Raisin Cookies", "category": "Cookies", "price": 160, "description": "Wholesome oatmeal cookies with plump raisins (6 pcs)", "image": "https://images.unsplash.com/photo-1590080876891-5ea8b5f7b9fd?w=500", "stock": 35},
        {"name": "Double Chocolate Cookies", "category": "Cookies", "price": 190, "description": "Intensely rich cocoa cookies with chocolate chunks (6 pcs)", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", "stock": 38},
        {"name": "Butter Shortbread", "category": "Cookies", "price": 150, "description": "Classic Scottish butter shortbread fingers (6 pcs)", "image": "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=500", "stock": 45},
        {"name": "Peanut Butter Cookies", "category": "Cookies", "price": 170, "description": "Crunchy peanut butter cookies with fork marks (6 pcs)", "image": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500", "stock": 32},
        {"name": "Sugar Cookies", "category": "Cookies", "price": 140, "description": "Sweet vanilla sugar cookies with royal icing (6 pcs)", "image": "https://images.unsplash.com/photo-1619985652612-4f5f08b16b99?w=500", "stock": 42},
        {"name": "Macadamia White Choc Cookies", "category": "Cookies", "price": 220, "description": "Premium macadamia nut & white chocolate cookies (6 pcs)", "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=500", "stock": 25},
        {"name": "Gingerbread Cookies", "category": "Cookies", "price": 165, "description": "Spiced gingerbread cookies with icing decoration (6 pcs)", "image": "https://images.unsplash.com/photo-1526081715791-7c538d23b056?w=500", "stock": 30},
        {"name": "Red Velvet Cookies", "category": "Cookies", "price": 195, "description": "Soft red velvet cookies with white chocolate chips (6 pcs)", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", "stock": 28},
        {"name": "Almond Biscotti", "category": "Cookies", "price": 200, "description": "Crunchy Italian almond biscotti, perfect with coffee (6 pcs)", "image": "https://images.unsplash.com/photo-1590080876891-5ea8b5f7b9fd?w=500", "stock": 26},
        {"name": "Snickerdoodle Cookies", "category": "Cookies", "price": 175, "description": "Soft cinnamon-sugar rolled cookies with crackle top (6 pcs)", "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500", "stock": 30},
        {"name": "Cranberry White Choc Cookies", "category": "Cookies", "price": 195, "description": "Tart cranberry cookies with white chocolate drizzle (6 pcs)", "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=500", "stock": 24},

        # ====== BREADS (12) ======
        {"name": "Sourdough Loaf", "category": "Breads", "price": 120, "description": "Artisan sourdough with crispy crust and tangy crumb", "image": "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=500", "stock": 25},
        {"name": "Whole Wheat Bread", "category": "Breads", "price": 80, "description": "100% whole wheat loaf for healthy daily bread", "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", "stock": 30},
        {"name": "French Baguette", "category": "Breads", "price": 90, "description": "Traditional crispy-crust French baguette", "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500", "stock": 28},
        {"name": "Multigrain Bread", "category": "Breads", "price": 95, "description": "Nutritious bread with 7 different grains and seeds", "image": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500", "stock": 22},
        {"name": "Garlic Herb Bread", "category": "Breads", "price": 110, "description": "Roasted garlic and Italian herb pull-apart bread", "image": "https://images.unsplash.com/photo-1573832267867-72b43a3e75d4?w=500", "stock": 20},
        {"name": "Ciabatta Bread", "category": "Breads", "price": 100, "description": "Italian ciabatta with open crumb and olive oil flavor", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 18},
        {"name": "Rye Bread", "category": "Breads", "price": 105, "description": "Dense European rye bread with caraway seeds", "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", "stock": 16},
        {"name": "Soft Dinner Rolls", "category": "Breads", "price": 60, "description": "Pillowy soft buttered dinner rolls (6 pcs)", "image": "https://images.unsplash.com/photo-1608198399988-f0c45f9998b2?w=500", "stock": 35},
        {"name": "Focaccia Bread", "category": "Breads", "price": 130, "description": "Italian rosemary and sea salt focaccia", "image": "https://images.unsplash.com/photo-1573832267867-72b43a3e75d4?w=500", "stock": 15},
        {"name": "Brioche Loaf", "category": "Breads", "price": 140, "description": "Rich buttery French brioche bread", "image": "https://images.unsplash.com/photo-1549312186-1f5e5a7e7c3b?w=500", "stock": 14},
        {"name": "Pumpernickel Bread", "category": "Breads", "price": 115, "description": "Dark German pumpernickel with deep earthy flavor", "image": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500", "stock": 12},
        {"name": "Banana Bread Loaf", "category": "Breads", "price": 150, "description": "Sweet banana bread with chocolate chips and walnuts", "image": "https://images.unsplash.com/photo-1603532648955-039e59e5fd7d?w=500", "stock": 20},

        # ====== DONUTS (12) ======
        {"name": "Glazed Ring Donut", "category": "Donuts", "price": 60, "description": "Classic sugar-glazed yeast donut, light and airy", "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", "stock": 50},
        {"name": "Chocolate Frosted Donut", "category": "Donuts", "price": 75, "description": "Fluffy donut with thick chocolate ganache frosting", "image": "https://images.unsplash.com/photo-1527515545081-5db817172677?w=500", "stock": 40},
        {"name": "Strawberry Sprinkle Donut", "category": "Donuts", "price": 70, "description": "Pink strawberry-frosted donut with rainbow sprinkles", "image": "https://images.unsplash.com/photo-1556302132-40bb13638500?w=500", "stock": 45},
        {"name": "Boston Cream Donut", "category": "Donuts", "price": 90, "description": "Filled with vanilla custard, topped with chocolate glaze", "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", "stock": 30},
        {"name": "Maple Bacon Donut", "category": "Donuts", "price": 100, "description": "Sweet maple glaze with crispy bacon crumble topping", "image": "https://images.unsplash.com/photo-1527515545081-5db817172677?w=500", "stock": 25},
        {"name": "Cinnamon Sugar Donut", "category": "Donuts", "price": 55, "description": "Warm donut rolled in cinnamon and sugar", "image": "https://images.unsplash.com/photo-1556302132-40bb13638500?w=500", "stock": 48},
        {"name": "Jelly Filled Donut", "category": "Donuts", "price": 65, "description": "Soft donut filled with strawberry jam, dusted with sugar", "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", "stock": 38},
        {"name": "Nutella Donut", "category": "Donuts", "price": 85, "description": "Warm donut filled with creamy Nutella hazelnut spread", "image": "https://images.unsplash.com/photo-1527515545081-5db817172677?w=500", "stock": 32},
        {"name": "Matcha Donut", "category": "Donuts", "price": 95, "description": "Japanese matcha green tea glazed donut", "image": "https://images.unsplash.com/photo-1556302132-40bb13638500?w=500", "stock": 20},
        {"name": "Churro Donut", "category": "Donuts", "price": 80, "description": "Crispy churro-style donut with cinnamon and dulce de leche", "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", "stock": 28},
        {"name": "Blueberry Cake Donut", "category": "Donuts", "price": 70, "description": "Dense blueberry cake donut with lemon glaze", "image": "https://images.unsplash.com/photo-1527515545081-5db817172677?w=500", "stock": 35},
        {"name": "Red Velvet Donut", "category": "Donuts", "price": 85, "description": "Red velvet donut with cream cheese frosting drizzle", "image": "https://images.unsplash.com/photo-1556302132-40bb13638500?w=500", "stock": 26},

        # ====== PIES & TARTS (12) ======
        {"name": "Classic Apple Pie", "category": "Pies & Tarts", "price": 450, "description": "Traditional double-crust apple pie with cinnamon spice", "image": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=500", "stock": 10},
        {"name": "Blueberry Pie", "category": "Pies & Tarts", "price": 480, "description": "Sweet blueberry filling in a buttery lattice-top crust", "image": "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=500", "stock": 8},
        {"name": "Pumpkin Pie", "category": "Pies & Tarts", "price": 420, "description": "Spiced pumpkin custard in a flaky graham cracker crust", "image": "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=500", "stock": 12},
        {"name": "Pecan Pie", "category": "Pies & Tarts", "price": 520, "description": "Rich caramelized pecan filling in a buttery crust", "image": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=500", "stock": 9},
        {"name": "Cherry Pie", "category": "Pies & Tarts", "price": 460, "description": "Sweet cherry filling with a golden lattice pastry top", "image": "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=500", "stock": 10},
        {"name": "Key Lime Pie", "category": "Pies & Tarts", "price": 500, "description": "Tangy key lime custard with whipped cream topping", "image": "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=500", "stock": 7},
        {"name": "Chocolate Silk Pie", "category": "Pies & Tarts", "price": 550, "description": "Velvety smooth chocolate silk filling with whipped cream", "image": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=500", "stock": 6},
        {"name": "Fruit Galette", "category": "Pies & Tarts", "price": 380, "description": "Rustic open-faced fruit tart with seasonal berries", "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500", "stock": 11},
        {"name": "Custard Tart", "category": "Pies & Tarts", "price": 350, "description": "Portuguese-style egg custard tart with caramelized top", "image": "https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?w=500", "stock": 15},
        {"name": "Banana Cream Pie", "category": "Pies & Tarts", "price": 470, "description": "Sliced bananas in vanilla cream with whipped topping", "image": "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=500", "stock": 8},
        {"name": "Lemon Tart", "category": "Pies & Tarts", "price": 400, "description": "Crisp shortcrust tart with zesty lemon curd filling", "image": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500", "stock": 12},
        {"name": "Mixed Berry Pie", "category": "Pies & Tarts", "price": 490, "description": "Seasonal mixed berry filling with crumble topping", "image": "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=500", "stock": 9},

        # ====== BROWNIES & BARS (12) ======
        {"name": "Classic Fudge Brownie", "category": "Brownies & Bars", "price": 200, "description": "Dense fudgy chocolate brownie, rich and decadent (4 pcs)", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 35},
        {"name": "Walnut Brownie", "category": "Brownies & Bars", "price": 220, "description": "Chocolate brownie loaded with crunchy toasted walnuts (4 pcs)", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 30},
        {"name": "Cheesecake Brownie", "category": "Brownies & Bars", "price": 250, "description": "Swirled cheesecake and brownie layers in one (4 pcs)", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", "stock": 25},
        {"name": "Salted Caramel Brownie", "category": "Brownies & Bars", "price": 240, "description": "Rich brownie with gooey salted caramel center (4 pcs)", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 28},
        {"name": "Lemon Bars", "category": "Brownies & Bars", "price": 190, "description": "Tangy lemon curd bars on shortbread crust with powdered sugar (4 pcs)", "image": "https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?w=500", "stock": 32},
        {"name": "Raspberry Crumble Bars", "category": "Brownies & Bars", "price": 210, "description": "Oat crumble bars with sweet raspberry jam filling (4 pcs)", "image": "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=500", "stock": 26},
        {"name": "Peanut Butter Blondies", "category": "Brownies & Bars", "price": 200, "description": "Chewy peanut butter blondie bars with chocolate chips (4 pcs)", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", "stock": 30},
        {"name": "S'mores Bars", "category": "Brownies & Bars", "price": 230, "description": "Graham cracker base with chocolate and torched marshmallow (4 pcs)", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 22},
        {"name": "Matcha White Choc Bars", "category": "Brownies & Bars", "price": 260, "description": "Green tea matcha bars with white chocolate chunks (4 pcs)", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", "stock": 18},
        {"name": "Coconut Bars", "category": "Brownies & Bars", "price": 180, "description": "Chewy coconut bars with chocolate-dipped bottom (4 pcs)", "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=500", "stock": 28},
        {"name": "Toffee Crunch Bars", "category": "Brownies & Bars", "price": 220, "description": "Buttery toffee bars with chocolate coating and almond crunch (4 pcs)", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 24},
        {"name": "Nutella Swirl Brownie", "category": "Brownies & Bars", "price": 240, "description": "Fudge brownie with generous Nutella swirl pattern (4 pcs)", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", "stock": 26},

        # ====== MUFFINS (12) ======
        {"name": "Blueberry Muffin", "category": "Muffins", "price": 80, "description": "Classic blueberry muffin bursting with fresh berries", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 40},
        {"name": "Chocolate Chip Muffin", "category": "Muffins", "price": 85, "description": "Soft vanilla muffin loaded with chocolate chips", "image": "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=500", "stock": 38},
        {"name": "Banana Nut Muffin", "category": "Muffins", "price": 80, "description": "Moist banana muffin with crunchy walnut pieces", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 35},
        {"name": "Lemon Poppy Seed Muffin", "category": "Muffins", "price": 85, "description": "Zesty lemon muffin with crunchy poppy seeds", "image": "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=500", "stock": 30},
        {"name": "Double Chocolate Muffin", "category": "Muffins", "price": 95, "description": "Dark cocoa muffin with melted chocolate center", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 32},
        {"name": "Carrot Raisin Muffin", "category": "Muffins", "price": 80, "description": "Spiced carrot muffin with raisins and cream cheese filling", "image": "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=500", "stock": 28},
        {"name": "Cranberry Orange Muffin", "category": "Muffins", "price": 90, "description": "Tart cranberry muffin with orange zest glaze", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 25},
        {"name": "Apple Cinnamon Muffin", "category": "Muffins", "price": 85, "description": "Diced apple muffin with warm cinnamon streusel top", "image": "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=500", "stock": 30},
        {"name": "Corn Muffin", "category": "Muffins", "price": 70, "description": "Sweet cornbread muffin with honey butter", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 35},
        {"name": "Pumpkin Spice Muffin", "category": "Muffins", "price": 90, "description": "Fall-inspired pumpkin muffin with spiced crumb topping", "image": "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=500", "stock": 22},
        {"name": "Bran Muffin", "category": "Muffins", "price": 75, "description": "Fiber-rich bran muffin with molasses and raisins", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 28},
        {"name": "Strawberry Muffin", "category": "Muffins", "price": 85, "description": "Fresh strawberry muffin with vanilla sugar topping", "image": "https://images.unsplash.com/photo-1604882737388-5b77e4b3ef4e?w=500", "stock": 26},

        # ====== MACARONS (12) ======
        {"name": "French Vanilla Macaron", "category": "Macarons", "price": 80, "description": "Delicate almond meringue shell with vanilla buttercream (2 pcs)", "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500", "stock": 30},
        {"name": "Chocolate Macaron", "category": "Macarons", "price": 85, "description": "Rich cocoa shells with dark chocolate ganache filling (2 pcs)", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 28},
        {"name": "Raspberry Macaron", "category": "Macarons", "price": 85, "description": "Pink raspberry shells with berry jam filling (2 pcs)", "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500", "stock": 25},
        {"name": "Pistachio Macaron", "category": "Macarons", "price": 90, "description": "Green pistachio shells with pistachio cream (2 pcs)", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 22},
        {"name": "Salted Caramel Macaron", "category": "Macarons", "price": 90, "description": "Caramel shells with sea salt caramel buttercream (2 pcs)", "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500", "stock": 24},
        {"name": "Lavender Macaron", "category": "Macarons", "price": 95, "description": "Fragrant lavender shells with honey cream filling (2 pcs)", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 18},
        {"name": "Lemon Macaron", "category": "Macarons", "price": 85, "description": "Bright lemon shells with lemon curd center (2 pcs)", "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500", "stock": 26},
        {"name": "Rose Macaron", "category": "Macarons", "price": 95, "description": "Delicate rose-flavored shells with rosewater cream (2 pcs)", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 20},
        {"name": "Coffee Macaron", "category": "Macarons", "price": 85, "description": "Espresso shells with coffee buttercream filling (2 pcs)", "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500", "stock": 24},
        {"name": "Matcha Macaron", "category": "Macarons", "price": 90, "description": "Japanese green tea shells with matcha cream (2 pcs)", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 20},
        {"name": "Macaron Gift Box (12 pcs)", "category": "Macarons", "price": 450, "description": "Assorted macaron collection in a luxury gift box", "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500", "stock": 15},
        {"name": "Macaron Tower (24 pcs)", "category": "Macarons", "price": 850, "description": "Stunning display tower with 24 assorted macarons for events", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 5},

        # ====== CUSTOM CAKES (10) ======
        {"name": "2-Tier Wedding Cake", "category": "Custom Cakes", "price": 4500, "description": "Elegant customizable 2-tier wedding cake with fondant", "image": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500", "stock": 3},
        {"name": "3-Tier Wedding Cake", "category": "Custom Cakes", "price": 6500, "description": "Grand 3-tier wedding cake with sugar flowers", "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500", "stock": 2},
        {"name": "Photo Print Cake", "category": "Custom Cakes", "price": 1200, "description": "Personalized cake with edible photo print of your choice", "image": "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500", "stock": 10},
        {"name": "Number Cake", "category": "Custom Cakes", "price": 1500, "description": "Custom number-shaped cake decorated with flowers & macarons", "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500", "stock": 8},
        {"name": "Heart Shaped Cake", "category": "Custom Cakes", "price": 1100, "description": "Romantic heart-shaped cake for anniversaries and valentines", "image": "https://images.unsplash.com/photo-1588195538326-c5b1e5b94d1e?w=500", "stock": 12},
        {"name": "Designer Theme Cake", "category": "Custom Cakes", "price": 2500, "description": "Premium designer fondant cake with custom theme", "image": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500", "stock": 5},
        {"name": "Kids Cartoon Cake", "category": "Custom Cakes", "price": 1800, "description": "Fun cartoon character themed cake for kids birthdays", "image": "https://images.unsplash.com/photo-1562440499-64c9a5a3b574?w=500", "stock": 7},
        {"name": "Naked Rustic Cake", "category": "Custom Cakes", "price": 1600, "description": "Trendy semi-naked cake with fresh flowers and berries", "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500", "stock": 6},
        {"name": "Drip Cake", "category": "Custom Cakes", "price": 1400, "description": "Instagram-worthy drip cake with ganache and candy toppings", "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", "stock": 8},
        {"name": "Corporate Logo Cake", "category": "Custom Cakes", "price": 2000, "description": "Professional cake with your company logo for events", "image": "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500", "stock": 5},

        # ====== ICE CREAM & FROZEN (10) ======
        {"name": "Vanilla Bean Ice Cream", "category": "Ice Cream & Frozen", "price": 250, "description": "Classic Madagascar vanilla bean ice cream (500ml)", "image": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=500", "stock": 25},
        {"name": "Belgian Chocolate Gelato", "category": "Ice Cream & Frozen", "price": 280, "description": "Rich Belgian chocolate Italian gelato (500ml)", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", "stock": 22},
        {"name": "Strawberry Sorbet", "category": "Ice Cream & Frozen", "price": 220, "description": "Fresh strawberry fruit sorbet, dairy-free (500ml)", "image": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=500", "stock": 20},
        {"name": "Mango Kulfi", "category": "Ice Cream & Frozen", "price": 200, "description": "Traditional Indian mango kulfi ice cream (4 pcs)", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", "stock": 30},
        {"name": "Salted Caramel Ice Cream", "category": "Ice Cream & Frozen", "price": 270, "description": "Salted caramel swirl ice cream with toffee bits (500ml)", "image": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=500", "stock": 18},
        {"name": "Cookie Dough Ice Cream", "category": "Ice Cream & Frozen", "price": 290, "description": "Vanilla ice cream loaded with cookie dough chunks (500ml)", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", "stock": 20},
        {"name": "Pistachio Gelato", "category": "Ice Cream & Frozen", "price": 300, "description": "Authentic Italian pistachio gelato (500ml)", "image": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=500", "stock": 15},
        {"name": "Frozen Yogurt Cup", "category": "Ice Cream & Frozen", "price": 180, "description": "Tangy frozen yogurt with fresh berry toppings", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", "stock": 28},
        {"name": "Ice Cream Sandwich", "category": "Ice Cream & Frozen", "price": 150, "description": "Vanilla ice cream between two fresh-baked cookies", "image": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=500", "stock": 25},
        {"name": "Affogato Kit", "category": "Ice Cream & Frozen", "price": 320, "description": "Vanilla gelato with espresso pour-over kit for 2", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", "stock": 12},

        # ====== BEVERAGES (12) ======
        {"name": "Classic Cappuccino", "category": "Beverages", "price": 150, "description": "Rich espresso with steamed milk and velvety foam", "image": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500", "stock": 100},
        {"name": "Caffe Latte", "category": "Beverages", "price": 160, "description": "Smooth espresso blended with steamed milk", "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", "stock": 100},
        {"name": "Hot Chocolate", "category": "Beverages", "price": 140, "description": "Creamy Belgian hot chocolate with whipped cream", "image": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500", "stock": 80},
        {"name": "Matcha Latte", "category": "Beverages", "price": 180, "description": "Japanese matcha green tea with frothy steamed milk", "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500", "stock": 60},
        {"name": "Iced Americano", "category": "Beverages", "price": 130, "description": "Bold espresso over ice with cold water", "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", "stock": 90},
        {"name": "Chai Tea Latte", "category": "Beverages", "price": 140, "description": "Spiced Indian chai tea with steamed milk", "image": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500", "stock": 70},
        {"name": "Fresh Orange Juice", "category": "Beverages", "price": 120, "description": "Freshly squeezed orange juice, no added sugar", "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500", "stock": 50},
        {"name": "Mango Smoothie", "category": "Beverages", "price": 160, "description": "Thick mango smoothie with yogurt and honey", "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500", "stock": 45},
        {"name": "Berry Smoothie", "category": "Beverages", "price": 170, "description": "Mixed berry smoothie with banana and almond milk", "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500", "stock": 40},
        {"name": "Cold Brew Coffee", "category": "Beverages", "price": 160, "description": "Slow-steeped cold brew coffee, smooth and strong", "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", "stock": 60},
        {"name": "Caramel Frappuccino", "category": "Beverages", "price": 200, "description": "Blended iced coffee with caramel and whipped cream", "image": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500", "stock": 50},
        {"name": "Earl Grey Tea", "category": "Beverages", "price": 100, "description": "Classic bergamot-infused black tea", "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500", "stock": 80},

        # ====== GIFT HAMPERS (8) ======
        {"name": "Cookie Lovers Gift Box", "category": "Gift Hampers", "price": 800, "description": "Assorted premium cookies in a beautiful gift box (12 pcs)", "image": "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=500", "stock": 15},
        {"name": "Tea Time Hamper", "category": "Gift Hampers", "price": 1200, "description": "Scones, cookies, tea bags, and honey in a wicker basket", "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500", "stock": 10},
        {"name": "Chocolate Indulgence Box", "category": "Gift Hampers", "price": 1500, "description": "Brownies, chocolate cookies, truffles, and hot cocoa mix", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500", "stock": 8},
        {"name": "Breakfast Basket", "category": "Gift Hampers", "price": 1000, "description": "Croissants, muffins, jam, butter, and fresh juice", "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500", "stock": 12},
        {"name": "Festive Celebration Box", "category": "Gift Hampers", "price": 2000, "description": "Cupcakes, macarons, cookies, and a mini cake in festive box", "image": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500", "stock": 6},
        {"name": "Vegan Treats Hamper", "category": "Gift Hampers", "price": 900, "description": "Plant-based cookies, brownies, and fruit bars collection", "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=500", "stock": 10},
        {"name": "New Baby Gift Box", "category": "Gift Hampers", "price": 1100, "description": "Pastel cookies, cupcakes, and a mini celebration cake", "image": "https://images.unsplash.com/photo-1519869325930-281384150729?w=500", "stock": 8},
        {"name": "Corporate Gift Box", "category": "Gift Hampers", "price": 1800, "description": "Premium assorted baked goods for corporate gifting", "image": "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=500", "stock": 20},

        # ====== SAVORY (10) ======
        {"name": "Chicken Puff Pastry", "category": "Savory", "price": 90, "description": "Flaky puff pastry with spiced chicken filling", "image": "https://images.unsplash.com/photo-1560180445-d3e19fad9d92?w=500", "stock": 30},
        {"name": "Spinach & Feta Quiche", "category": "Savory", "price": 180, "description": "French quiche with spinach, feta, and caramelized onions", "image": "https://images.unsplash.com/photo-1573832267867-72b43a3e75d4?w=500", "stock": 15},
        {"name": "Cheese Garlic Bread", "category": "Savory", "price": 120, "description": "Loaded cheesy garlic bread with herbs", "image": "https://images.unsplash.com/photo-1573832267867-72b43a3e75d4?w=500", "stock": 25},
        {"name": "Veg Puff", "category": "Savory", "price": 60, "description": "Crispy puff pastry with spiced vegetable filling", "image": "https://images.unsplash.com/photo-1560180445-d3e19fad9d92?w=500", "stock": 40},
        {"name": "Mushroom Vol-au-Vent", "category": "Savory", "price": 150, "description": "Light pastry cups filled with creamy mushroom ragout", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 18},
        {"name": "Ham & Cheese Croissant", "category": "Savory", "price": 110, "description": "Buttery croissant with ham and melted Emmental cheese", "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500", "stock": 22},
        {"name": "Mini Sausage Rolls", "category": "Savory", "price": 130, "description": "Pork sausage rolls in flaky golden pastry (6 pcs)", "image": "https://images.unsplash.com/photo-1560180445-d3e19fad9d92?w=500", "stock": 28},
        {"name": "Pizza Bread Slice", "category": "Savory", "price": 100, "description": "Thick-crust pizza bread with mozzarella and herbs", "image": "https://images.unsplash.com/photo-1573832267867-72b43a3e75d4?w=500", "stock": 30},
        {"name": "Corn & Cheese Muffin", "category": "Savory", "price": 80, "description": "Savory cornbread muffin with cheddar and jalapeno", "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", "stock": 25},
        {"name": "Egg & Bacon Tartlet", "category": "Savory", "price": 140, "description": "Individual tartlet with egg custard and crispy bacon", "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=500", "stock": 16},
    ]
    
    kg_variants = [
        {"label": "0.5kg", "multiplier": 1.0},
        {"label": "1kg", "multiplier": 1.8},
        {"label": "2kg", "multiplier": 3.2},
        {"label": "3kg", "multiplier": 4.5},
        {"label": "4kg", "multiplier": 5.8},
    ]

    for p in products:
        product = {
            "id": str(uuid.uuid4()),
            "name": p["name"],
            "category": p["category"],
            "price": p["price"],
            "description": p["description"],
            "image": p["image"],
            "stock": p["stock"],
            "rating": 0.0,
            "reviews_count": 0,
            "variants": kg_variants
        }
        await db.products.insert_one(product)
    
    print(f"Created {len(products)} products")
    
    # Create coupons
    coupons = [
        {"code": "WELCOME10", "discount_percentage": 10, "expiry_date": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(), "active": True},
        {"code": "SAVE15", "discount_percentage": 15, "expiry_date": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(), "active": True},
        {"code": "SAVE20", "discount_percentage": 20, "expiry_date": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(), "active": True},
        {"code": "FESTIVE25", "discount_percentage": 25, "expiry_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "active": True},
        {"code": "FIRST30", "discount_percentage": 30, "expiry_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(), "active": True},
    ]
    
    await db.coupons.insert_many(coupons)
    print(f"Created {len(coupons)} coupons")
    
    print(f"\nDatabase seeding completed!")
    print(f"Total products: {len(products)}")
    
    # Count categories
    cats = {}
    for p in products:
        cats[p["category"]] = cats.get(p["category"], 0) + 1
    for cat, count in sorted(cats.items()):
        print(f"  {cat}: {count}")
    
    print(f"\nTest Accounts:")
    print(f"Admin: admin / 1234")
    print(f"Customer: customer@test.com / customer123")
    print(f"\nCoupons: WELCOME10 (10%), SAVE15 (15%), SAVE20 (20%), FESTIVE25 (25%), FIRST30 (30%)")

if __name__ == "__main__":
    asyncio.run(seed_database())
    client.close()
