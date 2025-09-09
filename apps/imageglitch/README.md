# ImageGlitch

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

A minimalist Text-to-Image generator built for the Perchance platform, following the same single-file build flow as RPGlitch.

## For Developers (Human Documentation)

### Entry / Output

- **Entry HTML:** `apps/imageglitch/ImageGlitch.html`
- **Output HTML:** `build/output/ImageGlitch.html` (once wired to the build system)

### Build Process

ImageGlitch is now wired into the build pipeline. To build the application, run the following command:

```bash
npm run build:imageglitch
```

This command will process `apps/imageglitch/ImageGlitch.html`, inline its styles from `ImageGlitch-style-block.html`, and output the final bundled HTML to `build/output/ImageGlitch.html`.

### Styling

The current styling strategy is to **use Pico.css as much as possible** for foundational elements to ensure consistency and a clean, modern aesthetic with minimal effort. We may develop a more custom styling system in the future, but for now, all new components should adhere to Pico.css standards.

## Development Rules (AI Instructions)

### Referenced Rules from `rules/`

- **[html-best-practises.md](../../rules/html-best-practises.md)** - Semantic HTML, accessibility, and Perchance-specific markup.
- **[html-hyperscript-guide.md](../../rules/html-hyperscript-guide.md)** - For simple, readable interactivity directly in HTML.
- **[scss-style-guide.md](../../rules/scss-style-guide.md)** - Core principles for using Pico.css and modern CSS.
- **[js-modern-guide.md](../../rules/js-modern-guide.md)** - Guidelines for modern, modular JavaScript.

### Referenced Rules (Apps-Specific)

- **[perchance-architecture.md](../perchance-architecture.md)** - Perchance platform architecture and constraints.
- **[perchance-build.md](../perchance-build.md)** - Perchance build system and output requirements.

## Current Tasks (ImageGlitch-Specific)

- [x] **Build Pipeline:** Wired ImageGlitch into the build pipeline (e.g., created `build-imageglitch.js`).
- [ ] **Documentation:** Document the build usage in this README once implemented.
- [x] **UI Consistency:** Updated UI elements to use the standardized classes from `memory-bank/forever/design-system.md` (e.g., `.summon-button`).
