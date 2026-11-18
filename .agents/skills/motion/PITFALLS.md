# Motion Pitfalls & Empirical Scar Tissue

> Pre-flight failure catalog for RPGlitch motion engineering. Read every entry before modifying `DESIGN.md` motion rules, `@media` motion helpers, or View Transitions.

---

## Pitfall 1: Mixing `view-transition-name` with Svelte Transition Directives

- **Trigger**: Swapping cards, opening modals, or toggling backdrops (`EntityCard.svelte`, `Backdrop.svelte`) during `document.startViewTransition`.
- **Wrong Behavior**: Keeping `view-transition-name` bound while a clone flight runs, or placing a standard Svelte fade on a backdrop owned by a View Transition, captures overlapping snapshots and leaves frozen double ghosts.
- **Correct Behavior**: Clear `transition_name` to `undefined` (and call `style.removeProperty("view-transition-name")` on active DOM nodes) when clone flights run (`EntityCard.svelte`), and pass `class="profile"` on `<Backdrop>` so its internal 0ms `profile_transition` lets the View Transition crossfade the backdrop.

## Pitfall 2: Calling Raw `document.startViewTransition()` Instead of `guarded_transition()`

- **Trigger**: Animating view changes (`Storyboard` <-> `Storymode`), card swaps, or profile opens in UI/state controllers.
- **Wrong Behavior**: Invoking `document.startViewTransition()` directly skips the `_transition_state.active` single-flight concurrency lock, unsupported-browser synchronous fallback, `flushSync()` coordination, and `.is-switching-view` / `.is-swapping-card` / `.is-profile-*` root scoping classes.
- **Correct Behavior**: Always call `guarded_transition(callback, { className })` from `@utils` (`src/utils/ui-helpers.js`), flushing Svelte 5 DOM updates via `flushSync()` immediately before or inside `callback`.

## Pitfall 3: Unguarded `fly_card_*` Flights & CSS Transitions Under Reduced Motion

- **Trigger**: Calling `fly_card_in` / `fly_card_out`, adding custom `duration-*` transitions, or using `<Backdrop>` without `class="profile"`.
- **Wrong Behavior**: Assuming all `@media` functions and `DESIGN.md` media queries suppress every animation. `fly_card_in` and `fly_card_out` run clone CSS transitions unconditionally without checking `motion.is_reduced`, and `DESIGN.md` sets `0.01ms` only on `animation-duration` and `::view-transition-*` — not CSS `transition-duration` or non-profile `Backdrop` `fade(150)`.
- **Correct Behavior**: Gate `fly_card_in` / `fly_card_out` calls with `if (!motion.is_reduced)` (`Storyboard.svelte`), and explicitly handle `motion.is_reduced` on continuous/custom CSS `transition-*` elements when instant suppression is required.

## Pitfall 4: Static Scanner Rejections & Token Drift (`audit-design.js`, ESLint, `--transition-duration-*`)

- **Trigger**: Authoring hover transforms, popovers, accordions, easing classes, `resolve_ms()` calls, or custom utility names in `.css` / `.svelte` / `.js` files.
- **Wrong Behavior**: Writing hover `transform` rules in themes (`THEME_HOVER_TRANSFORM` blocking `[HERESY]`); triggering `audit-design.js` `[ADVICE]` rules (`scale-0` `MOTION_SCALE_ZERO`, `transition-all` `MOTION_TRANSITION_ALL`, `ease-in` `MOTION_EASE_IN`, inline `transition: width/height/top/left/margin/padding` `MOTION_LAYOUT_PROPS`); using unregistered utility/keyframe names absent from `DESIGN.md` / `src/media/design.css`; or calling `resolve_ms("--duration-*")`, which does not exist in `design.css` and silently falls back to defaults.
- **Correct Behavior**: Use compiled `DESIGN.md` utilities (`duration-fast`, `ease-drawer`, `active:scale-sink`) and `--transition-duration-*` tokens, start floating overlays at `scale` `0.95`, build collapsible panels with CSS Grid `grid-rows-[0fr]` / `grid-rows-[1fr]`, and verify with `npm run audit:design`.

## Pitfall 5: CSS Hover Transitions Fighting Kinetic Actions & Missing Duration Shorthands

