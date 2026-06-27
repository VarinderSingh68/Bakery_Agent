from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import event
from pathlib import Path
import sqlite3
import logging


def _sqlite_is_healthy(db_path: Path) -> bool:
    try:
        if not db_path.exists():
            return False
        conn = sqlite3.connect(db_path)
        try:
            row = conn.execute("PRAGMA integrity_check;").fetchone()
            return bool(row and row[0] == "ok")
        finally:
            conn.close()
    except Exception:
        return False


BASE_DIR = Path(__file__).resolve().parent
BACKEND_DB_PATH = BASE_DIR / "bakery.db"
ROOT_DB_PATH = BASE_DIR.parent / "bakery.db"

if _sqlite_is_healthy(BACKEND_DB_PATH):
    ACTIVE_DB_PATH = BACKEND_DB_PATH
elif _sqlite_is_healthy(ROOT_DB_PATH):
    ACTIVE_DB_PATH = ROOT_DB_PATH
else:
    ACTIVE_DB_PATH = BACKEND_DB_PATH

logging.getLogger(__name__).warning(f"Using SQLite database at: {ACTIVE_DB_PATH}")
DATABASE_URL = f"sqlite+aiosqlite:///{ACTIVE_DB_PATH.as_posix()}"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 60},
    echo=False,  # Set True for debug
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_timeout=30,
    max_overflow=10,
)

# Configure SQLite pragmas for better concurrency and performance
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Configure SQLite for better concurrency on every new connection."""
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA cache_size=10000;")
        cursor.execute("PRAGMA temp_store=memory;")
        cursor.execute("PRAGMA busy_timeout=60000;")
        cursor.execute("PRAGMA wal_autocheckpoint=1000;")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

