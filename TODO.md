# TODO - Fix frontend compile errors

## Goal
Make the React frontend compile and run successfully.

## Current failing errors
- Can't resolve `@/lib/utils`
- Can't resolve `@/components/ui/button`

## Plan
1) Fix CRA/CRACO alias resolution for `@` consistently (webpack + jsconfig).
2) Ensure imports `@/lib/utils` and `@/components/ui/button` resolve by verifying directory structure.
3) Restart frontend dev server and confirm it compiles.
4) Confirm UI loads at http://localhost:3001.

## Completed
- (not started)
