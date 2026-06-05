# LAMSL Email Schedule Notifications - SMTP Setup

The notification feature is wired in the backend. It will save website email subscribers and can send a schedule-update email with a mini schedule snapshot.

## Required Render environment variables

Add these to the **LAMSL backend** Render service, then redeploy:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-sending-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=LAMSL Schedule Updates <your-sending-email@gmail.com>
SMTP_EHLO_DOMAIN=lamsl.com
```

For Gmail, use an App Password, not your normal Gmail password.

Alternative for SendGrid/Mailgun/etc.:

```text
SMTP_HOST=<provider smtp host>
SMTP_PORT=465 or 587
SMTP_SECURE=true for 465, false for 587
SMTP_USER=<smtp username>
SMTP_PASS=<smtp password>
MAIL_FROM=LAMSL Schedule Updates <no-reply@lamsl.com>
SMTP_EHLO_DOMAIN=lamsl.com
```

## Storage variables

These should already exist:

```text
ADMIN_API_KEY=<your admin key>
LAMSL_STORAGE_DIR=/var/data
```

## Verify after redeploy

Open:

```text
https://lamsl-backend.onrender.com/api/notifications/status
```

Expected when configured:

```json
{
  "success": true,
  "smtpConfigured": true
}
```

## Admin testing

In `administrators.html`, use the notification controls:

1. Preview Schedule Email
2. Send Schedule Update Email

Automatic emails are queued when `/api/update` receives schedule changes.
