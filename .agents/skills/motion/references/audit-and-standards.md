# Motion Audit & Standards

Measurable animation principles, canonical tokens, reduced-motion architecture, numeric thresholds, and severity scoring calibrated to `DESIGN.md` and `src/media/motion.svelte.js`.

## 1. Canonical `DESIGN.md` Tokens & Two-Tier Motion Budget

| Category | Authoritative Tokens & Values |
| :-- | :-- |
| **Durations** | `--transition-duration-fast: 150ms` (`duration-fast`), `--transition-duration-standard: 300ms` (`duration-standard`), `--transition-duration-slow: 500ms` (`duration-slow`), `--transition-duration-ambient: 2000ms` (`duration-ambient`) |
| **Easings & Shorthands** | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, `--motion-dissolve`, `--motion-elastic` |
| **Scales & Springs** | `--scale-lift: 1.02`, `--scale-pulse: 1.05`, `--scale-sink: 0.97`, `--spring-stiffness-default: 0.15`, `--spring-damping-default: 0.8` |
| **Kinetic Spacing** | `--spacing-kinetic-shimmy-offset` (`1px`), `--spacing-kinetic-shimmy-y` (`0.5px`), `--spacing-kinetic-stab-distance` (`0.25rem`) |
| **Keyframes & T4 Utilities** | `noise-breathing`, `fade-in`, `wing-item-slide-down`, `undo-countdown-shrink`, `card-swap-decay`, `card-swap-ascent`, `profile-flip-out`, `profile-flip-in`, `@utility message--prologue`, `@utility prologue-awaiting-flight` |
| **View-Transition Slots** | `card-slot-ai`, `card-slot-user`, `card-slot-fractal`, `entity-morph-fractal`, `unified-console`; root classes `is-switching-view`, `is-swapping-card`, `is-profile-opening-${type}`, `is-profile-closing-${type}` |

- **Tier 1 (`<= 300ms`)**: Discrete interactive controls (`--transition-duration-fast` `150ms` + `--ease-out` / `--ease-in-out`), floating overlays (`150ms`), and standard modal/item entrances (`overlay_in` / `item_in` `300ms` with faster `overlay_out` `160ms`).
- **Tier 2 (`300–500ms` single-phase / up to `780ms` composite)**: View Transitions (`--transition-duration-slow` `500ms`, `--ease-drawer`), collapsible control drawers (`duration-500`), damped `Spring` (`0.15` / `0.8`), and clone card flights (`380–420ms` glide phase; composite pickup+glide+setdown `600ms` or staggered multi-card prologue transfers up to `780ms`). Zero overshoot or bounce.

## 2. Purpose Test & Documented Exceptions

Before adding or keeping motion, apply the decision test:

- **Animate when** motion clarifies spatial origin (`origin-(--transform-origin)`), bridges identity across views (`view-transition-name`), confirms physical press (`active:scale-sink`), or transfers card state (`Storyboard` <-> `Storymode` / `EntityCard`).
- **Spot missing motion** on abrupt dialog pops, teleporting entity swaps lacking View Transition slots, height snaps lacking CSS Grid collapse, or unresponsive controls missing tactile press feedback.
- **Cut motion immediately** on high-frequency typing, keyboard repeat shortcuts, live LLM token streaming (`Turn 2`), and continuous desktop hover transforms in themes (`audit-design.js` `THEME_HOVER_TRANSFORM`).
- **Strictly damped physics**: Settle smoothly with zero bounce (`--ease-drawer`, `--ease-out`, `--ease-in-out`, `--spring-damping-default: 0.8`). Zero underdamped spring overshoot in RPGlitch UI.

### Documented RPGlitch Exceptions

- **`fly_card_out` (`EXIT_EASE`)**: Uses module constant `cubic-bezier(0.4, 0, 1, 1)` in JS solely when returning swapped cards to the deck; `.css`/`.svelte` UI controls must still avoid `ease-in` (`MOTION_EASE_IN`).
- **`cover_flight` (`motion.svelte.js`)**: Uses `requestAnimationFrame` to lerp `left`, `top`, `width`, `height` on an isolated `position: fixed` clone so `object-cover` portraits crop without aspect stretching.
- **`PICKUP_EASE` / `GLIDE_EASE` & `message--prologue`**: Internal clone lift/glide curves in `src/media/motion.svelte.js` and `@utility message--prologue` (`650ms var(--ease-out)`) govern card-to-prologue choreography; `Console.svelte` uses `duration-500 ease-in-out` for drawer resizing.

