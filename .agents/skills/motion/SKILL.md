---
name: motion
description: >-
  UI motion choreography, easing curves, View Transitions, and reduced-motion enforcement in RPGlitch (`src/media/motion.svelte.js`). Use when modifying `DESIGN.md` transitions/keyframes, `@media` kinetic actions (`pulse`, `roll`, `shimmy`, `stab`), card flights (`fly_card_*`, storyboard flights), or `guarded_transition()`. Do NOT use for static tokens/layouts (`design`), SFX/TTS (`audio`), simulation turns (`simulation`), or general runes (`svelte`).
---

# Kinetic & Interactive Motion Governance

## 1. Mandatory Pre-Flight & Reference Map

> **CRITICAL**: Read [PITFALLS.md](./PITFALLS.md) before modifying any CSS transition, Svelte `in:`/`out:`/`transition:` directive, `@media` motion helper, or View Transition.

- [PITFALLS.md](./PITFALLS.md) — Empirical scar tissue (View Transition snapshot conflicts, reduced-motion scope, Tailwind class gates, `fly_card_*` contracts, `Button.svelte` suppression, `$effect.root`/race cleanup, overlay-to-overlay handoffs, non-morph View Transitions, and `$effect`/`requestAnimationFrame`/`setTimeout` mount state machines).
- [references/audit-and-standards.md](./references/audit-and-standards.md) — Canonical `DESIGN.md` token/budget reference, purpose decision test, 3-layer reduced-motion model, numeric thresholds, and `P0`–`P2` audit rubric.
- [references/recipes.md](./references/recipes.md) — Verified RPGlitch Svelte 5 + Tailwind v4 + `@primitives` + `@media` patterns.
- Core workspace contracts: [DESIGN.md](../../../DESIGN.md), [src/media/README.md](../../../src/media/README.md), [src/media/motion.svelte.js](../../../src/media/motion.svelte.js).

Sibling skills (out of scope): [design](../design/SKILL.md), [audio](../audio/SKILL.md), [simulation](../simulation/SKILL.md).

## 2. The 5-Lane Animation Engine Partition Map

Every UI motion in RPGlitch belongs to **exactly one lane**. Cross-lane contamination is prohibited:

| Lane | Domain | Permitted Technologies | Strict Invariant |
| :-- | :-- | :-- | :-- |
| **Lane 1** | Persistent In-Place State | CSS transitions, Tailwind tokens (`duration-fast`, `ease-out`), CSS Grid (`grid-rows-[0fr]` / `grid-rows-[1fr]`) | **NEVER** use `$effect`, `requestAnimationFrame`, or `setTimeout` to toggle CSS transition classes. |
| **Lane 2** | Tactile Micro-Impulses | `@media` WAAPI & Spring actions (`pulse`, `roll`, `shimmy`, `stab`) | **ALWAYS** set `node.dataset.kinetic = "true"` so `Button.svelte` strips CSS `transform` conflicts. |
| **Lane 3** | Conditional Mount Surfaces | Svelte `in:` / `out:` / `transition:` directives (`overlay_in`, `overlay_out`, `item_in`) | **NEVER** manage entry/exit states with paired `$state` booleans (`render_active` + `is_visible`), `requestAnimationFrame`, and `setTimeout`. |
| **Lane 4** | Spatial Card & View Transfers | `guarded_transition()` (for View Transition slots) OR `fly_card_*` / `fly_storyboard_cards_into_prologue()` (for clone flights) | **NEVER** invoke `guarded_transition()` inside child components (e.g., `EntityCard`); only parent routers/controllers trigger View Transitions. |
| **Lane 5** | Inter-Surface Handoffs | Snap-close (`duration: 0` or fast `150ms` exit) or stationary background stacking during overlay handoffs | **NEVER** animate two blurred backdrops or slide/fade a drawer and a modal simultaneously on the same tick. |

## 3. Tokens & `@media` Runtime Contract

- **Tokens**: Edit motion primitives strictly in [DESIGN.md](../../../DESIGN.md) and run `npm run sync:css` to compile `src/media/design.css` and `src/utils/tokens.js`. Use `DESIGN.md` motion tokens (`--transition-duration-*`, `--ease-*`, `--spring-*`) via `resolve_ms`, `resolve_string`, and `resolve_number` from `@utils` — see [references/audit-and-standards.md](./references/audit-and-standards.md) for the full token and Two-Tier Motion Budget tables.
- **View Transitions**: Wrap every root view switch, card swap, or profile morph in `guarded_transition(callback, { className })` from `@utils`, flushing Svelte 5 DOM state via `flushSync()`. `DESIGN.md` `::view-transition-*` enforces `prefers-reduced-motion: reduce`.
- **`@media` Exports** (`src/media/motion.svelte.js`, Rank 1 leaf — zero upward imports):
  - `motion` (`{ is_reduced, intensity }` synced live to `(prefers-reduced-motion: reduce)`).
  - Kinetic actions: `pulse`, `roll`, `shimmy`, `stab` (all four are suppressed when `motion.is_reduced` is `true`; `roll` returns before setting `dataset.kinetic`).
  - Svelte transitions: `overlay_in` (`300ms`), `overlay_out` (`160ms`), `item_in` (`300ms`) — auto-collapse to `0ms` when `motion.is_reduced` is `true`.
  - Clone flights & helpers: `fly_card_in()`, `fly_card_out()`; `capture_storyboard_flight()` + `fly_storyboard_cards_into_prologue()` (internally guarded); zero-argument prologue helpers `update_card_scrub()`, `clear_card_location()`; clone helpers `make_card_clone()`, `rect_of()`, `strip_card_text()`. See [references/recipes.md](./references/recipes.md).

## 4. Bright-Line Constraints & Verification

- **ALWAYS** verify utility, keyframe, and token names in [DESIGN.md](../../../DESIGN.md) or `src/media/design.css` before authoring Tailwind classes or animations.
- **ALWAYS** gate `fly_card_in` / `fly_card_out` callers with `if (!motion.is_reduced)` and ensure any `setTimeout` fallback paired with `animationend`/`transitionend` exceeds the CSS duration (e.g., `CSS_DURATION + 50ms`).
- **NEVER** call raw `document.startViewTransition()` or combine `view-transition-name` with Svelte `transition:` / `in:` / `out:` directives on the same DOM element.
- **NEVER** add hover `transform` rules in theme CSS (`THEME_HOVER_TRANSFORM` `[HERESY]` in `audit-design.js`) or bypass `@media (hover: none), (pointer: coarse)` touch suppression.
- **NEVER** use `transition-all` (`MOTION_TRANSITION_ALL`), `scale-0` (`MOTION_SCALE_ZERO`), layout box-model CSS transitions (`MOTION_LAYOUT_PROPS`), or `ease-in` on UI controls (`MOTION_EASE_IN`, except `fly_card_out`'s JS `EXIT_EASE`).

### Verification Checklist

- [ ] Verify reduced-motion behavior across CSS `animation-duration`, `@media` `motion.is_reduced`, and manual caller guards (`fly_card_in` / `fly_card_out`, custom Tailwind `duration-*`).
- [ ] Run `npx vitest run src/media/motion.test.js`.
- [ ] Run `npm run audit:design` (`0` `HERESY` violations; inspect all `ADVICE` diagnostics).
- [ ] Run `npm run verify` cleanly before marking work done.