- **Trigger**: Attaching `pulse`, `roll`, `shimmy`, or `stab` to interactive buttons (`Button.svelte`), or writing inline CSS `transition:` strings (`Profile.svelte`).
- **Wrong Behavior**: Allowing CSS `transition-[...,transform,...]` to fight active WAAPI/Spring transforms produces competing transform interpolation; passing only `var(--ease-drawer)` in an inline CSS `transition:` string leaves `transition-duration` at `0s`.
- **Correct Behavior**: Keep interactive primitives aligned with `Button.svelte`'s kinetic suppression selectors (`data-[kinetic=true]:active:scale-100`, `data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]`, and `data-[kinetic=true]:hover:scale-100` on flank controls), and always pair duration + easing tokens in inline CSS transitions (e.g., `var(--transition-duration-standard) var(--ease-drawer)`).

## Pitfall 6: Uncleaned `$effect.root`, Animation Races, Fallback Desyncs, or Overlapping Flights

- **Trigger**: Implementing Spring-driven actions (`roll`), rapidly re-hovered WAAPI actions (`pulse`, `shimmy`, `stab`), pairing `setTimeout` fallbacks with `animationend`/`transitionend`, or launching rapid Storyboard -> Prologue transitions (`fly_storyboard_cards_into_prologue`).
- **Wrong Behavior**: Spawning `$effect.root` without invoking its disposer in `destroy()`, letting hover triggers clash with active return animations, setting a fallback `setTimeout` `<= CSS_DURATION` (cutting off the final animation frames), treating synchronous `fly_card_out` (`returns void`) as awaitable, or launching overlapping fixed-clone prologue transfers.
- **Correct Behavior**: Invoke the `cleanup_effect` disposer in `destroy()`, cancel active WAAPI handles before launching replacements, set fallback `setTimeout` delays strictly `> CSS_DURATION` (e.g., `CSS_DURATION + 50ms`), serialize prologue transfers with `_begin_flight_running`, and avoid awaiting `fly_card_out`.

## Pitfall 7: Overlay-to-Overlay Handoff Collisions (Card-Hand -> Modal)

- **Trigger**: Opening a modal or secondary drawer from inside an active card-hand drawer or context menu on the same synchronous tick.
- **Wrong Behavior**: Playing a card eject animation (`350ms`), sliding the card-hand down (`300ms`), and fading out the card-hand backdrop (`150ms`) while simultaneously fading in a blurred modal backdrop (`150ms`) and rising the modal content (`300ms`). This forces the GPU to recalculate a 16px Gaussian blur every frame against moving geometry, causing compositor frame drops.
- **Correct Behavior**: Skip leaf launch animations on action cards (`launch_gesture={false}`), snap the card-hand closed instantly or let it sit stationary beneath the incoming modal backdrop, and stagger surface transitions.

## Pitfall 8: Non-Morph View Transitions (`guarded_transition` on Actions)

- **Trigger**: Calling `guarded_transition()` inside a button or action card click handler that opens a modal, dropdown, or configuration panel instead of executing a 1:1 shared-element DOM slot morph.
- **Wrong Behavior**: Freezing the full-screen viewport for a View Transition snapshot when nothing is morphing across DOM nodes, causing phantom `::view-transition-new` ghost layers to render over active UI components.
- **Correct Behavior**: Restrict `guarded_transition()` exclusively to root view switches and true canonical `view-transition-name` slot swaps (`card-slot-*`, `entity-morph-fractal`, `unified-console`).

## Pitfall 9: React-Style `$effect` + `requestAnimationFrame` + `setTimeout` Mount State Machines

- **Trigger**: Implementing component entry/exit animations in Svelte by pairing booleans (`render_active`, `is_visible`), calling `requestAnimationFrame` inside `$effect`, and cleaning up with manual `setTimeout`.
- **Wrong Behavior**: Triggering single-frame race conditions where entering surfaces pop in without animating (because browser paint batches the initial state before `is_visible` flips), and creating un-cancellable timer leaks on rapid re-toggling.
- **Correct Behavior**: Delete manual mount state machines entirely. Use Svelte's native `in:` / `out:` directives (`overlay_in`, `overlay_out`) or CSS Grid row collapse (`grid-rows-[0fr]` / `grid-rows-[1fr]`) so Svelte owns the DOM lifecycle.
