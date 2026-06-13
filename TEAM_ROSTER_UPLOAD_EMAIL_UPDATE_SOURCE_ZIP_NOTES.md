# Team Roster Upload + Team Email Updates

Source package used: `LAMSL- Project (4).zip`.

Changes applied to this source package:

- Updated `team.html` so Team Managers/Admins can upload roster spreadsheets from the team profile page.
- Roster upload supports `.xlsx`, `.xls`, and `.csv` files through the existing SheetJS parser.
- Spreadsheet rows are normalized into player records using common headers:
  - `Name`
  - `Position`
  - `Phone`
  - `Email`
  - `Team`
- Uploaded player emails are saved into `lamslTeamEmailSubscribersV1` and into the backend roster payload as `teamSubscribers`.
- Manual player add/edit also registers valid player emails for team schedule/score updates.
- Updated `js/schedule.js` so schedule and score updates collect emails for both teams in the updated game and include them in `/notify-schedule-update`.
- Updated `administrators.html` authoritative schedule editor so new schedules and score updates trigger team-specific email notifications.
- Updated `backend/server.js` so `/api/rosters` stores and returns `teamSubscribers`.
- Updated `backend/server.js` so `/notify-schedule-update` sends immediate team-specific email updates when recipients are passed. General league schedule notification behavior remains queued for the Wednesday/Friday 9:00 AM schedule.

SMTP still requires Render environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
