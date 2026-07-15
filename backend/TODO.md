# Backend TODO

## OAuth/Google login fix: SQLite DateTime TypeError
- [ ] Update `crud.create_user` to coerce `created_at`/`updated_at` from ISO strings to `datetime` objects (UTC-aware)
- [ ] Update `server.py` `ensure_sql_user` to coerce `created_at` similarly before calling `crud.create_user`
- [ ] Re-run backend Google login flow test(s) and confirm the OAuth insert succeeds

