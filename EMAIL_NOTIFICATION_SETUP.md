# LAMSL Email Notification Setup

This patch adds schedule-update email notifications for users who subscribe through the homepage email subscription region.

## Render environment variables

Add these variables to the Render backend service:

```text
SMTP_HOST=your.smtp.host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
MAIL_FROM=LAMSL <notifications@yourdomain.com>
LAMSL_AUTO_NOTIFY_SCHEDULE_UPDATES=true
```

`LAMSL_AUTO_NOTIFY_SCHEDULE_UPDATES=false` disables automatic emails when the backend schedule changes. Manual sending from the Administrator Dashboard still works.

## Administrator dashboard

Open `administrators.html`, sign in as admin, then use Site Content Dashboard > Email Schedule Notifications.

- Preview Email Snapshot: shows the next games snapshot and subscriber count.
- Send Schedule Update Email: sends the schedule update email to all subscribers.

## Backend endpoints

- `GET /api/notifications/schedule-preview`
- `POST /api/notifications/send-schedule-update`
- `GET /api/subscribers`

All endpoints require admin authentication.

## Subscriber storage

Subscribers are now stored under the configured persistent storage data folder: `LAMSL_STORAGE_DIR/data/email_subscribers.json`. Legacy `email_subscribers.json` entries are still read and merged.
