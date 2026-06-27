#!/usr/bin/env python3
"""Final test to verify login and /auth/me work correctly."""
import urllib.request, json, sys

BASE = 'http://localhost:8000'

def check(desc, cond):
    status = 'PASS' if cond else 'FAIL'
    print(f'  [{status}] {desc}')
    return cond

def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    return urllib.request.urlopen(req, timeout=5)

def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    return urllib.request.urlopen(req, timeout=5)

all_ok = True

# 1. Admin email login
print('1. Admin email login')
try:
    resp = post(f'{BASE}/api/auth/login', {'email': 'admin@bakery.com', 'password': 'admin123'})
    all_ok &= check('Status 200', resp.status == 200)
    data = json.loads(resp.read())
    all_ok &= check('Has token', bool(data.get('token')))
    all_ok &= check('User role is admin', data['user']['role'] == 'admin')
    admin_token = data['token']
    print(f'     User: {data["user"]["name"]}, Role: {data["user"]["role"]}, Username: {data["user"].get("username")}')
except Exception as e:
    print(f'  [FAIL] Exception: {e}')
    all_ok = False

# 2. /auth/me with token
print('2. /auth/me with admin token')
try:
    resp = get(f'{BASE}/api/auth/me', {'Authorization': f'Bearer {admin_token}'})
    all_ok &= check('Status 200', resp.status == 200)
    data = json.loads(resp.read())
    all_ok &= check('Role is admin', data.get('role') == 'admin')
    print(f'     User: {data.get("name")}, Role: {data.get("role")}')
except Exception as e:
    print(f'  [FAIL] Exception: {e}')
    all_ok = False

# 3. Admin username login
print('3. Admin username login')
try:
    resp = post(f'{BASE}/api/auth/login', {'email': 'admin', 'password': 'admin123'})
    all_ok &= check('Status 200', resp.status == 200)
    data = json.loads(resp.read())
    all_ok &= check('Has token', bool(data.get('token')))
    all_ok &= check('Role is admin', data['user']['role'] == 'admin')
    print(f'     User: {data["user"]["name"]}, Role: {data["user"]["role"]}')
except Exception as e:
    print(f'  [FAIL] Exception: {e}')
    all_ok = False

# 4. Customer login
print('4. Customer login')
try:
    resp = post(f'{BASE}/api/auth/login', {'email': 'customer@test.com', 'password': 'customer123'})
    all_ok &= check('Status 200', resp.status == 200)
    data = json.loads(resp.read())
    all_ok &= check('Role is customer', data['user']['role'] == 'customer')
    print(f'     User: {data["user"]["name"]}, Role: {data["user"]["role"]}')
except Exception as e:
    print(f'  [FAIL] Exception: {e}')
    all_ok = False

# 5. Verify admin endpoints work
print('5. Admin endpoints')
try:
    resp = get(f'{BASE}/api/admin/stats', {'Authorization': f'Bearer {admin_token}'})
    all_ok &= check('Admin stats 200', resp.status == 200)
    print(f'     Stats: {json.loads(resp.read())}')
except Exception as e:
    print(f'  [FAIL] Exception: {e}')
    all_ok = False

print()
if all_ok:
    print('ALL TESTS PASSED')
    sys.exit(0)
else:
    print('SOME TESTS FAILED')
    sys.exit(1)

