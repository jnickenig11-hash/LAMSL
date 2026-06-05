# Render storage setup for LAMSL

## Recommended setup

Use both:

1. Render Persistent Disk for uploaded image files.
2. Render Postgres later if you want relational database storage for league content.

The current backend package supports persistent disk immediately through `LAMSL_STORAGE_DIR` or `RENDER_DISK_MOUNT`.

## Persistent Disk setup

1. Open Render Dashboard.
2. Open the LAMSL backend Web Service.
3. Go to Settings.
4. Find Disks / Persistent Disk.
5. Add a disk.
6. Set mount path to:

```text
/var/data
```

7. Set size, for example 1 GB to start.
8. Save changes.
9. Add environment variable:

```text
LAMSL_STORAGE_DIR=/var/data
```

10. Confirm `ADMIN_API_KEY` is also set as an environment variable.
11. Redeploy the backend.
12. After deploy, visit:

```text
/api/health
```

The response should show uploads/data/logs directories as available.

## What will be stored on disk

With `LAMSL_STORAGE_DIR=/var/data`, the backend writes persistent files under:

```text
/var/data/data/content.json
/var/data/uploads
/var/data/logs
/var/data/EF_Images
/var/data/teamProfile images
```

The bundled `data/content.json` is used as the initial seed if the persistent disk does not already contain content.

## Render Postgres setup option

Use Postgres when you are ready to move schedules, teams, rosters, standings, and announcements out of JSON files.

1. Open Render Dashboard.
2. Click New > Postgres.
3. Name it something like:

```text
lamsl-db
```

4. Choose a region close to the backend service.
5. Create the database.
6. Open the database Info page.
7. Copy the Internal Database URL.
8. Add it to the backend Web Service environment variables as:

```text
DATABASE_URL=<internal database url>
```

9. Redeploy backend.
10. A later migration can replace `content.json` reads/writes with tables.

## Important

A Render free web service has an ephemeral filesystem. Uploaded files saved outside a persistent disk can disappear after restart or redeploy.
