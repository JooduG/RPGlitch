---
name: design
description: >-
  Visual design system, CSS token pipeline, and static layout governance for
  RPGlitch. Use when authoring or reviewing DESIGN.md tokens, color palettes,
  typography, glassmorphic surfaces, static component layouts, adversarial UI
  stress-testing, or running npm run sync:css and npm run audit:design. Do NOT
  use for interactive animations, easing curves, or View Transitions API
  choreography (use motion), sound synthesis (use audio), or Svelte 5 rune
  state architecture (use svelte).
---

# Design System & Static Layout Governance

**Role**: Visual Token & Static Layout Architect  
**Objective**: Anchor every color, typographic scale, elevation surface, and layout geometry in `DESIGN.md` tokens and `src/ui/primitives/` wrappers with zero viewport overflow or drift.

## 1. Mandatory Pre-Flight & Pitfalls Check

> **CRITICAL**: Before modifying [DESIGN.md](../../../DESIGN.md), CSS tokens, or UI components, read [PITFALLS.md](./PITFALLS.md) to avoid known regressions.

### Reference & Scripts Map

- [PITFALLS.md](./PITFALLS.md) — Pre-flight empirical scar tissue (read before any token or UI edit).
- [references/anti-slop.md](./references/anti-slop.md) — Color, typography, dark-surface, and hierarchy craft rules (consult before designing or styling components).
- [references/prototyping.md](./references/prototyping.md) — Isolated multi-variant Svelte 5 `{#key}` prototyping and temporary `.proto-picker` switcher (consult when comparing 2–3 competing design directions before promoting to `src/ui/`).
- [references/adversarial/break-ui.md](./references/adversarial/break-ui.md) — 3-Phase adversarial UI stress-test protocol (consult when stress-testing components or layouts).
- [references/adversarial/worst-case-catalog.md](./references/adversarial/worst-case-catalog.md) — Adversarial fixture dictionary across 10 data categories (use during Phase 2 of `break-ui.md`).
- [scripts/sync-css.js](./scripts/sync-css.js) — Forward compiler (`DESIGN.md` -> `src/media/design.css` + `src/media/tokens.js`).
- [scripts/audit-design.js](./scripts/audit-design.js) — Static CSS/Svelte rule scanner, hallucinated `var(--*)` detector, and unused-token auditor.
- [scripts/audit-google-design.js](./scripts/audit-google-design.js) — `@google/design.md` frontmatter schema validator.
- [scripts/token-utils.js](./scripts/token-utils.js) — Shared token parser, `{category.token}` resolver, and source walker.
- Core workspace contracts: [DESIGN.md](../../../DESIGN.md), [README.md](../../../README.md), and [src/ui/primitives/README.md](../../../src/ui/primitives/README.md).

## 2. Scope, When to Skip & Exclusivity Boundary

- **Design Scope**: `DESIGN.md` frontmatter tokens, color calibration, entity signatures, typography stacks, glassmorphic surfaces, static layout geometry, modal/dialog structure, `bits-ui` wrapper boundaries, and token compilation/audits.
- **When to Skip**: Skip this skill when modifying pure simulation/data logic (`src/engine/`, `src/intelligence/`, `src/data/`), authoring interactive motion/transitions, or implementing audio/TTS synthesis.
- **Exclusions**:
  - [motion](../motion/SKILL.md): All duration budgets, easing curves (`--ease-out`, `--ease-in-out`, `--ease-drawer`), press scales, blur limits, and View Transitions choreography.
  - [audio](../audio/SKILL.md): Web Audio API synthesis, procedural SFX, and Web Speech TTS playback.
  - [simulation](../simulation/SKILL.md): Turn/round physics, director/actor loop, and state schemas.
  - [local-scripts](../local-scripts/SKILL.md): Repository-wide verification gates (`npm run verify`) and ignore/deploy workflows.
  - Global `svelte` & `javascript` skills: Svelte 5 Runes architecture and non-UI engine utilities.

## 3. Token Architecture & Aesthetic Calibration

### Three Dials Baseline (Nordic Cockpit Terminal)

All visual design decisions calibrate to the following `1–10` scale targets:

