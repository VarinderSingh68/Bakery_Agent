"""
Test suite for Bakery E-commerce Inventory Expansion
Tests 184 products across 15 categories
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductInventory:
    """Tests for expanded product inventory - 184 products across 15 categories"""
    
    def test_total_product_count(self):
        """Verify total product count is 184"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 184, f"Expected 184 products, got {len(products)}"
    
    def test_category_cakes_count(self):
        """Verify Cakes category has 20 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Cakes"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 20, f"Expected 20 Cakes, got {len(products)}"
    
    def test_category_cupcakes_count(self):
        """Verify Cupcakes category has 15 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Cupcakes"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 15, f"Expected 15 Cupcakes, got {len(products)}"
    
    def test_category_pastries_count(self):
        """Verify Pastries category has 15 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Pastries"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 15, f"Expected 15 Pastries, got {len(products)}"
    
    def test_category_donuts_count(self):
        """Verify Donuts category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Donuts"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Donuts, got {len(products)}"
    
    def test_category_cookies_count(self):
        """Verify Cookies category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Cookies"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Cookies, got {len(products)}"
    
    def test_category_muffins_count(self):
        """Verify Muffins category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Muffins"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Muffins, got {len(products)}"
    
    def test_category_breads_count(self):
        """Verify Breads category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Breads"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Breads, got {len(products)}"
    
    def test_category_macarons_count(self):
        """Verify Macarons category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Macarons"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Macarons, got {len(products)}"
    
    def test_category_pies_tarts_count(self):
        """Verify Pies & Tarts category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Pies & Tarts"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Pies & Tarts, got {len(products)}"
    
    def test_category_brownies_bars_count(self):
        """Verify Brownies & Bars category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Brownies & Bars"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Brownies & Bars, got {len(products)}"
    
    def test_category_ice_cream_frozen_count(self):
        """Verify Ice Cream & Frozen category has 10 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Ice Cream & Frozen"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 10, f"Expected 10 Ice Cream & Frozen, got {len(products)}"
    
    def test_category_beverages_count(self):
        """Verify Beverages category has 12 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Beverages"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 12, f"Expected 12 Beverages, got {len(products)}"
    
    def test_category_gift_hampers_count(self):
        """Verify Gift Hampers category has 8 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Gift Hampers"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 8, f"Expected 8 Gift Hampers, got {len(products)}"
    
    def test_category_savory_count(self):
        """Verify Savory category has 10 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Savory"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 10, f"Expected 10 Savory, got {len(products)}"
    
    def test_category_custom_cakes_count(self):
        """Verify Custom Cakes category has 10 products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Custom Cakes"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 10, f"Expected 10 Custom Cakes, got {len(products)}"


class TestProductSearch:
    """Tests for product search functionality across 184 products"""
    
    def test_search_chocolate(self):
        """Search for 'chocolate' should return multiple products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "chocolate"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 10, f"Expected >10 chocolate products, got {len(products)}"
    
    def test_search_vanilla(self):
        """Search for 'vanilla' should return multiple products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "vanilla"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 5, f"Expected >5 vanilla products, got {len(products)}"
    
    def test_search_macaron(self):
        """Search for 'macaron' should return macaron products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "macaron"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 12, f"Expected >=12 macaron products, got {len(products)}"
    
    def test_search_donut(self):
        """Search for 'donut' should return donut products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "donut"})
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 12, f"Expected >=12 donut products, got {len(products)}"


class TestProductDetails:
    """Tests for individual product details"""
    
    def test_get_single_product(self):
        """Get a single product by ID"""
        # First get all products
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        # Get first product details
        product_id = products[0]["id"]
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        product = response.json()
        
        # Verify product structure
        assert "id" in product
        assert "name" in product
        assert "category" in product
        assert "price" in product
        assert "description" in product
        assert "image" in product
        assert "stock" in product
    
    def test_product_not_found(self):
        """Non-existent product returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/non-existent-id")
        assert response.status_code == 404


class TestAddToCartNewCategories:
    """Tests for adding products from new categories to cart"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for customer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@test.com",
            "password": "customer123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_add_donut_to_cart(self, auth_token):
        """Add a donut product to cart"""
        # Get a donut product
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Donuts"})
        assert response.status_code == 200
        donuts = response.json()
        assert len(donuts) > 0
        
        donut = donuts[0]
        
        # Add to cart
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/cart", json={
            "product_id": donut["id"],
            "quantity": 2,
            "name": donut["name"],
            "price": donut["price"],
            "image": donut["image"]
        }, headers=headers)
        
        assert response.status_code == 200
        cart = response.json()
        assert "items" in cart
        assert any(item["product_id"] == donut["id"] for item in cart["items"])
    
    def test_add_macaron_to_cart(self, auth_token):
        """Add a macaron product to cart"""
        # Get a macaron product
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Macarons"})
        assert response.status_code == 200
        macarons = response.json()
        assert len(macarons) > 0
        
        macaron = macarons[0]
        
        # Add to cart
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/cart", json={
            "product_id": macaron["id"],
            "quantity": 3,
            "name": macaron["name"],
            "price": macaron["price"],
            "image": macaron["image"]
        }, headers=headers)
        
        assert response.status_code == 200
        cart = response.json()
        assert "items" in cart
        assert any(item["product_id"] == macaron["id"] for item in cart["items"])
    
    def test_add_beverage_to_cart(self, auth_token):
        """Add a beverage product to cart"""
        # Get a beverage product
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "Beverages"})
        assert response.status_code == 200
        beverages = response.json()
        assert len(beverages) > 0
        
        beverage = beverages[0]
        
        # Add to cart
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/cart", json={
            "product_id": beverage["id"],
            "quantity": 1,
            "name": beverage["name"],
            "price": beverage["price"],
            "image": beverage["image"]
        }, headers=headers)
        
        assert response.status_code == 200
        cart = response.json()
        assert "items" in cart
        assert any(item["product_id"] == beverage["id"] for item in cart["items"])
    
    def test_clear_cart_after_tests(self, auth_token):
        """Clean up cart after tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get cart
        response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        if response.status_code == 200:
            cart = response.json()
            # Remove all items
            for item in cart.get("items", []):
                requests.delete(f"{BASE_URL}/api/cart/{item['product_id']}", headers=headers)
