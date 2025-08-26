---
description: "ImageGlitch sample app; mirrors RPGlitch build flow"
tags:
  - imageglitch
  - perchance
  - sample
globs:
  - "**/*.html"
---

---
description: "ImageGlitch: A minimalist Text-to-Image generator built for the Perchance platform."
tags:
  - imageglitch
  - perchance
  - app
globs:
  - "**/*.html"
  - "**/*.js"
  - "**/*.scss"
---

# ImageGlitch

A minimalist Text-to-Image generator built for the Perchance platform, following the same single-file build flow as RPGlitch.

## For Developers (Human Documentation)

### Entry / Output

- **Entry HTML:** `apps/imageglitch/ImageGlitch.html`
- **Output HTML:** `build/output/ImageGlitch.html` (once wired to the build system)

### Build Process

This app is not yet wired into the default build pipeline. The process should mirror the `build-rpglitch.js` script when implemented.

### Styling

The current styling strategy is to **use Pico.css as much as possible** for foundational elements to ensure consistency and a clean, modern aesthetic with minimal effort. We may develop a more custom styling system in the future, but for now, all new components should adhere to Pico.css standards.

## Development Rules (AI Instructions)

### Referenced Rules from `rules/`

- **[html-development.md](../../rules/html-development.md)** - Semantic HTML, accessibility, and Perchance-specific markup.
- **[html-hyperscript-usage.md](../../rules/html-hyperscript-usage.md)** - For simple, readable interactivity directly in HTML.
- **[scss-modern-css-frameworks.md](../../rules/scss-modern-css-frameworks.md)** - Core principles for using Pico.css and modern CSS.
- **[js-development.md](../../rules/js-development.md)** - Guidelines for modern, modular JavaScript.

### Referenced Rules (Apps-Specific)

- **[perchance-architecture.md](../perchance-architecture.md)** - Perchance platform architecture and constraints.
- **[perchance-build.md](../perchance-build.md)** - Perchance build system and output requirements.

## Current Tasks (ImageGlitch-Specific)

- [ ] **Build Pipeline:** Wire ImageGlitch into the build pipeline (e.g., create `build-imageglitch.js`).
- [ ] **Documentation:** Document the build usage in this README once implemented.
- [ ] **UI Consistency:** Update UI elements to use the standardized classes from `memory-bank/forever/designSystem.md` (e.g., `.summon-button`).
