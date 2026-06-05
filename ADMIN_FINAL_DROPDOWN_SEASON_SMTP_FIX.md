# Admin Final Dropdown / Season / SMTP Fix

## Fixed

- Schedule Editor `Select Team 1` and `Select Team 2` now populate immediately from default teams/local data, then refresh from backend once Render responds.
- Score Keeping `Select Scheduled Game` now populates from backend schedules, with local fallback.
- Practice/Scrimmage team selectors use the same final team-map loader.
- League Season Settings now has a final capture-phase submit handler that saves locally and posts `season`/`leagueSeason` to `/api/update`.
- Added `/api/notifications/status` so SMTP configuration can be verified from Render.
- Updated `EMAIL_NOTIFICATION_SETUP.md` with the exact SMTP environment variables.

## Deployment

Deploy both:

- `administrators.html` to the frontend repo/GitHub Pages.
- `backend/server.js` and `EMAIL_NOTIFICATION_SETUP.md` to the backend repo/Render.

Then redeploy Render.
