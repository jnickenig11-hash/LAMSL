# LAMSL Mobile Version

## Added files
- `mobile.html` - mobile-first dashboard for game schedules, scores, standings, announcements, and admin updates.
- `css/mobile.css` - mobile theme matching the LAMSL navy/orange site theme.
- `js/mobile.js` - backend-connected mobile logic with local fallback cache.
- `manifest.webmanifest` - Progressive Web App manifest for Add to Home Screen / install support.
- `sw.js` - service worker for basic offline shell caching.

## Updated file
- `LAMSL.html` - added a mobile-only sticky link at the top: `Open Mobile Version`.

## Mobile features
- Full Site link at the top of the mobile screen.
- Schedule tab with division filter.
- Scores tab showing posted final scores.
- Standings tab with division filter.
- Announcements tab.
- Admin tab for Administrator sign-in, quick score updates, game status updates, and announcement publishing.
- Full Admin Panel link for features that should stay on the full site.
- Install button appears on supported browsers once the site is served over HTTPS.

## Deployment
Upload these files with the rest of the site. After deployment, the mobile page will be available at:

`https://www.lamsl.com/mobile.html`

The mobile version uses the existing Render backend configured in `js/backend-config.js`.
