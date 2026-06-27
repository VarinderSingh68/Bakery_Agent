# Google OAuth Testing Guide for Bakery E-Commerce Website

## Overview
The website implements **Emergent-managed Google OAuth** alongside traditional email/password authentication. This provides users with a seamless one-click login experience using their Google accounts.

## Testing Steps

### 1. Access the Login Page
Navigate to: `https://bakery-ecommerce-8.preview.emergentagent.com/login`

### 2. Click "Continue with Google" Button
- You'll see a white button with the official Google logo
- Click the button to initiate OAuth flow

### 3. OAuth Flow Process
1. You'll be redirected to `https://auth.emergentagent.com`
2. The Emergent Auth page will ask you to sign in with Google
3. Select your Google account or sign in if not already logged in
4. Grant permissions if prompted

### 4. Automatic Redirect & Session Creation
1. After successful Google authentication, you'll be redirected back to the website
2. The URL will contain a `session_id` hash parameter
3. The AuthCallback component automatically exchanges this for user data
4. A secure httpOnly cookie is set for the session (lasts 7 days)
5. You're logged in and redirected to the home page

### 5. Verify Login Success
**Check these indicators:**
- User menu appears in header (click the User icon)
- Your Google name is displayed in the dropdown
- Wishlist icon becomes active
- Cart functionality is available
- You can navigate to "My Orders"

### 6. Test Session Persistence
1. Close the browser tab
2. Reopen `https://bakery-ecommerce-8.preview.emergentagent.com`
3. You should still be logged in (session cookie is persistent)

### 7. Test Logout
1. Click the User icon in header
2. Click "Logout"
3. Session cookie is cleared
4. You're logged out and can log in again

## Expected Behavior

### First-Time Google Users
- New user account created automatically
- Role: "customer" (not admin)
- Email from Google account is used
- Name and profile picture synced

### Returning Google Users
- Existing account matched by email
- Name and picture updated if changed in Google
- Previous orders and data preserved

## Technical Implementation Details

### Backend (FastAPI)
- **Endpoint**: `POST /api/auth/google/session`
- **Headers**: `X-Session-ID` contains the session_id from OAuth callback
- **Process**:
  1. Exchange session_id with Emergent Auth backend
  2. Retrieve user data (email, name, picture)
  3. Check if user exists by email
  4. Create new user or update existing
  5. Store session in MongoDB with expiry
  6. Return httpOnly cookie with session_token

### Frontend (React)
- **AuthCallback Component**: Handles the OAuth redirect
  - Extracts `session_id` from URL hash
  - Calls backend to exchange for session
  - Navigates to home on success
- **AuthContext**: Modified to support both JWT and cookie-based sessions
  - Checks for session_id in URL to skip /me check during callback
  - Sends `withCredentials: true` to include cookies
- **Login Page**: Displays Google button with proper styling

### Security Features
- **httpOnly Cookies**: Session token not accessible via JavaScript (XSS protection)
- **SameSite=none**: Works across origins for Emergent Auth redirect
- **Secure Flag**: Only transmitted over HTTPS
- **7-Day Expiry**: Sessions auto-expire after 7 days
- **MongoDB Storage**: Session validation on every request

## Troubleshooting

### Issue: "Invalid session" error
**Solution**: The session_id expired or was invalid. Try logging in again.

### Issue: Stuck on "Completing sign in..." page
**Solution**: 
1. Check browser console for errors
2. Verify network tab shows successful /api/auth/google/session call
3. Clear cookies and try again

### Issue: Logged out after browser restart
**Solution**: Check if cookies are being blocked. Enable third-party cookies for auth.emergentagent.com

### Issue: Can't log in with the same email that has password
**Solution**: This is by design. The system matches by email and allows either authentication method.

## Database Structure

### Users Collection
```javascript
{
  "id": "uuid",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "role": "customer",
  "created_at": "2026-01-28T...",
  "updated_at": "2026-01-28T..." // For Google OAuth users
  // No password field for OAuth users
}
```

### Sessions Collection
```javascript
{
  "user_id": "uuid",
  "session_token": "sess_abc123...",
  "expires_at": "2026-02-04T...", // 7 days from creation
  "created_at": "2026-01-28T..."
}
```

## Testing Checklist

- [ ] Click "Continue with Google" button
- [ ] Successfully redirect to auth.emergentagent.com
- [ ] Sign in with Google account
- [ ] Redirect back to website
- [ ] See user name in header dropdown
- [ ] Add item to cart (test authenticated action)
- [ ] Add item to wishlist
- [ ] Close and reopen browser - still logged in
- [ ] Logout successfully
- [ ] Login again with same Google account - existing data preserved

## Notes

- **No API Keys Required**: Emergent manages the Google OAuth credentials
- **Hybrid Auth**: Users can login with email/password OR Google OAuth
- **Email Matching**: If email exists, user can use either auth method
- **Admin Access**: Google OAuth users are created as "customer" role by default
- **Profile Updates**: Name and picture are updated on each Google login

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Verify cookies are enabled
4. Clear browser cache and cookies
5. Try in incognito/private browsing mode
