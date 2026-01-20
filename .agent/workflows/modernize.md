---
description: Safe refactoring pipeline. Upgrades legacy logic to Svelte 5 Runes and enforces architectural standards.
---

# ⚡ Modernization Workflow (Svelte 5)

> **Goal:** Upgrade a legacy component to the "Runes Standard".

## 1. Analysis

1. **Read:** Open the target file.
2. **Identify Legacy Patterns:**
   - `export let` -> **Needs `$props()`**.
   - `let variable;` (reactive) -> **Needs `$state()`**.
   - `$: value = ...` -> **Needs `$derived()`**.
   - `createEventDispatcher` -> **Needs Callback Props**.

## 2. Refactoring (The Transaction)

**Rule:** Do not migrate "halfway". The file must be 100% Runes or 0%.

1. **Imports:** Ensure `.svelte.js` stores are imported, NOT `writable` stores.
2. **Script:** Rewrite the `<script>` block using the **Runes Bible** (`.agent/skills/svelte/SKILL.md`).
3. **Template:** Update event listeners (`on:click` -> `onclick`).

## 3. Verification

1. **Lint:** Run `npm run lint`.
2. **Logic Check:** "Does this component still talk to the `Chrono` or `Mesmer` correctly?"
