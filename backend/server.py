from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, Cookie, Response, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import motor.motor_asyncio
from jinja2 import Template
import httpx
import hashlib
import secrets
import json
import re
from database import get_db, engine, Base, AsyncSessionLocal
import crud
from models import Order # OrderCreate is defined in this file, but Order model is imported

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

raw_cors_origins_str = os.environ.get('CORS_ORIGINS')
if raw_cors_origins_str:
    cors_origins = [origin.strip() for origin in raw_cors_origins_str.split(',') if origin.strip()]
else:
    # Default origins if the environment variable is not set
    cors_origins = [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'https://bakery-frontend-xiyt.onrender.com',
    ]

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
ADMIN_LOGIN_EMAIL = os.environ.get("ADMIN_LOGIN_EMAIL", "admin@bakery.com").strip().lower()
ADMIN_LOGIN_USERNAME = os.environ.get("ADMIN_LOGIN_USERNAME", "admin").strip().lower()
ADMIN_LOGIN_PASSWORD = os.environ.get("ADMIN_LOGIN_PASSWORD", "1234")

# Email configuration
DEFAULT_SENDER_EMAIL = 'ngw.designer@gmail.com'
MAIL_USERNAME = os.environ.get('MAIL_USERNAME', DEFAULT_SENDER_EMAIL)
MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
MAIL_FROM = os.environ.get('MAIL_FROM', MAIL_USERNAME or DEFAULT_SENDER_EMAIL)
MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.environ.get('MAIL_PORT', '587'))
ADMIN_EMAIL = DEFAULT_SENDER_EMAIL

# Configure email if credentials are provided
fm = None
EMAIL_CONFIGURED = False
if MAIL_USERNAME and MAIL_PASSWORD:
    try:
        conf = ConnectionConfig(
            MAIL_USERNAME=MAIL_USERNAME,
            MAIL_PASSWORD=MAIL_PASSWORD,
            MAIL_FROM=MAIL_FROM,
            MAIL_PORT=MAIL_PORT,
            MAIL_SERVER=MAIL_SERVER,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        fm = FastMail(conf)
        EMAIL_CONFIGURED = True
    except Exception as e:
        logging.warning(f"Email configuration failed: {e}")
else:
    logging.warning("Email credentials not found in .env file. Email sending will be disabled.")

# Security
# Allow cookie-only Google OAuth sessions to reach the auth dependency
# without forcing an Authorization header first.
security = HTTPBearer(auto_error=False)

# MongoDB optional - SQL primary for orders/cart (Atlas SSL workaround)
# Comment out Atlas if issues
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "bakery")
mongo_client = None
db = None
try:
    mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = mongo_client[DB_NAME]
except Exception as e:
    logging.warning(f"MongoDB connection failed (will use SQL fallback): {e}")
    mongo_client = None
    db = None

# Create the main app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
UPLOAD_ROOT = Path(os.environ.get("UPLOAD_DIR", ROOT_DIR / "uploads"))
OFFER_UPLOAD_DIR = UPLOAD_ROOT / "offers"
BANNER_UPLOAD_DIR = UPLOAD_ROOT / "banners"
OFFER_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
BANNER_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# Models
class UserCreate(BaseModel): 
    email: EmailStr
    username: Optional[str] = None
    password: str = Field(min_length=6)
    name: str

class UserLogin(BaseModel):
    email: str
    password: str
 
