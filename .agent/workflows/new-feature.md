---
name: New Feature Flight Plan
description: End-to-end protocol for building a new UI feature using the Meridian Architecture.
---

# ✈️ New Feature Protocol (Meridian Standard)

**Trigger:** User wants to build a new component or feature.

## Phase 1: Architecture & Planning

**Goal:** Define the structure before writing code.

1.  **Analyze:** Read the user request.
2.  **Plan:** Define the `props`, `state` (Runes), and file structure.
3.  **Track:** Add an entry to `.agent/tasks/tracks.md`.
4.  **Confirm:** Ask the user "Does this plan look correct?"

## Phase 2: The Skeleton (Logic Meridian)

**Goal:** Create a functional, unstyled logic backbone.
**Skill:** `.agent/skills/svelte/SKILL.md` (Skeleton Mode)

1.  **Execute:** Run the `svelte` protocol (Skeleton Intent).
2.  **Output:** Generate the `.svelte` file with:
    - TypeScript Interface (`Props`)
    - Runic State (`$state`, `$derived`)
    - Semantic HTML (`section`, `article`)
    - **ZERO CSS/SCSS.**

## Phase 3: The Tollgate (Audit Meridian)

**Goal:** Ensure the Skeleton is clean before Skinning.
**Skill:** `.agent/skills/audit-core/SKILL.md`

1.  **Execute:** Run the `audit-core` protocol.
2.  **Check:**
    - No `export let`? (Pass/Fail)
    - No `$:`? (Pass/Fail)
    - No `style="..."`? (Pass/Fail)
3.  **Decision:**
    - **FAIL:** Refactor immediately. Go back to Phase 2.
    - **PASS:** Proceed to Phase 4.

## Phase 4: The Skin (Presentation Meridian)

**Goal:** Apply the visual layer.
**Skill:** `.agent/skills/scss/SKILL.md`

1.  **Execute:** Run the `ui-skin` protocol.
2.  **Action:**
    - Add `class` attributes to the verified HTML.
    - Add `<style lang="scss">` block at the bottom.
    - Use `var(--tokens)` from the Chalk Regime.
3.  **Constraint:** DO NOT TOUCH THE `<script>` BLOCK.

## Phase 5: Verification

1.  **Verify:** Run `npm run verify` (if available) or `npm run check`.
2.  **Report:** Confirm the feature is built, styled, and audited.
