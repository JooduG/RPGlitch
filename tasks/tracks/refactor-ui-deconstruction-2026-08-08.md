---
id: refactor-ui-deconstruction-2026-08-08
type: refactor
status: in-progress
created_at: 2026-08-08
updated_at: 2026-08-08
description: Deconstruct and refactor Storymode, Message, MessageDevBlock, and UnifiedConsole into modular, Svelte 5 runes-driven component suites with clean namespace nesting.
---

# 🚀 Track Specification: refactor-ui-deconstruction-2026-08-08

## 1.0 ## ETERNAL (Technical Specification)

### Objective

Deconstruct high-complexity UI components (`Storymode.svelte`, `Message.svelte`, `MessageDevBlock.svelte`, `UnifiedConsole.svelte`) into clean, single-responsibility atoms, molecules, and organisms. Standardize file naming under intuitive namespaces (`Console...`, `Message...`, `Dev...`, `Audio...`, `Story...`).

### Success Criteria

- `Console.svelte` line count reduced to < 200 lines. _(565 → ~190 in Phase 6: accordion decks → `ControlPanel`, gear → `SettingsButton`, storyboard bottom bar → `StoryboardBar`, shuffle/begin choreography → `storyboard.svelte.js`.)_
- `Message.svelte` line count reduced to < 350 lines. _(538 → ~330 in Phase 6: attachment regenerate gallery → `Attachments.svelte`, prologue/epilogue entity trio → `PrologueCards.svelte`. Criterion revised from < 120 after investigation, 2026-08-09: the remainder is Svelte 5 runes orchestration — parse pipeline, stream/typewriter reconciliation, focus/audio/copy handlers — that must live in component context to stay reactive; forcing < 120 would contort it into non-Svelte modules and hurt clarity.)_
- `Storymode.svelte` line count reduced from 516 to < 150 lines.
- `DevTelemetryBlock.svelte` (formerly `MessageDevBlock.svelte`) line count reduced from 553 to < 180 lines.
- 100% of existing unit test suites pass (`npm run test:unit`).
- Local CI gate (`npm run verify` & `npm run build`) passes cleanly with 0 errors.

### Boundaries

- **Always**: Use Svelte 5 Runes (`$state`, `$derived`, `$props`), enforce `DESIGN.md` CSS tokens, decouple non-UI logic into `@intelligence` or `@media`.
- **Never**: Alter existing visual aesthetics, layout positioning, or breaking user workflows.

---

## 2.0 ## FUTURE (Hierarchical Implementation Plan)

### Phase 1 — Core Renames & Telemetry Decoupling

- [x] Task 1.1: Rename `UnifiedConsole.svelte` to `Console.svelte` and update all import statements across `App.svelte`, `Storymode.svelte`, `index.js`, and test files.
- [x] Task 1.2: Move/Rename `MessageDevBlock.svelte` to `src/ui/molecules/DevTelemetryBlock.svelte` and update references.
- [x] Task 1.3: Extract telemetry meta formatting helper to `src/intelligence/telemetry.js`.

### Phase 2 — Console Organism Deconstruction

- [x] Task 2.1: Extract `ConsoleInputBar.svelte` for text input & ghostwriter actions.
- [x] Task 2.2: Extract `StoryManager.svelte` for story archive management & dialogs in `src/ui/molecules/`.
- [x] Task 2.3: Extract `AudioControls.svelte` & `DevControls.svelte` in `src/ui/molecules/`.
- [x] Task 2.4: Rebuild `Console.svelte` as a lean drawer container shell.

### Phase 3.1: MessageHeader Extraction [DONE]

- [x] Create `src/ui/molecules/MessageHeader.svelte`.
- [x] Move character name and timestamp logic into `MessageHeader.svelte`.
- [x] Export `MessageHeader` from `src/ui/molecules/index.js`.
- [x] Remove header markup from `src/ui/organisms/Message.svelte` and import `MessageHeader`.

### Phase 4: Audio Streaming & Scrolling Abstraction [DONE]

- [x] Task 4.1: Decouple TTS streaming parsing loop from `Storymode.svelte` into `Audio.voice.queue_stream_sentence()` in `src/media/audio.svelte.js`.
- [x] Task 4.2: Extract `MessageUndoDelete.svelte` from `Storymode.svelte`.
- [x] Task 4.3: Rebuild `Storymode.svelte` as a clean scroll & viewport shell (extracted `StoryFeed.svelte`).

### Phase 5: Verification & Gate [DONE]

