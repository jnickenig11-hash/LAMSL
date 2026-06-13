# Image Upload Events/Fundraisers Folder Fix

Updated the administrator Image Uploads feature so selecting **Events / Fundraisers** saves images to the Events/Fundraisers slideshow image folder.

## Changes

- `administrators.html`
  - Sends the selected image destination in both the multipart body and the upload URL query string.
  - Event/fundraiser upload status now confirms the image was saved to the EFimages slideshow folder.

- `backend/server.js`
  - Reworked `/api/upload-image` to use memory upload handling so the destination value is available before the file is saved.
  - Selecting Events/Fundraisers now writes the image to persistent `EFimages` storage.
  - Also writes a compatibility copy to `EF_Images` for older gallery/slideshow code paths.
  - Updates `eventFundraiserImages` in backend content.
  - Updates `ef_images_metadata.json`.
  - Fixed duplicate `const folder` declaration in delete image handling.

- `server.py`
  - Added `/api/upload-image` compatibility endpoint.
  - Supports both `image` and `photo` multipart fields.
  - Saves Events/Fundraisers uploads to `EF_Images` when using the Python local server.

## Expected Result

When an administrator selects **Events / Fundraisers** and uploads an image, the file is saved to the Events/Fundraisers slideshow image folder and appears on `events.html`.
