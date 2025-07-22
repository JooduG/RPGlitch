# Start Here: Perchance/Glitch Development Onboarding

Welcome!  
This project is built with the Perchance/Glitch design system: a modern, minimal, robust approach to web app development focused on maintainability, clarity, and user experience.

## Projects Using This System

This Perchance/Glitch development system currently supports the following projects:

### RPGlitch

- [Live App](https://perchance.org/rpglitch)
- [Source: RPGlitch.html](apps/rpglitch/RPGlitch.html)
- A minimal, robust RPG character generator and editor.

### ImageGlitch

- [Live App](https://perchance.org/imageglitch)
- [Source: ImageGlitch.html](apps/imageglitch/ImageGlitch.html)
- A minimal, component-based image glitching tool.

_This README, the memory bank, and the rules are designed to support multiple Perchance/Glitch projects. As new projects are added, list them here to keep onboarding and reference up to date._

---

## Non-Negotiable Rules (Always Active)

This project is governed by a set of non-negotiable rules and protocols to ensure consistency, maintainability, and user experience.

**For the full, up-to-date list of rules, see:**

- [Perchance Architecture](.cursor/rules/perchance-architecture.mdc): Structure, modularity, and platform constraints for Perchance apps.
- [Perchance Plugin System](.cursor/rules/perchance-plugin-system.mdc): Guidelines for plugin development and integration.
- [Perchance Development Workflow](.cursor/rules/perchance-development-workflow.mdc): Standard workflow, protocols, and best practices.
- [Perchance Build & Deployment](.cursor/rules/perchance-build-deployment.mdc): Build process, merging, and deployment for Perchance.
- [IndexedDB Principles](.cursor/rules/js-indexeddb-principles.mdc): Storage, versioning, and best practices for IndexedDB in Perchance.
- [HTML Development](.cursor/rules/html-development.mdc): Semantic HTML, accessibility, and Perchance-specific markup.
- [JavaScript Development](.cursor/rules/js-development.mdc): JS best practices for maintainable, robust Perchance code.
- [SCSS Development](.cursor/rules/scss-development.mdc): Atomic/utility CSS, Tailwind compatibility, and general CSS best practices.
- [Design System](memory-bank/project/designSystem.md): No icons, only text labels for controls.
- [All rules in .cursor/rules/](.cursor/rules/)

**Highlights:**

- Minimal, grouped controls (no icons, only text labels)
- Atomic/component CSS: all CSS in one file for deployment, no @import, no repeated !important
- Incremental, reviewable changes only
- Protocol-driven workflows (see rules for details)
- Modular, extensible architecture and plugin system
- Perchance-specific storage and build/deploy requirements

---

## Onboarding & Reference Guide

- [All rules in .cursor/rules/](.cursor/rules/)

---

## Project File Structure

```text
/
├── apps/                   # Application code
│   ├── rpglitch/           # RPGlitch app source (HTML, JS, CSS)
│   ├── imageglitch/        # ImageGlitch app source
│   └── tizen/              # Tizen C# applications (future)
├── build/                  # Build system
│   ├── scripts/            # Build scripts
│   └── output/             # Build artifacts
├── docs/                   # Documentation
│   ├── guides/             # User and developer guides
│   ├── mcp/                # MCP ecosystem documentation
│   └── api/                # API documentation
├── tools/                  # Development tools
│   ├── diagnostics/        # Diagnostic tools
│   ├── browser-tools/      # Browser automation tools
│   └── mcp/                # MCP servers and tools
├── .cursor/                # Cursor editor configuration
│   └── rules/              # Project rules and guidelines
├── linting/                # Linting configuration
│   ├── eslint.config.mjs   # ESLint configuration
│   ├── stylelint.config.js # Stylelint configuration
│   └── .htmlhintrc         # HTMLHint configuration
├── memory/                 # Consolidated memory system
│   ├── project/            # Project-specific memory
│   ├── cursor/             # Cursor memory bank
│   └── archive/            # Archived memory
├── sdk/                    # External SDKs and tools
└── README.md               # This onboarding and reference guide
```

---

_For any task, always start by reviewing the current state and explicit instructions in this README and the memory bank.  
This onboarding applies to all Perchance/Glitch projects for consistent, high-quality development._

## RPGlitch Components: CSS & Build System

### CSS Structure

- **base.css**: Atomic/utility classes, variables, resets.
- **layout.css**: All layout, centering, width, and flex rules for app containers (top bar, chin, main content, etc.).
- **components.css**: Visual/component styles (background, border-radius, color, padding, font-size, font-weight, etc.) for UI elements.

### Build & Deployment

- Use `build-perchance.js` to merge all CSS into a single `<style>` block for Perchance deployment.
- **As of July 2025, the build script outputs the merged CSS and source map to `build/output/archive/`:**
  - `build/output/archive/RPGlitch-perchance.css`
  - `build/output/archive/RPGlitch-perchance.css.map`
- The HTML deployment file remains in `build/output/` as `RPGlitch-perchance.html`.
- Do not use or reference `RPGlitch.css`—the build script handles merging.
- The `atomic-css` folder is archived and can be deleted; all atomic classes are now in `base.css`.

#### How to Build

From the project root:

```sh
node build-perchance.js
```

- The merged CSS and map will be in `build/output/archive/`.
- The HTML deployment file will be in `build/output/`.

### Diagnostics

- Use `automation-collect-diagnostics.js` to collect browser logs, audits, and screenshots for QA/debugging.

### Best Practices

- ONE SOURCE ONE TRUTH: Each class or element should have its layout rules in `layout.css` and visual rules in `components.css` only once.
- Adjust only the relevant file for layout or visual changes.

## Recent Updates (January 2025)

### Card Component Styling

- **Chin Card UI Modernization**: Successfully unified chin cards with storyboard cards through semantic HTML restructuring, consistent styling, and smart text overflow handling.
- **Overflow Protection**: Added `overflow: hidden` to card info areas to prevent background "leakage" and ensure clean visual boundaries.
- **CSS Specificity Management**: Resolved conflicts between general article rules and card-specific styles using `:not()` selectors.
- **Text Overflow Strategy**: Implemented smart ellipsis handling with `text-wrap: balance` and fallback overflow styles for optimal readability.
- **Color Palette Integration**: "Premade" tags use character's color palette for visual consistency and brand recognition.

### Build System Improvements

- **Dependency Loading Fix**: Reverted to original inlining approach for reliable library loading, eliminating CDN timing issues.
- **Database Safety**: Added comprehensive null checks throughout the application to prevent race condition errors during startup.
- **Error Handling**: Improved error handling with better timeout messages and graceful degradation.

### Documentation Updates

- **Memory Bank Consolidation**: All project documentation, planning, and design system records are now centralized in the `memory/` directory.
- **Design System Refinement**: Updated component specifications and UI/UX review checklists to reflect current implementation.
- **Progress Tracking**: Comprehensive milestone tracking and learning documentation for future reference.

---
