# Mobile Browser Default + Team Page Mobile Update

## What changed

- Added `js/mobile-redirect.js`.
- Added mobile-browser auto-redirect to:
  - `index.html`
  - `LAMSL.html`
- Mobile users who open the public site now land on `mobile.html` by default.
- Updated the `Full Site` link on `mobile.html` to `LAMSL.html?fullsite=1` so users can intentionally bypass the mobile redirect during that browser session.
- Added mobile-friendly responsive overrides to `team.html`.

## Team page mobile improvements

- Compact mobile banner.
- Sticky mobile navigation with horizontal scrolling.
- Single-column team profile layout.
- Larger tap targets for buttons, selects, inputs, and file uploads.
- Responsive team photo frame.
- Mobile-friendly roster cards and manager controls.
- Horizontal scrolling protection for schedule/roster tables.
- Better modal behavior on phones.

## Deploy notes

Upload the full project to Render/GitHub as usual. After deploy, test from a phone or browser device emulator:

- `https://www.lamsl.com/` should open `mobile.html` on mobile.
- `https://www.lamsl.com/LAMSL.html` should open `mobile.html` on mobile.
- `https://www.lamsl.com/mobile.html` should remain the mobile dashboard.
- `Full Site` from the mobile dashboard should open `LAMSL.html?fullsite=1` and keep the full site available for that session.
- `team.html?team=Bandits&division=C` should remain accessible and display responsively on mobile.