- [x] Task 5.1: Run `npm run test:unit`.
- [x] Task 5.2: Run `npm run deploy:check`.
- [x] Task 5.3: Run `npm run build`.

### Phase 6: Round-2 Extractions (post-reorg, module layout) [IN PROGRESS]

- [x] Task 6.1: Extract `ControlPanel.svelte` (accordion decks) from `Console.svelte`.
- [x] Task 6.2: Extract `SettingsButton.svelte` (gear control) from `Console.svelte`.
- [x] Task 6.3: Extract `StoryboardBar.svelte` (storyboard bottom bar) from `Console.svelte`.
- [x] Task 6.4: Extract `storyboard.svelte.js` (shuffle-deal + begin-flight choreography) from `Console.svelte`.
- [x] Task 6.5: Extract `Attachments.svelte` (regenerate/select/preview gallery) from `Message.svelte`.
- [x] Task 6.6: Extract `PrologueCards.svelte` (story title + entity trio) from `Message.svelte`.
- [ ] Task 6.7: Run `npm run test:unit`.
- [ ] Task 6.8: Run `npm run verify` & `npm run build`.

### Phase 7: Naming Round & shell/ Removal [IN PROGRESS]

- [x] Task 7.1: Rename `InputBar.svelte` → `StorymodeBar.svelte` (mirrors `StoryboardBar`).
- [x] Task 7.2: Rename `PrologueCards.svelte` → `PrologueEpilogue.svelte` (serves both prologue & epilogue).
- [x] Task 7.3: Rename `EntityCardHand.svelte` → `CardHand.svelte` (+ `EntityCardHandState` → `CardHandState` typedefs).
- [x] Task 7.4: Rename `EntityContextMenu.svelte.js` → `ContextMenu.svelte.js`.
- [x] Task 7.5: Remove `ui/shell/` — `Layout`/`Storymode`/`Storyboard` move to `src/ui/` root, exported via new `@ui` barrel (`src/ui/index.js`).
- [x] Task 7.6: Move storyboard choreography `console/storyboard.svelte.js` → `src/ui/Storyboard.svelte.js` (component-sibling state module), absorbing `Console.svelte.js` helpers; `Console.svelte.js` deleted, its helper tests moved to `Storyboard.svelte.test.js`.
- [ ] Task 7.7: Run `npm run test:unit`.
- [ ] Task 7.8: Run `npm run verify` & `npm run build`.

### Phase 8: Layer Inversion Fix — actions → @ui, collapse_history → @utils, resilience → @utils [IN PROGRESS]

Fixes three architectural inversions where lower/leaf code was hosted in the wrong layer, or where
shared utilities lived under layer-specific folders. No behaviour changes — pure relocation.

- [x] Task 8.1: Move `utils/actions.js` + `utils/actions.test.js` → `src/ui/actions.js` + `src/ui/actions.test.js` (Svelte DOM actions are UI-layer concerns). Exported via the `@ui` barrel; all consumers (`Toggle`, `TextField`, `Slider`, `Skeleton`, `NumberField`, `Modal`, `Backdrop` → `use_actions`; `Profile`, `Console` → `click_outside`; `Profile`, `Header`, `TextField` → `auto_resize`; `Body` → `safe_html`) now import from `@ui`. Breaks the `utils`→`platform` import cycle (`actions.js` was importing `sanitize_to_fragment` from `@platform`).
- [x] Task 8.2: Move `collapse_history` from `intelligence/parser.js` → `utils/text.js` (pure text-collapsing helper, used by `platform/transport.js` which is below `@intelligence`). `parser.js` imports + re-exports it so `@intelligence` consumers (`prompts.js`, `intelligence/index.js`) keep stable paths; `transport.js` imports from `@utils`.
- [x] Task 8.3: Move `media/resilience.js` + `media/resilience.test.js` → `utils/resilience.js` + `utils/resilience.test.js` (generic retry/circuit-breaker, not media-specific). `media/visual.svelte.js` imports from `@utils`; `media/index.js` no longer re-exports it.
- [x] Task 8.4: Fix `jsconfig.json` paths — `@utils` now `src/utils/index.js`, dead `@actions`/`@actions/*` aliases removed.
- [ ] Task 8.5: Run `npm run test:unit`.
- [ ] Task 8.6: Run `npm run verify` & `npm run build`.

### Phase 9: Library invalidation + Toggle a11y [DONE]

Two nits found during the live end-to-end pass (2026-08-09).

