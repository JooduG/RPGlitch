---
description: Aggressive cleanup protocol. Runs linters, formatters, and tests in a fix-loop until the codebase is spotless.
---

# 🧹 Deep Clean Protocol

> **Goal:** Ensure the codebase is syntactically perfect and test-green.

1. **Auto-Fix (The Scrub):**
   - Run standard fixers to catch low-hanging fruit.

   ```bash
   // turbo
   npm run lint:fix
   ```

2. **Test & Verify (The Audit):**
   - Run the full test suite.

   ```bash
   // turbo
   npm test
   ```

   - **Condition:**
     - 🔴 **FAIL:** Fix specific errors, then GOTO Step 1.
     - 🟢 **PASS:** Proceed to Step 3.

3. **Hygiene Check (The White Glove):**
   - Scan for "developer leftovers" like `console.log` or `debugger`.

   ```bash
   // turbo
   npm run hygiene
   ```

4. **Final Report:**
   - Output: "✨ Codebase is CLEAN and GREEN."
