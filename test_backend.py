#!/usr/bin/env python3
"""Test backend connectivity and routes"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoints ===")
    
    # Test root health
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"GET {BASE_URL}/ -> {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"GET {BASE_URL}/ -> ERROR: {e}")
    
    # Test /api/health
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        print(f"\nGET {API_URL}/health -> {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"GET {API_URL}/health -> ERROR: {e}")

def test_login():
    """Test login endpoint"""
    print("\n=== Testing Login Endpoint ===")
    
    # Test with valid credentials
    try:
        r = requests.post(
            f"{API_URL}/auth/login",
            json={"email": "admin@bakery.com", "password": "admin123"},
            timeout=5
        )
        print(f"POST {API_URL}/auth/login -> {r.status_code}")
        print(f"Response: {json.dumps(r.json(), indent=2)}")
    except Exception as e:
        print(f"POST {API_URL}/auth/login -> ERROR: {e}")

def test_routes():
    """Test various routes"""
    print("\n=== Testing Other Routes ===")
    
    # Test products endpoint
    try:
        r = requests.get(f"{API_URL}/products", timeout=5)
        print(f"GET {API_URL}/products -> {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Found {len(data)} products")
        else:
            print(f"Response: {r.json()}")
    except Exception as e:
        print(f"GET {API_URL}/products -> ERROR: {e}")

if __name__ == "__main__":
    print("Testing Backend Connectivity...")
    test_health()
    test_login()
    test_routes()
    print("\nDone!")
