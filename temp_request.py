import urllib.request
import json
import traceback

url = 'http://127.0.0.1:8000/api/auth/google/browser'
payload = {
    'email': 'varindersinghnony68@gmail.com',
    'name': 'Varinder',
    'picture': 'https://example.com/p.png',
    'google_id': 'test-google-id-123'
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req, timeout=20) as r:
        print('status', r.status)
        print('body', r.read().decode('utf-8'))
except Exception as e:
    print('ERROR', type(e).__name__, e)
    try:
        body = e.read().decode('utf-8')
        print('error body', body)
    except Exception:
        pass
    traceback.print_exc()
