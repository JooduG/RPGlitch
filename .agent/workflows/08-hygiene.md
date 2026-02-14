---
description: The "Clean Room" Protocol. Sterilizes the codebase, ensuring hygiene, linting, and build integrity.
---

# 08-hygiene (The Clean Room)

> **Goal:** Ensure the codebase is chemically pure before any merge or deployment.

## 1. Triggers

- **Pre-Checkpoint**: Before `05-checkpoint`.
- **Pre-Review**: Before `06-review`.
- **Pre-Deploy**: Before `07-deploy`.
- **Slash Command**: `/08-hygiene`

## 2. Brain (Context Injection)

- **Lint Specs**: `eslint.config.js`, `.stylelintrc`.
- **Format Specs**: `.prettierrc`.

## 3. Procedures

### Phase 1: Sterilization

1. **Orphans**: Remove dead files and empty directories (except `src/data/`).
2. **Artifacts**: Clear `dist/`, `.cache/`, or `node_modules/.cache`.
3. **Deps**: Refresh `node_modules` if behavior is erratic (`npm ci`).

### Phase 2: Validation

1. **Hygiene Scan**:
    - **Check**: Zero `console.log`, `alert`, or `debugger` in production code.
    - **Check**: No `TODO` or `FIXME` comments without tracking tickets.
2. **Linting**:
    - **Command**: `npm run lint:fix` (if available) or `npm run lint`.
    - **Check**: Zero warnings. Manual intervention if auto-fix fails.
3. **Build**:
    - **Command**: `npm run build`.
    - **Check**: Build completes without error. Size constraints met.

### Phase 3: The Seal

- **Success**: Codebase is "Sterile". Proceed to Checkpoint or Deploy.
- **Failure**: Trigger `04-bug-fix` or `10-revert`. Do not push.

## 4. Anti-Patterns

- **Ignoring Warnings**: "It's just a linter warning".
- **Broken Build**: Pushing code that doesn't build.
- **Leaving Logs**: `console.log("here")` in production.

## 5. Tools

- `run_command` (npm run lint/build)
- `grep_search` (find console.log)
