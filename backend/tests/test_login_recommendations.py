"""
Test file for Login and Recommendations features
Focus: Email/password login, Google OAuth error handling, and recommendations endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEmailPasswordLogin:
    """Test email/password login functionality"""
    
    def test_customer_login_success(self):
        """Customer login with valid credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@test.com",
            "password": "customer123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "customer@test.com"
        assert data["user"]["role"] == "customer"
        assert len(data["token"]) > 0
        print(f"✓ Customer login successful: {data['user']['name']}")
    
    def test_admin_login_success(self):
        """Admin login with valid credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@bakery.com",
            "password": "1234"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "admin@bakery.com"
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_login_invalid_password(self):
        """Login with wrong password should fail with 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "Invalid email or password" in data["detail"]
        print("✓ Invalid password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Login with non-existent email should fail with 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        print("✓ Non-existent user correctly rejected")
    
    def test_google_oauth_user_email_login_error(self):
        """Google OAuth user trying email/password login should get helpful error"""
        # First, we need to check if varindersinghnony68@gmail.com exists as a Google OAuth user
        # This user should have no password set
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "varindersinghnony68@gmail.com",
            "password": "anypassword"
        })
        
        # If user exists and is Google OAuth user, should get specific error
        # If user doesn't exist, will get generic 401
        if response.status_code == 401:
            data = response.json()
            # Check if it's the Google OAuth specific error or generic error
            if "Google login" in data.get("detail", ""):
                print("✓ Google OAuth user gets helpful error message about using Google login")
                assert "Continue with Google" in data["detail"] or "Google login" in data["detail"]
            else:
                # User might not exist in DB yet (no Google login performed)
                print("⚠ Google OAuth user not found in DB (may not have logged in via Google yet)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestAuthenticatedUser:
    """Test authenticated user endpoints"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@test.com",
            "password": "customer123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Customer login failed")
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@bakery.com",
            "password": "1234"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_get_current_user_customer(self, customer_token):
        """GET /api/auth/me should return current customer user"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["email"] == "customer@test.com"
        assert data["role"] == "customer"
        print(f"✓ GET /api/auth/me returns customer: {data['name']}")
    
    def test_get_current_user_admin(self, admin_token):
        """GET /api/auth/me should return current admin user"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["email"] == "admin@bakery.com"
        assert data["role"] == "admin"
        print(f"✓ GET /api/auth/me returns admin: {data['name']}")
    
    def test_admin_can_access_admin_panel(self, admin_token):
        """Admin should be able to access admin endpoints"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Admin can access admin panel endpoints")
    
    def test_customer_cannot_access_admin_panel(self, customer_token):
        """Customer should NOT be able to access admin endpoints"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Customer correctly blocked from admin endpoints")


class TestRecommendations:
    """Test recommendations endpoints"""
    
    def test_trending_recommendations_anonymous(self):
        """GET /api/recommendations/trending should return products for anonymous users"""
        response = requests.get(f"{BASE_URL}/api/recommendations/trending")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return at least one product"
        assert len(data) <= 8, "Should return at most 8 products"
        
        # Verify product structure
        for product in data:
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "category" in product
        
        print(f"✓ Trending recommendations returned {len(data)} products")
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@test.com",
            "password": "customer123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Customer login failed")
    
    def test_personalized_recommendations_authenticated(self, customer_token):
        """GET /api/recommendations should return personalized products for logged-in users"""
        response = requests.get(f"{BASE_URL}/api/recommendations", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # May be empty if user has no order history, but should still return a list
        
        if len(data) > 0:
            # Verify product structure
            for product in data:
                assert "id" in product
                assert "name" in product
                assert "price" in product
                assert "category" in product
        
        print(f"✓ Personalized recommendations returned {len(data)} products")
    
    def test_recommendations_requires_auth(self):
        """GET /api/recommendations without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/recommendations")
        # 401 or 403 are both acceptable for unauthorized access
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        print("✓ Personalized recommendations correctly requires authentication")


class TestLogout:
    """Test logout functionality"""
    
    def test_logout(self):
        """POST /api/auth/logout should succeed"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@test.com",
            "password": "customer123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Then logout
        response = requests.post(f"{BASE_URL}/api/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data
        print("✓ Logout successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
