# Mission Command (TODO)

## 🎯 Current Objectives

- [x] Implement Chess Grid nomenclature (a-l, 1-12) <!-- id: 16 -->
- [x] Fix Layout centering on wide viewports <!-- id: 17 -->
- [x] Create Grid Debug Overlay <!-- id: 18 -->
- [x] Add Grid Toggle to Control Panel <!-- id: 19 -->

## 🧠 Skill Log

| Timestamp (ISO 8601) | Task                 | Skill Invoked        | Outcome     |
| -------------------- | -------------------- | -------------------- | ----------- |
| 2026-05-12T10:45:00Z | Chess Grid & Overlay | `svelte`, `designer` | ✅ Resolved |

## 🛠️ Task Breakdown

- [x] **Task 16: Chess Grid Nomenclature**
  - [x] Update `engine.css` with `col-a` to `col-l`
  - [x] Update `Layout.svelte` with `[col-a]` to `[col-l]`
- [x] **Task 17: Layout Centering**
  - [x] Replace `inset: 0` with explicit `left: 0; right: 0;` and `margin: auto`
- [x] **Task 18: Grid Overlay**
  - [x] Create `GridOverlay.svelte`
  - [x] Align lines with `Layout.svelte` named lines
- [x] **Task 19: Control Panel Toggle**
  - [x] Add toggle for `dev_grid_visible`
