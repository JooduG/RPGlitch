# Plan: Source Architecture Reorganization

> **Track:** `src-architecture-reorg`  
> **Strategy:** Incremental (one pillar per session)

## Migration Order

We migrate in dependency order to minimize breakage:

1. **Phase 1: Foundation** — Create new directories, update Vite aliases
2. **Phase 2: Warden → `core/`** — Pure logic, no UI deps
3. **Phase 3: Scholar → `core/` + `data/`** — Split prompts/persistence, move UI to `ui/`
4. **Phase 4: Gamemaster → `core/` + `state/`** — Session/LLM logic, move state files
5. **Phase 5: Mesmer → `theme/` + `ui/`** — Split services from UI
6. **Phase 6: Artificer → `ui/`** — Reorganize into Atomic Design
7. **Phase 7: Cleanup** — Delete empty folders, verify build

---

## Phase 1: Foundation

- [x] Create `src/core/`, `src/data/`, `src/state/`, `src/theme/`
- [x] Create `src/ui/atoms/`, `ui/molecules/`, `ui/organisms/`, `ui/views/`, `ui/layouts/`, `ui/actions/`
- [x] Update `vite.config.js` with aliases
- [x] **Quality Gate:** `npm run dev` starts without errors

## Phase 2: Warden → `core/`

- [x] Move `warden/logic/physics.js` → `core/physics/physics.js`
- [x] Move `warden/logic/parser.js` → `core/physics/parser.js`
- [x] Move `warden/index.js` → `core/physics/index.js` (Security facade)
- [x] Move `warden/bridge.js` → `data/bridge.js`
- [x] Move `warden/ui/*.svelte` → `ui/molecules/` or `ui/organisms/`
- [x] Update all imports referencing moved files
- [x] **Quality Gate:** `npm run build` passes

## Phase 3: Scholar → `core/` + `data/`

- [x] Move `scholar/library/context.js` → `core/prompts/context.js`
- [x] Move `scholar/library/echo.js` → `core/prompts/echo.js`
- [x] Move `scholar/library/prose.js` → `core/prompts/prose.js`
- [x] Move `scholar/config.js` → `core/prompts/templates/scholar.json`
- [x] Move `scholar/database/` → `data/database/`
- [x] Move `scholar/library/library.js` → `data/library/library.js`
- [x] Move `scholar/library/*.json` → `data/library/`
- [x] Move `scholar/runtime.svelte.js` → `state/runtime.svelte.js`
- [x] Move `scholar/*.svelte` → `ui/organisms/` or `ui/molecules/`
- [x] **Quality Gate:** `npm run build` passes

## Phase 4: Gamemaster → `core/` + `state/`

- [x] Move `gamemaster/llm.js` → `core/llm/index.js`
- [x] Move `gamemaster/session.js` → `core/session/session.js`
- [x] Move `gamemaster/chrono.svelte.js` → `core/session/chrono.js`
- [x] Move `gamemaster/bus.js` → `core/session/bus.js`
- [x] Move `gamemaster/config.js` → `core/llm/config.js`
- [x] Move `gamemaster/bootstrap.js` → `core/bootstrap.js`
- [x] Move `gamemaster/state.svelte.js` → `state/app.svelte.js`
- [x] Move `gamemaster/session.svelte.js` → `state/session.svelte.js`
- [x] Move `gamemaster/status.svelte.js` → `state/status.svelte.js`
- [x] **Quality Gate:** `npm run build` passes

## Phase 5: Mesmer → `theme/` + `ui/`

- [x] Move `mesmer/audio/` → `theme/audio/`
- [x] Move `mesmer/logic/` → `theme/visuals/`
- [x] Move `mesmer/scss/` → `theme/scss/`
- [x] Move `mesmer/index.js` → `theme/index.js`
- [x] Move `mesmer/ui/*.svelte` → `ui/atoms/` or `ui/organisms/`
- [x] **Quality Gate:** `npm run build` passes

## Phase 6: Artificer → `ui/`

- [x] Move `artificer/Button.svelte` → `ui/atoms/Button.svelte`
- [x] Move `artificer/Toggle.svelte` → `ui/atoms/Toggle.svelte`
- [x] Move `artificer/Tooltip.svelte` → `ui/atoms/Tooltip.svelte`
- [x] Move `artificer/Backdrop.svelte` → `ui/molecules/Backdrop.svelte`
- [x] Move `artificer/Modal.svelte` → `ui/molecules/Modal.svelte`
- [x] Move `artificer/Panel.svelte` → `ui/molecules/Panel.svelte`
- [x] Move `artificer/Layout.svelte` → `ui/templates/Layout.svelte`
- [x] Move `artificer/storyboard/` → `ui/organisms/storyboard/`
- [x] Move `artificer/storymode/` → `ui/organisms/storymode/`
- [x] Move `artificer/hud/` → `ui/organisms/hud/`
- [x] Move `artificer/actions/` → `ui/utils/actions/`
- [x] **Quality Gate:** `npm run build` passes

## Phase 7: Cleanup & Orphan Management

- [x] Delete empty pillar directories (`warden/`, `scholar/`, `gamemaster/`, `mesmer/`, `artificer/`)
- [x] Move orphaned `authors.json` to `.agent/knowledge/incubator/` (Confirmed unused)
- [x] Update `App.svelte` imports
- [x] Update `main.js` import
- [x] Final verification: `npm run build && npm run dev`
- [x] **Quality Gate:** Full app functional test

---

## Notes

- **Orphaned Data:** `authors.json` (54KB) is not imported anywhere — safe to delete
- **Used Data:** `tarot.json` is imported in physics.js for arcana prompts
