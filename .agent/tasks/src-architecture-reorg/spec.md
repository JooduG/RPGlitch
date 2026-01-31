# Spec: Source Architecture Reorganization

> **Type:** Feature
> **Slug:** `src-architecture-reorg`

## Problem

The `src/` directory uses persona-based folder names (gamemaster, scholar, mesmer, warden, artificer) that conflate **what** with **who**. 15 UI components (~120KB) live outside the UI directory, violating Pure IO principles.

## Solution

Reorganize `src/` by **concern**, not persona:

- `core/` — Pure logic (LLM, physics, session)
- `data/` — Persistence (Dexie, seeds)
- `state/` — Reactive bridges (`$state`)
- `ui/` — All Svelte components (Atomic Design)
- `theme/` — Styling and audio services

## User Decisions (Confirmed)

| Question            | Choice                                                          |
| ------------------- | --------------------------------------------------------------- |
| Q1: Atomic Design   | **Option A** — Full hierarchy (atoms/molecules/organisms/views) |
| Q2: State Directory | **Option A** — Separate `state/` directory                      |
| Q3: Pillar Facades  | **Option A** — Replace persona names with concern names         |
| Q4: Migration       | **Option B** — Incremental (one pillar per session)             |

## Success Criteria

- [x] No UI components outside `ui/`
- [x] All prompt engineering in `core/prompts/`
- [x] Vite aliases updated
- [x] All imports updated and verified
- [x] Build passes (`npm run build`)
