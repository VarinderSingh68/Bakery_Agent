# Complete Bakery E-commerce Setup Guide

This guide will help you set up and run the complete Bakery e-commerce application with working authentication, email functionality, and all features.

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

## Quick Start Commands

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Initialize database (creates tables)
python init_db.py

# Seed authentication users (creates admin and test users)
python seed_auth_users.py

# Start the backend server
python server.py
```

**Backend will run on:** `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (open new terminal)
cd frontend

# Install Node dependencies
npm install

# Start the frontend development server
npm start
```

**Frontend will run on:** `http://localhost:3000`

## Test Credentials

After running `seed_auth_users.py`, you can login with:

- **Admin Account:**
  - Email: `admin@bakery.com`
  - Password: `admin123`

- **Test User Account:**
  - Email: `user@bakery.com`
  - Password: `user123`

## Troubleshooting

### Database Issues

If you encounter database errors, reset the database:

```bash
cd backend
# Remove old database files
del bakery.db bakery.db-shm bakery.db-wal
# Recreate database
python init_db.py
# Re-seed users
python seed_auth_users.py
```

### Port Already in Use

If ports 8000 or 3000 are already in use:

**Backend (port 8000):**
```bash
# Kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (port 3000):**
```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Email Configuration

The application uses a mock email system for testing. No actual emails are sent. Email functionality is simulated in the backend.

### Authentication Issues

If login fails:
1. Ensure backend is running on `http://localhost:8000`
2. Check that users are seeded: `python backend/seed_auth_users.py`
3. Verify database exists: `backend/bakery.db`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)

### Orders
- `GET /api/orders` - List user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order details

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/items` - Add item to cart
- `DELETE /api/cart/items/{id}` - Remove item from cart

## Using Batch Files

You can also use the provided batch files:

```bash
# Start backend
start-backend.bat

# Start frontend (in new terminal)
start-frontend.bat
```

## Production Deployment

For production deployment, refer to `deploy.yml` for Docker deployment configuration.

## Features

- ✅ User Authentication (Register/Login)
- ✅ Product Management
- ✅ Shopping Cart
- ✅ Order Management
- ✅ Admin Dashboard
- ✅ Mock Email System
- ✅ Database Persistence
- ✅ Responsive UI

## Support

If you encounter any issues not covered in this guide, please check:
- `GOOGLE_OAUTH_FIX.md` - For OAuth related issues
- `NETWORK_ERROR_FIXES.md` - For network connectivity issues
- `TODO.md` - For known issues and planned features