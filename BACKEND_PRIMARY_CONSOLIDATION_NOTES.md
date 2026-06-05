# Backend-primary consolidation patch

This patch makes the Administrator Schedule, Scores & Practices region use Render backend data as the primary source and localStorage only as fallback/cache.

## Fixed
- Team 1 and Team 2 selectors load from backend content first.
- If backend team data is incomplete, selectors merge teams from `teams.html`, division standings pages, scheduled games, practice games, and local fallback data.
- Select Scheduled Game loads from backend `gameSchedules` first.
- Schedule saves POST to `/api/update` and only cache locally as fallback.
- Score saves POST to `/api/update`, then standings are recalculated by the backend.
- Practice/scrimmage saves POST to `/api/update` and only cache locally as fallback.
- League season settings save to backend as `season`, `activeSeason`, and `seasonSettings` for compatibility.
- Existing duplicate legacy handlers are overridden with capture-phase backend-primary handlers.

## Deployment
Deploy the updated `administrators.html` to the frontend. Backend changes are not required for this patch if the current backend already exposes `/api/content` and `/api/update`.
