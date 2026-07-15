# TODO - Fix blank white page on Render

## Goal
Diagnose and fix the runtime error causing the "Something went wrong" message on the live frontend.

## Problem Analysis
The `ErrorBoundary` is now catching a JavaScript error, which is an improvement over a blank white page. The underlying error is still likely `TypeError: n.map is not a function`, caused by the frontend not being able to connect to the backend API. The most probable cause is the missing `REACT_APP_BACKEND_URL` environment variable on Render.


## Plan
1. **[COMPLETED]** Improve the `ErrorBoundary` component to display detailed error information on the screen. This will help us see the exact error without using the browser console.
2. **[CRITICAL]** Set the `REACT_APP_BACKEND_URL` environment variable on the Render.com frontend service. This is the most likely root cause of the crash.
3. **[TODO]** Re-deploy the frontend service on Render.
4. **[TODO]** Check the live site. The error details should now be visible. If the error is `n.map is not a function`, it confirms the API connection issue.
5. **[TODO]** Confirm the site loads correctly after the environment variable is set and the service is redeployed.

## Completed
- Modified `frontend/src/index.js` to globally configure the base URL for all `axios` API calls.
- Cleaned up `frontend/src/pages/Shop.js` by removing the local API response check, as it's now handled globally.
- Updated `frontend/src/components/ErrorBoundary.js` to show a more detailed error message.
