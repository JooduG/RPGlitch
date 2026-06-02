---
track_id: refactor-vite-8
status: done
priority: high
type: infrastructure
---

# Refactor

## ETERNAL

**Objective:** Upgrade the repository to Vite 8 (`^8.0.16`) and `@sveltejs/vite-plugin-svelte` version 7 (`^7.1.2`), migrating the underlying bundler from `esbuild`/`rollup` to `Rolldown`.
**Success Criteria:** `npm run verify` passes. `npm run build` generates a valid single-file `dist/index.html`.
**Boundaries:**

- Do not migrate away from Single-File deployment.
- Maintain Svelte 5 strict rune mode.

## FUTURE

### Phase 1: Dependency Upgrade

- [x] Install Vite 8 and Svelte Plugin 7.

### Phase 2: Configuration Harmonization

- [x] Update `svelte.config.js` to remove deprecated inspector options.
- [x] Verify `vite.config.js` Rolldown compatibility with single-file plugin.

### Phase 3: Verification

- [x] Run `npm run verify`.
- [x] Verify `npm run build` and single-file generation.
