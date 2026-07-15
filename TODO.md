# TODO - Fix Backend and Frontend Issues

## Current Issue: Google Login Fails with Database Error
- **Error**: `TypeError: SQLite DateTime type only accepts Python datetime and date objects as input.`
- **Cause**: When creating a new user via Google OAuth, the backend was passing the `created_at` timestamp as a string (`.isoformat()`) instead of a `datetime` object, which the database driver for SQLite does not accept.
- **Status**: A fix has been prepared.

## Plan
1. **[COMPLETED]** Fix the `TypeError` in `backend/server.py` by passing a `datetime` object for `created_at` during user creation.
2. **[TODO]** Push changes to GitHub and trigger a new deployment.
3. **[TODO]** Verify that Google Login works correctly on the live site.

## Previous Issues (Resolved)
- **Issue**: Frontend compile errors (`Can't resolve @/...`).
- **Fix**: Added `craco.config.js` and `jsconfig.json` to configure path aliases and created missing UI component files.

## Completed
- Updated `backend/server.py` to correct the data type for timestamps.
