import subprocess
import sys
import re

print("=== Bakery Deps Fix ===")

# Fix grpcio-status for Python 3.14
with open('requirements.txt', 'r') as f:
    content = f.read()

# Replace grpcio-status==1.71.2 with >=1.75.1,<2.0.0
content = re.sub(r'grpcio-status==1\.71\.2', 'grpcio-status>=1.75.1,<2.0.0', content)

with open('requirements.txt', 'w') as f:
    f.write(content)

print("✅ Fixed grpcio-status in requirements.txt")

print("Now run: backend\\\\.venv\\\\Scripts\\\\activate.bat && pip install -r backend/requirements.txt")
