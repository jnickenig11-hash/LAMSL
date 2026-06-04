LAMSL admin cleanup package - existing JS integrated

This version keeps your uploaded existing JavaScript as the source of truth:
- js/backend-config.js is copied from your uploaded backend-config.js.
- js/schedule.js is copied from your uploaded schedule(2).js.

The administrator page remains the centralized dashboard for:
- Announcements
- Site content/homepage message
- Schedules and practice schedules
- Scores
- Slideshow images
- Divisions and teams
- User accounts and roles
- Team manager assignments
- Rosters/player data
- Season settings

Public page layouts are not intentionally changed, except for script wiring needed to read admin-managed content.
