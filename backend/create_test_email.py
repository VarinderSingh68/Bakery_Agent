import requests
import json

# Create Ethereal test account
response = requests.post('https://api.nodemailer.com/user', json={
    'requestor': 'bakery-test',
    'version': '1.0.0'
})

if response.status_code == 200:
    data = response.json()
    print('Test SMTP Credentials:')
    print(f'Username: {data["user"]}')
    print(f'Password: {data["pass"]}')
    print(f'Server: {data["smtp"]["host"]}')
    print(f'Port: {data["smtp"]["port"]}')
    print(f'Secure: {data["smtp"]["secure"]}')
else:
    print('Failed to create test account')
    print(response.text)