---
name: motion
description: >-
  UI motion choreography, tactile physics, easing curves, View Transitions, and reduced-motion enforcement in RPGlitch. Use when implementing, modifying, or auditing CSS transitions/keyframes from DESIGN.md, @media kinetic actions and card flights in src/media/motion.svelte.js (pulse, roll, shimmy, stab, overlay_in, overlay_out, item_in, fly_card_in, fly_card_out, capture_storyboard_flight, fly_storyboard_cards_into_prologue, update_card_scrub, clear_card_location), guarded_transition() View Transitions, or prefers-reduced-motion compliance. Do NOT use for static DESIGN.md tokens, typography, or .proto-picker prototyping (use design), Web Audio SFX or speech synthesis (use audio), general non-motion Svelte 5 runes (use svelte), or turn/simulation logic (use simulation).
---

# Kinetic & Interactive Motion Governance

**Role**: Motion & Interaction Engineer  
**Objective**: Deliver responsive, accessible, compositor-first UI choreography backed by `DESIGN.md` tokens, `src/media/motion.svelte.js` (`@media`), and `guarded_transition()` (`@utils`).

## 1. Mandatory Pre-Flight & Pitfalls Check

> **CRITICAL**: Read [PITFALLS.md](./PITFALLS.md) before modifying any CSS transition, Svelte `in:`/`out:`/`transition:` directive, `@media` motion helper, or View Transition.

### Reference Map

- [PITFALLS.md](./PITFALLS.md) — Empirical scar tissue (VT snapshot conflicts, CSS vs animation reduced-motion scope, Tailwind class gates, `fly_card_*` contracts, `Button.svelte` suppression).
- [references/audit-and-standards.md](./references/audit-and-standards.md) — Purpose decision test, damped physics rules, 3-layer reduced-motion model, 10-term glossary, and `P0`–`P2` audit rubric.
- [references/recipes.md](./references/recipes.md) — Verified RPGlitch Svelte 5 + Tailwind v4 + `@primitives` + `@media` patterns.
- Core workspace contracts: [DESIGN.md](../../../DESIGN.md), [src/media/README.md](../../../src/media/README.md), and [src/media/motion.svelte.js](../../../src/media/motion.svelte.js).

## 2. Scope, When to Skip & Exclusivity Boundary

- **Motion Scope**: Transition curves, duration budgets, `@media` kinetic actions and transitions, clone card flights, `guarded_transition()` View Transitions, `prefers-reduced-motion`, and motion audits.
- **When to Skip**: Skip when styling static surfaces/colors, adjusting layout typography, implementing Web Audio/TTS, or mutating simulation turns.
- **Exclusions**:
  - [design](../design/SKILL.md): Static design tokens, color palettes, glass surfaces, and `.proto-picker` multi-variant prototyping.
  - [audio](../audio/SKILL.md): Procedural Web Audio SFX and Web Speech playback.
  - [simulation](../simulation/SKILL.md): Turn phases, round transitions, and narrative state mutations.
  - Global `svelte` & `javascript` skills: Svelte 5 Runes architecture and non-UI engine utilities.

## 3. Canonical DESIGN.md Motion Tokens & View Transitions

Edit motion primitives strictly in [DESIGN.md](../../../DESIGN.md) and run `npm run sync:css` to recompile `src/media/design.css` and `src/media/tokens.js`. Inside JS helpers, read CSS custom properties via `@utils` (`resolve_ms`, `resolve_string`, `resolve_number`).

| Category | Authoritative Tokens & Values |
| :-- | :-- |
| **Durations** | `--duration-fast: 150ms`, `--duration-standard: 300ms`, `--duration-slow: 500ms`, `--duration-ambient: 2000ms` |
| **Easings & Shorthands** | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, `--motion-dissolve`, `--motion-elastic` |
| **Scales & Springs** | `--scale-lift: "1.02"`, `--scale-pulse: "1.05"`, `--scale-sink: "0.97"`, `--spring-stiffness-default: "0.15"`, `--spring-damping-default: "0.8"` |
| **Kinetic Spacing** | `--spacing-kinetic-shimmy-offset` (`1px`), `--spacing-kinetic-shimmy-y` (`0.5px`), `--spacing-kinetic-stab-distance` (`0.25rem`) |
| **Keyframes & T4 Utilities** | `noise-breathing`, `fade-in`, `wing-item-slide-down`, `undo-countdown-shrink`, `card-swap-decay`, `card-swap-ascent`, `profile-flip-out`, `profile-flip-in`, `@utility message--prologue`, `@utility prologue-awaiting-flight` |
| **View-Transition Slots** | `card-slot-ai`, `card-slot-user`, `card-slot-fractal`, `entity-morph-fractal`, `unified-console`; root classes `is-switching-view`, `is-swapping-card`, `is-profile-opening-${type}`, `is-profile-closing-${type}` |

- **Two-Tier Motion Budget**:
  - **Tier 1 (`<= 300ms`)**: Discrete interactive controls (`--duration-fast` `150ms` + `--ease-out` / `--ease-in-out`), floating overlays (`150ms`), and standard modal/item entrances (`overlay_in` / `item_in` `300ms` with faster `overlay_out` `160ms`).
  - **Tier 2 (`300–500ms` single-phase / up to `780ms` composite)**: View Transitions (`--duration-slow` `500ms`, `--ease-drawer`), collapsible control drawers (`duration-500`), damped `Spring` (`0.15` / `0.8`), and clone card flights (`380–420ms` glide phase; composite pickup+glide+setdown `600ms` or staggered multi-card prologue transfers up to `780ms`). Zero overshoot or bounce.
