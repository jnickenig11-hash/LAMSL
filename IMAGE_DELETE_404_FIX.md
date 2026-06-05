# Image Delete 404 Fix

The administrator page now retries image deletion against these backend routes:

- `/api/delete-image`
- `/api/images/delete`
- `/api/uploaded-images/delete`

The backend exposes all three routes to avoid 404 failures from older frontend/backend route mismatches. All routes use the same authenticated delete handler and remove both the content record and the stored file from `/SlideshowImages` or `/EFimages`.

Deploy both the frontend and backend updates. A 404 after this update means the Render backend was not redeployed with the updated `backend/server.js`.
