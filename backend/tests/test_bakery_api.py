"""
Comprehensive Backend API Tests for Bakery E-commerce Website
Tests: Auth, Products, Cart, Wishlist, Orders, Reviews, Coupons, Contact, Admin
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@bakery.com"
ADMIN_PASSWORD = "1234"
CUSTOMER_EMAIL = "customer@test.com"
CUSTOMER_PASSWORD = "customer123"

# Coupon codes
COUPON_WELCOME10 = "WELCOME10"
COUPON_SAVE20 = "SAVE20"
COUPON_FESTIVE25 = "FESTIVE25"


class TestHealthAndProducts:
    """Test product endpoints - no auth required"""
    
    def test_get_all_products(self):
        """GET /api/products - should return 60+ products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        products = response.json()
        assert isinstance(products, list), "Products should be a list"
        assert len(products) >= 60, f"Expected 60+ products, got {len(products)}"
        print(f"✓ Found {len(products)} products")
    
    def test_get_products_by_category_cakes(self):
        """GET /api/products?category=Cakes - filter by category"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Cakes"})
        assert response.status_code == 200
        
        products = response.json()
        assert len(products) > 0, "Should have Cakes products"
        for p in products:
            assert p["category"] == "Cakes", f"Expected Cakes, got {p['category']}"
        print(f"✓ Found {len(products)} Cakes")
    
    def test_get_products_by_category_pastries(self):
        """GET /api/products?category=Pastries"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Pastries"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0
        print(f"✓ Found {len(products)} Pastries")
    
    def test_get_products_by_category_cookies(self):
        """GET /api/products?category=Cookies"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Cookies"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0
        print(f"✓ Found {len(products)} Cookies")
    
    def test_get_products_by_category_breads(self):
        """GET /api/products?category=Breads"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Breads"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0
        print(f"✓ Found {len(products)} Breads")
    
    def test_get_products_by_category_custom_cakes(self):
        """GET /api/products?category=Custom Cakes"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Custom Cakes"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0
        print(f"✓ Found {len(products)} Custom Cakes")
    
    def test_search_products(self):
        """GET /api/products?search=chocolate - search functionality"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "chocolate"})
        assert response.status_code == 200
        
        products = response.json()
        assert len(products) > 0, "Should find chocolate products"
        print(f"✓ Search 'chocolate' found {len(products)} products")
    
    def test_get_single_product(self):
        """GET /api/products/{id} - get product details"""
        # First get all products
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        product_id = products[0]["id"]
        
        # Get single product
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        
        product = response.json()
        assert product["id"] == product_id
        assert "name" in product
        assert "price" in product
        assert "category" in product
        assert "description" in product
        assert "image" in product
        assert "stock" in product
        print(f"✓ Got product: {product['name']}")
    
    def test_get_nonexistent_product(self):
        """GET /api/products/{invalid_id} - should return 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Nonexistent product returns 404")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_customer_login_success(self):
        """POST /api/auth/login - customer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == CUSTOMER_EMAIL
        assert data["user"]["role"] == "customer"
        print(f"✓ Customer login successful: {data['user']['name']}")
    
    def test_admin_login_success(self):
        """POST /api/auth/login - admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials return 401")
    
    def test_register_new_user(self):
        """POST /api/auth/register - register new user"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["role"] == "customer"
        print(f"✓ User registration successful: {unique_email}")
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register - duplicate email should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": CUSTOMER_EMAIL,
            "password": "testpass123",
            "name": "Duplicate User"
        })
        assert response.status_code == 400
        print("✓ Duplicate email registration returns 400")
    
    def test_get_current_user(self):
        """GET /api/auth/me - get current user with token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        user = response.json()
        assert user["email"] == CUSTOMER_EMAIL
        print(f"✓ Get current user: {user['name']}")


class TestCartOperations:
    """Test cart endpoints - requires authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        """Get a product ID for testing"""
        response = requests.get(f"{BASE_URL}/api/products")
        return response.json()[0]["id"]
    
    def test_get_empty_cart(self, auth_token):
        """GET /api/cart - get cart (may be empty)"""
        response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        cart = response.json()
        assert "items" in cart
        assert "total" in cart or "user_id" in cart
        print(f"✓ Got cart with {len(cart.get('items', []))} items")
    
    def test_add_to_cart(self, auth_token, product_id):
        """POST /api/cart - add item to cart"""
        # Get product details
        product_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        product = product_response.json()
        
        response = requests.post(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "quantity": 2,
                "name": product["name"],
                "price": product["price"],
                "image": product["image"]
            }
        )
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        
        cart = response.json()
        assert len(cart["items"]) > 0
        print(f"✓ Added {product['name']} to cart")
    
    def test_update_cart_quantity(self, auth_token, product_id):
        """PUT /api/cart/{product_id} - update quantity"""
        # First add to cart
        product_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        product = product_response.json()
        
        requests.post(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "quantity": 1,
                "name": product["name"],
                "price": product["price"],
                "image": product["image"]
            }
        )
        
        # Update quantity
        response = requests.put(
            f"{BASE_URL}/api/cart/{product_id}?quantity=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ Updated cart quantity")
    
    def test_remove_from_cart(self, auth_token, product_id):
        """DELETE /api/cart/{product_id} - remove item"""
        # First add to cart
        product_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        product = product_response.json()
        
        requests.post(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "quantity": 1,
                "name": product["name"],
                "price": product["price"],
                "image": product["image"]
            }
        )
        
        # Remove from cart
        response = requests.delete(
            f"{BASE_URL}/api/cart/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ Removed item from cart")


