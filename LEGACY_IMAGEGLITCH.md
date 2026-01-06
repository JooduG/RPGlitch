# 🖼️ Legacy ImageGlitch Documentation

This file contains documentation fragments for **ImageGlitch** that were removed from the primary RPGlitch repository during its transition to a flat single-app structure.

## Original Context

ImageGlitch was a sister application within the JooduG monorepo, sharing styling and core utility patterns with RPGlitch.

## Directory Structure (Legacy)

```text
apps/imageglitch/
├── index.html             # Main UI template
├── js/
│   ├── index.js           # Entry point
│   └── ...                # Logic modules
└── scss/
    └── index.scss         # App-specific styles
```

## Build Process (Legacy)

```bash
# Build Command
npm run build:imageglitch

# Output
dist/imageglitch/ImageGlitch.html
```

## Styling Mandate

ImageGlitch used the same **Pico.css** base and **Glassmorphism** standards as RPGlitch.

- **Glassmorphism Standard:** `%material-glass` (Blur 16px, 60% Opacity)
- **Grid Layout:** Responsive Grid (`minmax(120px, 1fr)`)

## Security Context

ImageGlitch required strict `DOMPurify` sanitization for all user-generated image prompts and metadata.

- **Location:** `apps/imageglitch/js/index.js`
- **Rule:** Do not remove `localStorage` overrides to prevent platform data eviction.
