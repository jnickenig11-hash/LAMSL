# Admin Image Delete Update

This update adds administrator deletion controls for uploaded homepage slideshow and event/fundraiser images.

## Backend
- New protected endpoint: `POST /api/delete-image`
- Body: `{ "destination": "homepage" | "events", "filename": "uploaded-file-name.jpg" }`
- Deletes the physical file from the configured Render disk folder.
- Removes the image record from `content.slideshow` or `content.eventFundraiserImages`.
- Syncs EF image metadata for event/fundraiser images.

## Administrator page
- Uploaded homepage and event/fundraiser images now display with thumbnails and Delete buttons.
- Delete requires an admin/umpire session or valid backend API key.
- Delete confirmation explains that both the content record and storage file are removed.

## Storage paths
- Homepage slideshow files: `/var/data/SlideshowImages`
- Event/fundraiser files: `/var/data/EFimages`
