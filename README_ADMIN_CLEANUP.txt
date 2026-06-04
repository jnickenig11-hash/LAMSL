LAMSL admin cleanup package - Render API enabled

Files included:
- administrators.html: centralized admin console for announcements, schedules, divisions, teams, players, rosters, photos, event posts, payments, users, manager assignments, backup/import.
- LAMSL.html: public homepage reading the same backend-backed data.
- schedule.html: public schedule view reading games/practices from backend-backed data.
- events.html: public events/fundraisers page reading event posts/photos from backend-backed data.
- meetingnotes.html: public archived-announcements/meeting-notes view.
- team.html: public team profile page reading team photo, games, and player profiles.

Backend behavior:
- Each page attempts to load shared site data from the Render backend first.
- Backend base URL defaults to: https://lamsl-backend.onrender.com
- You can override it before the page scripts run by setting: window.BACKEND_BASE = 'https://your-render-url.onrender.com'
- localStorage is retained only as browser cache/fallback so the site does not go blank if the backend is temporarily unavailable.

Expected backend endpoints:
1. GET /api/site-data
   Alternative fallbacks tried by the pages: GET /api/data, GET /api/content
   Expected response can be either:
   { "data": { "lamslWeeklyScheduleV3": [...], "lamslAnnouncementsV1": [...], ... } }
   or directly:
   { "lamslWeeklyScheduleV3": [...], "lamslAnnouncementsV1": [...], ... }

2. POST /api/site-data
   Alternative fallbacks tried by the pages: POST /api/data, POST /api/update-key
   For normal saves, pages send:
   { "key": "lamslWeeklyScheduleV3", "value": [...] }

3. POST /api/update
   Used as a fallback for full backup/import saves.
   Body is the full data object keyed by the LAMSL storage keys.

4. POST /api/upload-image
   Alternative fallback tried: POST /api/upload
   Form field: image
   Expected JSON response should include one of: url, path, or filepath.

5. POST /api/subscribe
   Used by homepage email signup.
   Body: { "email": "person@example.com", "createdAt": "ISO date" }

Admin auth header:
- If localStorage.LAMSL_ADMIN_KEY or window.ADMIN_API_KEY exists, requests include:
  x-admin-key: <value>

Primary shared data keys:
- lamslAnnouncementsV1
- lamslArchivedAnnouncementsV1
- lamslEFAnnouncementsV1
- lamslDivisionsV1
- lamslWeeklyScheduleV3
- lamslPracticeScheduleV1
- lamslTeamRostersV1
- lamslTeamPlayersV1
- lamslTeamManagerAssignmentsV1
- lamslSeasonV1
- lamslPaymentLinksV1
- lamslHomeSlidesV1
- lamslEventSlidesV1
- lamslTeamPhotosV1
- lamslTeamGameCheckinsV1

Important:
- These front-end files are now wired to persist through Render, but your Render backend must implement the endpoints above.
- If the backend only supports your older /api/content and /api/update shape, the pages will still attempt those fallbacks, but the recommended stable implementation is /api/site-data for both GET and POST.
