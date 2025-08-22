# Build System

## Overview

This directory contains build scripts and output for RPGlitch.

## Structure

```md
build/
├── scripts/             # Build scripts
│   ├── build-and-copy.js
│   ├── build-perchance.js
│   └── README.md
├── output/              # Build outputs (gitignored)
│   ├── rpglitch/
│   ├── imageglitch/
│   └── archives/
└── README.md            # This file
```

## Scripts

### `build-perchance.js`

The main build script that:

- Downloads and inlines external dependencies (Hyperscript, Cash DOM, Dexie.js, DOMPurify)
- Compiles SCSS to CSS
- Combines all source files into a single HTML file
- Minifies CSS with PostCSS and cssnano
- Minifies JavaScript with Terser
- Minifies the final HTML output
- Outputs to `../output/RPGlitch-perchance.html`

Install dev dependencies once before running builds:

```bash
npm install
```

**Usage:**

```bash
node build-perchance.js
```

### `build-and-copy.js`

Builds RPGlitch and automatically copies the result to the clipboard for easy pasting into Perchance.

**Usage:**

```bash
# From build/scripts directory
node build-and-copy.js

# From project root
npm run build:copy
```

## Output

The build process creates:

- `../output/RPGlitch-perchance.html` - Fully minified HTML for Perchance
- `../output/archive/RPGlitch-perchance.css` - Compiled CSS (archived)
- `../output/archive/RPGlitch-perchance.css.map` - CSS source map (archived)

## Dependencies

The build process automatically downloads and inlines:

- **Hyperscript** (0.9.12) - For HTML interactivity
- **Cash DOM** (8.1.5) - jQuery-like DOM manipulation
- **Dexie.js** (4.0.8) - IndexedDB wrapper
- **DOMPurify** (3.0.1) - XSS protection

## Source Files

The build combines:

- `apps/rpglitch/RPGlitch.html` - Main HTML structure
- `apps/rpglitch/RPGlitch.scss` - Main stylesheet (compiled to CSS)
- `apps/rpglitch/ProfilePictureComponent.js` - Profile picture logic
- `apps/rpglitch/RPGlitch.js` - Main JavaScript logic

## Notes

- The build process runs from the `build/scripts` directory
- All paths are relative to the project root
- The output file is optimized for Perchance deployment
- External dependencies are inlined for reliability
