---
description: The "Clean Room" Protocol. Sterilizes the codebase, ensuring hygiene, linting, and build integrity.
---

# 07-hygiene (The Clean Room)

> **Goal:** Ensure the codebase is chemically pure before any merge or deployment.

## 1. Triggers

- **Pre-Commit**: Before `04-checkpoint`.
- **Pre-Review**: Before `05-review`.
- **Pre-Deploy**: Before `/ship`.
- **Slash Command**: `/07-hygiene`

## 2. Brain (Context Injection)

- **Lint Specs**: `.eslintrc`, `.stylelintrc` (or equivalent).
- **Format Specs**: `.prettierrc`.

## 3. Capabilities

- **Warden**: Sterilization, Validation.

## 4. Procedures

### Phase 1: Sterilization (Warden)

1.  **Orphans**: Remove dead files and empty directories (except `src/data/` or persistence layers).
2.  **Artifacts**: Clear `dist/`, `.cache/`, or `node_modules/.cache`.
3.  **Deps**: Refresh `node_modules` if behavior is erratic (`npm ci`).

### Phase 2: Validation (Warden)

1.  **Hygiene Scan**:
    - **Check**: Zero `console.log`, `alert`, or `debugger` statements in production code.
    - **Check**: No `TODO` or `FIXME` comments without tracking tickets.
2.  **Linting**:
    - **Command**: `npm run lint:fix` (if available) or `npm run lint`.
    - **Check**: Zero warnings. If auto-fix fails, manual intervention is required.
3.  **Build**:
    - **Command**: `npm run build`.
    - **Check**: Build completes without error. Size constraints met.

### Phase 3: The Seal

- **Success**: Codebase is considered "Sterile". Proceed to Checkpoint.
- **Failure**: Trigger `03-bug-fix` or `06-revert`. Do not push.

## 5. Anti-Patterns

- **Ignoring Warnings**: "It's just a linter warning".
- **Broken Build**: Pushing code that doesn't build.
- **Leaving Logs**: `console.log("here")` in production.

## 6. Tools

- `run_command` (npm run lint/build)
- `grep_search` (find console.log)
