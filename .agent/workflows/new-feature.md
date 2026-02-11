---
name: New Feature Flight Plan
description: End-to-end protocol for building a new UI feature.
---

# ✈️ New Feature Protocol

**Trigger:** User wants to build a new component or feature.

## Phase 1: Architecture (@Architect)

1.  **Analyze:** Read the user request.
2.  **Plan:** Define the `props`, `state` (Runes), and file structure.
3.  **Track:** Add an entry to `.agent/tasks/tracks.md`.
4.  **Handoff:** Explicitly state: "Plan approved. Handing off to Builder."

## Phase 2: Construction (@Builder)

1.  **Equip:** Load skills `tech-svelte` and `tech-scss`.
2.  **Scaffold:** Create the file(s).
3.  **Implement:** Write the code (Strict Svelte 5).
4.  **Style:** Apply SCSS variables.

## Phase 3: Verification (@Auditor)

1.  **Static Analysis:** Visually check the code for `export let` (Banned) or inline styles (Banned).
2.  **Test:** If applicable, write a simple unit test in `tests/`.
3.  **Verify:** Run `npm run verify` in the terminal.
4.  **Report:** Output a pass/fail report.
