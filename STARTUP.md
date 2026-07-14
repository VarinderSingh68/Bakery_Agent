# Bakery Project - Quick Start Guide

---

## Quick Start (Windows)

**First-time setup (from project root):**
1. Open a terminal in the project root (`d:\ngwd\Bakery-main`).
2. Install all dependencies:
   ```powershell
   npm install
   ```

2. **Run the Application** (from project root):
   ```powershell
   npm start
   ```
   This will start both the backend and frontend servers concurrently in a single terminal.

3. Open your browser to **http://localhost:3001**.

---

## Configuring Email

For email features (login notifications, order confirmations) to work, you must configure your email provider credentials.

1.  After running `npm install`, a `.env` file will be created in the `backend` directory.
2.  Open `backend/.env` and fill in your `MAIL_USERNAME` and `MAIL_PASSWORD`.
3.  For Gmail, you will need to generate an "App Password". See Google's documentation for instructions.

---

## Verify Everything Works

### Backend Health Check
Open in a browser or run:
```powershell
Invoke-WebRequest http://localhost:8001/api/health
```
Should return: `{"status":"ok"}`

### Frontend Connection
1. Open http://localhost:3001 in browser
2. Add items to cart
3. Click "Place Order" - should now work!

---

## Troubleshooting

### "Port 8001 already in use"
- Kill existing process: `taskkill /F /IM python.exe`
- Or use a different port in `start-backend.bat`, e.g., `--port 8002`

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
1. Verify backend is running: `netstat -ano | findstr :8001`
2. Check browser Console (F12) for CORS errors
3. Check backend logs for error messages

---

## Architecture

- **Backend**: FastAPI server on http://localhost:8001/api
- **Frontend**: React dev server on http://localhost:3001
- **Database**: SQLite at `backend/bakery.db`

Order endpoint flow:
1. Frontend at 3001 makes POST to http://localhost:8001/api/orders
2. Backend (8001) creates order in SQLite database
3. Backend returns order confirmation
4. Frontend shows success screen

---

## Common Endpoints

- Backend API: http://localhost:8001/api
- Health Check: http://localhost:8001/api/health
- Frontend: http://localhost:3001
- Docs: http://localhost:8001/docs (Swagger UI)

---

## Still Having Issues?

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try placing an order
4. Share any error messages shown
