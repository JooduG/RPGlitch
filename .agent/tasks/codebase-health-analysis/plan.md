# 📝 Plan: Codebase Health Analysis & Cleanup

## User Review Required

> [!NOTE]
> This is a housekeeping track. No breaking changes are accepted.

## Proposed Changes

### Phase 1: Technical Debt Resolution

Address the specific TODOs identified during discovery:

- **[MODIFY]** `src/ui/organisms/LibraryDrawer.svelte`: Implement "Create New" stub (connect to `app` store or show toast).
- **[MODIFY]** `src/state/runtime.svelte.js`: Implement rollback logic or better error handling for `save()`.
- **[MODIFY]** `src/state/app.svelte.js`: Implement `rerollTitle` logic (or remove if obsolete).

### Phase 2: Architectural Verification

- **[AUDIT]** Check `src/gamemaster` for any direct DOM access (Forbidden).
- **[AUDIT]** Check `src/scholar` for `window.` usage (should be proxied via `Security` or `bootstrap.js`).

### Phase 3: Final Svelte 5 Sweep

- **[SCAN]** Confirm zero instances of `createEventDispatcher` or `export let`.

## Verification Plan

### Automated Tests

- Run `npm run build` to ensure type safety and compilation.
- Run `npm test` (if available) to verify logic integrity.

### Manual Verification

- Open the application.
- Trigger "Create New" in Library Drawer to verify it doesn't crash.
- Inspect console for any runtime warnings.