## 3. Three-Layer Reduced Motion Architecture

Verify all three layers when auditing reduced-motion compliance:

1. **CSS Layer (`DESIGN.md`)**: `@media (prefers-reduced-motion: reduce)` sets `animation-duration: 0.01ms`, `animation-iteration-count: 1`, `scroll-behavior: auto`, and `::view-transition-* { animation-duration: 0.01ms; }`. `DESIGN.md` does **not** override CSS `transition-duration` globally.
2. **Engine Layer (`@media`)**: `motion.is_reduced` tracks `(prefers-reduced-motion: reduce)`, automatically suppressing kinetic actions (`pulse`, `roll`, `shimmy`, `stab`), collapsing Svelte transition helper durations (`overlay_in`, `overlay_out`, `item_in`) to `0`, and bypassing `fly_storyboard_cards_into_prologue`.
3. **Caller & Component Layer**: Programmatic clone flights (`fly_card_in`, `fly_card_out`) and custom Tailwind `duration-*` transitions (such as drawers or non-profile `Backdrop` `fade(150)`) are not suppressed by the CSS `animation-duration` override; callers must gate `fly_card_in` / `fly_card_out` explicitly with `if (!motion.is_reduced)`.

## 4. Quantitative Audit Thresholds

| Metric / Rule | Threshold / Target |
| :-- | :-- |
| **Origin-Aware Entrance** | Scale from `0.95` anchored via `origin-(--transform-origin)` — never `scale(0)`. |
| **Compositor-Only Property** | Prefer `transform`, `opacity`, `clip-path`; use `grid-template-rows` (`0fr` -> `1fr`) solely for CSS Grid accordion collapse instead of `width`/`height`/`top`/`left`/`margin`/`padding`. |
| **Asymmetric Pacing** | Exits finish faster than entrances (`overlay_out` `160ms` vs `overlay_in` `300ms`) so dismissals clear immediately. |
| **Stagger Discipline** | Card stagger (`Storyboard.svelte` `90ms` index delay; `fly_storyboard_cards_into_prologue` `110ms`) kept bounded so multi-card sequences stay under `780ms`. |
| **Fallback Timer Margin** | Any `setTimeout` fallback paired with `animationend`/`transitionend` must be `> CSS_DURATION` (e.g., `CSS_DURATION + 50ms`). |
| **Layer-Scoped Backdrop Blur** | Pair `--color-glass-*` with `--blur-mist` (`16px`) on fixed overlays; never stack simultaneous blurred backdrop transitions over moving geometry. |

## 5. Audit Protocol & Severity Rubric

Run `npm run audit:design` first (`THEME_HOVER_TRANSFORM` is blocking `[HERESY]`; `MOTION_*` rules emit non-blocking `[ADVICE]` in `.css`/`.svelte`), then inspect components and `@media` usage:

- **P0 — Critical (Fix Immediately)**: Unguarded `fly_card_in`/`fly_card_out`, kinetic actions ignoring `motion.is_reduced`, raw `document.startViewTransition` bypassing `guarded_transition()`, non-morph View Transitions on action controls, mixing `view-transition-name` with Svelte transitions, uncleaned `$effect.root`, manual `$effect`+`requestAnimationFrame`+`setTimeout` mount state machines, or concurrent blurred overlay handoff collisions.
- **P1 — Craft & Token Defect**: `npm run audit:design` `[HERESY]` or unaddressed `[ADVICE]`, unregistered Tailwind classes failing `better-tailwindcss/no-unknown-classes`, `--duration-*` instead of `--transition-duration-*`, missing duration tokens in inline CSS `transition:` strings, or fallback `setTimeout <= CSS_DURATION`.
- **P2 — Polish**: High-frequency typing/streaming lag from unnecessary motion, symmetric exit durations, or minor timing mismatches against Tier 1 (`<= 300ms`) / Tier 2 (`300–500ms`) budgets.
