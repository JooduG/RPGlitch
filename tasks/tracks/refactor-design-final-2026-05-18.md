# Implementation Plan: Final DESIGN.md Simplification & Grid Migration

## Objective

Complete the simplification of the RPGlitch design language by applying the "Rule of 3" to all remaining token groups, migrating the grid system to a purely dynamic engine, and enforcing high-density tactical typography.

## Key Files & Context

- `DESIGN.md`: The Sovereign Source of all tokens.
- `scripts/refactor-final.js`: A new migration script to be created.
- `src/theme/design.css` & `src/theme/tokens.js`: Generated outputs from `DESIGN.md`.
- All `.svelte` and `.js` files in `src/`: Subjects of the migration.

## Implementation Steps

### 1. DESIGN.md Frontmatter Refactor

- **Typography**:
  - Standardize `font-weight-bold` to `800`.
  - Purge `font-weight-heavy`.
- **Spacing**:
  - Add `margin-loose: calc(var(--spacing-unit) * 8)`.
  - Purge `auto-resize-buffer`.
  - Purge `gap-section` and `padding-section`.
- **Grid Engine**:
  - Purge all `columns-X` and `rows-Y` aliases.
- **Simplification (Rule of 3)**:
  - **Opacity**: Standardize to `none` (0), `ghost` (0.05), `whisper` (0.15), `muted` (0.4), `solid` (1).
  - **Duration**: Standardize to `none` (0s), `fast` (150ms), `standard` (300ms), `slow` (500ms), `ambient` (2000ms).
  - **Z-Index**: Standardize to `below` (-1), `base` (0), `surface` (10), `elevated` (50), `overlay` (100), `modal` (300).
  - **Scale**: Standardize to `scale-sink` (0.98), `scale-lift` (1.02), `scale-pulse` (1.05).
  - **Shadows**: Consolidate to `shadow-ghost`, `shadow-standard`, `shadow-ambient`.

### 2. Automated Migration (scripts/refactor-final.js)

Create a script to perform bulk replacements:

- **Grid**: `var(--columns-X)` -> `calc(var(--column-unit) * X)`.
- **Opacity**: Map all legacy values to the new 5-tier scale.
- **Duration**: Map all legacy values to the new 5-tier scale.
- **Z-Index**: Map all numeric and legacy semantic tokens to the new scale.
- **Scale**: Map all tremor/pulse/zoom variants to `scale-pulse`.
- **Shadows**: Map `shadow-light`/`shadow-heavy`/`shadow-focus` to `shadow-standard`.
- **Fixes**: `padding-section` -> `padding-standard`, `gap-section` -> `gap-standard`.

### 3. Verification & Testing

- Run `node scripts/refactor-final.js`.
- Run `npm run sync:design` to rebuild artifacts.
- Run `npm run audit:css` (The Warden) to ensure zero raw values or hallucinations.
- Run `npm run verify` (Lint + Tests).
- Visual verification of `Profile.svelte` and `StorymodeFeed.svelte`.

## Rollback Strategy

- `git restore .` can be used to revert all changes if the automated migration causes issues.
