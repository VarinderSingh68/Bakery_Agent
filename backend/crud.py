import logging

from sqlalchemy import select, update, delete, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from models import *  # All models

async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_username(session: AsyncSession, username: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def get_user_by_id(session: AsyncSession, user_id: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def create_user(session: AsyncSession, user_dict: Dict[str, Any]) -> User:
    user = User(**user_dict)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def get_session_by_token(session: AsyncSession, token: str) -> Optional[UserSession]:
    stmt = select(UserSession).where(UserSession.session_token == token)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def create_session(session: AsyncSession, session_dict: Dict[str, Any]) -> UserSession:
    session_obj = UserSession(**session_dict)
    session.add(session_obj)
    await session.commit()
    await session.refresh(session_obj)
    return session_obj

async def delete_session(session: AsyncSession, token: str):
    stmt = delete(UserSession).where(UserSession.session_token == token)
    await session.execute(stmt)
    await session.commit()

# Products
async def get_products(session: AsyncSession, category: Optional[str] = None, search: Optional[str] = None, limit: int = 5000) -> List[Product]:
    stmt = select(Product)
    if category:
        stmt = stmt.where(Product.category == category)
    if search:
        stmt = stmt.where(or_(Product.name.ilike(f"%{search}%"), Product.description.ilike(f"%{search}%")))
    stmt = stmt.order_by(func.random())  # Random for variety
    result = await session.execute(stmt.limit(limit))
    return result.scalars().all()

async def get_product(session: AsyncSession, product_id: str) -> Optional[Product]:
    result = await session.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()

async def create_product(session: AsyncSession, product_dict: Dict[str, Any]) -> Product:
    product = Product(**product_dict)
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product

async def update_product(session: AsyncSession, product_id: str, updates: Dict[str, Any]):
    stmt = update(Product).where(Product.id == product_id).values(**updates).returning(Product)
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()

async def delete_product(session: AsyncSession, product_id: str):
    stmt = delete(Product).where(Product.id == product_id)
    await session.execute(stmt)
    await session.commit()

# Cart
async def get_cart(session: AsyncSession, user_id: str) -> Optional[Cart]:
    result = await session.execute(select(Cart).where(Cart.user_id == user_id))
    return result.scalar_one_or_none()

async def upsert_cart(session: AsyncSession, user_id: str, items: List[Dict], total: float):
    try:
        logging.info(f"Upserting cart for user {user_id}: {len(items)} items, total {total}")
        cart = await get_cart(session, user_id)
        if cart:
            cart.items_json = items
            cart.total = total
        else:
            cart = Cart(user_id=user_id, items_json=items, total=total)
            session.add(cart)
        await session.commit()
        await session.refresh(cart)
        logging.info("Cart upserted successfully")
        return cart
    except Exception as e:
        await session.rollback()
        logging.error(f"Cart upsert error: {e}")
        raise

# Orders
async def get_user_orders(session: AsyncSession, user_id: str) -> List[Order]:
    stmt = select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_order(session: AsyncSession, order_id: str, user_id: str = None) -> Optional[Order]:
    stmt = select(Order).where(Order.id == order_id)
    if user_id:
        stmt = stmt.where(Order.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def create_order(session: AsyncSession, order_dict: Dict[str, Any]) -> Order:
    order = Order(**order_dict)
    session.add(order)
    await session.commit()
    await session.refresh(order)
    return order

async def get_all_orders(session: AsyncSession) -> List[Order]:
    stmt = select(Order).order_by(Order.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()

async def update_order_status(session: AsyncSession, order_id: str, status: str):
    stmt = update(Order).where(Order.id == order_id).values(status=status).returning(Order)
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()

# Reviews
async def create_review(session: AsyncSession, review_dict: Dict[str, Any]) -> Review:
    review = Review(**review_dict)
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return review

async def get_product_reviews(session: AsyncSession, product_id: str) -> List[Review]:
    stmt = select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_product_stats(session: AsyncSession, product_id: str):
    reviews = await get_product_reviews(session, product_id)
    if not reviews:
        return {'rating': 0.0, 'reviews_count': 0}
    avg_rating = sum(r.rating for r in reviews) / len(reviews)
    return {'rating': round(avg_rating, 1), 'reviews_count': len(reviews)}

# Wishlist
async def get_wishlist(session: AsyncSession, user_id: str) -> Optional[Wishlist]:
    result = await session.execute(select(Wishlist).where(Wishlist.user_id == user_id))
    return result.scalar_one_or_none()

async def upsert_wishlist(session: AsyncSession, user_id: str, product_ids: List[str]):
    wishlist = await get_wishlist(session, user_id)
    if wishlist:
        wishlist.product_ids = product_ids
    else:
        wishlist = Wishlist(user_id=user_id, product_ids=product_ids)
        session.add(wishlist)
    await session.commit()
    await session.refresh(wishlist)
    return wishlist

# Coupons
async def get_coupon(session: AsyncSession, code: str) -> Optional[Coupon]:
    result = await session.execute(select(Coupon).where(Coupon.code == code.upper()))
    return result.scalar_one_or_none()

# Contacts
async def create_contact(session: AsyncSession, contact_dict: Dict[str, Any]) -> ContactMessage:
    contact = ContactMessage(**contact_dict)
    session.add(contact)
    await session.commit()
    await session.refresh(contact)
    return contact

# Offer media
async def get_offer_media(session: AsyncSession, active_only: bool = True) -> List[OfferMedia]:
    stmt = select(OfferMedia)
    if active_only:
        stmt = stmt.where(OfferMedia.active == True)
    stmt = stmt.order_by(OfferMedia.sort_order.asc(), OfferMedia.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_offer_media_by_id(session: AsyncSession, media_id: str) -> Optional[OfferMedia]:
    result = await session.execute(select(OfferMedia).where(OfferMedia.id == media_id))
    return result.scalar_one_or_none()

async def create_offer_media(session: AsyncSession, media_dict: Dict[str, Any]) -> OfferMedia:
    media = OfferMedia(**media_dict)
    session.add(media)
    await session.commit()
    await session.refresh(media)
    return media

async def update_offer_media(session: AsyncSession, media_id: str, updates: Dict[str, Any]):
    stmt = update(OfferMedia).where(OfferMedia.id == media_id).values(**updates).returning(OfferMedia)
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()

async def delete_offer_media(session: AsyncSession, media_id: str):
    stmt = delete(OfferMedia).where(OfferMedia.id == media_id)
    await session.execute(stmt)
    await session.commit()

# Homepage banners
async def get_banners(session: AsyncSession, active_only: bool = True) -> List[Banner]:
    stmt = select(Banner)
    if active_only:
        stmt = stmt.where(Banner.active == True)
    stmt = stmt.order_by(Banner.sort_order.asc(), Banner.created_at.asc())
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_banner_by_id(session: AsyncSession, banner_id: str) -> Optional[Banner]:
    result = await session.execute(select(Banner).where(Banner.id == banner_id))
    return result.scalar_one_or_none()

async def create_banner(session: AsyncSession, banner_dict: Dict[str, Any]) -> Banner:
    banner = Banner(**banner_dict)
    session.add(banner)
    await session.commit()
    await session.refresh(banner)
    return banner

async def update_banner(session: AsyncSession, banner_id: str, updates: Dict[str, Any]):
    stmt = update(Banner).where(Banner.id == banner_id).values(**updates).returning(Banner)
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()

async def delete_banner(session: AsyncSession, banner_id: str):
    stmt = delete(Banner).where(Banner.id == banner_id)
    await session.execute(stmt)
    await session.commit()

# Admin stats
async def get_stats(session: AsyncSession):
    total_products = (await session.execute(select(func.count()).select_from(Product))).scalar()
    total_orders = (await session.execute(select(func.count()).select_from(Order))).scalar()
    total_users = (await session.execute(select(func.count()).select_from(User).where(User.role == 'customer'))).scalar()
    total_revenue = (await session.execute(select(func.sum(Order.total)).select_from(Order))).scalar() or 0.0
    return {
        'total_products': total_products,
        'total_orders': total_orders,
        'total_users': total_users,
        'total_revenue': round(total_revenue, 2)
    }
