@echo off
echo Setting up backend venv...
call .venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
pip install sqlalchemy[asyncio] aiosqlite==0.19.0 alembic==1.13.2
python init_db.py
echo Backend setup complete! Tables created, auth_users migrated.
echo Run: uvicorn server:app --reload --host 127.0.0.1 --port 8000
pause

