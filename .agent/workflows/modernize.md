---
description: Safe refactoring pipeline. Upgrades legacy logic to Svelte 5 Runes and enforces architectural standards.
---

# 🛠️ Modernization Protocol

> **Goal:** Upgrade legacy code to the **Runes Standard** without breaking functionality.

## Phase 1: Analysis

1. **Scan for Debt:**
   - Look for: `let x;` (Legacy State), `$:` (Legacy Reactive), `var`, `require()`.
2. **Draft Plan:**
   - Create a checklist: "Convert `count` to `$state`", "Convert `$: double` to `$derived`".

## Phase 2: The Safety Net

1. **Snapshot Behavior:**
   - If no tests exist, write a basic test to capture current inputs/outputs.

   ```bash
   // turbo
   npm test tests/<target>.test.js
   ```

## Phase 3: The Upgrade

1. **Refactor:**
   - Apply **Runes** syntax strictly.
   - Move complex logic to `.svelte.js` files.
2. **Verify:**

   ```bash
   // turbo
   npm run lint:fix
   // turbo
   npm test
   ```

3. **Final Polish:**
   - Ensure code matches `style.md` (Pico classes, no Tailwind).
