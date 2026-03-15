# Technology Stack

## Core Language and Framework

- **Language:** JavaScript (ESNext)
- **Frontend:** Svelte 5 (Runes-only: `$state`, `$derived`, `$effect`)
- **Build Tool:** Vite (with `vite-plugin-singlefile` for Perchance)

## Persistence and Data

- **Database:** Dexie.js (IndexedDB)
- **State Management:** Svelte 5 reactive stores and global application state.

## Styling and Layout

- **Style Regime:** Vanilla CSS with "Chalk Regime" design tokens (`src/theme/tokens.css`).
- **Preprocessors:** Svelte-preprocess, SCSS, PostCSS.

## Testing and Quality Assurance

- **Unit/Integration:** Vitest.
- **End-to-End:** Playwright.
- **Linting:** ESLint, Stylelint, HTMLHint.
- **Automation:** Project-specific "agent skills" in `.agent/`.

## Deployment and Platform

- **Platform:** Perchance (Self-contained single `index.html` bundle).
