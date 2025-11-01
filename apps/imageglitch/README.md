# ImageGlitch

A minimalist Perchance application for AI-powered text-to-image generation.

## Overview

ImageGlitch provides a clean, straightforward interface for generating images from text prompts using Perchance's text-to-image plugin (Stable Diffusion).

## Architecture

### Two-Panel Structure (Perchance)

- **Left Panel:** `ImageGlitch-left-panel.txt`
  - Perchance engine logic
  - Plugin imports (text-to-image-plugin)
  - Core setup and configuration

- **Right Panel:** Source in `html/index.html`
  - Main application UI and logic
  - JavaScript modules in `js/`
  - Styles in `scss/`
  - Compiled into single inlined HTML output

## Build

```bash
# Build ImageGlitch
npm run build:imageglitch

# Output location
build/output/ImageGlitch.html
```

## Source Structure

```text
apps/imageglitch/
├── ImageGlitch-left-panel.txt  # Perchance engine (plugin imports, setup)
├── html/
│   └── index.html               # Main UI template
├── js/
│   └── (application modules)    # Image generation logic
└── scss/
    └── (style modules)          # Styles (compiled and inlined)
```

## Key Features

- **Text-to-Image Generation:** Create images from text prompts using AI
- **Minimalist Design:** Clean, focused interface
- **Perchance Integration:** Leverages Perchance's Stable Diffusion backend

## Technology Stack

- **UI Framework:** Custom components built on Pico.css
- **JavaScript:** ES6+ modules (vanilla, no framework)
- **Styling:** SCSS compiled to CSS, inlined in build
- **Image Generation:** Perchance text-to-image-plugin

## Development

See the main repository README.md and CLAUDE.md for:

- Complete development protocol and rules
- Coding standards
- Build process details
- Testing guidelines
- Deployment workflow

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Complete protocol and development guidelines
- [design-system.md](../../design-system.md) - UI/UX guidelines and components
- [plan.md](../../plan.md) - Project roadmap and feature backlog
