# Repository Guidelines

## Project Structure & Module Organization

- apps/: application source. Key app: `apps/rpglitch/` with `html/` and `js/`.
- build/scripts/: build, sync, and tooling scripts. Output goes to `build/output/`.
- tests/: Jest + jsdom tests.
- docs/: project documentation (this file).
- memory-bank/: live context and plans (`present/`, `forever/`, `past/`).

## Build, Test, and Development Commands

- `npm run build`: Builds RPGlitch into a single inlined HTML.
- `npm run deploy`: Syncs, runs tests, lints (fix), builds, and copies artifacts.
- `npm run deploy:loose`: Same as deploy but continues on non‑critical failures.
- `npm run sync`: Sync shared libs/configs/docs.
- `npm run lint` / `npm run lint:fix`: Lint JS, CSS, Markdown (auto‑fix where possible).
- `npm test`: Run Jest test suite (jsdom environment).
- `npm run validate`: Sanity‑check that `build/output/RPGlitch.html` exists and is non‑empty.

## Coding Style & Naming Conventions

- JavaScript: ES2022+, 2‑space indentation, `camelCase` for functions, `App.*` for global app APIs.
- CSS/SCSS: `kebab-case` classes, optional BEM modifier (`.block--modifier`).
- Linting: ESLint (`build/config/eslint.config.mjs`) and Stylelint (`build/config/stylelint.config.js`). Keep diffs small and deterministic.
- HTML safety: Sanitize any dynamic HTML via `DOMPurify.sanitize()`.

## Testing Guidelines

- Framework: Jest with jsdom.
- Configs: `build/config/jest.config.js`, `build/config/babel.config.js`.
- Location: `tests/`. Prefer pure functions; for DOM code, use jsdom queries and events.
- Naming: `<feature>.test.js`. Run with `npm test` locally and in CI.

## Commit & Pull Request Guidelines

- Commits: `<scope>: <summary>` (present tense). Example: `rpglitch: add storyboard title sync`.
- Branches: Agents use `codex/{date}-{time}-{feature}`; humans use `{scope}/{short-task}`.
- PRs: Small and focused. Title `[rpglitch] <summary>`. Include what/why, validation steps, screenshots for UI, and linked issues.

## Security & Configuration Tips

- Never commit secrets. Use local `.env` for dev.
- Avoid external network calls in app code; prefer vendoring to `build/local_libs/`.
- Fetch time via Time MCP; default timezone `Europe/Stockholm`.
- Don’t hand‑edit generated outputs (`build/output/`). Avoid writing to `node_modules/`.