class GoogleBrowserLogin(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    google_id: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    name: str
    role: str = "customer"
    created_at: str
 
class Variant(BaseModel):
    label: str
    multiplier: float

 
DEFAULT_WEIGHT_VARIANTS = [
    {"label": "0.5kg", "multiplier": 0.5},
    {"label": "1kg", "multiplier": 1},
    {"label": "2kg", "multiplier": 2},
    {"label": "3kg", "multiplier": 3},
    {"label": "4kg", "multiplier": 4},
]
 
DEFAULT_CATEGORY_VARIANTS = {
    "Cakes": DEFAULT_WEIGHT_VARIANTS,
    "Custom Cakes": [
        {"label": "1kg", "multiplier": 1},
        {"label": "2kg", "multiplier": 2},
        {"label": "3kg", "multiplier": 3},
        {"label": "4kg", "multiplier": 4},
        {"label": "5kg", "multiplier": 5},
    ],
    "Cupcakes": [
        {"label": "One box", "multiplier": 1},
        {"label": "2 boxes", "multiplier": 2},
        {"label": "Party box", "multiplier": 3},
    ],
    "Cookies": [
        {"label": "One box", "multiplier": 1},
        {"label": "2 boxes", "multiplier": 2},
        {"label": "Family box", "multiplier": 3},
    ],
    "Macarons": [
        {"label": "Box of 6", "multiplier": 1},
        {"label": "Box of 12", "multiplier": 2},
        {"label": "Box of 24", "multiplier": 4},
    ],
    "Donuts": [
        {"label": "1 piece", "multiplier": 1},
        {"label": "Box of 6", "multiplier": 6},
        {"label": "Box of 12", "multiplier": 12},
    ],
    "Pastries": [
        {"label": "1 piece", "multiplier": 1},
        {"label": "Box of 2", "multiplier": 2},
        {"label": "Box of 4", "multiplier": 4},
    ],
    "Muffins": [
        {"label": "1 piece", "multiplier": 1},
        {"label": "Box of 4", "multiplier": 4},
        {"label": "Box of 8", "multiplier": 8},
    ],
    "Breads": [
        {"label": "1 loaf", "multiplier": 1},
        {"label": "2 loaves", "multiplier": 2},
        {"label": "Family pack", "multiplier": 3},
    ],
    "Pies & Tarts": [
        {"label": "Single", "multiplier": 1},
        {"label": "Box of 2", "multiplier": 2},
        {"label": "Box of 4", "multiplier": 4},
    ],
    "Brownies & Bars": [
        {"label": "Box of 4", "multiplier": 1},
        {"label": "Box of 8", "multiplier": 2},
        {"label": "Box of 12", "multiplier": 3},
    ],
    "Beverages": [
        {"label": "250ml", "multiplier": 1},
        {"label": "500ml", "multiplier": 2},
        {"label": "1 litre", "multiplier": 4},
    ],
    "Ice Cream & Frozen": [
        {"label": "Single cup", "multiplier": 1},
        {"label": "500ml tub", "multiplier": 2},
        {"label": "1 litre tub", "multiplier": 4},
    ],
    "Savory": [
        {"label": "1 plate", "multiplier": 1},
        {"label": "2 plates", "multiplier": 2},
        {"label": "Party tray", "multiplier": 4},
    ],
    "Gift Hampers": [
        {"label": "Small box", "multiplier": 1},
        {"label": "Medium box", "multiplier": 1.5},
        {"label": "Large box", "multiplier": 2.5},
    ],
}

DEFAULT_PACK_VARIANTS = [
    {"label": "Single", "multiplier": 1},
    {"label": "Pack of 2", "multiplier": 2},
    {"label": "Pack of 4", "multiplier": 4},
]


def get_category_variants(category: Optional[str]) -> list:
    return DEFAULT_CATEGORY_VARIANTS.get(category or "", DEFAULT_PACK_VARIANTS)


def with_weight_variants(product: Optional[dict]):
    if not product:
        return product

    normalized = dict(product)
    normalized["variants"] = normalized.get("variants") or get_category_variants(normalized.get("category"))
    return normalized

class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str
    image: str
    stock: int
    rating: float = 0.0
    reviews_count: int = 0
    variants: Optional[List[Variant]] = None
 
class CartItem(BaseModel):
    product_id: str
    quantity: int
    name: str
    price: Union[float, int]
    image: str
    variant: Optional[str] = None
 
    class Config:
        arbitrary_types_allowed = True
 
class Cart(BaseModel):
    user_id: str
    items: List[CartItem]
    total: float
 
class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: str

class OrderCreate(BaseModel): 
    items: List[OrderItem]
    subtotal: float
    shipping_cost: float
    tax: float
    discount: float = 0.0
    total: float
    payment_method: str
    delivery_date: str
    shipping_address: str
    shipping_city: str
    shipping_state: str
    shipping_zip: str
    coupon_code: Optional[str] = None
 
class Order(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    order_number: str
    items: List[OrderItem]
    subtotal: float
    shipping_cost: float
    tax: float
    discount: float
    total: float
    payment_method: str
    delivery_date: str
    shipping_address: str
    shipping_city: str
    shipping_state: str
    shipping_zip: str
    status: str
    created_at: str

class Review(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str
 
class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str
 
class Coupon(BaseModel):
    code: str
    discount_percentage: float
    expiry_date: str
    active: bool
 
class CouponValidate(BaseModel):
    code: str
    total: float
 
class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
 
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    description: str
    image: str
    stock: int
    variants: Optional[List[Variant]] = None 

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image: Optional[str] = None
    stock: Optional[int] = None
    variants: Optional[List[Variant]] = None
 
class OfferMediaCreate(BaseModel):
    kind: str = Field(pattern="^(offer|reel)$")
    title: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    badge: Optional[str] = None
    image_url: Optional[str] = None
    reel_url: Optional[str] = None
    cta_label: Optional[str] = None
    cta_url: Optional[str] = None
    active: bool = True
    sort_order: int = 0
 
class OfferMediaUpdate(BaseModel):
    kind: Optional[str] = Field(default=None, pattern="^(offer|reel)$")
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    badge: Optional[str] = None
    image_url: Optional[str] = None
    reel_url: Optional[str] = None
    cta_label: Optional[str] = None
    cta_url: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None
 
class BannerCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    subtitle: Optional[str] = ""
    description: Optional[str] = ""
    cta: Optional[str] = "Shop Now"
    cta_link: Optional[str] = "/shop"
    image: Optional[str] = ""
    bg_from: str = "#2D241E"
    bg_to: str = "#5C4B40"
    accent: str = "#F2D780"
    active: bool = True
    sort_order: int = 0
 
class BannerUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cta: Optional[str] = None
    cta_link: Optional[str] = None
    image: Optional[str] = None
    bg_from: Optional[str] = None
    bg_to: Optional[str] = None
    accent: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None
 
DEFAULT_BANNERS = [
    {
        "title": "Fresh Baked Daily",
        "subtitle": "150+ Artisan Products",
        "description": "From classic cakes to gourmet macarons - everything made fresh every morning",
        "cta": "Shop All",
        "cta_link": "/shop",
        "bg_from": "#2D241E",
        "bg_to": "#5C4B40",
        "accent": "#F2D780",
        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
        "active": True,
        "sort_order": 1,
    },
    {
        "title": "New: Macarons Collection",
        "subtitle": "French Elegance",
        "description": "12 exquisite flavors - from classic vanilla to lavender rose. Perfect for gifting.",
        "cta": "Explore Macarons",
        "cta_link": "/shop?category=Macarons",
        "bg_from": "#4A6B53",
        "bg_to": "#2D5438",
        "accent": "#F2D780",
        "image": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800",
        "active": True,
        "sort_order": 2,
    },
    {
        "title": "Donut Fest",
        "subtitle": "Get 20% Off",
        "description": "Glazed, frosted, filled - try our irresistible donut varieties. Use code SAVE20.",
        "cta": "Order Donuts",
        "cta_link": "/shop?category=Donuts",
        "bg_from": "#C25934",
        "bg_to": "#A84C2A",
        "accent": "#F2D780",
        "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
        "active": True,
        "sort_order": 3,
    },
] 

DEFAULT_PRODUCTS = [
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


def build_chat_reply(message: str) -> str:
    text = (message or "").lower().strip()

    if "cake" in text or "product" in text or "shop" in text:
        return (
            "You can explore all bakery products in the Shop page. "
            "Open any product card to view full details, options, and add it to cart."
        )

    if "delivery" in text or "shipping" in text or "date" in text:
        return (
            "Delivery date selection is available during checkout. "
            "For urgent updates, you can use the WhatsApp button for quick support."
        )

    if "custom" in text or "birthday" in text or "design" in text:
        return (
            "Custom cake orders are available. Share flavor, weight, design theme, and date, "
            "then contact the bakery on WhatsApp for faster confirmation."
        )

    if "contact" in text or "phone" in text or "number" in text or "whatsapp" in text:
        return "You can contact the bakery directly on WhatsApp at 6283968189."

    if "login" in text or "account" in text or "google" in text:
        return (
            "If login fails, refresh once and retry. "
            "You can use email/password or Continue with Google."
        )

    if "cart" in text or "checkout" in text or "payment" in text:
        return (
            "Add items from product details or shop cards, then proceed to cart and checkout "
            "to complete your order."
        )

    return (
        "I can help with products, delivery, custom cake orders, cart/checkout, login, and contact details."
    )

# Helper functions
def hash_password(password: str) -> str:
    iterations = 390000
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${digest.hex()}" 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt, stored_hash = hashed_password.split("$", 3)
            digest = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                int(iterations),
            ).hex()
            return secrets.compare_digest(digest, stored_hash)
        except Exception:
            return False

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_fallback_users() -> dict:
    return {
        "customer@test.com": {
            "id": "fallback-customer",
            "email": "customer@test.com",
            "username": "customer",
            "name": "Test Customer",
            "password": hash_password("customer123"),
            "role": "customer"
        },
        ADMIN_LOGIN_EMAIL: {
            "id": "fallback-admin",
            "email": ADMIN_LOGIN_EMAIL,
            "username": ADMIN_LOGIN_USERNAME,
            "name": "Admin User",
            "password": hash_password(ADMIN_LOGIN_PASSWORD),
            "role": "admin"
        }
    } 

FALLBACK_USERS = get_fallback_users()
LOCAL_AUTH_USERS_PATH = ROOT_DIR / "auth_users.json"


def load_local_auth_users() -> dict:
    if not LOCAL_AUTH_USERS_PATH.exists():
        return {}

    try:
        with LOCAL_AUTH_USERS_PATH.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, dict) else {}
    except Exception as e:
        logging.warning(f"Failed to load local auth users: {e}")
        return {}


def save_local_auth_users(users: dict) -> None:
    try: 
        with LOCAL_AUTH_USERS_PATH.open("w", encoding="utf-8") as file:
            json.dump(users, file, indent=2)
    except Exception as e:
        logging.error(f"Failed to save local auth users: {e}")
        raise


def get_local_user_by_email(email: str) -> Optional[dict]:
    return load_local_auth_users().get(email)
 

def get_local_user_by_username(username: str) -> Optional[dict]:
    users = load_local_auth_users().values()
    return next((user for user in users if (user.get("username") or "").lower() == username.lower()), None)


def get_local_user_by_id(user_id: str) -> Optional[dict]:
    users = load_local_auth_users().values()
    return next((user for user in users if user.get("id") == user_id), None)
 

def store_local_auth_user(user: dict) -> dict:
    users = load_local_auth_users()
    users[user["email"]] = user
    save_local_auth_users(users)
    return user

 
def serialize_sqlalchemy_record(record) -> dict:
    data = dict(record.__dict__)
    data.pop('_sa_instance_state', None)

    for key, value in list(data.items()):
        if isinstance(value, datetime):
            data[key] = value.isoformat()

    return data
 
def get_instagram_embed_url(reel_url: Optional[str]) -> Optional[str]:
    if not reel_url:
        return None

    cleaned = reel_url.strip()
    if not cleaned:
        return None

    if cleaned.rstrip("/").endswith("/embed"):
        return cleaned

    match = re.search(r"instagram\.com/(reel|p|tv)/([^/?#]+)", cleaned)
    if not match:
        return None

    content_type, shortcode = match.groups()
    return f"https://www.instagram.com/{content_type}/{shortcode}/embed"
 
def normalize_offer_payload(payload: dict) -> dict:
    data = {
        key: value.strip() if isinstance(value, str) else value
        for key, value in payload.items()
    }
    data["kind"] = data.get("kind") or "offer"
    data["description"] = data.get("description") or ""
    data["badge"] = data.get("badge") or ""
    data["cta_label"] = data.get("cta_label") or ""
    data["cta_url"] = data.get("cta_url") or ""

    if data["kind"] == "offer" and not data.get("image_url"):
        raise HTTPException(status_code=400, detail="Offer image is required")

    if data["kind"] == "reel":
        if not data.get("reel_url"):
            raise HTTPException(status_code=400, detail="Instagram reel link is required")
        data["embed_url"] = get_instagram_embed_url(data.get("reel_url"))
        if not data["embed_url"]:
            raise HTTPException(status_code=400, detail="Enter a valid Instagram reel URL")
    else:
        data["reel_url"] = None
        data["embed_url"] = None

    return data
 
def normalize_banner_payload(payload: dict) -> dict:
    data = {
        key: value.strip() if isinstance(value, str) else value
        for key, value in payload.items()
    }
    data["title"] = data.get("title") or ""
    if not data["title"]:
        raise HTTPException(status_code=400, detail="Banner title is required")

    data["subtitle"] = data.get("subtitle") or ""
    data["description"] = data.get("description") or ""
    data["cta"] = data.get("cta") or "Shop Now"
    data["cta_link"] = data.get("cta_link") or "/shop"
    data["image"] = data.get("image") or ""
    data["bg_from"] = data.get("bg_from") or "#2D241E"
    data["bg_to"] = data.get("bg_to") or "#5C4B40"
    data["accent"] = data.get("accent") or "#F2D780"
    data["sort_order"] = int(data.get("sort_order") or 0)
    if "active" not in data or data["active"] is None:
        data["active"] = True
    return data
 
def build_upload_url(request: Request, filename: str) -> str:
    base_url = str(request.base_url).rstrip("/")
    return f"{base_url}/uploads/offers/{filename}"

 
def build_banner_upload_url(request: Request, filename: str) -> str:
    base_url = str(request.base_url).rstrip("/")
    return f"{base_url}/uploads/banners/{filename}"

 
def format_order_item_html(item) -> str:
    """Format a single order item as HTML for email templates.
    Works with both dictionaries and Pydantic models."""
    # Handle both dict and Pydantic model
    if isinstance(item, dict):
        name = item.get("name", "")
        price = item.get("price", 0)
        quantity = item.get("quantity", 1)
        image = item.get("image", "")
        variant = item.get("variant", "")
    else:
        # Pydantic model
        name = item.name
        price = item.price
        quantity = item.quantity
        image = item.image
        variant = getattr(item, "variant", "")
    
    variant_html = ""
    if variant:
        variant_html = f'<br><small>({variant})</small>'
    
    return (
        f'<div class="item">'
        f'<img src="{image}" alt="{name}" style="width:80px;height:auto;margin-right:12px;vertical-align:middle;border:1px solid #ddd;border-radius:4px;">'
        f'<strong>{name}</strong>'
        f'{variant_html}'
        f'<br>Qty: {quantity} × ₹{price:.2f} = ₹{price * quantity:.2f}'
        f'</div>'
    )


async def find_user_by_email(email: str, db: AsyncSession):
    user = await crud.get_user_by_email(db, email)
    if user:
        return serialize_sqlalchemy_record(user)
    return get_local_user_by_email(email)


async def find_user_by_username(username: str, db: AsyncSession):
    user = await crud.get_user_by_username(db, username)
    if user:
        return serialize_sqlalchemy_record(user)
    local_user = get_local_user_by_username(username)
    if local_user:
        return local_user
    return next((user for user in FALLBACK_USERS.values() if (user.get("username") or "").lower() == username.lower()), None)


async def find_user_by_id(user_id: str, db: AsyncSession):
    user = await crud.get_user_by_id(db, user_id)
    if user:
        return serialize_sqlalchemy_record(user)
    return get_local_user_by_id(user_id)


async def find_session_by_token(session_token: str, db: AsyncSession):
    session = await crud.get_session_by_token(db, session_token)
    if session:
        return serialize_sqlalchemy_record(session)
    return None


async def ensure_sql_user(db: AsyncSession, user_data: dict) -> dict:
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")

    existing_by_id = None
    user_id = user_data.get("id")
    if user_id:
        existing_by_id = await crud.get_user_by_id(db, user_id)
    if existing_by_id:
        return serialize_sqlalchemy_record(existing_by_id)

    existing_by_email = None
    email = user_data.get("email")
    if email:
        existing_by_email = await crud.get_user_by_email(db, email)
    if existing_by_email:
        return serialize_sqlalchemy_record(existing_by_email)

    created_at_value = user_data.get("created_at")
    if isinstance(created_at_value, str):
        try:
            created_at_value = datetime.fromisoformat(created_at_value)
        except Exception:
            created_at_value = None

    user_dict = {
        "id": user_id or str(uuid.uuid4()),
        "email": email,
        "username": user_data.get("username"),
        "password": user_data.get("password"),
        "name": user_data.get("name") or "User",
        "role": user_data.get("role", "customer"),
        "picture": user_data.get("picture"),
        "google_id": user_data.get("google_id"),
        "created_at": created_at_value or datetime.now(timezone.utc),
    }

    try:
        created_user = await crud.create_user(db, user_dict)
        return serialize_sqlalchemy_record(created_user)
    except Exception as exc:
        logging.warning(f"ensure_sql_user fallback fetch after create failure: {exc}")
        existing_by_email = await crud.get_user_by_email(db, email)
        if existing_by_email:
            return serialize_sqlalchemy_record(existing_by_email)
        raise


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(db: AsyncSession = Depends(get_db), credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), session_token: Optional[str] = Cookie(None)):
    # Try session token from cookie first (Google OAuth)
    if session_token:
        try:
            session = await crud.get_session_by_token(db, session_token)
            if session:
                # Check expiry
                expires_at = session.expires_at
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                if expires_at >= datetime.now(timezone.utc):
                    user = await crud.get_user_by_id(db, session.user_id)
                    if user:
                        return User(**serialize_sqlalchemy_record(user))
        except Exception as e:
            logging.error(f"Session token error: {e}")
    
    # Fallback to JWT token (email/password auth)
    try:
        if not credentials:
            raise HTTPException(status_code=401, detail="Authentication required")

        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub") or payload.get("user_id")
        email: Optional[str] = payload.get("email")
        if user_id is None and email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")

        user = None
        if user_id:
            sql_user = await crud.get_user_by_id(db, user_id)
            if sql_user:
                user = serialize_sqlalchemy_record(sql_user)
        if user is None and email:
            user = await find_user_by_email(email, db)

        # Keep demo credentials functional even if DB is unavailable.
        if user is None:
            if user_id:
                user = next((u for u in FALLBACK_USERS.values() if u.get("id") == user_id), None)
            if user is None and email:
                user = FALLBACK_USERS.get(email)

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        user = await ensure_sql_user(db, user)
        return User(**user)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication required")

async def get_admin_user(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def exchange_google_session(session_id: str) -> dict:
    session_id = (session_id or "").strip()
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")

    oauth_urls = [
        os.environ.get("EMERGENT_OAUTH_SESSION_URL"),
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        "https://auth.emergentagent.com/auth/v1/env/oauth/session-data",
    ]
    oauth_urls = [url for url in oauth_urls if url]

    headers = {"X-Session-ID": session_id}
    last_error = None

    async with httpx.AsyncClient(follow_redirects=True) as client:
        for url in oauth_urls:
            for method in ("GET", "POST"):
                try:
                    if method == "GET":
                        response = await client.get(url, headers=headers, timeout=10.0)
                    else:
                        response = await client.post(
                            url,
                            headers=headers,
                            json={"session_id": session_id},
                            timeout=10.0,
                        )

                    response.raise_for_status()
                    payload = response.json()
                    if isinstance(payload, dict):
                        user_payload = payload.get("user") if isinstance(payload.get("user"), dict) else payload
                        session_token = (
                            payload.get("session_token")
                            or user_payload.get("session_token")
                            or payload.get("token")
                            or user_payload.get("token")
                        )
                        email = user_payload.get("email")
                        if email and session_token:
                            return {
                                "email": email,
                                "name": user_payload.get("name", "User"),
                                "picture": user_payload.get("picture"),
                                "session_token": session_token,
                            }
                except Exception as exc:
                    last_error = exc
                    logging.warning(f"OAuth session exchange failed via {method} {url}: {exc}")

    logging.error(f"Failed to exchange session_id after trying all providers: {last_error}")
    raise HTTPException(status_code=401, detail="Invalid session")

@api_router.get("/auth/debug/oauth-config")
async def debug_oauth_config():
    """Debug endpoint to check if OAuth is configured correctly"""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    
    return {
        "client_id_set": bool(client_id),
        "client_id_preview": client_id[:20] + "..." if client_id and len(client_id) > 20 else client_id,
        "client_secret_set": bool(client_secret),
        "client_secret_is_placeholder": client_secret == "your-google-oauth-client-secret" if client_secret else True,
        "redirect_uri_backend": "http://localhost:3001/auth/callback",
        "frontend_expected_redirect_uri": "http://localhost:3001/auth/callback",
        "match": True,
        "instructions": {
            "step_1": "Ensure GOOGLE_CLIENT_SECRET in backend/.env is your REAL secret from Google Cloud Console",
            "step_2": "In Google Cloud Console, verify Authorized redirect URIs includes: http://localhost:3001/auth/callback",
            "step_3": "Verify Authorized JavaScript origins includes: http://localhost:3001",
            "step_4": "Verify the frontend is at http://localhost:3001 (not 127.0.0.1:3000)"
        }
    }

@api_router.get("/auth/debug/mail-config")
async def debug_mail_config():
    return {
        "mail_enabled": bool(fm),
        "mail_username": MAIL_USERNAME,
        "mail_server": MAIL_SERVER,
        "mail_port": MAIL_PORT,
        "mail_api_available": bool(fm),
        "info": "If mail_enabled is False, set MAIL_USERNAME and MAIL_PASSWORD in backend/.env and restart."
    }

@api_router.post("/auth/debug/test-token-exchange")
async def test_token_exchange(request: Request):
    """Test endpoint to see exact error from Google when exchanging an invalid code"""
    try:
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        
        # Use a dummy code to test what error Google returns
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = "http://localhost:3001/auth/callback"
        
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": "invalid_test_code_12345",
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            
            return {
                "status_code": token_response.status_code,
                "response_text": token_response.text,
                "response_json": token_response.json() if token_response.headers.get('content-type') == 'application/json' else None,
                "request_data": {
                    "client_id": client_id[:20] + "...",
                    "client_secret_set": bool(client_secret),
                    "redirect_uri": redirect_uri
                },
                "diagnosis": {
                    "401_error": "Invalid client secret, authorization code, or redirect_uri mismatch",
                    "next_steps": [
                        "1. Check if GOOGLE_CLIENT_SECRET in backend/.env matches Google Cloud Console",
                        "2. Check if Authorized redirect URIs in Google Console includes: http://localhost:3001/auth/callback",
                        "3. If you see 'invalid_client', the secret is wrong",
                        "4. If you see 'redirect_uri_mismatch', the redirect_uri doesn't match Google Console config"
                    ]
                }
            }
    except Exception as e:
        logging.error(f"Test token exchange error: {e}", exc_info=True)
        return {
            "error": str(e),
            "type": type(e).__name__
        }

@api_router.post("/auth/google/callback")
async def google_oauth_callback(request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        body = await request.json()
        code = body.get("code")
        redirect_uri = body.get("redirect_uri")  # Accept redirect_uri from frontend
        
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code required")

        # Exchange code for token
        token_url = "https://oauth2.googleapis.com/token"
        
        # If frontend doesn't provide redirect_uri, support both localhost and 127.0.0.1
        if not redirect_uri:
            redirect_uri = "http://localhost:3001/auth/callback"
        
        logging.info(f"OAuth callback: code={code[:10]}..., redirect_uri={redirect_uri}")
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise HTTPException(status_code=500, detail="Google OAuth not configured")

        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        logging.info(f"OAuth token exchange: redirect_uri={redirect_uri}, client_id={client_id[:20]}...")

        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                error_text = token_response.text
                logging.error(f"Google token exchange failed with status {token_response.status_code}: {error_text}")
                try:
                    error_data = token_response.json()
                    logging.error(f"Error details: {error_data}")
                except:
                    pass
                raise HTTPException(
                    status_code=401, 
                    detail=f"OAuth token exchange failed: {token_response.status_code} - {error_text[:200]}..."
                )
            
            token_info = token_response.json()

        access_token = token_info.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        # Get user info
        user_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            user_response = await client.get(user_url, headers=headers)
            user_response.raise_for_status()
            user_info = user_response.json()

        email = user_info.get("email")
        name = user_info.get("name")
        google_id = user_info.get("id")
        picture = user_info.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        # Check if user exists
        existing_user = await find_user_by_email(email, db)
        if existing_user:
            # find_user_by_email already serializes SQLAlchemy objects to dict
            user = existing_user if isinstance(existing_user, dict) else serialize_sqlalchemy_record(existing_user)
        else:
            # Create new user
            user_dict = {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "google_id": google_id,
                "picture": picture,
                "role": "customer",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            user_obj = await crud.create_user(db, user_dict)
            user = serialize_sqlalchemy_record(user_obj)

        # Create JWT token using the shared payload shape expected by auth guards.
        token = create_access_token({"sub": user["id"]})

        # Send login notification email (fire-and-forget)
        background_tasks.add_task(send_login_success_email, user["email"], user.get("name", "User"))

        return {
            "token": token,
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "customer")
        }

    except HTTPException:
        raise
    except httpx.RequestError as e:
        logging.error(f"Google OAuth network error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="Google OAuth network connection failed. Please retry in a moment."
        )
    except Exception as e:
        logging.error(f"Google OAuth callback error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OAuth authentication failed: {str(e)}")


def parse_delivery_datetime(delivery_date_str: str) -> datetime:
    """Parse delivery date string to datetime object for reminder scheduling."""
    # Try common formats
    formats = [
        "%B %d, %Y - %H:%M",  # April 5, 2026 - 14:00
        "%B %d, %Y - %I:%M %p",  # April 5, 2026 - 2:00 PM
        "%B %d, %Y",  # April 5, 2026
        "%b %d, %Y",  # Apr 5, 2026
        "%d %B %Y",  # 05 April 2026
        "%Y-%m-%d",  # 2026-04-05
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(delivery_date_str, fmt)
        except ValueError:
            continue
    
    # If no format matches, return None
    return None


def get_delivery_time_slot(delivery_date_str: str) -> str:
    """Extract time slot from delivery date string (e.g., 'morning', 'afternoon', 'evening')."""
    lower = delivery_date_str.lower()
    if "morning" in lower:
        return "morning (9 AM - 12 PM)"
    elif "afternoon" in lower:
        return "afternoon (12 PM - 4 PM)"
    elif "evening" in lower:
        return "evening (4 PM - 8 PM)"
    return "scheduled time"


async def schedule_delivery_reminder(delay_seconds: float, order: Order):
    """Wait for the specified delay and then send the delivery reminder email."""
    logging.info(f"Delivery reminder scheduled for order {order.order_number} in {delay_seconds:.0f} seconds ({delay_seconds/3600:.1f} hours)")
    
    # Wait for the scheduled time
    await asyncio.sleep(delay_seconds)
    
    # Send the reminder email
    await send_delivery_reminder_email(
        order.user_email, order.user_name, order.order_number,
        order.delivery_date, order.items, order.shipping_address,
        order.shipping_city, order.shipping_state, order.shipping_zip
    )


async def send_delivery_reminder_email(user_email: str, user_name: str, order_number: str, delivery_date: str, items: list, shipping_address: str, shipping_city: str, shipping_state: str, shipping_zip: str):
    """Send delivery reminder email 4 hours before delivery."""
    if not fm:
        logging.info(f"Email service not configured. Skipping delivery reminder for {order_number}")
        return
    
    try:
        time_slot = get_delivery_time_slot(delivery_date)
        
        # Customer reminder email
        reminder_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .header {{ background-color: #C25934; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .reminder-box {{ background: #FFF3CD; border: 2px solid #FFC107; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }}
                .reminder-box h2 {{ color: #856404; margin: 0 0 10px 0; }}
                .reminder-box .timer {{ font-size: 24px; font-weight: bold; color: #856404; }}
                .order-details {{ background: #F3EFE6; padding: 15px; margin: 20px 0; border-radius: 8px; }}
                .items {{ margin: 20px 0; }}
                .item {{ padding: 10px; border-bottom: 1px solid #E3DCCF; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚚 Delivery Reminder</h1>
            </div>
            <div class="content">
                <div class="reminder-box">
                    <h2>Your order will be delivered soon!</h2>
                    <p class="timer">⏰ Expected in about 4 hours</p>
                    <p><strong>Delivery Date:</strong> {delivery_date}</p>
                    <p><strong>Time Slot:</strong> {time_slot}</p>
                </div>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> {order_number}</p>
                </div>
                
                <div class="items">
                    <h3>Order Items:</h3>
                    {''.join([format_order_item_html(item) for item in items])}
                </div>
                
                <p><strong>Delivery Address:</strong><br>
                {shipping_address}<br>
                {shipping_city}, {shipping_state} {shipping_zip}</p>
                
                <p style="margin-top: 20px;">Please ensure someone is available at the delivery address during the scheduled time.</p>
                <p>If you have any questions, contact us at 6283968189.</p>
            </div>
            <div class="footer">
                <p>This is an automated reminder from Bakery. Order confirmation was sent to {user_email}.</p>
            </div>
        </body>
        </html>
        """
        
        reminder_message = MessageSchema(
            subject=f"Delivery Reminder - Order {order_number} arriving soon!",
            recipients=[user_email],
            body=reminder_html,
            subtype=MessageType.html
        )
        await fm.send_message(reminder_message)
        logging.info(f"Delivery reminder email sent for order {order_number}")
    except Exception as e:
        logging.error(f"Failed to send delivery reminder email for {order_number}: {str(e)}")


async def send_order_email(order: Order):
    if not fm:
        logging.info(f"Email service not configured. Order confirmation for {order.order_number}")
        return
    
    try:
        # Customer email
        customer_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .header {{ background-color: #C25934; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .order-details {{ background: #F3EFE6; padding: 15px; margin: 20px 0; border-radius: 8px; }}
                .items {{ margin: 20px 0; }}
                .item {{ padding: 10px; border-bottom: 1px solid #E3DCCF; }}
                .total {{ font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Thank You for Your Order!</h1>
            </div>
            <div class="content">
                <p>Hello {order.user_name},</p>
                <p>Your order has been confirmed and will be delivered on {order.delivery_date}.</p>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> {order.order_number}</p>
                    <p><strong>Order Date:</strong> {order.created_at}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method}</p>
                </div>
                
                <div class="items">
                    <h2>Order Items:</h2>
                    {''.join([format_order_item_html(item) for item in order.items])}
                </div>
                
                <div class="total">
                    <p>Subtotal: ₹{order.subtotal:.2f}</p>
                    <p>Shipping: ₹{order.shipping_cost:.2f}</p>
                    <p>Tax: ₹{order.tax:.2f}</p>
                    {f'<p>Discount: -₹{order.discount:.2f}</p>' if order.discount > 0 else ''}
                    <p>Total: ₹{order.total:.2f}</p>
                </div>
                
                <p><strong>Delivery Address:</strong><br>
                {order.shipping_address}<br>
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
            </div>
        </body>
        </html>
        """
        
        customer_message = MessageSchema(
            subject=f"Order Confirmation - {order.order_number}",
            recipients=[order.user_email],
            body=customer_html,
            subtype=MessageType.html
        )
        await fm.send_message(customer_message)
        
        # Admin email
        admin_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                .header {{ background-color: #C25934; color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; max-width: 700px; margin: 0 auto; }}
                .order-details {{ background: #F3EFE6; padding: 20px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #C25934; }}
                .items {{ margin: 25px 0; }}
                .item {{ display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #E3DCCF; }}
                .item:last-child {{ border-bottom: none; }}
                .item img {{ width: 80px; height: 80px; object-fit: cover; margin-right: 15px; border-radius: 8px; border: 1px solid #ddd; }}
                .item-details {{ flex: 1; }}
                .item-price {{ font-weight: bold; color: #C25934; }}
                .totals {{ background: white; padding: 20px; border-radius: 12px; border: 1px solid #E3DCCF; margin: 20px 0; }}
                .total-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; }}
                .grand-total {{ font-size: 20px; font-weight: bold; color: #2D241E; border-top: 2px solid #C25934; padding-top: 12px; }}
                .address {{ background: #F8F6F3; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #E3DCCF; font-size: 12px; color: #8A7E74; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🧁 New Bakery Order #{order.order_number}</h1>
                <p>New order received from {order.user_name}</p>
            </div>
            <div class="content">
                <div class="order-details">
                    <p><strong>Customer:</strong> {order.user_name}</p>
                    <p><strong>Email:</strong> {order.user_email}</p>
                    <p><strong>Order Date:</strong> {order.created_at}</p>
                    <p><strong>Payment:</strong> {order.payment_method}</p>
                    <p><strong>Delivery Date:</strong> {order.delivery_date}</p>
                </div>
                
                <div class="items">
                    <h2 style="color: #2D241E; margin-bottom: 15px;">Order Items ({len(order.items)}):</h2>
                    {''.join([
                        f'<div class="item">'
                        f'  <img src="{item.image}" alt="{item.name}" />'
                        f'  <div class="item-details">'
                        f'    <h3 style="margin: 0 0 5px 0; color: #2D241E;">{item.name}</h3>'
                        f'    <p>Qty: {item.quantity} x Rs.{item.price:.0f}</p>'
                        f'  </div>'
                        f'  <div class="item-price">₹{item.price * item.quantity:.0f}</div>'
                        f'</div>'
                        for item in order.items
                    ])}
                </div>
                
                <div class="totals">
                    <div class="total-row"><span>Subtotal</span><span>₹{order.subtotal:.0f}</span></div>
                    <div class="total-row"><span>Shipping</span><span>₹{order.shipping_cost:.0f}</span></div>
                    <div class="total-row"><span>Tax</span><span>₹{order.tax:.0f}</span></div>
                    {f'<div class="total-row"><span>Discount</span><span>-₹{order.discount:.0f}</span></div>' if order.discount > 0 else ''}
                    <div class="grand-total"><span>Total</span><span>₹{order.total:.0f}</span></div>
                </div>
                
                <div class="address">
                    <strong>Delivery:</strong> {order.delivery_date}<br>
                    <strong>Address:</strong> {order.shipping_address}<br>
                    <strong>Location:</strong> {order.shipping_city}, {order.shipping_state} - {order.shipping_zip}<br>
                    <strong>Payment:</strong> {order.payment_method}
                </div>
                
                <div style="background: #C25934; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                    <p><strong>Action Required</strong></p>
                    <p>Prepare order for delivery on {order.delivery_date}</p>
                </div>
            </div>
            <div class="footer">
                <p>Sent from Bakery Admin System</p>
            </div>
        </body>
        </html>
        """
        
        admin_message = MessageSchema(
            subject=f"New Order - {order.order_number}",
            recipients=[ADMIN_EMAIL],
            body=admin_html,
            subtype=MessageType.html
        )
        await fm.send_message(admin_message)
        
        logging.info(f"Order confirmation emails sent for {order.order_number}")
    except Exception as e:
        logging.error(f"Failed to send order email: {str(e)}")

async def send_login_success_email(user_email: str, user_name: str):
    logging.info(f"Attempting to send login success email to {user_email}")
    
    if not fm:
        logging.error("Email service not configured. Please set MAIL_USERNAME and MAIL_PASSWORD in backend/.env and restart the server")
        logging.error(f"Skipping email send for {user_email}")
        return
    
    try:
        login_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .header {{ background-color: #C25934; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .login-info {{ background: #F3EFE6; padding: 15px; margin: 20px 0; border-radius: 8px; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Login Successful!</h1>
            </div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>You have successfully logged in to your Bakery account.</p>
                
                <div class="login-info">
                    <p><strong>Login Time:</strong> {login_time}</p>
                    <p><strong>Email:</strong> {user_email}</p>
                </div>
                
                <p>If this wasn't you, please contact our support team immediately.</p>
                <p>Happy shopping!</p>
                <p>The Bakery Team</p>
            </div>
            <div class="footer">
                <p>This email was sent from ngw.designer@gmail.com</p>
            </div>
        </body>
        </html>
        """
        
        logging.info(f"Email content prepared for {user_email}: {html_content[:200]}...")
        
        message = MessageSchema(
            subject="Login Successful - Bakery Account",
            recipients=[user_email],
            body=html_content,
            subtype=MessageType.html
        )
        await fm.send_message(message)
        
        logging.info(f"Login success email sent to {user_email}")
    except Exception as e:
        logging.error(f"Failed to send login success email to {user_email}: {str(e)}")
        logging.info(f"Email content that failed to send: {html_content[:500]}...")

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await find_user_by_email(user_data.email, db)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_data.username:
        existing_username = await find_user_by_username(user_data.username, db)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "username": user_data.username,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    user_obj = await crud.create_user(db, user_dict)
    user_serialized = serialize_sqlalchemy_record(user_obj)
    token = create_access_token({"sub": user_serialized['id']})
    return {
        "token": token,
        "user": user_serialized
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        identifier = credentials.email.strip()
        logging.info(f"Login attempt for identifier: {identifier}")
        user = None
        user = await find_user_by_email(identifier, db)
        if not user:
            user = await find_user_by_username(identifier, db)
        if not user:
            user = FALLBACK_USERS.get(identifier)

        if not user:
            logging.warning(f"Login failed: user not found for {identifier}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Google OAuth users don't have a password
        if "password" not in user or not user["password"]:
            logging.warning(f"Login failed: {identifier} is a Google OAuth account")
            raise HTTPException(status_code=401, detail="This account uses Google login. Please use 'Continue with Google' instead.")

        if not verify_password(credentials.password, user["password"]):
            logging.warning(f"Login failed: invalid password for {identifier}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = await ensure_sql_user(db, user)
        
        token = create_access_token({"sub": user["id"]})
        logging.info(f"Login successful for {identifier}, token created")
        
        # Send login success email in background
        background_tasks.add_task(send_login_success_email, user["email"], user["name"])
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user.get("username"),
                "name": user["name"],
                "role": user["role"]
            }
        }
    except HTTPException as e:
        logging.error(f"Login HTTPException: {e.detail}")
        raise
    except Exception as e:
        logging.error(f"Login error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/auth/me")
async def get_me(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return user

# Google OAuth session endpoint
@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    session_id = request.headers.get("X-Session-ID")
    user_data = await exchange_google_session(session_id)
    
    # Check if user exists
    existing_user = await crud.get_user_by_email(db, user_data["email"])
    
    if existing_user:
        user_id = existing_user.id
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "email": user_data["email"],
            "name": user_data.get("name", "User"),
            "picture": user_data.get("picture"),
            "role": "customer",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await crud.create_user(db, new_user)
    
    # Store session in database
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_dict = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at
    }
    await crud.create_session(db, session_dict)
    
    is_local_dev = request.url.hostname in {"localhost", "127.0.0.1"}
    cookie_secure = not is_local_dev
    cookie_samesite = "lax" if is_local_dev else "none"

    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Send login success email in background
    background_tasks.add_task(send_login_success_email, user_data["email"], user_data.get("name", "User"))
    
    # Return user data with JWT token for frontend storage
    user = await crud.get_user_by_id(db, user_id)
    jwt_token = create_access_token({"sub": user_id})
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else "",
        "token": jwt_token
    }

@api_router.post("/auth/google/browser")
async def google_browser_login(
    request: Request,
    response: Response,
    payload: GoogleBrowserLogin,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    logging.info(f"Google browser login start: {payload.email} {payload.google_id}")
    try:
        user = await ensure_sql_user(
            db,
            {
                "email": payload.email.strip().lower(),
                "name": payload.name.strip() or "User",
                "picture": payload.picture,
                "google_id": payload.google_id,
                "role": "customer",
            },
        )

        logging.info(f"User resolved/created: {user.get('id')} ({user.get('email')})")

        jwt_token = create_access_token({"sub": user["id"]})
        session_token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session_obj = await crud.create_session(
            db,
            {
                "user_id": user["id"],
                "session_token": session_token,
                "expires_at": expires_at,
            },
        )

        logging.info(f"Session created: {session_obj.session_token} for user {user.get('id')}")

        is_local_dev = request.url.hostname in {"localhost", "127.0.0.1"}
        cookie_secure = not is_local_dev
        cookie_samesite = "lax" if is_local_dev else "none"
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=cookie_secure,
            samesite=cookie_samesite,
            path="/",
            max_age=7 * 24 * 60 * 60,
        )

        background_tasks.add_task(send_login_success_email, user["email"], user.get("name", "User"))

        result = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "customer"),
            "created_at": user.get("created_at", ""),
            "token": jwt_token,
        }

        logging.info(f"Google browser login success for user {user.get('email')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google browser login error: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Google browser login failed: {e}")

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db), session_token: Optional[str] = Cookie(None)):
    if session_token:
        await crud.delete_session(db, session_token)
    
    # Clear cookie
    is_local_dev = request.url.hostname in {"localhost", "127.0.0.1"}
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=not is_local_dev,
        samesite="lax" if is_local_dev else "none",
    )
    return {"message": "Logged out successfully"}

# Products endpoints
@api_router.get("/products")
async def list_products(db_session: AsyncSession = Depends(get_db), category: Optional[str] = None, search: Optional[str] = None):
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            query = {}
            if category:
                query["category"] = category
            if search:
                query["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                ]
            
            products = await db.products.find(query, {"_id": 0}).to_list(5000)
            if products:
                return [with_weight_variants(p) for p in products]
        except Exception as e:
            logging.warning(f"MongoDB products lookup failed, using SQL fallback: {e}")

    # SQL fallback
    try:
        products = await crud.get_products(db_session, category, search)
        return [with_weight_variants(serialize_sqlalchemy_record(p)) for p in products]
    except Exception as e:
        logging.error(f"Database error: {e}")
        return []

@api_router.get("/products/{product_id}")
async def get_product_endpoint(product_id: str, db_session: AsyncSession = Depends(get_db)):
    product = await crud.get_product(db_session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return with_weight_variants(serialize_sqlalchemy_record(product))

# Cart endpoints
@api_router.get("/cart")
async def get_cart_endpoint(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    cart = await crud.get_cart(db, user.id)
    if not cart:
        return {"user_id": user.id, "items": [], "total": 0}
    return {
        "user_id": cart.user_id,
        "items": cart.items_json,
        "total": cart.total
    }

@api_router.post("/cart")
async def add_to_cart(item: CartItem, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        logging.info(f"Adding to cart for user {user.id}: {item.model_dump()}")

        cart = await crud.get_cart(db, user.id)
        items = list(cart.items_json) if cart and cart.items_json else []
        item_data = item.model_dump()

        existing_item = next(
            (
                cart_item
                for cart_item in items
                if cart_item["product_id"] == item.product_id
                and (cart_item.get("variant") or None) == item.variant
            ),
            None,
        )

        if existing_item:
            existing_item["quantity"] += item.quantity
            existing_item["price"] = float(item.price)
            existing_item["name"] = item.name
            existing_item["image"] = item.image
            existing_item["variant"] = item.variant
        else:
            item_data["price"] = float(item.price)
            items.append(item_data)

        total = sum(float(cart_item["price"]) * int(cart_item["quantity"]) for cart_item in items)
        await crud.upsert_cart(db, user.id, items, total)

        return {
            "user_id": user.id,
            "items": items,
            "total": total
        }
    except Exception as e:
        logging.error(f"Error in add_to_cart: {type(e).__name__}: {str(e)}", exc_info=True)
        raise

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    cart = await crud.get_cart(db, user.id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    items = [i for i in cart.items_json if i["product_id"] != product_id]
    total = sum(i["price"] * i["quantity"] for i in items)

    await crud.upsert_cart(db, user.id, items, total)

    return {"user_id": user.id, "items": items, "total": total}

@api_router.put("/cart/{product_id}")
async def update_cart_quantity(product_id: str, quantity: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    cart = await crud.get_cart(db, user.id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    items = cart.items_json.copy()
    item = next((i for i in items if i["product_id"] == product_id), None)

    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")

    if quantity <= 0:
        items = [i for i in items if i["product_id"] != product_id]
    else:
        item["quantity"] = quantity

    total = sum(i['price'] * i['quantity'] for i in items)

    await crud.upsert_cart(db, user.id, items, total)

    return {"user_id": user.id, "items": items, "total": total}

# Wishlist endpoints
@api_router.get("/wishlist")
async def get_wishlist(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    wishlist = await crud.get_wishlist(db, user.id)
    if not wishlist:
        return {"user_id": user.id, "product_ids": []}
    product_ids = wishlist.product_ids or []
    products = await crud.get_products(db)
    products = [p for p in products if p.id in product_ids]
    return {"user_id": user.id, "products": [serialize_sqlalchemy_record(p) for p in products]}

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    wishlist = await crud.get_wishlist(db, user.id)
    product_ids = wishlist.product_ids or []
    if product_id not in product_ids:
        product_ids.append(product_id)
        await crud.upsert_wishlist(db, user.id, product_ids)
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    wishlist = await crud.get_wishlist(db, user.id)
    if wishlist:
        product_ids = wishlist.product_ids or []
        product_ids = [pid for pid in product_ids if pid != product_id]
        await crud.upsert_wishlist(db, user.id, product_ids)
    return {"message": "Removed from wishlist"}

# Orders endpoints
@api_router.post("/orders")
async def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, db_session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    order_number = f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    order = Order(
        id=str(uuid.uuid4()),
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
        order_number=order_number,
        items=order_data.items,
        subtotal=order_data.subtotal,
        shipping_cost=order_data.shipping_cost,
        tax=order_data.tax,
        discount=order_data.discount,
        total=order_data.total,
        payment_method=order_data.payment_method,
        delivery_date=order_data.delivery_date,
        shipping_address=order_data.shipping_address,
        shipping_city=order_data.shipping_city,
        shipping_state=order_data.shipping_state,
        shipping_zip=order_data.shipping_zip,
        coupon_code=order_data.coupon_code,
        status="confirmed",
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    order_dict = order.model_dump()

    # Try MongoDB first
    if db is not None:
        try:
            await db.orders.insert_one(order_dict)
            # Clear cart (SQL, as cart is SQL-only for now)
            await crud.upsert_cart(db_session, user.id, [], 0.0)
            
            # Send order confirmation email in background
            background_tasks.add_task(send_order_email, order)
            
            # Schedule delivery reminder email
            delivery_dt = parse_delivery_datetime(order.delivery_date)
            if delivery_dt:
                if delivery_dt.hour == 0: delivery_dt = delivery_dt.replace(hour=14)
                reminder_time = delivery_dt - timedelta(hours=4)
                delay_seconds = (reminder_time - datetime.now(timezone.utc)).total_seconds()
                if delay_seconds > 0:
                    background_tasks.add_task(schedule_delivery_reminder, delay_seconds, order)
            return order
        except Exception as e:
            logging.warning(f"MongoDB order creation failed, using SQL fallback: {e}")
    db_order_payload = {
        "id": order_dict["id"],
        "user_id": order_dict["user_id"],
        "user_name": order_dict["user_name"],
        "user_email": order_dict["user_email"],
        "order_number": order_dict["order_number"],
        "items_json": order_dict["items"],
        "subtotal": order_dict["subtotal"],
        "shipping_cost": order_dict["shipping_cost"],
        "tax": order_dict["tax"],
        "discount": order_dict["discount"],
        "total": order_dict["total"],
        "payment_method": order_dict["payment_method"],
        "delivery_date": order_dict["delivery_date"],
        "shipping_address": order_dict["shipping_address"],
        "shipping_city": order_dict["shipping_city"],
        "shipping_state": order_dict["shipping_state"],
        "shipping_zip": order_dict["shipping_zip"],
        "coupon_code": order_dict.get("coupon_code"),
        "status": order_dict["status"],
        "created_at": datetime.now(timezone.utc),  # Pass datetime object, not string
    }

    await crud.create_order(db_session, db_order_payload)
    
    # Clear cart (SQL)
    await crud.upsert_cart(db_session, user.id, [], 0.0)
    
    # Send order confirmation email in background
    background_tasks.add_task(send_order_email, order)
    
    # Schedule delivery reminder email (4 hours before delivery)
    # Parse delivery date to calculate reminder time
    delivery_dt = parse_delivery_datetime(order.delivery_date)
    if delivery_dt:
        # If delivery date has no time component, assume delivery at 2 PM
        if delivery_dt.hour == 0 and delivery_dt.minute == 0:
            delivery_dt = delivery_dt.replace(hour=14, minute=0, second=0)
        
        reminder_time = delivery_dt - timedelta(hours=4)
        now = datetime.now(timezone.utc)
        
        # Make reminder_time timezone-aware if naive
        if reminder_time.tzinfo is None:
            reminder_time = reminder_time.replace(tzinfo=timezone.utc)
        
        delay_seconds = (reminder_time - now).total_seconds()
        
        if delay_seconds > 0:
            # Schedule the reminder email
            logging.info(f"Scheduling delivery reminder for order {order.order_number} in {delay_seconds:.0f} seconds")
            background_tasks.add_task(schedule_delivery_reminder, delay_seconds, order)
        else:
            # If delivery is less than 4 hours away, send reminder immediately
            logging.info(f"Delivery is less than 4 hours away for order {order.order_number}, sending reminder now")
            background_tasks.add_task(send_delivery_reminder_email, 
                order.user_email, order.user_name, order.order_number, 
                order.delivery_date, order.items, order.shipping_address,
                order.shipping_city, order.shipping_state, order.shipping_zip)
    else:
        logging.warning(f"Could not parse delivery date '{order.delivery_date}' for order {order.order_number}")

    return order

@api_router.get("/orders")
async def get_user_orders(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    orders = await crud.get_user_orders(db, user.id)
    return [
        {
            "id": order.id,
            "user_id": order.user_id,
            "user_name": order.user_name,
            "user_email": order.user_email,
            "order_number": order.order_number,
            "items": order.items_json,
            "subtotal": order.subtotal,
            "shipping_cost": order.shipping_cost,
            "tax": order.tax,
            "discount": order.discount,
            "total": order.total,
            "payment_method": order.payment_method,
            "delivery_date": order.delivery_date,
            "shipping_address": order.shipping_address,
            "shipping_city": order.shipping_city,
            "shipping_state": order.shipping_state,
            "shipping_zip": order.shipping_zip,
            "coupon_code": order.coupon_code,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else "",
        }
        for order in orders
    ]

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    order = await crud.get_order(db, order_id, user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "id": order.id,
        "user_id": order.user_id,
        "user_name": order.user_name,
        "user_email": order.user_email,
        "order_number": order.order_number,
        "items": order.items_json,
        "subtotal": order.subtotal,
        "shipping_cost": order.shipping_cost,
        "tax": order.tax,
        "discount": order.discount,
        "total": order.total,
        "payment_method": order.payment_method,
        "delivery_date": order.delivery_date,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "shipping_state": order.shipping_state,
        "shipping_zip": order.shipping_zip,
        "coupon_code": order.coupon_code,
        "status": order.status,
        "created_at": order.created_at.isoformat() if order.created_at else "",
    }

# Reviews endpoints
@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, db_session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    # Check if user already reviewed (SQL fallback)
    existing = await crud.get_product_reviews(db_session, review_data.product_id)
    if existing:
        user_review = next((r for r in existing if r.user_id == user.id), None)
        if user_review:
            raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            review = Review(
                id=str(uuid.uuid4()),
                product_id=review_data.product_id,
                user_id=user.id,
                user_name=user.name,
                rating=review_data.rating,
                comment=review_data.comment,
                created_at=datetime.now(timezone.utc).isoformat()
            )
            
            await db.reviews.insert_one(review.model_dump())
            
            # Update product rating
            reviews = await db.reviews.find({"product_id": review_data.product_id}, {"_id": 0}).to_list(1000)
            avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
            
            await db.products.update_one(
                {"id": review_data.product_id},
                {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
            )
            
            return review
        except Exception as e:
            logging.warning(f"MongoDB review creation failed, using SQL fallback: {e}")
    
    # SQL fallback - create review in SQLite
    review_dict = {
        "id": str(uuid.uuid4()),
        "product_id": review_data.product_id,
        "user_id": user.id,
        "user_name": user.name,
        "rating": review_data.rating,
        "comment": review_data.comment,
    }
    created_review = await crud.create_review(db_session, review_dict)
    
    # Update product rating using SQL
    all_reviews = await crud.get_product_reviews(db_session, review_data.product_id)
    if all_reviews:
        avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
        from models import Product
        from sqlalchemy import update as sql_update
        await db_session.execute(
            sql_update(Product).where(Product.id == review_data.product_id).values(
                rating=round(avg_rating, 1),
                reviews_count=len(all_reviews)
            )
        )
        await db_session.commit()
    
    return created_review

@api_router.get("/reviews/{product_id}")
async def get_product_reviews(product_id: str, db_session: AsyncSession = Depends(get_db)):
    # Try MongoDB first
    if db is not None:
        try:
            reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
            if reviews:
                return reviews
        except Exception as e:
            logging.warning(f"MongoDB reviews lookup failed, using SQL fallback: {e}")

    # SQL fallback
    reviews = await crud.get_product_reviews(db_session, product_id)
    return [serialize_sqlalchemy_record(r) for r in reviews]

# Coupons endpoint
@api_router.post("/coupons/validate")
async def validate_coupon(data: CouponValidate, db_session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    # Try MongoDB first, fallback to SQL
    coupon = None
    if db is not None:
        try:
            coupon = await db.coupons.find_one({"code": data.code.upper(), "active": True}, {"_id": 0})
        except Exception as e:
            logging.warning(f"MongoDB coupon lookup failed, using SQL fallback: {e}")
    
    # SQL fallback
    if coupon is None:
        coupon = await crud.get_coupon(db_session, data.code.upper())
        if coupon and not coupon.active:
            coupon = None
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Handle both dict (MongoDB) and SQLAlchemy object (SQL)
    if isinstance(coupon, dict):
        expiry = datetime.fromisoformat(coupon["expiry_date"])
        discount_pct = coupon["discount_percentage"]
    else:
        expiry = coupon.expiry_date
        if isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry)
        discount_pct = coupon.discount_percentage
    
    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    discount = (data.total * discount_pct) / 100
    
    return {
        "valid": True,
        "discount": round(discount, 2),
        "discount_percentage": discount_pct
    }

# Analytics endpoint (frontend tracker)
@api_router.post("/analytics/track")
async def track_event(request: Request):
    body = await request.json()
    logging.info(f"Analytics event: {body.get('event', 'unknown')}")
    return {"status": "ok"}


@api_router.post("/chat")
async def chat_with_assistant(chat_data: ChatRequest):
    message = chat_data.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    return {"reply": build_chat_reply(message)}

# Recommendations endpoint
@api_router.get("/recommendations")
async def get_recommendations(db_session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            # Get user's past orders
            orders = await db.orders.find({"user_id": user.id}, {"_id": 0}).to_list(100)
            
            # Collect ordered product IDs and categories
            ordered_product_ids = set()
            ordered_categories = {}
            for order in orders:
                for item in order.get("items", []):
                    ordered_product_ids.add(item["product_id"])
            
            # Get categories from ordered products
            if ordered_product_ids:
                ordered_products = await db.products.find(
                    {"id": {"$in": list(ordered_product_ids)}},
                    {"_id": 0, "category": 1}
                ).to_list(200)
                for p in ordered_products:
                    cat = p.get("category", "")
                    ordered_categories[cat] = ordered_categories.get(cat, 0) + 1
            
            # Get wishlist items for additional signal
            wishlist = await db.wishlists.find_one({"user_id": user.id}, {"_id": 0})
            wishlist_ids = set(wishlist.get("product_ids", [])) if wishlist else set()
            
            # Build exclusion set (products already ordered)
            exclude_ids = ordered_product_ids
            
            recommendations = []
            
            # Strategy 1: Products from user's most-ordered categories (not already bought)
            if ordered_categories:
                sorted_cats = sorted(ordered_categories.items(), key=lambda x: x[1], reverse=True)
                for cat, _ in sorted_cats[:3]:
                    cat_products = await db.products.find(
                        {"category": cat, "id": {"$nin": list(exclude_ids)}, "stock": {"$gt": 0}},
                        {"_id": 0}
                    ).sort("rating", -1).to_list(4)
                    recommendations.extend(cat_products)
            
            # Strategy 2: Top-rated products the user hasn't bought
            if len(recommendations) < 8:
                top_rated = await db.products.find(
                    {"id": {"$nin": list(exclude_ids)}, "stock": {"$gt": 0}},
                    {"_id": 0}
                ).sort("rating", -1).to_list(12)
                recommendations.extend(top_rated)
            
            # Strategy 3: Popular products (high review count)
            if len(recommendations) < 8:
                popular = await db.products.find(
                    {"stock": {"$gt": 0}},
                    {"_id": 0}
                ).sort("reviews_count", -1).to_list(12)
                recommendations.extend(popular)
            
            # Deduplicate while preserving order
            seen = set()
            unique_recs = []
            for p in recommendations:
                if p["id"] not in seen:
                    seen.add(p["id"])
                    unique_recs.append(p)
            
            return unique_recs[:8]
        except Exception as e:
            logging.warning(f"MongoDB recommendations failed, using SQL fallback: {e}")
    
    # SQL fallback - return trending products
    return await get_trending(db_session)

# Recommendations for anonymous users (trending/popular)
@api_router.get("/recommendations/trending")
async def get_trending(db: AsyncSession = Depends(get_db)):
    products = await crud.get_products(db)
    # Sort top rated/stock
    sorted_products = sorted(products, key=lambda p: (p.rating or 0, p.stock or 0), reverse=True)[:8]
    return [serialize_sqlalchemy_record(p) for p in sorted_products]

# Contact endpoint
@api_router.post("/contact")
async def contact_submit(message: ContactMessage, db_session: AsyncSession = Depends(get_db)):
    contact_dict = {
        "id": str(uuid.uuid4()),
        "name": message.name,
        "email": message.email,
        "subject": message.subject,
        "message": message.message,
    }
    
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            contact_dict["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.contacts.insert_one(contact_dict)
            return {"message": "Thank you for your message. We'll get back to you soon!"}
        except Exception as e:
            logging.warning(f"MongoDB contact submit failed, using SQL fallback: {e}")
    
    # SQL fallback
    contact = await crud.create_contact(db_session, contact_dict)
    return {"message": "Thank you for your message. We'll get back to you soon!"}

# Offer and reel endpoints
@api_router.get("/offer-media")
async def list_public_offer_media(db_session: AsyncSession = Depends(get_db)):
    rows = await crud.get_offer_media(db_session, active_only=True)
    return [serialize_sqlalchemy_record(row) for row in rows]

@api_router.get("/admin/offer-media")
async def list_admin_offer_media(admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    rows = await crud.get_offer_media(db_session, active_only=False)
    return [serialize_sqlalchemy_record(row) for row in rows]

@api_router.post("/admin/offer-media/upload")
async def upload_offer_image(
    request: Request,
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or GIF image")

    file_bytes = await file.read()
    max_size = 8 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(status_code=400, detail="Image must be under 8MB")

    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = OFFER_UPLOAD_DIR / filename
    destination.write_bytes(file_bytes)
    return {"image_url": build_upload_url(request, filename)}

@api_router.post("/admin/offer-media")
async def create_offer_media(media: OfferMediaCreate, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    data = normalize_offer_payload(media.model_dump())
    data["id"] = str(uuid.uuid4())
    created = await crud.create_offer_media(db_session, data)
    return serialize_sqlalchemy_record(created)

@api_router.put("/admin/offer-media/{media_id}")
async def update_offer_media(media_id: str, media: OfferMediaUpdate, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    current = await crud.get_offer_media_by_id(db_session, media_id)
    if not current:
        raise HTTPException(status_code=404, detail="Offer or reel not found")

    current_data = serialize_sqlalchemy_record(current)
    updates = {key: value for key, value in media.model_dump().items() if value is not None}
    merged = {**current_data, **updates}
    allowed_keys = {
        "kind", "title", "description", "badge", "image_url", "reel_url",
        "embed_url", "cta_label", "cta_url", "active", "sort_order"
    }
    normalized = normalize_offer_payload({key: value for key, value in merged.items() if key in allowed_keys})
    update_data = {key: normalized[key] for key in allowed_keys if key in normalized and normalized[key] != current_data.get(key)}
    if not update_data:
        return serialize_sqlalchemy_record(current)

    updated = await crud.update_offer_media(db_session, media_id, update_data)
    return serialize_sqlalchemy_record(updated)

@api_router.delete("/admin/offer-media/{media_id}")
async def delete_offer_media(media_id: str, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    current = await crud.get_offer_media_by_id(db_session, media_id)
    if not current:
        raise HTTPException(status_code=404, detail="Offer or reel not found")
    await crud.delete_offer_media(db_session, media_id)
    return {"message": "Deleted successfully"}

# Homepage banner endpoints
@api_router.get("/banners")
async def list_public_banners(db_session: AsyncSession = Depends(get_db)):
    rows = await crud.get_banners(db_session, active_only=True)
    return [serialize_sqlalchemy_record(row) for row in rows]

@api_router.get("/admin/banners")
async def list_admin_banners(admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    rows = await crud.get_banners(db_session, active_only=False)
    return [serialize_sqlalchemy_record(row) for row in rows]

@api_router.post("/admin/banners/upload")
async def upload_banner_image(
    request: Request,
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or GIF image")

    file_bytes = await file.read()
    max_size = 8 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(status_code=400, detail="Image must be under 8MB")

    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = BANNER_UPLOAD_DIR / filename
    destination.write_bytes(file_bytes)
    return {"image": build_banner_upload_url(request, filename)}

@api_router.post("/admin/banners")
async def create_banner(banner: BannerCreate, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    data = normalize_banner_payload(banner.model_dump())
    data["id"] = str(uuid.uuid4())
    created = await crud.create_banner(db_session, data)
    return serialize_sqlalchemy_record(created)

@api_router.put("/admin/banners/{banner_id}")
async def update_banner(banner_id: str, banner: BannerUpdate, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    current = await crud.get_banner_by_id(db_session, banner_id)
    if not current:
        raise HTTPException(status_code=404, detail="Banner not found")

    current_data = serialize_sqlalchemy_record(current)
    updates = {key: value for key, value in banner.model_dump().items() if value is not None}
    if not updates:
        return current_data

    merged = {**current_data, **updates}
    allowed_keys = {
        "title", "subtitle", "description", "cta", "cta_link", "image",
        "bg_from", "bg_to", "accent", "active", "sort_order"
    }
    normalized = normalize_banner_payload({key: value for key, value in merged.items() if key in allowed_keys})
    update_data = {key: normalized[key] for key in allowed_keys if key in normalized and normalized[key] != current_data.get(key)}
    if not update_data:
        return current_data

    updated = await crud.update_banner(db_session, banner_id, update_data)
    return serialize_sqlalchemy_record(updated)

@api_router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    current = await crud.get_banner_by_id(db_session, banner_id)
    if not current:
        raise HTTPException(status_code=404, detail="Banner not found")
    await crud.delete_banner(db_session, banner_id)
    return {"message": "Banner deleted successfully"}

# Admin endpoints
@api_router.get("/admin/orders")
async def get_all_orders(admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
            return orders
        except Exception as e:
            logging.warning(f"MongoDB admin orders failed, using SQL fallback: {e}")
    
    # SQL fallback
    orders = await crud.get_all_orders(db_session)
    return [
        {
            "id": order.id,
            "user_id": order.user_id,
            "user_name": order.user_name,
            "user_email": order.user_email,
            "order_number": order.order_number,
            "items": order.items_json,
            "subtotal": order.subtotal,
            "shipping_cost": order.shipping_cost,
            "tax": order.tax,
            "discount": order.discount,
            "total": order.total,
            "payment_method": order.payment_method,
            "delivery_date": order.delivery_date,
            "shipping_address": order.shipping_address,
            "shipping_city": order.shipping_city,
            "shipping_state": order.shipping_state,
            "shipping_zip": order.shipping_zip,
            "coupon_code": order.coupon_code,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else "",
        }
        for order in orders
    ]

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
            return {"message": "Order status updated"}
        except Exception as e:
            logging.warning(f"MongoDB order status update failed, using SQL fallback: {e}")
    
    # SQL fallback
    await crud.update_order_status(db_session, order_id, status)
    return {"message": "Order status updated"}

@api_router.post("/admin/products")
async def create_product(product: ProductCreate, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    variants = [variant.model_dump() for variant in product.variants] if product.variants else None
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            new_product = Product(
                id=str(uuid.uuid4()),
                name=product.name,
                category=product.category,
                price=product.price,
                description=product.description,
                image=product.image,
                stock=product.stock,
                rating=0.0,
                reviews_count=0,
                variants=product.variants,
            )
            await db.products.insert_one(new_product.model_dump())
            return new_product
        except Exception as e:
            logging.warning(f"MongoDB product creation failed, using SQL fallback: {e}")
    
    # SQL fallback
    product_dict = {
        "id": str(uuid.uuid4()),
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "description": product.description,
        "image": product.image,
        "stock": product.stock,
        "variants": variants,
    }
    created_product = await crud.create_product(db_session, product_dict)
    return serialize_sqlalchemy_record(created_product)

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, updates: ProductUpdate, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if updates.variants is not None:
        update_data["variants"] = [variant.model_dump() for variant in updates.variants]
    
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            if not update_data:
                raise HTTPException(status_code=400, detail="No updates provided")
            
            result = await db.products.update_one({"id": product_id}, {"$set": update_data})
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Product not found")
            
            return {"message": "Product updated successfully"}
        except HTTPException:
            raise
        except Exception as e:
            logging.warning(f"MongoDB product update failed, using SQL fallback: {e}")
    
    # SQL fallback
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    await crud.update_product(db_session, product_id, update_data)
    return {"message": "Product updated successfully"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            result = await db.products.delete_one({"id": product_id})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Product not found")
            
            return {"message": "Product deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            logging.warning(f"MongoDB product delete failed, using SQL fallback: {e}")
    
    # SQL fallback
    await crud.delete_product(db_session, product_id)
    return {"message": "Product deleted successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_admin_user), db_session: AsyncSession = Depends(get_db)):
    # Try MongoDB first, fallback to SQL
    if db is not None:
        try:
            total_products = await db.products.count_documents({})
            total_orders = await db.orders.count_documents({})
            total_users = await db.users.count_documents({"role": "customer"})
            
            orders = await db.orders.find({}, {"_id": 0, "total": 1}).to_list(1000)
            total_revenue = sum(o["total"] for o in orders)
            
            return {
                "total_products": total_products,
                "total_orders": total_orders,
                "total_users": total_users,
                "total_revenue": round(total_revenue, 2)
            }
        except Exception as e:
            logging.warning(f"MongoDB admin stats failed, using SQL fallback: {e}")
    
    # SQL fallback
    stats = await crud.get_stats(db_session)
    return stats

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Include router
app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def ensure_default_admin_account():
    admin_hash = hash_password(ADMIN_LOGIN_PASSWORD)
    users = load_local_auth_users()
    existing_local = users.get(ADMIN_LOGIN_EMAIL) or get_local_user_by_username(ADMIN_LOGIN_USERNAME) or {}
    users[ADMIN_LOGIN_EMAIL] = {
        "id": existing_local.get("id") or "fallback-admin",
        "email": ADMIN_LOGIN_EMAIL,
        "username": ADMIN_LOGIN_USERNAME,
        "name": existing_local.get("name") or "Admin User",
        "password": admin_hash,
        "role": "admin",
    }
    save_local_auth_users(users)

    async with AsyncSessionLocal() as session:
        admin_user = await crud.get_user_by_email(session, ADMIN_LOGIN_EMAIL)
        if not admin_user:
            admin_user = await crud.get_user_by_username(session, ADMIN_LOGIN_USERNAME)

        if admin_user:
            admin_user.email = ADMIN_LOGIN_EMAIL
            admin_user.username = ADMIN_LOGIN_USERNAME
            admin_user.name = "Admin User"
            admin_user.password = admin_hash
            admin_user.role = "admin"
            await session.commit()
        else:
            await crud.create_user(session, {
                "id": "fallback-admin",
                "email": ADMIN_LOGIN_EMAIL,
                "username": ADMIN_LOGIN_USERNAME,
                "name": "Admin User",
                "password": admin_hash,
                "role": "admin",
                "created_at": datetime.now(timezone.utc),
            })


async def seed_default_banners():
    async with AsyncSessionLocal() as session:
        existing = await crud.get_banners(session, active_only=False)
        if existing:
            return

        for banner in DEFAULT_BANNERS:
            payload = normalize_banner_payload({**banner, "id": str(uuid.uuid4())})
            await crud.create_banner(session, payload)


async def seed_default_products():
    async with AsyncSessionLocal() as session:
        existing = await crud.get_products(session, limit=1)
        if existing:
            return

        for product in DEFAULT_PRODUCTS:
            await crud.create_product(session, {
                "id": str(uuid.uuid4()),
                **product,
                "variants": get_category_variants(product.get("category")),
            })


async def ensure_category_product_variants():
    async with AsyncSessionLocal() as session:
        products = await crud.get_products(session, limit=5000)
        for product in products:
            current_variants = product.variants or []
            should_update = not current_variants
            if product.category not in {"Cakes", "Custom Cakes"} and current_variants == DEFAULT_WEIGHT_VARIANTS:
                should_update = True
            if should_update:
                await crud.update_product(session, product.id, {
                    "variants": get_category_variants(product.category),
                })


@app.get("/")
async def root():
    return {"message": "Bakery backend is running", "docs": "/docs", "api_prefix": "/api"}

@app.on_event("startup")
async def ensure_database_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_default_admin_account()
    await seed_default_banners()
    await seed_default_products()
    await ensure_category_product_variants()
    if not EMAIL_CONFIGURED:
        logger.warning("="*80)
        logger.warning("EMAIL NOT CONFIGURED")
        logger.warning("Emails for login and order confirmation will NOT be sent.")
        logger.warning("To enable email, set MAIL_USERNAME and MAIL_PASSWORD in backend/.env")
        logger.warning("="*80)

# Shutdown MongoDB client
@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client = globals().get("client")
    if mongo_client is not None:
        mongo_client.close()
