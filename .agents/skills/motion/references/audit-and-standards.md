# Motion Audit & Standards

Measurable animation principles, reduced-motion architecture, terminology, and severity scoring calibrated to `DESIGN.md` and `src/media/motion.svelte.js`.

## 1. Purpose Test & Documented Exceptions

Before adding or keeping motion, apply the decision test:

- **Animate when** motion clarifies spatial origin (`origin-(--transform-origin)`), bridges identity across views (`view-transition-name`), confirms physical press (`active:scale-sink`), or transfers card state (`Storyboard` <-> `Storymode` / `EntityCard`).
- **Spot missing motion** on abrupt dialog pops, teleporting entity swaps lacking View Transition slots, height snaps lacking CSS Grid collapse, or silent controls missing tactile press feedback.
- **Cut motion immediately** on high-frequency typing, keyboard repeat shortcuts, live LLM token streaming (`Turn 2`), and continuous desktop hover transforms in themes (`audit-design.js` `THEME_HOVER_TRANSFORM`).
- **Strictly damped physics**: Settle smoothly with zero bounce (`--ease-drawer`, `--ease-out`, `--ease-in-out`, `--spring-damping-default: 0.8`). Zero underdamped spring overshoot in RPGlitch UI.

### Documented RPGlitch Exceptions

- **`fly_card_out` (`EXIT_EASE`)**: Uses module constant `cubic-bezier(0.4, 0, 1, 1)` in JS solely when returning swapped cards to the deck; `.css`/`.svelte` UI controls must still avoid `ease-in` (`MOTION_EASE_IN`).
- **`cover_flight` (`motion.svelte.js`)**: Uses `requestAnimationFrame` to lerp `left`, `top`, `width`, `height` on an isolated `position: fixed` clone so `object-cover` portraits crop cleanly without aspect stretching.
- **`PICKUP_EASE` / `GLIDE_EASE` & `message--prologue`**: Internal clone lift/glide curves in `src/media/motion.svelte.js` and `@utility message--prologue` (`650ms var(--ease-out)`) govern card-to-prologue choreography; `Console.svelte` uses `duration-500 ease-in-out` for heavy drawer resizing.

## 2. Three-Layer Reduced Motion Architecture

Verify all three layers when auditing reduced-motion compliance:

1. **CSS Layer (`DESIGN.md`)**: `@media (prefers-reduced-motion: reduce)` forces `animation-duration: 0.01ms !important`, `animation-iteration-count: 1 !important`, `scroll-behavior: auto !important`, and `::view-transition-* { animation-duration: 0.01ms !important; }`. Note: `DESIGN.md` does **not** override CSS `transition-duration` globally.
2. **Engine Layer (`@media`)**: `motion.is_reduced` tracks `(prefers-reduced-motion: reduce)`, automatically suppressing kinetic actions (`pulse`, `roll`, `shimmy`, `stab`), collapsing Svelte transition helper durations (`overlay_in`, `overlay_out`, `item_in`) to `0`, and bypassing `fly_storyboard_cards_into_prologue`.
3. **Caller & Component Layer**: Programmatic clone flights (`fly_card_in`, `fly_card_out`) and custom Tailwind `duration-*` transitions (such as drawers or non-profile `Backdrop` `fade(150)`) do not consult CSS `animation-duration`; callers must gate `fly_card_in` / `fly_card_out` explicitly with `if (!motion.is_reduced)`.

## 3. Core Engineering Glossary (10 Terms)

| Term                                     | RPGlitch Definition                                                                                                                                                                       |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interruptibility**                     | Canceling active WAAPI handles on re-entry (`pulse`, `shimmy`, `stab`), retargeting `Spring` smoothly (`roll`), and serializing prologue transfers via `_begin_flight_running`.           |
| **Origin-Aware Entrance**                | Anchoring floating overlays to trigger edges (`origin-(--transform-origin)` in `Tooltip.svelte`) and scaling from `0.95` — never `scale(0)`.                                              |
| **Critically Damped**                    | Zero-bounce settling curves (`--ease-drawer`, damping `0.8`) rather than oscillatory overshoot.                                                                                           |
| **Clone Card Flight**                    | Capturing bounding geometry (`rect_of`) and driving isolated fixed `document.body` clones via CSS transitions (`fly_card_in`, `fly_card_out`) or `rAF` crop lerp (`cover_flight`).        |
| **View Transition Slot**                 | Cross-DOM morphing via `guarded_transition(cb, { className })` + canonical `view-transition-name`s (`card-slot-*`, `entity-morph-fractal`, `unified-console`).                            |
| **Compositor-Only Property**             | Preferring `transform`, `opacity`, `clip-path`, and `grid-template-rows` over layout box properties (`width`, `height`, `top`, `left`, `margin`, `padding`).                              |
| **Asymmetric Pacing**                    | Exits finish faster than entrances (`overlay_out` `160ms` vs `overlay_in` `300ms`) so dismissals never lag behind user intent.                                                            |
| **Kinetic Suppression (`data-kinetic`)** | Setting `node.dataset.kinetic = "true"` so `Button.svelte` strips `transform` from CSS transitions without losing color/shadow feedback.                                                  |
| **Stagger Discipline**                   | Intentional card stagger (`Storyboard.svelte` `90ms` index delay; `fly_storyboard_cards_into_prologue` `110ms`) kept bounded so multi-card sequences stay under ~780ms.                   |
| **Layer-Scoped Backdrop Blur**           | Pairing `--color-glass-*` surfaces with `--blur-mist` (`16px`) / backdrop blur utilities cleanly on fixed overlays without stacking heavy redundant filter passes on animated text nodes. |

## 4. Audit Protocol & Severity Rubric

Run `npm run audit:design` first (`THEME_HOVER_TRANSFORM` is blocking `[HERESY]`; `MOTION_*` rules emit non-blocking `[ADVICE]` in `.css`/`.svelte`), then inspect components and `@media` usage:

### P0 — Critical (Fix Immediately)

- Broken reduced-motion handling (`fly_card_in`/`fly_card_out` missing `motion.is_reduced` guard, kinetic actions ignoring `motion.is_reduced`, raw `document.startViewTransition` bypassing `guarded_transition()`).
- Frozen ghosts or leaks: mixing `view-transition-name` with Svelte `transition:` / `in:` / `out:` on the same node, uncleaned `$effect.root`, blocking pointer events on exiting backdrops, or concurrent overlapping prologue flights.

### P1 — Craft & Token Defect

- `npm run audit:design` `[HERESY]` or unaddressed `[ADVICE]` (`THEME_HOVER_TRANSFORM`, `MOTION_SCALE_ZERO`, `MOTION_TRANSITION_ALL`, `MOTION_EASE_IN`, `MOTION_LAYOUT_PROPS`), unregistered class names failing ESLint `better-tailwindcss/no-unknown-classes`.
- Hardcoded timing strings when `DESIGN.md` tokens exist, missing duration tokens in inline CSS `transition:` strings (`var(--ease-drawer)` alone resolves to `0s`), or uninterruptible animation triggers.

### P2 — Polish

- High-frequency typing/streaming lag from unnecessary motion, symmetric exit durations that feel sluggish, or minor timing mismatches against Tier 1 (`<= 300ms`) / Tier 2 (`300–500ms` single-phase) targets.

### Audit Output Schema

```text
[P0|P1|P2] <file:line> — <Violation / Token mismatch>
Fix: <Minimal replacement using DESIGN.md tokens, @media, or guarded_transition>
```
