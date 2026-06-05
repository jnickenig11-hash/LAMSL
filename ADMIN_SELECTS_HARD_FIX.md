# Admin Selects Hard Fix

This patch fixes the Schedule Editor and Score Keeping dropdowns that were empty on `administrators.html`.

## Fixed
- `Select Team 1` and `Select Team 2` now populate from backend content, static seeded schedules, local fallback divisions, and existing scheduled games.
- `Select Scheduled Game` now populates from backend `gameSchedules`, with fallback to static `data/content.json` and then browser localStorage.
- Missing game IDs are generated safely so existing games can still be selected for scoring/deletion.
- Practice/scrimmage team selectors use the same team map.
- The fix runs after the older duplicate handlers so it wins over stale code paths.

## Deployment
Deploy the updated `administrators.html` and ensure `data/content.json` is deployed if the backend currently has no schedules.
