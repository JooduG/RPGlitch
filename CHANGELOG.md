<!--
  Changelog Format (Keep a Changelog 1.1.0 + SemVer 2.0.0):
  - Keep `## [Unreleased]` at the top for in-progress changes.
  - Cut releases as `## [X.Y.Z] - YYYY-MM-DD` (pre-1.0 uses `0.y.z`; no backticks).
  - Group new entries under `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`.
-->

# Changelog

All notable changes to **RPGlitch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## `[Unreleased]`

### Added

- `.agents/skills/design/scripts/audit-design.js`: Added `LEGACY_Z_INDEX` `HERESY` rule blocking `z-elevated`, `z-backdrop`, `z-5`, `z-25`, `z_index=`, `--z-index-elevated`/`backdrop`, and bracketed `z-[...]`, plus exempted `--z-index-sticky`, `--z-index-overlay`, and `--z-index-toast` from unused-token debt.
- `src/definitions/orion-nova-glitch.js` & `src/data/db.js` (`seed_premades`): Added a 10-round concluded premade story fixture (`Neon Static & Pink Thunder`) uniting Orion, Glitch, and Nova City with `simulation_log` entries and `mutation_ledger` diffs seeded idempotently on boot.
- `.agents/skills/graph-it-live/scripts/scan-dead-code.js` (`npm run audit:dead-code`): Comment-stripped `.svelte`/`.js` filter over `graph-it tool scan_dead_code` to eliminate `.svelte` template and `export *` barrel false positives.
- `tsconfig.json`: Added root TypeScript/alias config (`"baseUrl": "."` + bare barrel `paths`, `"noEmit": true`) so `graph-it-live` resolves all cross-folder `@alias` edges with 0 `svelte-check` warnings.
- `engine-atoms.md`: Stage 1 Goldfish atom inventory for `src/engine/` and coupled `@utils` modules.
- `.github/dependabot.yml`: Weekly `github-actions` update schedule.

### Changed

- `DESIGN.md` & UI layering (`Backdrop.svelte`, `Modal.svelte`, `Dialog.svelte`, `ScrollArea.svelte`, `App.svelte`, `motion.svelte.js`, `Storyboard.svelte`, `Profile.svelte`, `ImagePreview.svelte`, `Console.svelte`, `EntityCard.svelte`, `ProfilePicture.svelte`, `VisualWing.svelte`): Consolidated global z-index tokens to the 7-tier scale (`sticky: 100`, `overlay: 200`, `popover: 300`, `modal: 400`, `tooltip: 500`, `toast: 600`, `max: 999`), removed arbitrary `z_index` number overrides (`1000`/`500`/`40`/`50`/`600`), added `isolate` stacking contexts, and normalized local z-classes (`z-5` → `z-10`, `z-25` → `z-20`, `z-elevated` → `z-20`/`z-sticky`/`z-overlay`).
- `src/ui/Storyboard.svelte`: Pulled back the card hand (`app.close_card_hand()`) when opening the Import modal instead of hiding it in place with `opacity-0`.
- `src/ui/` (`Toggle.svelte`, `Storyboard.svelte`, `Profile.svelte`, `DevWing.svelte`, `VisualWing.svelte`): Fixed UI visual drift — removed stray `'false'` class and added `border-white/10` on unchecked `Toggle`, standardized Import/Export modals to `rounded-standard` + `shadow-standard`, flattened the Storyboard Import Modal directly onto `SourceField` with `Character`/`Fractal` toggles and the `Import` CTA in its header snippets, unified `profile-time-travel-bar` round pills to `<Button size="small">` with portrait-veil gradient, flattened `DevWing` Token Budget (`rounded-standard bg-glass-sunken p-standard`) and `Mutation Ledger` (`<Accordion>` + `divide-y`) with `wing-item-slide-down`, and bound `VisualWing` prompt headers to entity `signature_color`.
- `src/ui/` & `src/utils/ui-helpers.test.js`: Converted 7 self-barrel imports (`@ui`, `@primitives`, `@utils`) to relative `./` sibling paths to eliminate barrel cycles (`ChatBubble.svelte`, `Console.svelte`, `Profile.svelte`, `Storyboard.svelte`, `Storymode.svelte`, `TextField.svelte`, `ui-helpers.test.js`).
- `src/utils/text.js` & `src/utils/text.test.js`: Removed redundant `export * from "./alternations.js"` pass-through and pointed `text.test.js` directly to `./alternations.js`.
- `src/App.svelte`: Replaced `[data-dev="grid"]` `border` with `outline` + `outline-offset` to eliminate CSS `boxModel` warnings.
- `README.md` & `src/{engine,media,ui,utils}/README.md`: Fixed broken file links after module relocations.

