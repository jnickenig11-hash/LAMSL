# Team Profile Photo Upload Fix

Fixes the team profile photo upload stack error on `team.html`.

## Changes

- Added `/api/upload-team-photo` backend route alias.
- Kept legacy `/upload-team-photo` route.
- Moved uploaded team profile photos to persistent `TeamProfileImages` folder.
- Kept legacy `/teamProfile images` static route for backward compatibility.
- Fixed multipart upload ordering issue by passing team/division through query string and FormData before the file.
- Sanitized team/division folder names.
- Saved team photo metadata into persistent backend `data/team_profile_metadata.json`.
- Saved active team photo reference into backend `content.teamPhotos`.
- Fixed `team.html` to render uploaded images from the backend URL instead of the GitHub Pages domain.
- Updated photo load endpoint to `/api/team-profile-photo`.

## Deploy

Deploy both:

1. `team.html` to the frontend site.
2. `backend/server.js` to Render backend, then redeploy Render.

Confirm Render still has:

```text
LAMSL_STORAGE_DIR=/var/data
```
