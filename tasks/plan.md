# 📝 Plan: Chess Grid & Grid Overlay

Refactor the UI grid system to use a standardized 12-column Chess Grid (a-l, 1-12) and introduce a non-clickable visual overlay for debugging and visualization.

## 🎯 Objective

- Standardize grid nomenclature to Chess notation (a-l, 1-12).
- Fix layout centering issues on ultrawide displays.
- Provide a visual debug overlay for grid alignment.

## 🏗️ Structural Changes

- **Theme**: Update `engine.css` with lowercase grid tokens.
- **State**: Add `dev_grid_visible` to `settings`.
- **UI**:
  - `Layout.svelte`: Standardize grid lines and fix centering.
  - `GridOverlay.svelte`: Visual representation of the grid.
  - `ControlPanel.svelte`: Add toggle for the overlay.

## 📐 Coordinate Usage (e.g., B2)

- To place an element in "B2":
  - `grid-column: col-b / col-c;`
  - `grid-row: row-2 / row-3;`
- This covers the cell between line B and C, and row 2 and 3.

## ✅ Acceptance Criteria

- [x] Grid overlay toggles correctly.
- [x] Grid lines align perfectly with layout columns/rows.
- [x] Layout is centered on wide screens.
- [x] No raw `px`, `rem`, or `#` values used.
- [x] Svelte 5 Runes used for state.

## 📅 Task List

- [x] Step 1: Update `engine.css` tokens.
- [x] Step 2: Add `dev_grid_visible` to state.
- [x] Step 3: Create `GridOverlay.svelte`.
- [x] Step 4: Add toggle to `ControlPanel.svelte`.
- [x] Step 5: Refactor `Layout.svelte` (Centering & Lines).
- [x] Step 6: Verify and Cleanup.

## 🧠 Skill Log

| Timestamp (ISO 8601) | Task                      | Skill Invoked                    | Outcome     |
| -------------------- | ------------------------- | -------------------------------- | ----------- |
| 2026-05-12T10:45:00Z | Chess Grid Implementation | svelte, designer, user-interface | ✅ Resolved |
