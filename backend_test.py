import requests
import sys
import json
from datetime import datetime, timedelta

class BakeryAPITester:
    def __init__(self, base_url="https://bakery-ecommerce-8.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_product_id = None
        self.test_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_type=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if auth_type == 'admin' and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif auth_type == 'customer' and self.customer_token:
            test_headers['Authorization'] = f'Bearer {self.customer_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@bakery.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_customer_login(self):
        """Test customer login"""
        success, response = self.run_test(
            "Customer Login",
            "POST",
            "auth/login",
            200,
            data={"email": "customer@test.com", "password": "customer123"}
        )
        if success and 'token' in response:
            self.customer_token = response['token']
            print(f"   Customer token obtained: {self.customer_token[:20]}...")
            return True
        return False

    def test_customer_registration(self):
        """Test customer registration with unique email"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        test_email = f"test_user_{timestamp}@test.com"
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            200,
            data={
                "name": "Test User",
                "email": test_email,
                "password": "testpass123"
            }
        )
        return success

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        if success and response:
            print(f"   Found {len(response)} products")
            if response:
                self.test_product_id = response[0]['id']
                print(f"   Using product ID for tests: {self.test_product_id}")
        return success

    def test_get_single_product(self):
        """Test getting a single product"""
        if not self.test_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        success, response = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{self.test_product_id}",
            200
        )
        return success

    def test_search_products(self):
        """Test product search"""
        success, response = self.run_test(
            "Search Products",
            "GET",
            "products?search=cake",
            200
        )
        if success:
            print(f"   Search returned {len(response)} products")
        return success

    def test_filter_products_by_category(self):
        """Test filtering products by category"""
        success, response = self.run_test(
            "Filter Products by Category",
            "GET",
            "products?category=Cakes",
            200
        )
        if success:
            print(f"   Category filter returned {len(response)} products")
        return success

    def test_cart_operations(self):
        """Test cart operations"""
        if not self.customer_token or not self.test_product_id:
            print("❌ Skipping cart tests - Missing customer token or product ID")
            return False

        # Get empty cart
        success1, _ = self.run_test(
            "Get Empty Cart",
            "GET",
            "cart",
            200,
            auth_type='customer'
        )

        # Add item to cart
        success2, _ = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data={
                "product_id": self.test_product_id,
                "quantity": 2,
                "name": "Test Product",
                "price": 100.0,
                "image": "test.jpg"
            },
            auth_type='customer'
        )

        # Update cart quantity
        success3, _ = self.run_test(
            "Update Cart Quantity",
            "PUT",
            f"cart/{self.test_product_id}?quantity=3",
            200,
            auth_type='customer'
        )

        # Remove from cart
        success4, _ = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"cart/{self.test_product_id}",
            200,
            auth_type='customer'
        )

        return all([success1, success2, success3, success4])

    def test_wishlist_operations(self):
        """Test wishlist operations"""
        if not self.customer_token or not self.test_product_id:
            print("❌ Skipping wishlist tests - Missing customer token or product ID")
            return False

        # Get empty wishlist
        success1, _ = self.run_test(
            "Get Wishlist",
            "GET",
            "wishlist",
            200,
            auth_type='customer'
        )

        # Add to wishlist
        success2, _ = self.run_test(
            "Add to Wishlist",
            "POST",
            f"wishlist/{self.test_product_id}",
            200,
            auth_type='customer'
        )

        # Remove from wishlist
        success3, _ = self.run_test(
            "Remove from Wishlist",
            "DELETE",
            f"wishlist/{self.test_product_id}",
            200,
            auth_type='customer'
        )

        return all([success1, success2, success3])

    def test_coupon_validation(self):
        """Test coupon validation"""
        if not self.customer_token:
            print("❌ Skipping coupon tests - Missing customer token")
            return False

        # Test valid coupon
        success1, response1 = self.run_test(
            "Validate WELCOME10 Coupon",
            "POST",
            "coupons/validate",
            200,
            data={"code": "WELCOME10", "total": 1000.0},
            auth_type='customer'
        )

        # Test invalid coupon
        success2, _ = self.run_test(
            "Validate Invalid Coupon",
            "POST",
            "coupons/validate",
            404,
            data={"code": "INVALID", "total": 1000.0},
            auth_type='customer'
        )

        return success1 and success2

    def test_reviews(self):
        """Test review operations"""
        if not self.customer_token or not self.test_product_id:
            print("❌ Skipping review tests - Missing customer token or product ID")
            return False

        # Get product reviews
        success1, _ = self.run_test(
            "Get Product Reviews",
            "GET",
            f"reviews/{self.test_product_id}",
            200
        )

        # Add review
        success2, _ = self.run_test(
            "Add Product Review",
            "POST",
            "reviews",
            200,
            data={
                "product_id": self.test_product_id,
                "rating": 5,
                "comment": "Great product! Automated test review."
            },
            auth_type='customer'
        )

        return success1 and success2

    def test_order_creation(self):
        """Test order creation"""
        if not self.customer_token or not self.test_product_id:
            print("❌ Skipping order tests - Missing customer token or product ID")
            return False

        # First add item to cart
        self.run_test(
            "Add to Cart for Order",
            "POST",
            "cart",
            200,
            data={
                "product_id": self.test_product_id,
                "quantity": 1,
                "name": "Test Product",
                "price": 100.0,
                "image": "test.jpg"
            },
            auth_type='customer'
        )

        # Create order
        order_data = {
            "items": [{
                "product_id": self.test_product_id,
                "name": "Test Product",
                "price": 100.0,
                "quantity": 1,
                "image": "test.jpg"
            }],
            "subtotal": 100.0,
            "shipping_cost": 50.0,
            "tax": 5.0,
            "discount": 0.0,
            "total": 155.0,
            "payment_method": "Cash on Delivery",
            "delivery_date": (datetime.now() + timedelta(days=3)).strftime('%B %d, %Y'),
            "shipping_address": "123 Test Street",
            "shipping_city": "Test City",
            "shipping_state": "Test State",
            "shipping_zip": "123456"
        }

        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data,
            auth_type='customer'
        )

        if success and response:
            self.test_order_id = response.get('id')
            print(f"   Order created with ID: {self.test_order_id}")

        return success

    def test_order_retrieval(self):
        """Test order retrieval"""
        if not self.customer_token:
            print("❌ Skipping order retrieval tests - Missing customer token")
            return False

        # Get user orders
        success1, response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200,
            auth_type='customer'
        )

        if success1 and response:
            print(f"   Found {len(response)} orders")

        # Get specific order if available
        success2 = True
        if self.test_order_id:
            success2, _ = self.run_test(
                "Get Specific Order",
                "GET",
                f"orders/{self.test_order_id}",
                200,
                auth_type='customer'
            )

        return success1 and success2

    def test_contact_form(self):
        """Test contact form submission"""
        success, _ = self.run_test(
            "Submit Contact Form",
            "POST",
            "contact",
            200,
            data={
                "name": "Test User",
                "email": "test@example.com",
                "subject": "Test Subject",
                "message": "This is a test message from automated testing."
            }
        )
        return success

    def test_admin_stats(self):
        """Test admin statistics"""
        if not self.admin_token:
            print("❌ Skipping admin stats test - Missing admin token")
            return False

        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200,
            auth_type='admin'
        )

        if success and response:
            print(f"   Stats: {response}")

        return success

    def test_admin_orders(self):
        """Test admin order management"""
        if not self.admin_token:
            print("❌ Skipping admin order tests - Missing admin token")
            return False

        # Get all orders
        success1, response = self.run_test(
            "Get All Orders (Admin)",
            "GET",
            "admin/orders",
            200,
            auth_type='admin'
        )

        if success1 and response:
            print(f"   Found {len(response)} total orders")

        # Update order status if we have a test order
        success2 = True
        if self.test_order_id:
            success2, _ = self.run_test(
                "Update Order Status",
                "PUT",
                f"admin/orders/{self.test_order_id}/status?status=processing",
                200,
                auth_type='admin'
            )

        return success1 and success2

    def test_admin_product_management(self):
        """Test admin product management"""
        if not self.admin_token:
            print("❌ Skipping admin product tests - Missing admin token")
            return False

        # Update product stock
        success1 = True
        if self.test_product_id:
            success1, _ = self.run_test(
                "Update Product Stock",
                "PUT",
                f"admin/products/{self.test_product_id}",
                200,
                data={"stock": 100},
                auth_type='admin'
            )

        return success1

def main():
    print("🧪 Starting Bakery E-commerce API Tests")
    print("=" * 50)
    
    tester = BakeryAPITester()
    
    # Authentication Tests
    print("\n📋 AUTHENTICATION TESTS")
    admin_login_success = tester.test_admin_login()
    customer_login_success = tester.test_customer_login()
    registration_success = tester.test_customer_registration()
    
    # Product Tests
    print("\n📋 PRODUCT TESTS")
    products_success = tester.test_get_products()
    single_product_success = tester.test_get_single_product()
    search_success = tester.test_search_products()
    filter_success = tester.test_filter_products_by_category()
    
    # Cart Tests
    print("\n📋 CART TESTS")
    cart_success = tester.test_cart_operations()
    
    # Wishlist Tests
    print("\n📋 WISHLIST TESTS")
    wishlist_success = tester.test_wishlist_operations()
    
    # Coupon Tests
    print("\n📋 COUPON TESTS")
    coupon_success = tester.test_coupon_validation()
    
    # Review Tests
    print("\n📋 REVIEW TESTS")
    review_success = tester.test_reviews()
    
    # Order Tests
    print("\n📋 ORDER TESTS")
    order_creation_success = tester.test_order_creation()
    order_retrieval_success = tester.test_order_retrieval()
    
    # Contact Tests
    print("\n📋 CONTACT TESTS")
    contact_success = tester.test_contact_form()
    
    # Admin Tests
    print("\n📋 ADMIN TESTS")
    admin_stats_success = tester.test_admin_stats()
    admin_orders_success = tester.test_admin_orders()
    admin_products_success = tester.test_admin_product_management()
    
    # Print Results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for test in tester.failed_tests:
            print(f"   - {test}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())