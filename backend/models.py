from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.sqlite import JSON  # For lists/dicts
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from uuid import uuid4
from datetime import datetime
import json

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)  # hashed
    name = Column(String, nullable=False)
    role = Column(String, default="customer")
    picture = Column(String, nullable=True)
    google_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    carts = relationship("Cart", back_populates="user", uselist=True)
    orders = relationship("Order", back_populates="user", uselist=True)
    reviews = relationship("Review", back_populates="user")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    category = Column(String, index=True)
    price = Column(Float, nullable=False)
    description = Column(Text)
    image = Column(String)
    stock = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    variants = Column(JSON)  # list of dicts [{"label": "1kg", "multiplier": 1}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Cart(Base):
    __tablename__ = "carts"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    items_json = Column(JSON, nullable=False, default=list)  # [{"product_id": "", "quantity": 1, ...}]
    total = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="carts")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_name = Column(String)
    user_email = Column(String)
    order_number = Column(String, unique=True, index=True)
    items_json = Column(JSON, nullable=False)  # list of order items dicts
    subtotal = Column(Float)
    shipping_cost = Column(Float)
    tax = Column(Float)
    discount = Column(Float, default=0.0)
    total = Column(Float)
    payment_method = Column(String)
    delivery_date = Column(String)
    shipping_address = Column(String)
    shipping_city = Column(String)
    shipping_state = Column(String)
    shipping_zip = Column(String)
    coupon_code = Column(String, nullable=True)
    status = Column(String, default="confirmed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="orders")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    product_id = Column(String, ForeignKey("products.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"))
    user_name = Column(String)
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")
    product = relationship("Product")

class Coupon(Base):
    __tablename__ = "coupons"

    code = Column(String, primary_key=True)
    discount_percentage = Column(Float)
    expiry_date = Column(String)
    active = Column(Boolean, default=True)

class ContactMessage(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String)
    email = Column(String)
    subject = Column(String)
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OfferMedia(Base):
    __tablename__ = "offer_media"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    kind = Column(String, nullable=False, default="offer")  # offer | reel
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    badge = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    reel_url = Column(String, nullable=True)
    embed_url = Column(String, nullable=True)
    cta_label = Column(String, nullable=True)
    cta_url = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Banner(Base):
    __tablename__ = "banners"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    cta = Column(String, nullable=True)
    cta_link = Column(String, nullable=True)
    image = Column(String, nullable=True)
    bg_from = Column(String, default="#2D241E")
    bg_to = Column(String, default="#5C4B40")
    accent = Column(String, default="#F2D780")
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    session_token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    product_ids = Column(JSON, default=list)  # list of str

    user = relationship("User")