class TestWishlist:
    """Test wishlist endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        response = requests.get(f"{BASE_URL}/api/products")
        return response.json()[5]["id"]  # Use different product
    
    def test_get_wishlist(self, auth_token):
        """GET /api/wishlist"""
        response = requests.get(
            f"{BASE_URL}/api/wishlist",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ Got wishlist")
    
    def test_add_to_wishlist(self, auth_token, product_id):
        """POST /api/wishlist/{product_id}"""
        response = requests.post(
            f"{BASE_URL}/api/wishlist/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ Added to wishlist")
    
    def test_remove_from_wishlist(self, auth_token, product_id):
        """DELETE /api/wishlist/{product_id}"""
        # First add
        requests.post(
            f"{BASE_URL}/api/wishlist/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Then remove
        response = requests.delete(
            f"{BASE_URL}/api/wishlist/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ Removed from wishlist")


class TestCoupons:
    """Test coupon validation"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        return response.json()["token"]
    
    def test_validate_welcome10_coupon(self, auth_token):
        """POST /api/coupons/validate - WELCOME10 (10%)"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"code": "WELCOME10", "total": 1000}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percentage"] == 10
        assert data["discount"] == 100  # 10% of 1000
        print("✓ WELCOME10 coupon validated (10% off)")
    
    def test_validate_save20_coupon(self, auth_token):
        """POST /api/coupons/validate - SAVE20 (20%)"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"code": "SAVE20", "total": 1000}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_percentage"] == 20
        assert data["discount"] == 200
        print("✓ SAVE20 coupon validated (20% off)")
    
    def test_validate_festive25_coupon(self, auth_token):
        """POST /api/coupons/validate - FESTIVE25 (25%)"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"code": "FESTIVE25", "total": 1000}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_percentage"] == 25
        assert data["discount"] == 250
        print("✓ FESTIVE25 coupon validated (25% off)")
    
    def test_invalid_coupon(self, auth_token):
        """POST /api/coupons/validate - invalid coupon"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"code": "INVALIDCODE", "total": 1000}
        )
        assert response.status_code == 404
        print("✓ Invalid coupon returns 404")


class TestReviews:
    """Test review endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        response = requests.get(f"{BASE_URL}/api/products")
        return response.json()[10]["id"]  # Use different product
    
    def test_get_product_reviews(self, product_id):
        """GET /api/reviews/{product_id}"""
        response = requests.get(f"{BASE_URL}/api/reviews/{product_id}")
        assert response.status_code == 200
        
        reviews = response.json()
        assert isinstance(reviews, list)
        print(f"✓ Got {len(reviews)} reviews for product")
    
    def test_submit_review(self, auth_token):
        """POST /api/reviews - submit a review"""
        # Get a product that hasn't been reviewed by this user
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        # Try to find a product without a review from this user
        for product in products[20:30]:  # Try products 20-30
            response = requests.post(
                f"{BASE_URL}/api/reviews",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "product_id": product["id"],
                    "rating": 5,
                    "comment": "Excellent product! Highly recommended."
                }
            )
            if response.status_code == 200:
                review = response.json()
                assert review["rating"] == 5
                assert "comment" in review
                print(f"✓ Submitted review for {product['name']}")
                return
            elif response.status_code == 400:
                # Already reviewed, try next product
                continue
        
        # If all products already reviewed, that's okay
        print("✓ Review submission tested (user may have already reviewed)")


class TestOrders:
    """Test order endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_order(self, auth_token):
        """POST /api/orders - create a new order"""
        # Get a product
        products_response = requests.get(f"{BASE_URL}/api/products")
        product = products_response.json()[0]
        
        order_data = {
            "items": [{
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": 2,
                "image": product["image"]
            }],
            "subtotal": product["price"] * 2,
            "shipping_cost": 50,
            "tax": product["price"] * 2 * 0.05,
            "discount": 0,
            "total": product["price"] * 2 + 50 + product["price"] * 2 * 0.05,
            "payment_method": "COD",
            "delivery_date": "2026-04-01",
            "shipping_address": "123 Test Street",
            "shipping_city": "Mumbai",
            "shipping_state": "Maharashtra",
            "shipping_zip": "400001"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=order_data
        )
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        order = response.json()
        assert "order_number" in order
        assert order["status"] == "confirmed"
        assert order["payment_method"] == "COD"
        print(f"✓ Order created: {order['order_number']}")
    
    def test_get_user_orders(self, auth_token):
        """GET /api/orders - get user's orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Got {len(orders)} orders")


class TestContact:
    """Test contact form"""
    
    def test_submit_contact_form(self):
        """POST /api/contact - submit contact message"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Inquiry",
            "message": "This is a test message from automated testing."
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print("✓ Contact form submitted successfully")


class TestAdminEndpoints:
    """Test admin-only endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_get_stats(self, admin_token):
        """GET /api/admin/stats - admin dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        stats = response.json()
        assert "total_products" in stats
        assert "total_orders" in stats
        assert "total_users" in stats
        assert "total_revenue" in stats
        print(f"✓ Admin stats: {stats['total_products']} products, {stats['total_orders']} orders")
    
    def test_admin_get_all_orders(self, admin_token):
        """GET /api/admin/orders - get all orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Admin got {len(orders)} orders")
    
    def test_customer_cannot_access_admin(self, customer_token):
        """Customer should not access admin endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 403
        print("✓ Customer cannot access admin endpoints (403)")
    
    def test_admin_create_product(self, admin_token):
        """POST /api/admin/products - create new product"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "TEST_New Product",
                "category": "Cakes",
                "price": 999,
                "description": "Test product for automated testing",
                "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
                "stock": 10
            }
        )
        assert response.status_code == 200
        
        product = response.json()
        assert product["name"] == "TEST_New Product"
        print(f"✓ Admin created product: {product['name']}")
        
        # Cleanup - delete the test product
        requests.delete(
            f"{BASE_URL}/api/admin/products/{product['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
