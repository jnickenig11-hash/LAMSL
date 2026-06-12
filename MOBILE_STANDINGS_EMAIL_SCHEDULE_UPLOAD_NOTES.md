# Mobile Standings, Scheduled Email Notifications, and Schedule Upload Update

## Mobile standings
- Mobile standings now use the saved/manual standings while scheduled games are still missing final scores.
- Once every non-cancelled scheduled game has valid scores, standings are recalculated from game results automatically.
- Backend normalization uses the same rule so manually maintained standings are not overwritten prematurely.

## Email notifications
- Automatic schedule update emails now send only on Wednesdays at 9:00 AM and Fridays at 9:00 AM, America/Los_Angeles time.
- Immediate automatic sends on every schedule update were disabled.
- Manual admin email send/preview buttons remain available.

## Administrator schedule upload and preview
- Added a Schedule Upload & Preview area inside the Administrator Schedule Editor.
- Admins can upload .xlsx, .xls, or .csv files.
- Required data can use these column names: Date, Park/Field/Location, Time, and Teams/Matchup/Game.
- Team matchups can be entered as `Team 1 vs Team 2`. Separate Team 1 and Team 2 columns are also supported.
- Uploaded rows are previewed before saving. The Add Uploaded Schedule button saves parsed games to the Render backend and skips duplicate rows already in the schedule.
