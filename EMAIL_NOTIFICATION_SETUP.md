# LAMSL Email Schedule Notifications - SMTP Setup

The notification feature is integrated into the backend. Website visitors can subscribe through the homepage email subscription region, and admins can preview or send schedule-update emails from `administrators.html`.

## Gmail sender account

Use this Gmail account as the sender and reply inbox:

```text
lamslsupport@gmail.com
```

Create a Google App Password for the account and use that generated password in Render. Do not use the normal Gmail login password.

## Required Render environment variables

Add these to the LAMSL backend Render service, then redeploy:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lamslsupport@gmail.com
SMTP_PASS=<Google App Password>
MAIL_FROM=LAMSL Support <lamslsupport@gmail.com>
SMTP_EHLO_DOMAIN=lamsl.com
```

`SMTP_SECURE` is optional. Leave it blank for Gmail port `587`. The backend will connect with STARTTLS automatically. If you use Gmail port `465`, set:

```text
SMTP_PORT=465
SMTP_SECURE=true
```

For Gmail, the backend now strips whitespace from `SMTP_PASS` automatically so copied app passwords with spaces still authenticate.

## Storage variables

These should already exist on the backend service:

```text
ADMIN_API_KEY=<your admin key>
LAMSL_STORAGE_DIR=/var/data
```

## Verification endpoint

After redeploy, open:

```text
https://lamsl-backend.onrender.com/api/notifications/status
```

Expected configured response:

```json
{
  "success": true,
  "smtpConfigured": true
}
```

## Admin testing

In `administrators.html`:

1. Sign in as admin.
2. Go to Email Schedule Notifications.
3. Click Preview Email Snapshot.
4. Confirm the next games mini schedule displays.
5. Click Send Schedule Update Email.

## Automatic notifications

The backend automatically queues subscriber notifications when `/api/update` receives a schedule change. Score-only updates do not trigger schedule-change notifications.

To disable automatic schedule emails temporarily, set this Render variable:

```text
LAMSL_AUTO_NOTIFY_SCHEDULE_UPDATES=false
```

Manual admin sends will still work.
