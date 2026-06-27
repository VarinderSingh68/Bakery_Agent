#!/usr/bin/env python3
"""
Migration script to add coupon_code column to orders table.
Run this script to fix the "table orders has no column named coupon_code" error.
"""

import sqlite3
import os

# Get the database path
DB_PATH = os.path.join(os.path.dirname(__file__), "bakery.db")

def migrate():
    """Add coupon_code column to orders table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if the column already exists
    cursor.execute("PRAGMA table_info(orders)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if "coupon_code" in columns:
        print("Migration not needed: coupon_code column already exists in orders table.")
        conn.close()
        return True
    
    # Add the coupon_code column
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN coupon_code TEXT")
        conn.commit()
        print("Migration successful: Added coupon_code column to orders table.")
        return True
    except sqlite3.OperationalError as e:
        print(f"Migration failed: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = migrate()
    exit(0 if success else 1)