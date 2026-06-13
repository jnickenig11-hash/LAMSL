# Events Gallery Admin Upload Fix

Changes applied:

- Removed the visible event photo upload controls from `events.html`.
- Event/fundraiser photos are now managed only from `administrators.html` using Image Uploads > Events / Fundraisers.
- Updated `events.html` slideshow loading to read `eventFundraiserImages` from `/api/content`, which is the same backend content used by the Administrator image upload tool.
- Kept legacy `/ef-images` loading as a fallback only.
- Normalized event image paths so backend-relative image URLs render correctly on the public Events & Fundraisers page.
