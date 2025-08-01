# RPGlitch App

## Overview

RPGlitch is a web application for creating and managing RPG character profiles with glitch effects.

## Structure

```
rpglitch/
├── RPGlitch.html                    # Main HTML template
├── RPGlitch-left-panel.txt         # Left panel content
├── RPGlitch.js                      # Main JavaScript logic
├── RPGlitch.scss                    # Main SCSS styles
├── ProfilePictureComponent.js       # React component for profile pictures
└── README.md                        # This documentation
```

## Development

- **Main Entry Point**: `RPGlitch.html`
- **Styles**: `RPGlitch.scss`
- **Scripts**: `RPGlitch.js`
- **Components**: `ProfilePictureComponent.js`

## Build

The app can be built using the build scripts in the `build/` directory.

## Perchance Integration

This app follows the Perchance architecture principles:

- Client-side only execution
- Single-file output for deployment
- Modular organization during development
- Plugin system support via global App object

### Database

Data is stored in an IndexedDB database via Dexie.js. If `window.dbName` is not
defined, the app sets it to the default `rpglitch-db` before opening the
database.
