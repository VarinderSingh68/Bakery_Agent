import urllib.request, json, traceback

url = 'http://localhost:8001/api/auth/google/browser'
data = json.dumps({
    'email': 'varindersinghnony68@gmail.com',
    'name': 'Varinder',
    'picture': 'https://example.com/p.png',
    'google_id': 'test-google-id-123'
}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print('status', r.status)
        print('body', r.read().decode('utf-8'))
except Exception as e:
    print('ERROR', type(e).__name__, e)
    if hasattr(e, 'read'):
        try:
            body = e.read().decode('utf-8')
            print('body', body)
        except Exception as e2:
            print('body read failed', e2)
    traceback.print_exc()
