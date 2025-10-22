## Quick guide for AI coding agents working in this repository

These are concise, actionable rules to make an AI agent productive immediately.

1.  **Start with `AGENTS.md`**: This is the repository's canonical playbook. Follow its guidelines for all tasks.

2.  **Core Commands**:
    *   Install & Sync: `npm ci` then `npm run sync`
    *   Build Apps: `npm run build`
    *   Lint: `npm run lint` (or `npm run lint:fix`)
    *   Test: `npm test`
    *   Full Deploy Flow: `npm run deploy`

3.  **Project Layout**:
    *   Apps: `apps/`
    *   Shared Code: `src/`
    *   Build Scripts: `build/scripts/`
    *   Tests: `tests/`
    *   Memory Bank: `memory-bank/`

4.  **File Permissions**:
    *   **Allowed**: `apps/`, `build/scripts/`, `memory-bank/`, `docs/`, `tests/`, `tools/`
    *   **Forbidden**: `build/output/`, `.cursor/`, `node_modules/`

5.  **Testing**:
    *   Tests run in a `jsdom` environment.
    *   Global test helpers are in `tests/setup-jest.js`.
    *   For dependency changes, be aware of security scans mentioned in `AGENTS.md`.

6.  **Conventions**:
    *   Always use the `npm` scripts defined in `package.json`.
    *   Sanitize all dynamic HTML with `DOMPurify.sanitize()`.
    *   Commit message format: `<scope>: <summary>`.

7.  **When Blocked**:
    *   If a required script or file is missing, ask the user for clarification.
    *   If required tooling is unavailable, ask the user how to proceed.

For more detailed instructions, always refer to `AGENTS.md`.
