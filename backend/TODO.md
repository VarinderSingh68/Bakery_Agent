# TODO - Fix blank white page on Render

## Goal
Fix backend errors to ensure stable operation, particularly for user authentication.

## Problem Analysis
**Current Issue:** Google Login fails with `TypeError: SQLite DateTime type only accepts Python datetime...`
**Cause:** When a new user signs up via Google, another code path was identified where the `created_at` timestamp was not being correctly passed as a `datetime` object to the database. This leads to a `TypeError` from the SQLite driver.
**Status:** A more specific fix has been prepared for the affected Google login endpoint.


## Plan
1. **[COMPLETED]** Refactor the `/auth/google/browser` endpoint in `backend/server.py` to explicitly create users with a proper `datetime` object for `created_at`.
2. **[TODO]** Push the new fix to GitHub to trigger a deployment.
3. **[TODO]** Verify that creating a new account via Google Login works without database errors.

## Completed
- Modified `frontend/src/index.js` to globally configure the base URL for all `axios` API calls.
- Cleaned up `frontend/src/pages/Shop.js` by removing the local API response check, as it's now handled globally.
- Updated `frontend/src/components/ErrorBoundary.js` to show a more detailed error message.
- Updated `backend/server.py` to refactor the Google login flow and ensure correct timestamp handling.
