# Bakery Project - Quick Start Guide

## Problem
You're getting the error: "Cannot reach order server at http://localhost:8000/api/orders"

This means the **backend is not running**. Follow the steps below to fix it.

---

## Quick Start (Windows)

### Option 1: Use Startup Scripts (Easiest)

1. **Start Backend** (in first terminal window):
   ```
   cd d:\ngwd\Bakery-main
   start-backend.bat
   ```
   Wait for "Application startup complete" message

2. **Start Frontend** (in second terminal window):
   ```
   cd d:\ngwd\Bakery-main
   start-frontend.bat
   ```
   Wait for "webpack compiled" or similar message

3. Open browser to **http://localhost:3001**

---

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```powershell
cd d:\ngwd\Bakery-main\backend
.venv-1\Scripts\activate.bat
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload --log-level info
```

**Terminal 2 - Frontend:**
```powershell
cd d:\ngwd\Bakery-main\frontend
set PORT=3001
npm start
```

---

## Verify Everything Works

### Backend Health Check
Open in browser or run:
```powershell
Invoke-WebRequest http://localhost:8000/api/health
```
Should return: `{"status":"ok"}`

### Frontend Connection
1. Open http://localhost:3001 in browser
2. Add items to cart
3. Click "Place Order" - should now work!

---

## Troubleshooting

### "Port 8000 already in use"
- Kill existing process: `taskkill /F /IM python.exe`
- Or use different port: `--port 8001`

### "Port 3001 already in use"
- Kill existing node: `taskkill /F /IM node.exe`
- Or set: `set PORT=3002` then run npm start

### "Module not found" in backend
- Ensure you're in `backend/` directory
- Check: `pip install -r requirements.txt`

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart terminal and try again

### "Cannot reach order server" still shows
1. Verify backend is running: `netstat -ano | findstr :8000`
2. Check browser Console (F12) for CORS errors
3. Check backend logs for error messages

---

## Architecture

- **Backend**: FastAPI server on http://localhost:8000/api
- **Frontend**: React dev server on http://localhost:3001
- **Database**: SQLite at `backend/bakery.db`

Order endpoint flow:
1. Frontend at 3001 makes POST to http://localhost:8000/api/orders
2. Backend (8000) creates order in SQLite database
3. Backend returns order confirmation
4. Frontend shows success screen

---

## Common Endpoints

- Backend API: http://localhost:8000/api
- Health Check: http://localhost:8000/api/health  
- Frontend: http://localhost:3001
- Docs: http://localhost:8000/docs (Swagger UI)

---

## Still Having Issues?

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try placing an order
4. Share any error messages shown
