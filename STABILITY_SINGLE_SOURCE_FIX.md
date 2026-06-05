# LAMSL Stability / Single Source of Truth Fix

Version: 2026.06.05-stability-single-source-v1

## What changed

- `LAMSL.html` now performs one final homepage bootstrap after DOM load.
- Homepage content is fetched from Render backend first: `/api/content`.
- LocalStorage is now used only as fallback/cache for old schedule and announcement data.
- The homepage overwrites static placeholders for:
  - Next Games / mini schedule
  - Active announcements
  - Recent scores
  - Homepage slideshow
- Slideshow images are loaded from backend content first, then `/slideshow-images` as fallback.
- Uploaded homepage slideshow images are resolved from `/SlideshowImages/...` on the backend.
- `backend/server.js` now returns merged slideshow data from both persisted content and the `SlideshowImages` disk folder.
- Dynamic API responses are marked `Cache-Control: no-store`.
- Added deployment marker: `2026.06.05-stability-single-source-v1`.

## Deployment requirement

Deploy both parts together:

1. Upload frontend files to GitHub Pages repo.
2. Upload backend files to Render backend repo.
3. Redeploy Render backend.
4. Hard refresh `https://www.lamsl.com/LAMSL.html`.
5. In browser console, confirm:
   `LAMSL homepage stability boot 2026.06.05-stability-single-source-v1`

## Validation URLs

- `https://lamsl-backend.onrender.com/api/content`
- `https://lamsl-backend.onrender.com/slideshow-images`
- `https://lamsl-backend.onrender.com/api/storage-status`