- `src/ui/primitives/SourceField.svelte` & `src/ui/Storyboard.svelte`: Decoupled `SourceField` from `@data` via an optional `decode_png_card` prop (`extract_card_from_png` passed from `Storyboard.svelte`), satisfying `rank5-primitives-stateless`.
- `src/utils/{text,xml}.test.js` → `src/simulation/{brackets,history,llm-output}.test.js`: Relocated `@simulation` test suites out of `src/utils/` so `graph-it check-architecture` passes all 13 rules with 0 violations.

- `jsconfig.json` & `graphit.architecture.json`: Added bare barrel path aliases (`@data`, `@definitions`, `@engine`, `@media`, `@simulation`, `@state`, `@primitives`, `@ui`, `@utils`) matching `vite.config.js`, and scoped `shell` to `["src/main.js", "src/App.svelte"]`.
- `src/state/runtime.svelte.js` & `src/state/interface.svelte.js`: Broke circular import via `register_runtime_app_sink(app)` so `@state` dependencies flow one-way (`interface` → `runtime`).
- `src/ui/primitives/TextField.svelte` & cross-folder barrel imports: Switched `TextField.svelte` to import `./Shimmer.svelte` directly (removing barrel cycle) and converted the 6 relative cross-folder imports (`prompts.js`, `llm-output.test.js`, `narrative-styles.js`, `visual-styles.js`, `exporters.js`, `chat.test.js`) to `@utils` / `@data` (`interEdges=0`).
- `.agents/skills/graph-it-live/`: Consolidated the 5 `graph-it-*` skills into 1 RPGlitch-scoped skill (`SKILL.md`, `PITFALLS.md`, and 1-hop `references/`), aligned with `agent-customization`, `agy-customizations`, `deslop`, and `graphit.architecture.json`; synced stale example paths to `src/engine/runner.js` / `src/main.js#app_bootstrap` and added `[PF-005]` for bare `@alias` barrel blindness.
- `.github/workflows/ci.yml`: Added least-privilege `permissions`, SHA-pinned Actions (`checkout`, `setup-node`, `graph-it-review-gate`), dropped `--legacy-peer-deps`, added `<= 4.00 MB` Perchance bundle ceiling check, and added PR-only `graph-review` job.
- `src/engine/runner.test.js`: Inlined `create_contract_fixtures()` directly into the test suite.

### Removed

- `src/ui/Profile.svelte`: Removed the clock/time-travel button, inline `profile-time-travel-bar` scrub UI, and timeline replay/branch/revert handlers while keeping `DevWing`'s Mutation Ledger intact.
- `src/ui/DevWing.svelte`: Removed the Token Budget / Breakdown HUD block and its unused token snapshot derivations.
- `src/simulation/fixtures.test-util.js`: Removed standalone fixture file after inlining into its sole consumer (`src/engine/runner.test.js`).

### Fixed

- `src/ui/primitives/Tooltip.svelte`: Applied `style:z-index="var(--z-index-max)"` (`999`) to `Tooltip.Content`'s positioned `wrapperProps` element (replacing the undefined `z-tooltip` utility class) so tooltips always render above modal backdrops (`z-index: 200`/`600`).
- `src/ui/VisualWing.svelte`: Wired `handle_creative_action()`'s Envision prompt button to `refine_image_prompt` from `@engine` (replacing the removed `app.visual.envision` call) and called `profile_state.mark_mutated()` after updating prompt fields.
- `src/ui/` (`VisualWing.svelte`, `AudioWing.svelte`, `DevWing.svelte`): Scoped `VisualWing` and `AudioWing` to fallback `--color-frozen` (`--signature-color: var(--color-frozen)`, removing entity `signature_color` from `VisualWing` prompt fields) and pinned `DevWing` to `--color-electric-cyan`.
- `src/ui/DevWing.svelte`: Derived dynamics meter `desc` tooltip from `axis.low` → `axis.high` instead of falling back to `"Metric"`.
- `src/ui/Storyboard.svelte`: Matched the Import modal header button to the adjacent `SourceField` upload icon button (`variant="invisible"`, `size="small"`, `square`, `size-icon-small`, `tooltip`) and increased checked `Toggle` contrast against the `--color-frozen` header bar.
- `.agents/skills/graph-it-{dead-code-hunter,refactor,pr-review,onboarding-express}/`: Removed merged skill directories.

## `[0.2.0]` - 2026-11-16

- Full pre-beta architecture refactor, UI/primitives cleanup, design-system alignment, and EGM `README.md` contract sync.
- Full historical details for `0.1.0`–`0.2.0` archived in `tmp/archive/CHANGELOG-0.1-0.2-ARCHIVE.md`.
