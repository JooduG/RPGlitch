# Motion Pitfalls & Empirical Scar Tissue

> Pre-flight failure catalog for RPGlitch motion engineering. Read every entry before modifying `DESIGN.md` motion rules, `@media` motion helpers, or View Transitions.

---

## Pitfall 1: Mixing `view-transition-name` with Svelte Transition Directives

- **Trigger**: Swapping cards, opening modals, or toggling backdrops (`EntityCard.svelte`, `Backdrop.svelte`) during `document.startViewTransition`.
- **Wrong Behavior**: Keeping `view-transition-name` bound while a clone flight runs, or placing a standard Svelte fade on a backdrop owned by a View Transition, captures overlapping snapshots and leaves frozen double ghosts.
- **Correct Behavior**: Clear `transition_name` to `undefined` (and call `style.removeProperty("view-transition-name")` on active DOM nodes) when clone flights run (`EntityCard.svelte`), and pass `class="profile"` on `<Backdrop>` so its internal 0ms `profile_transition` lets the View Transition crossfade the backdrop cleanly.

## Pitfall 2: Calling Raw `document.startViewTransition()` Instead of `guarded_transition()`

- **Trigger**: Animating view changes (`Storyboard` <-> `Storymode`), card swaps, or profile opens in UI/state controllers.
- **Wrong Behavior**: Invoking `document.startViewTransition()` directly skips the `_transition_state.active` single-flight concurrency lock, unsupported-browser synchronous fallback, `flushSync()` coordination, and `.is-switching-view` / `.is-swapping-card` / `.is-profile-*` root scoping classes.
- **Correct Behavior**: Always call `guarded_transition(callback, { className })` from `@utils` (`src/utils/ui-helpers.js`), flushing Svelte 5 DOM updates via `flushSync()` immediately before or inside `callback`.

## Pitfall 3: Unguarded `fly_card_*` Flights & CSS Transitions Under Reduced Motion

- **Trigger**: Calling `fly_card_in` / `fly_card_out`, adding custom `duration-*` transitions, or using `<Backdrop>` without `class="profile"`.
- **Wrong Behavior**: Assuming all `@media` functions and `DESIGN.md` media queries suppress every animation. `fly_card_in` and `fly_card_out` run clone CSS transitions unconditionally without checking `motion.is_reduced`, and `DESIGN.md` sets `0.01ms !important` only on `animation-duration` and `::view-transition-*` — not CSS `transition-duration` or non-profile `Backdrop` `fade(150)`.
- **Correct Behavior**: Gate `fly_card_in` / `fly_card_out` calls with `if (!motion.is_reduced)` (`Storyboard.svelte`), and explicitly handle `motion.is_reduced` on continuous/custom CSS `transition-*` elements when instant suppression is required.

## Pitfall 4: Static Scanner & Tailwind Class Rejections (`audit-design.js` & ESLint)

- **Trigger**: Authoring hover transforms, popovers, accordions, easing classes, or custom utility names in `.css` / `.svelte` files.
- **Wrong Behavior**: Writing hover `transform` rules in themes (`THEME_HOVER_TRANSFORM` blocking `[HERESY]`), triggering `audit-design.js` `[ADVICE]` rules (`scale-0` `MOTION_SCALE_ZERO`, `transition-all` `MOTION_TRANSITION_ALL`, `ease-in` `MOTION_EASE_IN`, inline `transition: width/height/top/left/margin/padding` `MOTION_LAYOUT_PROPS`), or writing unregistered utility/keyframe names absent from `DESIGN.md` / `src/media/design.css` (rejected by `better-tailwindcss/no-unknown-classes`).
- **Correct Behavior**: Use compiled `DESIGN.md` utilities (`duration-(--duration-fast)`, `ease-(--ease-drawer)`, `active:scale-sink`), start floating overlays at `scale` `0.95`, build collapsible panels with CSS Grid `grid-rows-[0fr]` / `grid-rows-[1fr]`, and verify with `npm run audit:design`.

## Pitfall 5: CSS Hover Transitions Fighting Kinetic Actions & Missing Duration Shorthands

- **Trigger**: Attaching `pulse`, `roll`, `shimmy`, or `stab` to interactive buttons (`Button.svelte`), or writing inline CSS `transition:` strings (`Profile.svelte`).
- **Wrong Behavior**: Allowing CSS `transition-[...,transform,...]` to fight active WAAPI/Spring transforms produces rubbery jitter; passing only `var(--ease-drawer)` in an inline CSS `transition:` string leaves `transition-duration` at `0s`.
- **Correct Behavior**: Keep interactive primitives aligned with `Button.svelte`'s kinetic suppression selectors (`data-[kinetic=true]:active:scale-100 data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]` and `hover:scale-100` on flank controls), and always pair duration + easing tokens in inline CSS transitions (e.g. `var(--duration-standard) var(--ease-drawer)`).

## Pitfall 6: Uncleaned `$effect.root`, Animation Races, or Overlapping Flights

- **Trigger**: Implementing Spring-driven actions (`roll`), rapidly re-hovered WAAPI actions (`pulse`, `shimmy`, `stab`), or rapid Storyboard -> Prologue transitions (`fly_storyboard_cards_into_prologue`).
- **Wrong Behavior**: Spawning `$effect.root` without invoking its disposer in `destroy()`, letting hover triggers clash with active return animations, treating synchronous `fly_card_out` (`returns void`) as awaitable, or launching overlapping fixed-clone prologue transfers.
- **Correct Behavior**: Invoke the `cleanup_effect` disposer in `destroy()`, cancel active WAAPI handles before launching replacements, synchronize prologue transfers with `_begin_flight_running`, and avoid awaiting `fly_card_out`.
