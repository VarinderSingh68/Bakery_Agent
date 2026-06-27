# Google OAuth Setup - Fix redirect_uri_mismatch Error

## 🔴 Issue
You're seeing: **"Error 400: redirect_uri_mismatch"**

This means the app is trying to use a redirect URI (e.g., `http://localhost:3001/auth/callback`) that is NOT registered in Google Cloud Console for this Client ID.

## ✅ Solution

### Option 1: Update Existing Client ID (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (type: Web application)
5. Click on it to edit
6. Under "Authorized redirect URIs", add **ALL** of these:
   ```
   http://localhost:3001/auth/callback
   http://127.0.0.1:3001/auth/callback
   http://localhost:3000/auth/callback
   http://127.0.0.1:3000/auth/callback
   ```
7. Under "Authorized JavaScript origins", add **ALL** of these:
   ```
   http://localhost:3001
   http://127.0.0.1:3001
   http://localhost:3000
   http://127.0.0.1:3000
   ```
8. Click **Save**
9. Reload the browser (clear cache with Ctrl+Shift+Delete)

### Option 2: Use Your Current Client ID in Code

Your current Client ID: `143052067568-kdnvb8i0j78ccvmv583vb2fp4cktr7bb.apps.googleusercontent.com`

This Client ID appears to be registered for port 3000. If you want to keep using port 3000:

**Restart frontend on port 3000:**
```powershell
cd d:\ngwd\Bakery-main\frontend
# First, kill the process on port 3001
$env:PORT=3000
npm start
```

Then update `.env.local`:
```
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Option 3: Create New Client ID for Port 3001

If you want to stick with port 3001, create a new OAuth Client:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
4. Choose **Web application**
5. Fill in details:
   - **Name**: Bakery App (Local Dev Port 3001)
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3001
     http://127.0.0.1:3001
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3001/auth/callback
     http://127.0.0.1:3001/auth/callback
     ```
6. Click **Create**
7. Copy the new **Client ID**
8. Update `frontend/.env.local`:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=<YOUR_NEW_CLIENT_ID>
   REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
   ```

---

## 🔧 Current Configuration

**Frontend Port**: 3001
**Backend Port**: 8000
**Expected Redirect URI**: `http://localhost:3001/auth/callback`

---

## ✅ After Making Changes

1. **Update `.env.local`** with correct settings
2. **Restart Frontend**:
   ```powershell
   cd d:\ngwd\Bakery-main\frontend
   $env:PORT=3001
   npm start
   ```
3. **Clear Browser Cache** (Ctrl+Shift+Delete)
4. **Hard Refresh** (Ctrl+Shift+R)
5. **Try Login Again**

---

## 🧪 Test Google OAuth

1. Go to `http://localhost:3001`
2. Click **"Continue with Google"**
3. You should see Google login OR the error will show what's wrong

### Expected Flow:
```
User clicks "Continue with Google"
  ↓
Redirects to Google with redirect_uri=http://localhost:3001/auth/callback
  ↓
User logs in on Google
  ↓
Google redirects back to http://localhost:3001/auth/callback
  ↓
AuthCallback.js processes the OAuth response
  ↓
User is logged in to Bakery app
```

---

## 🆘 Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Error 400: redirect_uri_mismatch` | Redirect URI not registered in Google Console | Add URI to Google Cloud Console |
| `Invalid Client ID` | Client ID doesn't exist or wrong | Check Client ID in .env.local matches Google Console |
| `Blank page after Google login` | AuthCallback.js not processing response | Check browser console (F12) for errors |
| `Token not saving` | Maybe localStorage is disabled | Check browser settings, enable localStorage |

---

## 📋 Summary of Files Updated

✅ `frontend/src/pages/Login.js` - Updated fallback redirect URI and comments to port 3001
✅ `frontend/src/components/AuthCallback.js` - Updated fallback redirect URI to port 3001  
✅ `frontend/.env.local` - Already has `http://localhost:3001/auth/callback`

---

## 🚀 Complete Restart Steps

After updating Google Cloud Console:

```powershell
# Terminal 1: Backend (already running on 8000)
cd d:\ngwd\Bakery-main\backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend (restart on 3001)
cd d:\ngwd\Bakery-main\frontend
$env:PORT=3001
npm start
```

Then in browser:
1. Go to `http://localhost:3001`
2. Clear cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+R)
4. Try Google login again

---

**Next Step**: Update your Google Client ID settings with the redirect URIs above, then try logging in again!
