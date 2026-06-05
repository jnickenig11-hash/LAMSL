# Admin Editor Selects, Practice/Scrimmage, and Season Settings Fix

This patch addresses the administrator dashboard failures where:

- Schedule Editor team dropdowns did not populate after selecting a division.
- Score Keeping did not list existing scheduled games.
- Practice/Scrimmage team dropdowns were inconsistent.
- Practice/Scrimmage saves were not clearly persisted to the backend.
- League Season Settings were only stored locally and did not persist to backend content.

## Main changes

- Rebuilds the admin team map from all available sources: backend content, local divisions, existing scheduled games, and practice games.
- Normalizes division labels such as `All`, `ALL`, `All Divisions`, and `Division A`.
- Rebinds Schedule Editor, Score Keeping, Practice/Scrimmage, and refresh buttons with stable backend-aware handlers.
- Populates Score Keeping from backend `gameSchedules` after admin content reload.
- Saves scores through `/api/update`, which recalculates standings.
- Saves practice/scrimmage games through backend `practiceSchedules`.
- Saves League Season Settings into backend content as `seasonSettings` and `activeSeason` while retaining local fallback.

## Deploy

Deploy the updated `administrators.html` to the frontend. No backend file changes are required for this patch if the backend already exposes `/api/content` and `/api/update`.
