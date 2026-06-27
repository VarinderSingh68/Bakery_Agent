# Bakery E-commerce Website - Product Requirements Document

## Original Problem Statement
Create a fully functional E-commerce Website for a Bakery with modern UI and complete backend functionality.

## Core Requirements
- **Frontend**: Responsive design, attractive bakery theme
- **Pages**: Home, Shop, Product Details, Cart, Checkout, Login/Register, Order Confirmation, Contact, Admin, Wishlist, Orders
- **Features**: 60+ products inventory, Categories (Cakes, Pastries, Cookies, Breads, Custom Cakes), Product search/filter, Add/Remove from cart, Quantity, Price calculation
- **Backend**: Store users, products, orders. User authentication (hashed passwords)
- **Extra Features**: Wishlist, Reviews & ratings, Coupon/discount system, Delivery date selection, Payments (COD/UPI/Netbanking), Email Notifications (SMTP)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Context API, Lucide-React, Shadcn UI, date-fns
- **Backend**: FastAPI, Motor (Async MongoDB), PyJWT, Bcrypt, HTTPX
- **Database**: MongoDB
- **Auth**: JWT + Google OAuth (Emergent-managed)

## Architecture
```
/app/backend/server.py        - FastAPI endpoints (auth, products, cart, orders, reviews, coupons, contact, admin, analytics)
/app/backend/seed_data.py      - DB seeder (60 products, 2 users, 3 coupons)
/app/frontend/src/App.js       - Router & layout
/app/frontend/src/context/     - AuthContext, CartContext, WishlistContext
/app/frontend/src/pages/       - All page components
/app/frontend/src/components/  - Header, Footer, ProductCard, ExitIntentModal, etc.
```

## What's Implemented (as of March 28, 2026)

### DONE - Core Features
- [x] FastAPI Backend with all CRUD endpoints
- [x] MongoDB seeding: **184 products** across **15 categories**, admin/customer users, 5 coupons
- [x] React Frontend with routing and all pages
- [x] User auth: Login, Register, JWT tokens (with proper Google OAuth user handling)
- [x] Google OAuth integration (Emergent-managed) — JWT token persisted in localStorage
- [x] Product listing with category filters and search (15 categories)
- [x] **Moving promotional banners** — 5 auto-advancing slides with navigation arrows & dots
- [x] Product details with quantity selector
- [x] Cart: add, remove, update quantity, price calculation
- [x] Wishlist: add/remove products
- [x] Checkout: address form, delivery date picker, payment methods (COD/UPI/Netbanking)
- [x] Coupon/discount system (WELCOME10, SAVE15, SAVE20, FESTIVE25, FIRST30)
- [x] Reviews & ratings on product detail pages
- [x] Order placement and order history
- [x] Admin panel (product CRUD, order management, stats)
- [x] Contact form
- [x] Exit Intent Modal with A/B testing
- [x] CSS Animations & Transitions
- [x] Email notification SMTP configured (credentials issue - see below)
- [x] Analytics tracking endpoint
- [x] **Recommended For You** section on homepage (personalized for logged-in users, trending for anonymous)
- [x] Recommendations backend (order history + category-based + top-rated + popular)

### Testing Status
- Backend: 74+ API tests passing (100%) across 4 iterations
- Frontend: All major features verified via Playwright
- Test files: /app/backend/tests/test_bakery_api.py, test_login_recommendations.py, test_inventory_expansion.py
- Reports: /app/test_reports/iteration_1.json through iteration_4.json

## Product Categories (15)
Cakes (20), Cupcakes (15), Pastries (15), Donuts (12), Cookies (12), Muffins (12), Breads (12), Macarons (12), Pies & Tarts (12), Brownies & Bars (12), Ice Cream & Frozen (10), Beverages (12), Gift Hampers (8), Savory (10), Custom Cakes (10)

## Known Issues
1. **Email SMTP**: Configured with user-provided Gmail app password, but Gmail rejected credentials ("Username and Password not accepted"). User needs to verify: (a) 2-Step Verification is enabled, (b) App password is correct, (c) Email address is correct (varindersingnony68@gmail.com)
2. **bcrypt warning**: Harmless `module 'bcrypt' has no attribute '__about__'` log warning (passlib version mismatch, does not affect functionality)

## Backlog / Future Enhancements
- P1: Fix email SMTP credential issue with user
- P2: Real Google Analytics / Mixpanel integration (needs tracking IDs)
- P2: Heatmap session recording
- P2: Predictive analytics backend
- P3: Order status tracking with real-time updates
- P3: Product image upload for admin
- P3: Multi-language support

## API Endpoints
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/google/session`, `POST /api/auth/logout`
- `GET /api/products`, `GET /api/products/{id}`
- `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/{id}`, `DELETE /api/cart/{id}`
- `GET /api/wishlist`, `POST /api/wishlist/{id}`, `DELETE /api/wishlist/{id}`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{id}`
- `POST /api/reviews`, `GET /api/reviews/{product_id}`
- `POST /api/coupons/validate`
- `GET /api/recommendations` (authenticated - personalized)
- `GET /api/recommendations/trending` (anonymous - popular products)
- `POST /api/contact`
- `POST /api/analytics/track`
- `GET /api/admin/stats`, `GET /api/admin/orders`, `PUT /api/admin/orders/{id}/status`
- `POST /api/admin/products`, `PUT /api/admin/products/{id}`, `DELETE /api/admin/products/{id}`

## DB Schema
- **users**: {id, email, password, name, role, google_id, picture, created_at}
- **products**: {id, name, description, price, category, image, stock, rating, reviews_count}
- **orders**: {id, user_id, user_name, user_email, order_number, items, subtotal, shipping_cost, tax, discount, total, payment_method, delivery_date, shipping_address/city/state/zip, status, created_at}
- **carts**: {user_id, items, total}
- **wishlists**: {user_id, product_ids}
- **reviews**: {id, product_id, user_id, user_name, rating, comment, created_at}
- **coupons**: {code, discount_percentage, expiry_date, active}
- **contacts**: {id, name, email, subject, message, created_at}

## Test Credentials
- Admin: admin@bakery.com / admin123
- Customer: customer@test.com / customer123
- Coupons: WELCOME10 (10%), SAVE20 (20%), FESTIVE25 (25%)
