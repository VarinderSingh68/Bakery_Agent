import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


def hash_password(password: str) -> str:
    import hashlib
    import secrets

    iterations = 390000
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${digest.hex()}"


def upsert_user(email: str, password: str, name: str, role: str):
    db.users.update_one(
        {"email": email},
        {
            "$set": {
                "name": name,
                "role": role,
                "password": hash_password(password),
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        },
        upsert=True,
    )


upsert_user("admin@bakery.com", "1234", "Admin User", "admin")
upsert_user("customer@test.com", "customer123", "Test Customer", "customer")

print("Seeded auth users: admin@bakery.com, customer@test.com")
