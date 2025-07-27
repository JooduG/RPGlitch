# ImageGlitch App

## Overview

ImageGlitch is a web application for applying glitch effects to images.

## Structure

```
imageglitch/
├── ImageGlitch.html                 # Main HTML template
├── ImageGlitch-left-panel.html      # Left panel HTML template
├── ImageGlitch-style-block.html     # CSS styles
└── README.md                        # This documentation
```

## Development

- **Main Entry Point**: `ImageGlitch.html`
- **Styles**: `ImageGlitch-style-block.html`

## Build

The app can be built using the build scripts in the `build/` directory.

## Perchance Integration

This app follows the Perchance architecture principles:

- Client-side only execution
- Single-file output for deployment
- Modular organization during development
- Plugin system support via global App object