- **Layout Variance (`4–5 / 10`, Controlled Clinical Geometry)**: Structured alignments with intentional grid contrast for telemetry monitors and narrative dialogue.
- **Motion Intensity (`5–6 / 10`, Responsive Kinetic Telemetry)**: Snappy, damped physics with zero theatrical delay; see [motion](../motion/SKILL.md) for timing rules.
- **Visual Density (`8–9 / 10`, Subterranean Research Terminal)**: High-information workspace featuring somatic vectors (numerical character axes in `src/config.js`), prompt brackets (`[KEY: VALUE]` tags in `--font-mono`), and tabular figures (`tabular-nums`).

### 4-Tier Token Hierarchy

Always read [DESIGN.md](../../../DESIGN.md) before UI work. `DESIGN.md` is the sole authoritative source (compiled to `src/media/design.css` and the `src/media/tokens.js` bridge):

- **T1–T3 (`@theme` tokens)**: Frontmatter categories `colors`, `typography` (`--font-sans`, `--font-heading`, `--font-display`, `--font-mono`), `rounded`, `spacing` (including T3 organism dimensions `spacing-character-card-*`, `spacing-fractal-card-*`), and `theme` (compiled under `/* --- COMPONENTS --- */` in `src/media/design.css`).
- **T4 (`@utility` & `@layer base`)**: Compiled CSS utilities defined in `DESIGN.md` fenced blocks: `mask-border-solid`, `glass-input`, `terminal-box`, `message--prologue`, and `prologue-awaiting-flight`.

### Token Purity, Signatures & ESLint Boundary

- **Mandate Tokens First**: Use `DESIGN.md` tokens wherever a domain token exists (surfaces, entity signatures, typography, radii, spacing, shadows, z-index, durations/easing).
- **Permitted Tailwind & CSS Primitives**: Standard Tailwind v4 layout/structural utilities, neutral palette/opacity utilities (`bg-white/5`, `border-white/10`, `text-slate-50`), `color-mix(in srgb, var(--signature-color) 10%, var(--color-glass-sunken))`, and `1px`/`2px` hairline borders are permitted where no semantic token fits.
- **ESLint Unknown-Class Gate**: [eslint.config.js](../../../eslint.config.js) enforces `better-tailwindcss/no-unknown-classes`. Register new semantic utilities as `@utility` in `DESIGN.md` (or add non-utility component classes to the ESLint ignore whitelist).
- **Entity Signature Contrast (`>= 4.5:1`)**: Because `signatures` in `DESIGN.md` span dark greens (`#15803d`) to high-luminance yellows (`#fde047`, `#fbbf24`, `#84cc16`), text-bearing containers tinted by `--signature-color` must use translucent `color-mix()` wells or dark scrims over obsidian surfaces (as in `ChatBubble.svelte` and `Profile.svelte`), or pair solid high-luminance fills with dark `--color-chalk` ink.
- **No Pure-Black Drops**: Use tinted `--shadow-ghost`, `--shadow-standard`, and `--shadow-ambient` over `#0b101a` (`--color-background-gradient-1`).

## 4. Layout Geometry, Scroll Containers & Perchance Normalization

- **Viewport Grid & Mobile Breakpoint**: Use the 12x12 golden-ratio stage grid (`--spacing-grid-width`, `--spacing-grid-height`, bounded via `min(clamp(...), 100vw / 100dvh)`), `min-h-dvh` over `h-screen`, and the `< 48rem` (`768px`) mobile breakpoint tracked in [interface.svelte.js](../../../src/ui/interface.svelte.js).
- **Defensive Columns & Numeric Stability**: Place `min-w-0` on text flex/grid children (`minmax(0, 1fr)`), `wrap-anywhere` on long unbroken values, `shrink-0` on avatars/icons, and `tabular-nums` on dynamic counters and telemetry figures.
- **Scrollbar Suppression**: Never use `.no-scrollbar` (fails ESLint). Use [ScrollArea.svelte](../../../src/ui/primitives/ScrollArea.svelte) or `scrollbar-none [&::-webkit-scrollbar]:hidden` (as in `Dropdown.svelte` and `Modal.svelte`).
- **Modal & Dialog Layout**: Left-align header titles and body copy (`items-start text-left`); right-align footer actions (`justify-end gap-standard` in `Dialog.svelte`, `gap-2` in custom modal footers). Add inline `style="display: flex;"` on HTML5 landmark `<footer>`/`<header>` containers alongside Perchance `normalize.css v3` `:where(...)` rules in `DESIGN.md`.
- **Disabled vs. Busy States**: Reserve `opacity-30 cursor-not-allowed` for `disabled` controls. Busy controls (`Button`, `Dialog`, `Modal`, `Slider`, `Toggle`) apply `brightness-90` / `brightness-75`, `grayscale*`, `cursor-wait`, `pointer-events-none`, and `finally`-guarded lock release.