- **View Transition Discipline**: Wrap every view switch, card swap, or profile morph in `guarded_transition(callback, { className })` from `@utils` (flushing Svelte 5 DOM state via `flushSync()` before or inside `callback`). Note `guarded_transition` manages single-flight locking (`_transition_state.active`) and fallback execution; `DESIGN.md` `::view-transition-*` handles `prefers-reduced-motion: reduce`.

## 4. @media Motion API (`src/media/motion.svelte.js`)

Import runtime motion controllers from `@media`, respecting Rank 1 leaf boundaries (zero upward imports; see [src/media/README.md](../../../src/media/README.md)):

- **Reactive Accessibility State**: `motion` (`{ is_reduced, intensity }` — synced live to `(prefers-reduced-motion: reduce)`).
- **Kinetic Actions**: `pulse`, `roll`, `shimmy`, `stab`. `pulse`, `shimmy`, and `stab` cancel overlapping WAAPI runs; `roll` drives a damped Svelte `Spring` with `$effect.root` cleanup. All four check `motion.is_reduced` / `motion.intensity` (`roll` returns before setting `dataset.kinetic` when disabled).
- **Svelte Transitions**: `overlay_in` (`300ms`), `overlay_out` (`160ms`), `item_in` (`300ms`) — collapse duration to `0` automatically when `motion.is_reduced` is `true`. _(Backdrop's `profile_transition` is private to `src/ui/primitives/Backdrop.svelte`, not `@media`.)_
- **Clone Card Flights & Prologue Helpers**:
  - `fly_card_in(source_el, from_rect, to_rect, options)` -> `Promise<void>` (clone CSS transitions; `options`: `on_clone`, `on_land`, `pickup_ms = 90`, `glide_ms = 380`, `set_down_ms = 130`, `tag`, `z`; **caller must check `motion.is_reduced`**).
  - `fly_card_out(source_el, to_rect, options)` -> `void` (clone CSS transitions with module `EXIT_EASE`; `options`: `duration_ms = 300`, `tilt_deg = -8`, `tag`, `z`; **caller must check `motion.is_reduced`**).
  - `capture_storyboard_flight(enabled)` + `fly_storyboard_cards_into_prologue(assets, dst_rects)` -> `Promise<void>` (internally checks `motion.is_reduced`, locks concurrent runs via `_begin_flight_running`, and animates fixed clones via `rAF` `cover_flight`).
  - Static prologue & clone helpers: zero-argument `update_card_scrub()`, `clear_card_location()`, `make_card_clone()`, `rect_of()`, `strip_card_text()`.

## 5. Bright-Line Constraints & Verification

### Bright-Line Constraints

- **ALWAYS** verify utility, keyframe, and token names in [DESIGN.md](../../../DESIGN.md) or `src/media/design.css` before authoring Tailwind classes or animations.
- **ALWAYS** wrap View Transitions in `guarded_transition(callback, { className })` from `@utils` and gate `fly_card_in` / `fly_card_out` callers with `if (!motion.is_reduced)`.
- **NEVER** call raw `document.startViewTransition()` or combine `view-transition-name` with Svelte `transition:` / `in:` / `out:` directives on the same DOM element.
- **NEVER** add hover `transform` rules in theme CSS (`THEME_HOVER_TRANSFORM` [HERESY] in `audit-design.js`) or bypass `@media (hover: none), (pointer: coarse)` touch suppression.
- **NEVER** use `transition-all` (`MOTION_TRANSITION_ALL`), `scale-0` (`MOTION_SCALE_ZERO`), layout box-model CSS transitions (`MOTION_LAYOUT_PROPS`), or `ease-in` on UI controls (`MOTION_EASE_IN`, except `fly_card_out`'s JS `EXIT_EASE`), and never introduce upward imports into `src/media/motion.svelte.js`.

### Counter-Rationalization Table

| Rationalization | Required Action |
| :-- | :-- |
| `"I'll call document.startViewTransition() directly for this swap."` | Bypasses the single-flight lock, fallback handling, and root `className` scoping. Use `guarded_transition(callback, { className })`. |
| `"height: auto with CSS transition is simpler for this accordion."` | Causes layout reflow every frame. Toggle CSS Grid `grid-rows-[0fr]` / `grid-rows-[1fr]` around an `overflow-hidden` child. |
| `"@media handles reduced motion everywhere, so fly_card_out is safe."` | `fly_card_in` and `fly_card_out` execute unconditionally unless the caller checks `motion.is_reduced`. |
| `"transition-all duration-150 catches every property cleanly."` | Animates unintended layout/paint properties and triggers `MOTION_TRANSITION_ALL` advice. Transition explicit compositor properties. |
| `"Writing inline keyframes/ms in Svelte is faster than touching DESIGN.md."` | Creates drift between CSS utilities and `resolve_ms()` token readers. Update `DESIGN.md` and run `npm run sync:css`. |

### Verification Checklist

- [ ] Read [PITFALLS.md](./PITFALLS.md) before changing tokens, transitions, or View Transitions.
- [ ] Verify reduced-motion behavior across CSS `animation-duration`, `@media` `motion.is_reduced`, and manual caller guards (`fly_card_in` / `fly_card_out`, custom Tailwind `duration-*`).
- [ ] Run `npx vitest run src/media/motion.test.js src/media/transitions.test.js`.
- [ ] Run `npm run audit:design` (`0` `HERESY` violations; inspect all `ADVICE` diagnostics).
- [ ] Run `npm run verify` cleanly before marking work done.
