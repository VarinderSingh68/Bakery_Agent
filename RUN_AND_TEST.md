# Complete Run & Connectivity Test Guide

## 🚀 Step-by-Step: Start Backend

### 1. Open Terminal 1 for Backend
```bash
cd backend
python server.py
```

**Expected Output:**
```
Using SQLite database at: C:\NGWD\Samples\e-commerce\ngwd\Bakery-main\backend\bakery.db
WARNING:root:Email credentials not found in .env file. Email sending will be disabled.
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

✅ **If you see "Uvicorn running on http://0.0.0.0:8001", the backend is running!**

### 2. Test Backend Connection
Open a **new terminal** and run:
```bash
curl http://localhost:8001/api/health
```

**Expected Response:**
```json
{"status":"ok"}
```

If you get this response, the backend is working correctly!

## 🌐 Step-by-Step: Start Frontend

### 1. Open Terminal 2 for Frontend
```bash
cd frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
  On Your Network:  http://192.168.x.x:3001
```

✅ **If you see "Compiled successfully!", the frontend is running!**

### 2. Test Frontend-Backend Connectivity

1. Open browser to `http://localhost:3001`
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Try to login with:
   - Email: `admin@bakery.com`
   - Password: `admin123`
5. Check the network request to `/api/auth/login`
   - **Status should be 200** (success)
   - **Response should contain token and user data**

## 🔧 Troubleshooting

### Backend Won't Start

**Error: Port 8001 already in use**
```bash
# Kill process on port 8001
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

**Error: Module not found**
```bash
cd backend
pip install -r requirements.txt
```

**Error: Database issues**
```bash
cd backend
python init_db.py
python seed_auth_users.py
```

### Frontend Can't Connect to Backend

**Check these files have correct ports:**

**frontend/.env:**
```
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
```

**frontend/.env.local:**
```
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
REACT_APP_API_URL=http://127.0.0.1:8001/api
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
```

**After changing .env files, restart frontend:**
```bash
# Ctrl+C to stop frontend, then:
npm start
```

### Still Getting Network Error?

1. **Verify backend is running:**
   ```bash
   curl http://localhost:8001/api/health
   ```

2. **Check browser console for exact error URL:**
   - Should be `http://127.0.0.1:8001/api/auth/login`
   - NOT `http://127.0.0.1:8000/api/auth/login`

3. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files
   - Hard refresh with `Ctrl+Shift+R`

## ✅ Success Checklist

- [ ] Backend terminal shows "Uvicorn running on http://0.0.0.0:8001"
- [ ] `curl http://localhost:8001/api/health` returns `{"status":"ok"}`
- [ ] Frontend terminal shows "Compiled successfully!"
- [ ] Frontend loads at `http://localhost:3001`
- [ ] Can login with `admin@bakery.com` / `admin123`
- [ ] Network tab shows successful API calls to port 8001

## 🎯 Quick Test Commands

Run these in order to verify everything:

```bash
# Terminal 1: Start backend
cd backend
python server.py

# Terminal 2: Test backend (after it starts)
curl http://localhost:8001/api/health

# Terminal 3: Start frontend (after backend is running)
cd frontend
npm start

# Then open browser to http://localhost:3001
```

If all steps succeed, your application is fully working! 🎉