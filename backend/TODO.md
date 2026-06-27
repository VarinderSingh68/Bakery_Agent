# Fix Login Loop - Mongo to SQL Migration Plan
Status: Approved by user. Proceed step-by-step.

## Breakdown from Approved Plan:
1. **[TODO] Ensure DB setup**: Run `python backend/init_db.py` to create tables and migrate users.
2. **[TODO] Expand backend/crud.py**: Add missing CRUD functions (get_orders, create_order, etc.).
3. **[x] Refactor backend/server.py**: Replaced cart endpoints, get_products with SQL CRUD. Progress: Cart fixed.
4. **[TODO] Test backend**: `uvicorn backend.server:app --reload`, POST /api/auth/login, GET /api/auth/me.
5. **[TODO] Verify frontend**: Login loop fixed, test with customer@test.com / customer123.
6. **[ ] COMPLETE**: attempt_completion.

Current: Starting with DB init check → crud.py → server.py refactor.
