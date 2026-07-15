# TODO - Fix blank white page on Render

## Goal
Make the live frontend on Render.com display correctly instead of showing a blank white page.

## Problem Analysis
A blank page after deployment is almost always a runtime JavaScript error. The previous error `n.map is not a function` suggests that an API call is returning an unexpected data type (e.g., HTML instead of a JSON array), which causes the React app to crash.

This typically happens on a live environment when the frontend cannot find the backend because the `REACT_APP_BACKEND_URL` environment variable is not set correctly.

## Plan
1. **[TODO]** Set the backend URL environment variable on Render.com for the frontend service.
2. **[COMPLETED]** Make the frontend product fetching more robust to avoid a hard crash if the API returns an invalid response.
3. **[TODO]** Re-deploy the frontend service on Render and verify that the site loads.
4. **[TODO]** Confirm the login loop is fixed and the site is fully functional on the live URL.

## Completed
- Updated `frontend/src/pages/Shop.js` to check the API response `Content-Type` and show an error toast instead of crashing on invalid data.
