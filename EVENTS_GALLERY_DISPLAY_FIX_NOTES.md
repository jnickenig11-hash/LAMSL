# Events Gallery Display Fix

Updated `events.html` so the Events & Fundraisers slideshow correctly displays photos uploaded from the Administrator page.

Fixes included:
- Supports backend image fields including `imageUrl`, `publicUrl`, `url`, `src`, `path`, `filePath`, `filename`, and `name`.
- Resolves backend-hosted upload paths through the Render backend instead of incorrectly looking for uploaded files on `www.lamsl.com`.
- Handles bare filenames by treating them as Events/Fundraisers gallery images in `EF_Images`.
- Keeps Events & Fundraisers page as display-only; uploads are managed from `administrators.html`.
