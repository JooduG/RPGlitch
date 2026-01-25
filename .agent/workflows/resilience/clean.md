---
description: Aggressive cleanup protocol. Runs linters, formatters, and tests in a fix-loop until the codebase is spotless.
---

# 🧹 Deep Clean Protocol

> **Goal:** Purge legacy code, zombie files, and enforce strict hygiene.
> **Constraint:** Zero Tolerance. No warnings allowed.

## 1. The Purge

1. **Target:** Identify the specific folders/files to delete.
2. **Execute:** Use `rm -rf` or file system deletion tools.
3. **Verify:** Check that the path returns 404/Missing.

## 2. The Sterilization (Hygiene & Lint)

After deleting files, you **MUST** run the full suite.

1. **Hygiene:** Run `npm run hygiene` (Executes `tools/ops/hygiene.js`).
   - **FAIL:** Any "Unused Export" or "Dead Import".
2. **Lint:** Run `npm run lint:fix`.
   - **FAIL:** Any ESLint warning or formatting error.
3. **Test:** Run `npm test`.
   - **FAIL:** Any broken unit test.

## 3. The Rebuild

1. **Sync:** Run `npm run sync` to regenerate auto-generated lists (e.g., Palette).
2. **Confirm:** "System Clean. Hygiene Passed. 0 Warnings."