## 5. UI Primitives & State Sovereignty

- **Directory Structure**:
  - [src/ui/primitives/](../../../src/ui/primitives/README.md) (`18` wrappers + `tooltip` action): `Accordion`, `Backdrop`, `Button`, `Dialog`, `Dropdown`, `Label`, `Meter`, `Modal`, `NumberField`, `ProgressBar`, `ScrollArea`, `Shimmer`, `Slider`, `SourceField`, `StyleBadge`, `TextField`, `Toggle`, `Tooltip`.
  - `src/ui/` feature views: `Storymode.svelte`, `Storyboard.svelte`, `StoryCard.svelte`, `Console.svelte`, `EntityCard.svelte`, `Profile.svelte`, `ProfilePicture.svelte`, `VisualWing.svelte`, `AudioWing.svelte`, `DevWing.svelte`, `ChatBubble.svelte`, `ContextMenu.svelte`, `ImagePreview.svelte`, `MacroText.svelte`, `RelationalGraph.svelte`, `Typewriter.svelte`, `UndoToast.svelte`.
- **Bits UI (`^2.20.6`) Boundary**: Feature views must consume `src/ui/primitives/` first. Direct `bits-ui` imports (`AlertDialog`, `Avatar`, `Button`, `Collapsible`, `Dialog`, `Label`, `Meter`, `Progress`, `ScrollArea`, `Select`, `Slider`, `Switch`, `Tooltip`) stay encapsulated inside `src/ui/primitives/` (plus `Avatar` in `ProfilePicture.svelte`). `Dropdown.svelte` wraps `Select` (no `DropdownMenu` or `Popover` exists). Use `{#snippet child({ props })}` for render delegation and keep `bind:ref` and `origin-(--transform-origin)` internal to primitive wrappers. Rely on `bits-ui` for ARIA roles and modal focus management.
- **Reactive State Ownership Matrix**:
  - [src/engine/runtime.svelte.js](../../../src/engine/runtime.svelte.js): Active entities (`user`, `ai`, `fractal`), `round`, `story_id`.
  - [src/engine/status.svelte.js](../../../src/engine/status.svelte.js): Simulation lifecycle (`simulation_state`, `ui_state`, `phase` = `"idle"` | `"generating"` | `"locked"`, `busy`, `streaming`).
  - [src/ui/interface.svelte.js](../../../src/ui/interface.svelte.js): Modal/view routing, `< 48rem` viewport state, and `--active-signature-color` hydration. _(Note: these three files reside under `src/engine/` and `src/ui/`, despite stale `@file src/state/...` header comments.)_

## 6. View Transition Names & Motion Boundary

- **Jurisdiction**: Delegate all duration budgets, easing curves, scale physics, and entrance/exit choreography to [motion/SKILL.md](../motion/SKILL.md). Only apply design token bindings (e.g., `duration-(--duration-fast) ease-(--ease-out) active:scale-sink`).
- **Canonical View-Transition Names**: Registered in `DESIGN.md`: `card-slot-ai`, `card-slot-user`, `card-slot-fractal`, `entity-morph-fractal`, and `unified-console` (bound dynamically in `EntityCard.svelte`, `App.svelte`, and `Console.svelte`).
- **Guarded Transitions Only**: Trigger DOM view transitions exclusively via `guarded_transition(callback, options)` from [ui-helpers.js](../../../src/utils/ui-helpers.js) — never call raw `document.startViewTransition()` directly.
- **Directive Isolation**: Never combine `view-transition-name` with Svelte `transition:`, `in:`, or `out:` directives on the same DOM node.

## 7. Token Compilation, Audits & Visual Inspection