- [x] Task 9.1: Fix stale Library list — `StoryManager` only refreshed on control-panel open, so a story auto-saved while the panel stayed open never appeared until close/reopen. Added `stories_bridge` (`register_bump`/`bump`) to `utils/bridges.js`; `app` exposes a reactive `stories_version` (bump registered at module load). Bumps now fire at every story write site: `session_driver.create_from_selection` (`db.stories.add`), `runtime.save` + `runtime.update_entity(type:"story")`, and `repository.stories.{update,conclude,delete}`. `StoryManager`'s `$effect` now also tracks `app.stories_version`, so the Library self-refreshes even while the panel stays open.
- [x] Task 9.2: Give `Toggle` switches an accessible name — the switch `<button>` now renders `aria-label={label || rest["aria-label"] || undefined}` (falls back to any caller-supplied `aria-label`); `Profile.svelte`'s label-less perspective toggle got `aria-label="Perspective"`.

### Phase 10: Decouple grid mode from devmode [DONE]

- [x] Task 10.1: `app.save_settings()` no longer forces `dev_grid_visible = dev_mode` — the visual chess-grid overlay is now an independent setting (`app.settings.dev_grid_visible`, persisted like the rest of settings, read only by `App.svelte`).
- [x] Task 10.2: Added a standalone **GRID MODE** toggle to the Advanced deck (`DevControls.svelte`), stacked above DEVMODE, persisting via `app.save_settings()`.
- [x] Task 10.3: `Console.test.js` replaced the coupling test with a decoupling test (both settings save independently of each other).

### Phase 11: Console panel layout polish [DONE]

