---
description: The "Clean Room" Protocol. Sterilizes the codebase, ensuring hygiene, linting, and build integrity.
skill: warden
constraints:
    - "MUST adopt the Warden Persona."
context:
    - "Run clean workflow"
    - "Fix lint errors"
    - "Verify build"
---

# 🧹 Clean Protocol (Codebase Sterilization)

> **Goal:** Ensure the codebase is chemically pure before any merge or deployment.

## 1. Sterilization

1.  **Orphans**: Remove dead files and empty directories (except `src/data/`).
2.  **Artifacts**: Clear `dist/` and `.cache/` folders.
3.  **Deps**: Refresh `node_modules` if behavior is erratic (`npm ci`).

## 2. Validation (The Gauntlet)

1.  **Hygiene Scan**:
    - **Command**: `node .agent/skills/warden/scripts/warden.js hygiene`
    - **Check**: Zero `console.log`, `alert`, or `debugger` statements in production code.
2.  **Linting**:
    - **Command**: `npm run lint:fix`
    - **Check**: Zero warnings. If auto-fix fails, manual intervention is required.
3.  **Build**:
    - **Command**: `npm run build`
    - **Check**: Build completes without error.

## 3. The Seal

- **Success**: Codebase is considered "Sterile".
- **Failure**: Trigger **[09-nope.md](./09-nope.md)**. Do not push.
