# 📝 Plan: Control Panel Redesign (Kinetic Grid)

> **Goal:** implement the "Kinetic Bento Grid" control panel with a semi-flat "System Wing" aesthetic.

## 1. Foundation (The Grid)

- [ ] **Component:** `KineticGrid.svelte`
    - **Logic:** CSS Grid with `subgrid` support (or fallback).
    - **State:** Manage `isSolid` (Global) vs `isFluid` (Contextual) zones.
    - **Styling:** "Chalk Regime" - `#222326` background, no borders, deep shadows (`box-shadow` instead of border).

## 2. Atoms (The Cells)

- [ ] **Component:** `ToggleCell.svelte` (Solid)
    - **Purpose:** Boolean toggles (Audio, DevMode).
    - **Visuals:** Matte background, "LED" indicator (active state).
    - **Interaction:** Instant click.
- [ ] **Component:** `ActionCell.svelte` (Fluid)
    - **Purpose:** Contextual triggers (Reroll, Focus).
    - **Visuals:** Icon-heavy, slight hover lift.
    - **Transients:** Support for "sliding" content (e.g., Narrative Speed slider).

## 3. Integration (The Panel)

- [ ] **Refactor:** `ControlPanel.svelte`
    - **Action:** Replace existing list-based layout with `KineticGrid`.
    - **Hook:** Connect `Gamemaster` state to `ActionCell` triggers.
    - **Aesthetic:** Ensure semi-flat match with `VisualWing` / `DevWing`.

## 4. Quality Gate

- [ ] **Verification:**
    - [ ] **Visual:** Confirm NO borders on panel or cells.
    - [ ] **Functional:** Audio toggle actually mutes/unmutes.
    - [ ] **Context:** "Reroll" only appears in Story Mode.
    - [ ] **Mobile:** Grid collapses to 1 column or scales appropriately.
