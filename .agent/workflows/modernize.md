---
description: Safe refactoring pipeline. Analyzes legacy code, creates a test safety net, plans the upgrade, and executes with strict verification.
---

# 🛠️ Legacy Modernization Protocol

This workflow orchestrates the safe refactoring of legacy code into the modern JooduG stack.

## 1. The Strategy Phase (Planning Mode)

Before writing code, we must understand the debt.

1. **Analyze Violations:**
   - Scan the target file against `.agent/rules/tech-stack.md` and `.agent/rules/security.md`.
   - _Look for:_ `var`, `innerHTML` (unsanitized), `require()`, `localStorage`, direct DOM manipulation (without ID checks).
2. **Generate Plan:**
   - Create an **Implementation Plan** artifact.
   - _Detail:_ explicitly list what will be replaced (e.g., "Replace `localStorage` with `db.settings.put`").

## 2. The Safety Net (Test First)

We do not refactor without a harness.

1. **Check Coverage:**
   - Look for existing tests in `tests/` that cover this file.
2. **Create Harness:**
   - If no tests exist, generate a `tests/<filename>.test.js` file.
   - _Goal:_ Capture the _current_ behavior (even if buggy) to ensure we don't break functionality during the port.
   - _Mocking:_ Ensure `Dexie` is mocked via `fake-indexeddb` and `DOMPurify` is mocked.
3. **Establish Baseline:**
   - Command:
     // turbo
     `npm test tests/<filename>.test.js`
   - _Constraint:_ Tests must pass (or be known failures) before moving to Phase 3.

## 3. The Execution Phase (Refactor)

1. **Apply Changes:**
   - Execute the Implementation Plan.
   - _Constraint:_ Apply changes iteratively (Data layer first, then Logic, then UI).
2. **Integrity Check:**
   - After every significant edit, run `ide.getDiagnostics`.
   - _Goal:_ Catch syntax errors immediately.

## 4. Verification & Cleanup

1. **Verify Parity:**
   - Command:
     // turbo
     `npm test tests/<filename>.test.js`
   - _Constraint:_ If tests fail, analyze the diff. Do not ask the user to fix it; fix it yourself.
2. **Final Polish:**
   - Command:
     // turbo
     `npm run lint:fix`
   - _Goal:_ Ensure the new code matches Prettier/ESLint standards.
