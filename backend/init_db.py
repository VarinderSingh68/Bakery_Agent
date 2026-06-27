import asyncio
import json
import sqlite3
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import engine, AsyncSessionLocal, Base, ACTIVE_DB_PATH
from models import User

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def ensure_username_column():
    """SQLite migration: add username column if missing."""
    conn = sqlite3.connect(ACTIVE_DB_PATH)
    try:
        cursor = conn.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        if "username" not in columns:
            conn.execute("ALTER TABLE users ADD COLUMN username TEXT")
            conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)")
            conn.commit()
            print("Added username column to users table")
        else:
            print("username column already exists")
    except Exception as e:
        print(f"Column migration error (may already exist): {e}")
    finally:
        conn.close()

async def migrate_auth_users():
    try:
        with open('auth_users.json', 'r') as f:
            users_data = json.load(f)
        
        async with AsyncSessionLocal() as session:
            for email, user_data in users_data.items():
                # Remove MongoDB-specific keys
                if '_id' in user_data:
                    del user_data['_id']
                user_data['created_at'] = user_data.get('created_at', None)
                
                existing_result = await session.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": email}
                )
                existing_id = existing_result.scalar()
                
                if existing_id:
                    # Update existing user: password, role, username
                    stmt = text("""
                        UPDATE users 
                        SET password = :password, role = :role, username = :username, name = :name
                        WHERE email = :email
                    """)
                    await session.execute(stmt, {
                        "email": email,
                        "password": user_data.get("password"),
                        "role": user_data.get("role", "customer"),
                        "username": user_data.get("username"),
                        "name": user_data.get("name", "User")
                    })
                    print(f"Updated existing user {email}")
                else:
                    user = User(**user_data)
                    session.add(user)
                    print(f"Inserted new user {email}")
            
            await session.commit()
            print(f"Migrated {len(users_data)} auth users to SQL")
    except FileNotFoundError:
        print("No auth_users.json found")
    except Exception as e:
        print(f"Migration error: {e}")

async def main():
    ensure_username_column()
    await create_tables()
    await migrate_auth_users()
    print("DB initialized!")

if __name__ == "__main__":
    asyncio.run(main())

