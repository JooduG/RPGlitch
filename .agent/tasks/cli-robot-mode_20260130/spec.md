# Specification: CLI Robot Mode (JSON Output)

## 1. Overview
Enable "Robot Mode" for core internal CLI scripts (`gamemaster.js`, `explorer.js`, `warden.js`). By adding a `--json` flag, these tools will output structured, machine-readable data to `stdout` instead of human-readable text.

## 2. Functional Requirements
*   **Global Flag**: All target scripts must accept a `--json` argument.
*   **Target Scripts**:
    *   `src/gamemaster/scripts/gamemaster.js` (Status, Hygiene)
    *   `src/scholar/scripts/explorer.js` (Search, Ingest)
    *   `src/warden/scripts/warden.js` (Audit)
*   **Output Standard**: Structured JSON to `stdout`, logs to `stderr`.

## 3. Acceptance Criteria
*   [x] `node .../gamemaster.js status --json` returns valid JSON.
*   [x] `node .../explorer.js search "query" --json` returns valid JSON.
*   [x] `node .../warden.js audit --json` returns valid JSON.
