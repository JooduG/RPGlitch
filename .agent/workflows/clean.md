---
description: Aggressive cleanup protocol. Runs linters and tests in a fix-loop until the codebase is green.
---

# 🧹 Deep Clean Protocol

1. **Auto-Fix (Turbo):**
   - Run the standard fixers without asking:

     ```bash
     // turbo
     npm run lint:fix
     // turbo
     npm run format
     ```

2. **Test & Report:**
   - Run the test suite:

     ```bash
     // turbo
     npm test
     ```

   - **Condition:** If tests fail, fix the specific error and GOTO Step 1.
   - **Condition:** If tests pass, stop.

3. **Verify Hygiene:**
   - Check `tools/ops/hygiene.js` (if applicable) to ensure no `console.log` left behind.
