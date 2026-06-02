# Track: view-transition-guard-2026-06-02

**Objective**: Eliminate all `InvalidStateError: Transition was aborted because of invalid state` errors by introducing a centralized `guardedTransition()` singleton that serializes all `document.startViewTransition()` calls across the application.

**Priority**: P0  
**Status**: ✅ Done  
**Risk**: Medium (Level 2)

---

## FUTURE (Task Plan)

- [x] **Task 1** — Write failing unit tests for `transition-guard.js` (RED phase)
- [x] **Task 2** — Create `src/engine/transition-guard.js` (GREEN phase)
- [x] **Task 3** — Export `guardedTransition` from `src/engine/index.js`
- [x] **Task 4** — Migrate `EntityCard.svelte` — replace raw `startViewTransition` + fix `removeProperty` sweep
- [x] **Task 5** — Migrate `app.svelte.js` `set_view()` — replace raw `startViewTransition`
- [x] **Task 6** — Migrate `Modal.svelte` `$effect` — replace raw `startViewTransition`
- [x] **Task 7** — Run full test suite `npx vitest run` and confirm 388+ tests green
- [x] **Task 8** — Run `npm run verify` full pipeline and confirm no violations
- [x] **Task 9** — Commit and update `tasks/FUTURE.md` + `tasks/PRESENT.md`

---

## PAST (Forensic Log)

| Step | Action                             | SHA | Outcome |
| ---- | ---------------------------------- | --- | ------- |
| —    | Track initialized                  | —   | —       |
| 1    | Centralized guard implementation   | —   | Green   |
| 2    | Perchance duplicate name collision | —   | Fixed   |
