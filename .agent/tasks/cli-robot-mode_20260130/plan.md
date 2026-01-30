# Plan: CLI Robot Mode (JSON Output)

> **Goal:** Upgrade core CLIs to speak fluent JSON.

## Phase 1: Gamemaster (The Executive)
- [x] **Task: Update `gamemaster.js`**
- [x] **Verify**: Run `node .../gamemaster.js status --json` and check output.

## Phase 2: Scholar (The Librarian)
- [x] **Task: Update `explorer.js`**
- [x] **Verify**: Run a search and check JSON structure.

## Phase 3: Warden (The Shield)
- [x] **Task: Update `warden.js`**
- [x] **Verify**: Run an audit and check JSON structure.

## Phase 4: Integration
- [x] **Task: Final Polish**
    - [x] Update workflows in `.agent/workflows/` to reference JSON mode.
    - [x] Add shorthand scripts to `package.json`.
