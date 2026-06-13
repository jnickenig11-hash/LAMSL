# Events Gallery Display Final Fix

Applied a stronger Events & Fundraisers gallery fix.

## Changes
- `events.html` now checks multiple backend sources for event/fundraiser images:
  - `/api/content`
  - `/ef-images`
  - `/api/ef-images`
- `events.html` now de-duplicates image records and supports fallback image paths:
  - `/EFimages/<filename>`
  - `/EF_Images/<filename>`
  - original saved path
- `backend/server.js` now merges event/fundraiser images from:
  - backend `content.eventFundraiserImages`
  - legacy EF image metadata
  - files found on disk in `EFimages`
  - files found on disk in `EF_Images`
- Added `/api/ef-images` endpoint in addition to `/ef-images`.
- Backend now serves both `/EFimages` and `/EF_Images` paths.

## Result
Images uploaded from the Administrator page to Events / Fundraisers should appear on `events.html` even if the backend record only has a filename, an old path, or the file exists on disk without a clean content record.
