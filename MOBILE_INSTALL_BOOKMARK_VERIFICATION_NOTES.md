# Mobile Install / Bookmark Verification

Verified and updated mobile install support.

## Confirmed files
- `manifest.webmanifest` exists and is linked from `mobile.html`.
- `sw.js` exists and is registered from `js/mobile.js`.
- `mobile.html` includes iOS home-screen metadata and Apple touch icon.

## Change added
- The top-right mobile button now always displays as `Save App`.
- On Android/Chrome and supported browsers, the button launches the native PWA install prompt when available.
- On iPhone/Safari or browsers that do not expose the install prompt, the button scrolls to visible instructions for Share → Add to Home Screen / bookmark.
- Instructions are visible on the mobile landing card so users can install/bookmark directly from the website.
