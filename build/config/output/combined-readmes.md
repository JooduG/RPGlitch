<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->
> **Generated file** — built by `build/scripts/sync-combine.js` at build time.  
> Edit the source docs under `docs/` and `memory-bank/docs/`, not this file.

# All READMEs across repo

### Folder summary

- `README.md/` — 1 files
- `apps/` — 6 files
- `build/` — 1 files
- `docs/` — 1 files

## Table of Contents

- **README.md/**
  - [README.md](#readmemd)
- **apps/**
  - [apps/README.md](#appsreadmemd)
  - [apps/imageglitch/README.md](#appsimageglitchreadmemd)
  - [apps/rpglitch/README.md](#appsrpglitchreadmemd)
  - [apps/rpglitch/html/README.md](#appsrpglitchhtmlreadmemd)
  - [apps/rpglitch/js/README.md](#appsrpglitchjsreadmemd)
  - [apps/rpglitch/scss/README.md](#appsrpglitchscssreadmemd)
- **build/**
  - [build/README.md](#buildreadmemd)
- **docs/**
  - [docs/README.md](#docsreadmemd)

---

<a id="readmemd"></a>
## README.md

## RPGlitch Workspace

A unified, Perchance-friendly workspace with:

- **Apps:** `apps/rpglitch`, `apps/imageglitch`
- **One-source configs:** `build/config/*`
- **Generators:** `build/scripts/sync-combine.js` (docs),
  `sync-configs.js` (ignores + IDE configs)
- **Output:** built HTML to `build/output/`

### Quick start

```bash
## One command to rule them all - ready for Perchance
npm run deploy
## Or just build and copy
npm run build:copy
```

### Common tasks

- **Deploy to Perchance:** `npm run deploy` (sync all, test, lint, build & copy)
- **Build RPGlitch only:** `npm run build`
- **Lint everything:** `npm run lint` (use `npm run lint:fix` to auto-fix)
- **Sync everything:** `npm run sync` (libs, configs, combine docs)
- **Combine docs (generated):** `npm run sync:combine`

### Where things live

- **Configs:** `build/config/` (eslint, stylelint, htmlhint, md, jest)
- **Config sync:** `build/config/ignores.master.json` + `.rules/` → `npm run sync` (or individual sync:xxx commands)
- **Scripts:** `build/scripts/*`
- **Generated docs:** `build/output/*.md` (⚠️ do not edit)

### Perchance constraints

- All scripts are **inlined**; no CDN tags in the final HTML.
- Local libs pulled into `build/local_libs` only.
- Output for RPGlitch: `build/output/RPGlitch.html`.

**More docs:** see
[`build/output/combined-docs.md`](build/output/combined-docs.md) and
[`build/output/repo-overview.md`](build/output/hub.md).

---

<a id="appsreadmemd"></a>
## apps\README.md

## Apps

Shared standards for all Perchance applications.

### For Developers (Human Documentation)

#### Build Commands

```bash
npm run fetch:libs      # downloads pico/cash/dexie/purify/_hyperscript → build/local_libs

## Project-specific builds
node build/scripts/build-rpglitch.js
```

#### Perchance Constraints

- Strip all external `<script src>` and `<link>`; inline bundle only

#### UI Standards

- All buttons must have visible text labels (no icon-only buttons)
- Use semantic HTML5 elements and proper ARIA labels
- All inputs must have associated labels with clear validation
- All interactive elements must be keyboard accessible
- Mobile-first responsive design with progressive enhancement
- Modular, self-contained, reusable components

#### Troubleshooting

- If UI looks unstyled, re-run `npm run fetch:libs` (pico in `build/local_libs/pico.min.css`)
- If clipboard copy fails, PowerShell may need `Set-Clipboard`; re-open terminal or copy manually from build output

### Development Rules (AI Instructions)

#### Referenced Rules (Apps-Specific)

- **[perchance-architecture.md](perchance-architecture.md)** - Perchance platform architecture and constraints
- **[perchance-build.md](perchance-build.md)** - Perchance build system and output requirements
- **[perchance-lifecycle.md](perchance-lifecycle.md)** - Perchance application lifecycle and deployment
- **[perchance-plugins.md](perchance-plugins.md)** - Perchance plugin system and integration

#### Shared Perchance Standards

- Single-file deliverable with inline bundling for Perchance compatibility
- Strip external dependencies and inline all resources

### Current Tasks (Apps-Level)

#### High Priority

- [ ] **Build System Enhancement**: Implement incremental builds for faster development
- [ ] **Shared Component Library**: Create reusable UI components across apps

#### Medium Priority

- [ ] **Performance Monitoring**: Set up build-time performance tracking
- [ ] **Cross-App Standards**: Establish consistent patterns across RPGlitch/ImageGlitch
- [ ] **ImageGlitch Build Script**: Add `build-imageglitch.js` to `build/scripts/` and document usage here

#### Low Priority

- [ ] **Documentation Enhancement**: Improve shared documentation and examples
- [ ] **Testing Framework**: Implement shared testing utilities for Perchance apps

### Recently Completed (Max 10)

- [x] **README Reorganization**: Moved shared standards to apps/ level
- [x] **Folder Structure**: Established technology-specific folder patterns
- [x] **Build Script Updates**: Updated build processes for new structure

---

<a id="appsimageglitchreadmemd"></a>
## apps\imageglitch\README.md

## ImageGlitch

Small sample app, same Perchance build flow.

### Entry / Output

- Entry HTML: `apps/imageglitch/index.html`
- Output: `build/output/ImageGlitch-perchance.html` (if added to build later)

### Build

This app is not wired into the default build yet. Mirror the RPGlitch setup
when needed.

---

<a id="appsrpglitchreadmemd"></a>
## apps\rpglitch\README.md

## RPGlitch

Single-file Perchance deliverable with storyboard + profiles functionality.

### For Developers (Human Documentation)

#### Build Commands

```bash
## Development build
node build/scripts/build-rpglitch.js
```

### Development Rules (AI Instructions)

#### RPGlitch-Specific Requirements

- Storyboard functionality with dynamic title management
- Character and profile management with persistent storage
- Deterministic placeholder system for consistent UX
- Item management with full-featured forms and card interactions

### Current Tasks (RPGlitch-Specific)

#### High Priority

- [ ] **Deterministic Placeholders**: Implement consistent placeholder system with "Empty" titles
- [ ] **Storyboard Flow Hardening**: Complete toolbar, cancel, showPicker, and dynamic title functionality
- [ ] **JavaScript Modularization**: Continue breaking down remaining business logic modules

#### Medium Priority

- [ ] **UI Module Implementation**: Complete remaining RPGlitch-specific UI components
- [ ] **Chin List Enhancement**: Improve persistence and accessibility for chin list functionality
- [ ] **Item Form Development**: Build full-featured item forms with validation
- [ ] **Watch Script**: Add a `watch:rpglitch` npm script if watch mode is desired

#### Low Priority

- [ ] **Card Interaction System**: Implement interactive card system for items/characters
- [ ] **Performance Optimization**: Optimize for Perchance single-file constraints
- [ ] **Accessibility Audit**: Comprehensive accessibility review and improvements

### Recently Completed (Max 10)

- [x] **Folder Reorganization**: Restructured into html/, js/, scss/ technology-specific folders
- [x] **Build Script Update**: Updated build process for new folder structure
- [x] **README Migration**: Moved shared standards to parent apps/ folder

---

<a id="appsrpglitchhtmlreadmemd"></a>
## apps\rpglitch\html\README.md

## HTML Files

### Development Rules (AI Instructions)

#### Referenced Rules from `/rules/`

- **[html-development.md](../../../rules/html-development.md)** - Semantic HTML, accessibility, and Perchance-specific markup
- **[html-hyperscript-usage.md](../../../rules/html-hyperscript-usage.md)** - Hyperscript for easy, readable interactivity using _ attribute

### Current Tasks (RPGlitch HTML-Specific)

#### High Priority

- [ ] **Semantic Structure Review**: Audit current HTML structure for proper semantic elements
- [ ] **Accessibility Compliance**: Ensure all interactive elements meet WCAG AA standards
- [ ] **Form Validation Enhancement**: Improve character creation form with proper labels and validation

#### Medium Priority

- [ ] **Hyperscript Integration**: Add interactive elements using Hyperscript _ attribute
- [ ] **ARIA Labels Audit**: Review and enhance ARIA labels for screen readers
- [ ] **Tab Order Optimization**: Ensure logical tab order throughout the application

#### Low Priority

- [ ] **HTML5 Validation**: Run HTML5 validator and fix any issues
- [ ] **Meta Tags Enhancement**: Optimize meta tags for better SEO and social sharing

### Recently Completed (Max 10)

- [x] **Initial HTML Structure**: Created basic semantic HTML structure for RPGlitch
- [x] **Form Elements Setup**: Added proper form elements with labels for character creation

---

<a id="appsrpglitchjsreadmemd"></a>
## apps\rpglitch\js\README.md

## JavaScript Files

### Development Rules (AI Instructions)

#### Referenced Rules from `rules/`

- **[js-development.md](../../../rules/js-development.md)** - Modern vanilla JavaScript development index and quick reference
- **[js-cash-dom-usage.md](../../../rules/js-cash-dom-usage.md)** - Cash DOM for concise, readable JavaScript in Perchance projects
- **[js-dexie-usage.md](../../../rules/js-dexie-usage.md)** - Dexie.js for IndexedDB management in Perchance projects
- **[js-dom-manipulation.md](../../../rules/js-dom-manipulation.md)** - Modern DOM APIs and manipulation patterns for vanilla JavaScript
- **[js-ecosystem-overview.md](../../../rules/js-ecosystem-overview.md)** - Unified JavaScript ecosystem decision framework
- **[js-indexeddb-principles.md](../../../rules/js-indexeddb-principles.md)** - IndexedDB principles and best practices for Perchance applications
- **[js-modern-apis.md](../../../rules/js-modern-apis.md)** - Modern browser APIs including Fetch API, Intersection Observer, and contemporary web APIs
- **[js-modern-features.md](../../../rules/js-modern-features.md)** - Modern JavaScript features (ES2023+) including template literals and destructuring
- **[js-patterns-practices.md](../../../rules/js-patterns-practices.md)** - JavaScript patterns, performance optimization, and debugging best practices
- **[js-storage-strategy.md](../../../rules/js-storage-strategy.md)** - Unified client-side storage strategy covering localStorage, IndexedDB, and Dexie.js

### Current Tasks (RPGlitch JavaScript-Specific)

#### High Priority

- [ ] **Code Modularization**: Break down monolithic JavaScript into focused modules
- [ ] **Character Storage System**: Implement Dexie.js for character data persistence
- [ ] **Story Management**: Create story/campaign management functionality with IndexedDB
- [ ] **Data Validation**: Add comprehensive input validation for character creation

#### Medium Priority

- [ ] **API Integration**: Implement fetch API for external data sources
- [ ] **Performance Optimization**: Optimize JavaScript performance using modern patterns
- [ ] **Error Handling Enhancement**: Improve error handling throughout the application
- [ ] **Cash DOM Migration**: Migrate DOM manipulation to use Cash DOM library

#### Low Priority

- [ ] **Modern Features Adoption**: Implement more ES2023+ features where beneficial
- [ ] **Code Documentation**: Add comprehensive JSDoc comments
- [ ] **Unit Testing Setup**: Implement JavaScript unit testing framework
- [ ] **Bundle Optimization**: Optimize JavaScript bundle size for Perchance

### Recently Completed (Max 10)

- [x] **Initial JavaScript Structure**: Created basic JavaScript structure for RPGlitch
- [x] **Character Creation Logic**: Implemented basic character creation functionality
- [x] **Local Storage Setup**: Added localStorage for basic data persistence

---

<a id="appsrpglitchscssreadmemd"></a>
## apps\rpglitch\scss\README.md

## SCSS Files

### Development Rules (AI Instructions)

#### Referenced Rules from `rules/`

- **[scss-advanced-patterns.md](../../../rules/scss-advanced-patterns.md)** - Advanced SCSS patterns and modern features including color spaces and module system
- **[scss-debugging.md](../../../rules/scss-debugging.md)** - Comprehensive SCSS debugging and troubleshooting guide
- **[scss-modern-css-frameworks.md](../../../rules/scss-modern-css-frameworks.md)** - Modern CSS principles and Pico.css framework integration

### Current Tasks (RPGlitch SCSS-Specific)

#### High Priority

- [ ] **Responsive Design Implementation**: Ensure all components work across all device sizes
- [ ] **Color Scheme Enhancement**: Implement consistent color palette with CSS custom properties
- [ ] **Component Styling**: Style character creation and management components
- [ ] **Pico.css Integration**: Properly integrate and customize Pico.css framework

#### Medium Priority

- [ ] **SCSS Modularization**: Organize SCSS into logical modules and partials
- [ ] **Accessibility Styling**: Ensure all styling meets WCAG AA contrast requirements
- [ ] **Performance Optimization**: Optimize CSS output size and loading performance
- [ ] **Dark Mode Support**: Implement dark/light theme switching capability

#### Low Priority

- [ ] **Advanced SCSS Features**: Implement advanced SCSS patterns where beneficial
- [ ] **CSS Grid Layout**: Enhance layout system using modern CSS Grid
- [ ] **Animation System**: Create consistent animation and transition system
- [ ] **Print Styles**: Add print-friendly styling for character sheets

### Recently Completed (Max 10)

- [x] **Initial SCSS Structure**: Created basic SCSS structure for RPGlitch
- [x] **Basic Responsive Layout**: Implemented basic responsive grid system
- [x] **Form Styling**: Added consistent styling for character creation forms

---

<a id="buildreadmemd"></a>
## build\README.md

## Build System

### Overview

This directory contains build scripts and output for RPGlitch.

### Structure

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

### Scripts

#### `build-perchance.js`

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

#### `build-and-copy.js`

Builds RPGlitch and automatically copies the result to the clipboard for easy pasting into Perchance.

**Usage:**

```bash
## From build/scripts directory
node build-and-copy.js

## From project root
npm run build:copy
```

### Output

The build process creates:

- `../output/RPGlitch-perchance.html` - Fully minified HTML for Perchance
- `../output/archive/RPGlitch-perchance.css` - Compiled CSS (archived)
- `../output/archive/RPGlitch-perchance.css.map` - CSS source map (archived)

### Dependencies

The build process automatically downloads and inlines:

- **Hyperscript** (0.9.12) - For HTML interactivity
- **Cash DOM** (8.1.5) - jQuery-like DOM manipulation
- **Dexie.js** (4.0.8) - IndexedDB wrapper
- **DOMPurify** (3.0.1) - XSS protection

### Source Files

The build combines:

- `apps/rpglitch/RPGlitch.html` - Main HTML structure
- `apps/rpglitch/RPGlitch.scss` - Main stylesheet (compiled to CSS)
- `apps/rpglitch/ProfilePictureComponent.js` - Profile picture logic
- `apps/rpglitch/RPGlitch.js` - Main JavaScript logic

### Notes

- The build process runs from the `build/scripts` directory
- All paths are relative to the project root
- The output file is optimized for Perchance deployment
- External dependencies are inlined for reliability

---

<a id="docsreadmemd"></a>
## docs\README.md

## Documentation Overview

This directory centralizes project documentation. Key sections:

- **protocols/** – agent and operational guides (e.g. `gemini-protocol.md`, `agent-guide.md`)
- **build/** – build scripts and system notes
- **apps/** – application overviews
- **tools/** – development utilities
- **memory-bank/** – persistent knowledge base (remains outside this folder)

Refer to the root [README.md](../README.md) for a broader introduction.

---
