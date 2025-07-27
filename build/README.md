# Build System

## Overview

This directory contains build scripts and output for the project.

## Structure

```
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

### build-and-copy.js

Builds the project and copies files to appropriate locations.

### build-perchance.js

Builds the project specifically for Perchance integration.

## Output

Build outputs are stored in the `output/` directory and are excluded from version control.

## Usage

Run build scripts from the project root:

```bash
node build/scripts/build-and-copy.js
node build/scripts/build-perchance.js
```
