# Fix Admin Panel + Add Username/Password Login

## Root Causes Found
1. **Admin.js redirects before auth loading finishes** - causes premature redirect to `/`
2. **auth_users.json has malformed password hashes** (missing digest part) - login always fails for DB users
3. **init_db.py skips existing users** - bad hashes persist forever in SQLite
4. **No username field exists** anywhere in backend/frontend

## Steps
- [x] 1. Fix `frontend/src/pages/Admin.js` - wait for `loading` before role check redirect
- [x] 2. Add `username` column to `backend/models.py` SQLAlchemy User model
- [x] 3. Fix `backend/auth_users.json` - generate valid hashes, add username fields
- [x] 4. Update `backend/init_db.py` - migrate username column, update existing users from JSON
- [x] 5. Update `backend/server.py` Pydantic models & login endpoint to accept email OR username
- [x] 6. Add `backend/crud.py` `get_user_by_username` helper
- [x] 7. Update `frontend/src/pages/Login.js` - show username in registration, "Email or Username" for login
- [x] 8. Update `frontend/src/context/AuthContext.js` - pass identifier correctly
- [x] 9. Run `python backend/init_db.py` to apply fixes
- [x] 10. Verify admin panel opens and login works with both email and username

## Test Results
- Admin email login: OK (admin@bakery.com / admin123)
- Admin username login: OK (admin / admin123)
- Customer username login: OK (customer / customer123)
- Wrong password: Correctly rejected (401)