1. **Compile Tokens**: Run `npm run sync:css` (`node .agents/skills/design/scripts/sync-css.js`) after editing `DESIGN.md` to regenerate `src/media/design.css` and `src/media/tokens.js` (also invoked automatically by `designTokenSync()` in `vite.config.js`). Every entry in `signatures` and `PALETTE` must reference a `#hex` color token. Use `npm run test:sync` to run `sync-css.test.js`, or `npm run sync` for full repo sync (`sync:ignores` + `sync:css` + `sync:gates`). All CLI scripts support `--help`.
2. **Audit Design Compliance**:
   - `npm run audit:design`: Runs `audit-design.js` (exits `1` on `[HERESY]` rules such as hover `translateY`, legacy `--spacing-<num>`, or hallucinated `var(--*)` variables; prints `[ADVICE]` and `[DEBT]` unused-token diagnostics) and `audit-google-design.js` (`npx designmd lint`, exits `1` on broken reference `errors > 0`, warnings non-blocking).
   - `npm run lint`: Runs ESLint (`better-tailwindcss/no-unknown-classes`) and Stylelint.
   - `npm run verify`: Full gate (`lint`, `audit`, `test`) before finalizing work.
3. **Browser & Stitch Workflows**:
   - **Browser Verification**: Launch `npm run dev` (`http://localhost:4001`) or `npm run preview` (`http://localhost:8080`) and inspect via `chrome-devtools` MCP whenever modifying layout structure, modal overlays, view-transition groups, or responsive behavior at `320px` / `< 48rem` / desktop widths to verify zero visual bleed and `< 0.1` CLS.
   - **Stitch Prompt Structure**: When authoring screens for Stitch (`stitch` skill / `StitchMCP`), document each functional block with `## [Screen]`, `### [Area]`, `- **Description**:`, `- **Intent**:`, and `- **Tokens**:` referencing exact `DESIGN.md` frontmatter keys.

## 8. Bright-Line Constraints & Verification Checklist

- **NEVER** edit `src/media/design.css` or `src/media/tokens.js` by hand.
- **NEVER** invent `.no-scrollbar` or unregistered CSS classes without defining `@utility` in `DESIGN.md` or whitelisting in `eslint.config.js`.
- **NEVER** call raw `document.startViewTransition()` or mix `view-transition-name` with Svelte transition directives.
- **NEVER** import raw `bits-ui` directly inside feature views when a wrapper exists in `src/ui/primitives/`.
- **ALWAYS** apply `min-w-0` + `wrap-anywhere` on flex/grid text columns, `shrink-0` on avatars/icons, and `style="display: flex;"` on modal `<header>`/`<footer>` containers.

### Counter-Rationalization Table

| Rationalization                                                | Required Action                                                                                                                                               |
| :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"Quick one-line tweak in design.css / tokens.js"`             | Edit `DESIGN.md` and run `npm run sync:css`; Vite/CI overwrites manual edits.                                                                                 |
| `"This badge can use solid bg-(--signature-color) text-white"` | Bright signatures (`#fde047`, `#fbbf24`, `#84cc16`) fail `4.5:1`; use translucent `color-mix()` wells or dark `--color-chalk` ink.                            |
| `"Demo data fits cleanly; no need to stress-test"`             | Run the 3-phase protocol in [break-ui.md](./references/adversarial/break-ui.md) with [worst-case-catalog.md](./references/adversarial/worst-case-catalog.md). |
| `"Need a new modal animation curve here"`                      | Hand off to [motion/SKILL.md](../motion/SKILL.md) instead of inventing raw CSS curves in `design`.                                                            |

### Verification Checklist

- [ ] New or modified components follow [references/anti-slop.md](./references/anti-slop.md) dark-surface, contrast, and token rules.
- [ ] All dynamic slots survive Phase 2 adversarial inputs from [worst-case-catalog.md](./references/adversarial/worst-case-catalog.md) (no horizontal overflow at `320px`, `< 48rem`, or `200%` zoom).
- [ ] `npm run sync:css` and `npm run test:sync` pass if `DESIGN.md` changed.
- [ ] `npm run audit:design` and `npm run verify` exit `0`.
- [ ] Browser layout & CLS (`< 0.1`) inspected via `chrome-devtools` on modified views/modals (`:4001` or `:8080`).
