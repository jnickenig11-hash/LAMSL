# Events Page Announcements and Gallery Fix

Applied to the supplied source ZIP.

## Fixes
- `events.html` now loads announcements from the Render backend `/api/content` instead of relying only on browser localStorage.
- Existing local announcement keys are still supported as fallback.
- Event gallery renders bundled/static `EF_Images` immediately before backend calls, so the slideshow is never blocked by a slow Render request.
- Event gallery still merges backend `/api/content`, `/ef-images`, and `/api/ef-images` records.
- Image path handling supports `EF_Images`, `EFimages`, `uploads`, and bare filenames.
- Backend now reads both persistent `data/ef_images_metadata.json` and legacy root `ef_images_metadata.json`.
- Seeded `data/ef_images_metadata.json` from the existing root metadata file when present.

## Deployment note
Deploy both the static site files and the `backend/server.js` changes. If Render uses persistent disk, uploaded images must exist under the Render disk folder `EFimages`. Static bundled images must be deployed under `EF_Images`.