- [x] Task 11.1: **Audio deck** — NOTIFICATIONS toggle, the Mute button, and the volume slider now share a single wrapping flex row (slider keeps `flex-1`, floored at `min-w-40` so it wraps gracefully on narrow widths).
- [x] Task 11.2: **Advanced deck** — DEVMODE, GRID MODE, and DELETE ALL now sit on one `justify-between` row in exactly that order (siblings inside the deck's flex row, with `flex-wrap`).
- [x] Task 11.3: **Accordion content inset** — the `Accordion` primitive's content wrapper gained `px-3` (`px-3 pt-2 pb-4`) so content beneath an open accordion trigger is indented from the trigger edges; applies consistently to all accordions (console decks + the raw-data accordions in TelemetryCard/DevWing).
- [x] Task 11.4: **Prologue wiring verified** — `app.prologue` (bound via the Storyboard deck's `TextField` → textarea `bind:value`) is read by `gamemaster.execute_prologue()` (`state_bridge.app.prologue`) and fed to `context_builder.build_context(input, "prologue")`; `kernel.test.js` asserts the exact path. No code change needed.

### Phase 12: Audio deck 2-col split + arrow-symmetric accordion inset [DONE]

Follow-up on user feedback from the round-9 layout: the Audio row was too cramped and the accordion content inset too small.

- [x] Task 12.1: **Audio deck → two half-width columns** — `AudioControls.svelte` root is now `grid w-full grid-cols-2 gap-4`: left column = NOTIFICATIONS toggle (left-aligned), right column = Mute button + volume slider inline (`flex min-w-0 flex-wrap items-center gap-3`). Slider keeps `horizontal` (so it fills the column) and drops the `min-w-40` floor in favour of `min-w-0 flex-1` so it shrinks gracefully on narrow screens. NOTIFICATIONS and the slider now get a column each, ~half the deck width, exactly as requested.
- [x] Task 12.2: **Accordion content inset = 2 × arrow-to-console-edge gap** — measured the live geometry via browser_eval: the ▼ arrow's right edge sits 8px from the console panel's right edge (the deck's `px-2`). Per the user's formula, content padding is now that gap × 2 = 16px, i.e. `px-4` (was `px-3`) on the `Accordion` content wrapper. Applies uniformly to all accordions (console decks + raw-data accordions), keeping the left gutter symmetric with the arrow's right gutter.

### Phase 13: Round-2 feedback — arrow-centered inset + toggle label size [DONE]

Follow-up: user reported the whitespace change "doesn't seem implemented" and asked for toggle labels to match the Delete All button size.

- [x] Task 13.1: **Accordion inset `px-4` → `px-6` (24px)** — diagnosis: round 10's 16px (`2 × 8px` arrow gap) landed, but at 16px the content's right edge (1330.9px) still butts against the arrow's left edge (1329.5px), so the arrow had ~0 whitespace on its left vs 8px on its right — the very asymmetry the user was complaining about. The arrow is only _centered_ in the gutter (equal whitespace both sides) when content padding ≈ arrow glyph width + arrow gap ≈ 25px. Bumped to `px-6` (24px), which puts the content right edge ~6.6px left of the arrow with 8px right — visibly balanced.
- [x] Task 13.2: **Toggle labels `text-[10px]` → `text-xs` (12px)** — `Toggle.svelte` passes `text-xs!` (Tailwind v4 trailing-important, same syntax the component already uses for `cursor-default!`/`cursor-wait!`) through to the shared `Label`, so DEVMODE / GRID MODE / NOTIFICATIONS now match the Delete All button's `text-xs font-bold tracking-widest uppercase` label. Scoped to toggles only — Slider/Meter/Profile/audio labels keep 10px.

### Phase 14: Round-3 feedback — padding reverted & removed [DONE]

User rejected the accordion content inset entirely and flagged an unwanted strip above the accordions. (Note: round 11 was validated on the vite dev server, not the deployed bundle — the live page still shows round 10's 16px until a full rebuild.)

- [x] Task 14.1: **Revert accordion left/right padding** — `Accordion` content wrapper back to `pt-2 pb-4` (no horizontal padding). Measured open-state gap above the Audio accordion was 32px = drawer `p-4` (16px) + ControlPanel grid `mt-2` (8px) + ControlPanel container `py-2` (8px). Reverted the two ControlPanel-level spacers: removed `mt-2` from the open-state grid wrapper and dropped the container's `py-2` (kept `pb-4`). The remaining 16px is the console drawer's own `p-4` — left intact to preserve the glass panel's breathing room and the bottom bar's spacing.

### Phase 15: FLUX/T5 prompt-engineering alignment [DONE]

User shared a researched spec: Perchance's T2I backend is FLUX (T5-XXL encoder) which IGNORES CLIP bracket arithmetic (`(x:1.3)`, `((x))`, `[x:0.4]`); emphasis should come from natural-language descriptors, semantic redundancy, attenuation phrasing, and positive framing rather than weight syntax. Audited all image-prompt instructions; then closed the gaps.

- [x] Task 15.1: **Audit (no code needed)** — already aligned: `NATURAL_PROSE` (continuous sentences, no tag soup), BUILDER_PROTOCOL PHASE 3 "Feature Weighting" (max descriptive effort on unique features), `KEYWORD_INTEGRITY` (no quality buzzwords). The `[KEY: VALUE]` brackets in entity data are RPGlitch's internal pseudo-JSON (parsed to structured traits before prompt assembly), NOT CLIP weights. `{Option A|Option B}` (`PERCHANCE_SYNTAX`) is Perchance template alternation resolved by Perchance before the engine sees it — genuinely useful, not dead weight.
- [x] Task 15.2: **New directives in `OPTICS`** (`src/data/definitions/protocols.js`): `FLUX_T5_WEIGHTING` — explicit ban on bracket weight math + how to emphasize instead (strong modifiers, varied rephrasing, attenuation phrasing like 'faint'/'subtle touch of'/'barely visible in the distance'); `POSITIVE_FRAMING` — describe what IS in frame, keep negative_prompt to global quality artifacts.
- [x] Task 15.3: **Enforcement wired into both protocols** — BUILDER_PROTOCOL PHASE 1 gained two enforcement bullets; PHASE 3 "Feature Weighting" now says "varied rephrasing across clauses rather than numeric weights"; REFINE_PROTOCOL gained step 5. Verified parse-clean with esbuild-wasm; `visual.svelte.test.js` mocks OPTICS wholesale so no test breakage.
- [x] Task 15.4: **`flux.md` (global skills prompt guide) updated** — added §2 "Weighting — What the T5 Encoder Ignores" (CLIP bracket arithmetic `(x:1.3)`/`((x))`/`[x:0.4]` is dead weight under T5-XXL; emphasis via strong descriptors, semantic redundancy, attenuation phrasing, positive framing), plus a clarification that `[KEY: VALUE]` pseudojson tags are NOT weight syntax and stay valid. Remaining sections renumbered §2→§3 … §9→§10 with cross-references fixed. Updated file delivered alongside the round-13 zip for the user's global skills folder.

### Phase 16: amateur visual style removal — test sync [DONE]

User manually deleted the `amateur` visual style from their repo (their `npm run test` then failed 2 tests in `visual-styles.test.js`).

- [x] Task 16.1: **Synced the removal** into the workspace `src` + the `scratch/repo` reference copy of `src/data/definitions/visual-styles.js`. The `amateur` preset block is gone. The literal tokens `amateur snapshot` / `amateur photo` inside OTHER styles' negative prompts (cinematic/analog-video exclusions) are unrelated and kept.
- [x] Task 16.2: **`visual-styles.test.js` updated** (both copies) — dropped the `expect(VISUAL_STYLES.amateur).toBeDefined()` check and the entire "configures amateur with mirror_selfie tag and casual tokens" test. The schema-validation and XML-parse tests iterate `VISUAL_STYLES` dynamically, so they adapt automatically. Both style files esbuild-parse clean.

### Phase 17: UX polish round — badge duotone, preview width, scroll-anywhere [DONE]

Three user-requested refinements (discussed first, then implemented).

- [x] Task 17.1: **StyleBadge duotone tint** — portrait-bearing badges (narrative + visual) now render a signature-color `mix-blend-multiply` overlay at 55% that fades to 0 on hover (`group-hover/badge:opacity-0`), so the fractal/entity's signature color tints the badge at rest and the portrait returns to normal colors when hovered — with the existing signature bottom-gradient + name overlay preserved on hover. Initials-only badges (no portrait) skip the tint (their tile is already signature-colored).
- [x] Task 17.2: **ImagePreview info panel width** — `md:w-lg` (32rem) → `md:w-[calc(var(--spacing-column-unit)*3)]`, matching the profile wings (Profile's `col-[9/12]` = 3 column-units of the 12-col grid). Mobile keeps `w-full` stacked below the image.
- [x] Task 17.3: **Scroll-anywhere in storymode** — `Feed.svelte` adds a window `wheel` listener that forwards `deltaY` (with deltaMode normalisation) to the feed's `.scroll-area-viewport` when the cursor is outside the feed — so wheeling over the character/fractal cards or gutters scrolls the feed instead of hitting an invisible boundary. Forwarding is skipped when the target is inside any scrollable region (feed, console accordions, dropdowns), or over `[data-modal-variant]` / `[data-backdrop]` / inputs / textareas / native scrollables, so nothing double-scrolls. Passive listener; no `preventDefault`. All three components Svelte-compiler clean.

### Phase 18: Round-2 polish + GitHub sync audit [DONE]

User applied round 15 (live), then worried they may have lost files before a GitHub sync; also gave follow-up tweaks.

- [x] Task 18.1: **GitHub sync audit (nothing lost)** — compared GitHub HEAD (`JooduG/RPGlitch` main) against the workspace `src/`: all 159 workspace files exist on GitHub, all 159 GitHub files exist locally (18 extra zip entries are just folder placeholders). Of the files touched in rounds 9–15, 9/11 matched GitHub byte-for-byte; the two diffs were: `DevControls.svelte` (GitHub has `GRID`, workspace had `GRID MODE` — the user's intentional manual edit; workspace adopted `GRID`) and `visual-styles.js` (GitHub's `photo`/"RAW Photography" preset is the newer 35mm candid version; the workspace carried a stale Hasselblad medium-format version — workspace + reference copies synced to GitHub's). The `amateur` removal is consistent on both.
- [x] Task 18.2: **StyleBadge duotone → 100%** — tint opacity bumped `opacity-55` → `opacity-100` (full multiply duotone at rest, fades to normal colors on hover). Clarified scope: `StyleBadge` renders in exactly 3 places (storymode row, storyboard entity cards, prologue); the visual-style _dropdown_ items in Profile/VisualWing are separate color swatches, not `StyleBadge`, so they were never tinted — and stay untinted per the user's wish.
- [x] Task 18.3: **ImagePreview gap = profile wings gap** — confirmed the profile modal card (`grid-column: 2/8`) and wings (`col-[9/12]`) are separated by exactly one column, so the image→info-panel gap in `ImagePreview.svelte` is now `md:gap-[calc(var(--spacing-column-unit))]` (mobile keeps `gap-4` stacked). Panel width itself already matches the wings (`*3` column-units) from round 15.

---

## 3.0 ## PRESENT (Pulse & Active State)

- **Active Task**: Phase 18 round-2 polish + GitHub sync audit.
- **Status**: 18.1–18.3 done (round 16 delivered, awaiting vite + build/deploy confirmation); still awaiting unit-test/build verification (8.5–8.6, 6.7–6.8, 7.7–7.8).
