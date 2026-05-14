# RPGlitch Technical Infrastructure

## Core Tech Stack
- **Language**: TypeScript (Strongly Typed)
- **UI Framework**: Svelte 5 (Runes-based reactivity)
- **Styling**: Native SCSS
- **Bundler**: Vite 6

## Persistence & State
- **Primary Database (Local)**: IndexedDB via **Dexie.js**
- **Persistence Pattern**: Local-First architecture. UI binds to Dexie observables.
- **Remote Archive (Cloud)**: **Supabase (PostgreSQL)** for historical logs and cold storage.

## Security
- **XSS Prevention**: **DOMPurify** for sanitizing all user and AI-generated content.
- **Architecture**: Zero-Trust model between narrative engine and UI.

## Quality & Testing
- **Unit Testing**: Vitest
- **E2E/Browser Testing**: Playwright
- **Linting**: ESLint, Prettier, Stylelint, Markdownlint
