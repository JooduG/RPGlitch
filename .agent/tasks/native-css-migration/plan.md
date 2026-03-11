# Plan: Native CSS Migration

## Phase 1: Preparation & Bridge

- [x] **Step 1.1**: Audit `tokens.css` vs `_variables.scss`. Ensure all `$variables` have a `--token` equivalent.
- [x] **Step 1.2**: Create `src/theme/abstracts/_bridge.scss`. This file will map all legacy `$variables` to their `var(--token)` counterparts.
- [x] **Step 1.3**: Update `_variables.scss` to `@forward "_bridge.scss"`. This ensures components don't break during the transition.

## Phase 2: Global Registration

- [ ] **Step 2.1**: Ensure `tokens.css` is imported in `src/index.html`.
- [ ] **Step 2.2**: Audit `app.scss` for any remaining global hardcoded values.

## Phase 3: Component Migration (The Purge)

- [ ] **Step 3.1**: Identify core components (Button, Profile, StoryPanel).
- [ ] **Step 3.2**: Replace `$variable` with `var(--token)` in Svelte `<style>` blocks.
- [ ] **Step 3.3**: Remove `@use "variables"` or `@import` calls from Svelte components.
- [ ] **Step 3.4**: (Optional) Remove `lang="scss"` from `<style>` blocks if no longer using SASS features.

## Phase 4: Mixin & Utility Refactor

- [ ] **Step 4.1**: Refactor `@include mobile` to use CSS variables for custom media queries (if supported) or standardized native `@media` blocks.
- [ ] **Step 4.2**: Standardize Z-index management via CSS variables.

## Phase 5: Verification & Cleanup

- [x] **Step 5.1**: Run `npm run lint:css` to identify dangling SCSS dependencies. [checkpoint: e644bbbb37b9040de82d060174e58391a3baf571]
- [x] **Step 5.2**: Manual UI regression test across mobile and desktop views. [checkpoint: e644bbbb37b9040de82d060174e58391a3baf571]
- [x] **Step 5.3**: Remove legacy `_variables.scss` and `_bridge.scss` once all components are migrated. [checkpoint: e644bbbb37b9040de82d060174e58391a3baf571]
