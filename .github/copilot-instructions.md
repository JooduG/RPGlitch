## Quick guide for AI coding agents working in this repository

These are concise, actionable rules to make an AI agent productive immediately.

1. Start with the repository's canonical playbook: the content in `GEMINI.md` (this repo's AGENTS spec). Follow the "Tactical Planner / Strategic Architect / Operational Coder" workflow for non-trivial tasks.

2. Important commands (use exact npm script names):

   - Install & sync: `npm ci` (or `npm install`) then `npm run sync`
   - Build apps: `npm run build` (runs `build:rpglitch` + `build:imageglitch`)
   - Lint: `npm run lint` (auto-fix: `npm run lint:fix`)
   - Test: `npm test` (uses Jest; see `jest.config.cjs` and `tests/setup-jest.js`)
   - Full deploy flow: `npm run deploy` (sync → lint:fix → build → test)

3. Project layout quick map (refer to these paths when making edits):

   - Shared code: `src/` (core modules in `src/main`, tests in `src/tests`)
   - User-facing apps: `apps/` (e.g. `apps/imageglitch`, `apps/rpglitch`)
   - Build & sync scripts: `build/` and `scripts/` (npm scripts call `build/scripts/*.js`)
   - Tests: `tests/` (global jest setup at `tests/setup-jest.js`)
   - Memory & protocols: `memory-bank/` and `rules/` (do not modify `memory-bank/past` or `memory-bank/archive` contents)

4. File edit permissions and write constraints (follow these):

   - Allowed write targets: `./apps/**`, `./build/scripts/**`, `./memory-bank/**`, `./docs/**`, `./tests/**`, `./tools/**`.
   - Do NOT write to: `./build/output/**`, `./.cursor/**`, `./node_modules/**`.

5. Testing & environment notes (examples you can rely on):

   - Tests run under `jsdom`; global test helpers are in `tests/setup-jest.js`. It mocks `localStorage`, `DOMPurify.sanitize`, and ensures open DB connections are closed in `afterAll`.
   - If you change dependencies, run the repository's security scan step (project expects codacy/trivy checks via internal MCP rules in `.github/instructions/codacy.instructions.md`). Notify the user if the environment lacks Codacy tooling.

6. Patterns and conventions to follow (concrete, repo-specific):

   - Use npm scripts (do not invent new top-level commands without adding them to `package.json` under `scripts`). Examples: `npm run sync`, `npm run build:imageglitch`.
   - Derived configs must be produced by sync scripts. Edit master configs under `build/config/` and then run the appropriate `npm run sync:*` script (e.g., `npm run sync:configs`).
   - Sanitize dynamic HTML using `DOMPurify.sanitize()` where applicable (this repo explicitly requires this in AGENTS guidance).
   - Commit message format: `<scope>: <summary>` (e.g., `rpglitch: add storyboard title sync`). Branch naming: `{agent}/{scope}/{short-task}`.

7. When making edits:

   - Small/one-line fixes: perform the edit, run `npm run lint:fix` & `npm test`, and include a short `memory-bank/present` handoff file describing the change.
   - Larger or architectural tasks: produce a short TODO blueprint (3–8 steps) in the PR description and create a Handoff document in `memory-bank/present/` following the repository's handoff template (see `GEMINI.md`).

8. Examples to reference in code suggestions:

   - Jest setup: `tests/setup-jest.js` — use the same mocks and teardown pattern for tests that interact with IndexedDB or global `App.db`.
   - Build invocations: `package.json` scripts `build:imageglitch` & `build:rpglitch` (the `build` script chains them).

9. Safety and security

   - Never add secrets to the repo. Use `.env` (local) and `dotenv`-based npm scripts for runtime environment needs.
   - Prefer vendoring libs into `build/local_libs/` rather than making external runtime network calls.

10. Ask for clarification when blocked

- If a required file or script referenced by an npm script is missing, stop and ask the user (do not assume how to recreate it).
- If Codacy MCP tooling is required by policy (see `.github/instructions/codacy.instructions.md`) but not available, ask whether to install or skip.

If anything here is unclear or you'd like more examples (PR template, a sample handoff markdown), tell me which part to expand and I'll iterate.
