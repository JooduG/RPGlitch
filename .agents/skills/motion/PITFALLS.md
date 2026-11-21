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
- **Correct Behavior**: Always call `guarded_transition(callback, { className })` from `@utils` (`src/utils/dom.js`), flushing Svelte 5 DOM updates via `flushSync()` immediately before or inside `callback`.

## Pitfall 3: Unguarded CSS Transitions Under Reduced Motion

- **Trigger**: Adding custom `duration-*` transitions or using `<Backdrop>` without `class="profile"`.
- **Wrong Behavior**: Assuming `DESIGN.md` media queries suppress every CSS transition. `DESIGN.md` sets `0.01ms` only on `animation-duration` and `::view-transition-*` — not CSS `transition-duration` or non-profile `Backdrop` `fade(150)`.
- **Correct Behavior**: `fly_card_in`, `fly_card_out`, and `fly_storyboard_cards_into_prologue` guard `motion.is_reduced` internally; explicitly handle `motion.is_reduced` on continuous/custom CSS `transition-*` elements when instant suppression is required.

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

## Pitfall 10: 3D `preserve-3d` Flip Clipping, Mid-Exit State Snap & Flip-to-Void Dismissal

- **Trigger**: Flipping a hover preview card 180° to an interactive `ContextMenu` backside (`[data-card-flip-rotor]` in `App.svelte` / `Tooltip.svelte`) and animating its dismissal.
- **Wrong Behavior**: Letting front and back faces use mismatched border radii or active `backdrop-blur-md` inside a `preserve-3d` rotor (breaks `backface-visibility: hidden` in Chromium); binding the rotor directly to live `tooltip_state` instead of an exit-held `display_snapshot` (causes the card to snap back to the front face mid-fade); or scaling a flipped card (`180deg`) flat down on close instead of continuing the rotation.
- **Correct Behavior**: Enforce identical `rounded-standard` and `backface-hidden` on both faces, freeze content in `display_snapshot` while `open` transitions out, and animate `data-closing="true"` forward from `rotateY(180deg)` to `rotateY(270deg) scale(0.92)` with `opacity: 0` so the card turns edge-on into nothing without flashing the front face (and collapse via `transition: none !important` when `motion.is_reduced` is true).

## Pitfall 11: Re-Targeting a Singleton Floating Portal on the Same Tick as `unpin_tooltip()`

- **Trigger**: Switching a singleton `Tooltip.Root` from a pinned 3D card-back menu on entity A to a hover preview on entity B (`Tooltip.svelte`).
- **Wrong Behavior**: Calling `unpin_tooltip()` (`active = false`, `pinned = false`) and immediately calling `show_tooltip(newNode, ..., { delay: 0 })` (`active = true`) in the same synchronous tick. Svelte coalesces `active` to remain `true`, aborting the exit transition, keeping the old anchor coordinates while Floating UI recalculates, and visibly rotating entity A's context menu backward (`180deg -> 0deg`) over entity B.
- **Correct Behavior**: Stage the handoff: require a short hover dwell (`150ms`) to ignore accidental cursor fly-bys, call `unpin_tooltip()` so entity A completes its `250ms` flip-to-void exit and unmounts, and only mount entity B's fresh `rotateY(0deg)` preview after the exit window (`260ms`) if the pointer is still over entity B.
