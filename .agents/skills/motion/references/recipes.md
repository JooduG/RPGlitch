# RPGlitch Motion Recipes

Verified Svelte 5, Tailwind v4, `DESIGN.md`, `@primitives`, and `@media` (`src/media/motion.svelte.js`) motion patterns. Use exact exported symbols and canonical aliases (`@primitives`, `@media`, `@utils`).

## 1. Tactile Button Press & Kinetic Actions (`@primitives`)

Use `<Button actions={[...]}>` from `@primitives`; `Button.svelte` handles `active:scale-sink` and yields CSS `transform` transitions cleanly whenever `@media` kinetic actions set `data-kinetic="true"`:

```svelte
<script>
  import { stab } from "@media";
  import { Button } from "@primitives";
</script>

<Button actions={[stab]} onclick={submit_turn}>Send</Button>
```

When authoring a custom kinetic-compatible primitive in `src/ui/primitives/`, keep color/shadow transitions alive while dropping CSS `transform` transitions during active JS motion (verbatim `Button.svelte` pattern):

```svelte
<button
  class="
    transition-[background-color,color,box-shadow,transform,filter,border-color]
    duration-(--duration-fast) ease-out active:scale-sink
    data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]
    data-[kinetic=true]:active:scale-100
  ">
  Action
</button>
```

## 2. Floating Overlays (`src/ui/primitives/` `Tooltip` / `Dropdown`)

Feature views import `<Tooltip>` and `<Dropdown>` from `@primitives` — direct `bits-ui` imports stay encapsulated in `src/ui/primitives/` (no `Popover` wrapper exists). Inside a `bits-ui` primitive wrapper (`Tooltip.svelte` pattern), anchor transforms via `origin-(--transform-origin)` and scale from `0.95` (never `0`):

```svelte
<script>
  import { scale } from "svelte/transition";
  import { Tooltip } from "bits-ui";
</script>

<Tooltip.Content forceMount sideOffset={6}>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:scale={{ duration: 150, start: 0.95, opacity: 0 }} class="origin-(--transform-origin)">
          <!-- Tooltip content -->
        </div>
      </div>
    {/if}
  {/snippet}
</Tooltip.Content>
```

## 3. Modals, Dialogs & View-Transition Backdrops

Use `@media` `overlay_in` (`300ms` default) and `overlay_out` (`160ms` default) for overlay panels (both auto-collapse to `0ms` when `motion.is_reduced` is `true`), paired with `@primitives` `<Backdrop>`:

```svelte
<script>
  import { overlay_in, overlay_out } from "@media";
  import { Backdrop } from "@primitives";

  let { is_open = false, is_profile_view = false } = $props();
</script>

{#if is_open}
  <!-- class="profile" automatically triggers Backdrop's internal 0ms VT snapshot transition -->
  <Backdrop class={is_profile_view ? "profile" : ""}>
    <div in:overlay_in out:overlay_out>
      <!-- Modal surface -->
    </div>
  </Backdrop>
{/if}
```

## 4. Compositor-Safe Accordions (CSS Grid Trick)

Toggle `grid-rows-[1fr]` and `grid-rows-[0fr]` around an `overflow-hidden` container (`Accordion.svelte` / `Console.svelte` pattern) instead of transitioning CSS `height`:

```svelte
<div class="grid transition-[grid-template-rows] duration-(--duration-standard) ease-(--ease-drawer) {is_open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
  <div class="overflow-hidden">
    <!-- Collapsible body -->
  </div>
</div>
```

## 5. View Transitions (`guarded_transition` + `flushSync`)

Always wrap state flips in `guarded_transition(callback, { className })` from `@utils`, using only canonical `DESIGN.md` `view-transition-name`s (`card-slot-ai`, `card-slot-user`, `card-slot-fractal`, `entity-morph-fractal`, `unified-console`):

```javascript
import { flushSync } from "svelte";
import { guarded_transition } from "@utils";

export function switch_view(target_view) {
  return guarded_transition(
    () => {
      state.view = target_view;
      flushSync();
    },
    { className: "is-switching-view" },
  );
}
```

- **Conflict ban**: Never combine `view-transition-name` with Svelte `transition:` / `in:` / `out:` on the same DOM element; set `transition_name = undefined` (and remove inline `view-transition-name` during flights) as in `EntityCard.svelte`.

## 6. Card Flights & Prologue Choreography (`@media`)

Gate `fly_card_in` (`Promise<void>`) and `fly_card_out` (`void`) with `motion.is_reduced` in callers; use `capture_storyboard_flight()` + `fly_storyboard_cards_into_prologue()` for Storyboard -> Storymode transitions:

```javascript
import {
  motion,
  fly_card_in,
  fly_card_out,
  capture_storyboard_flight,
  fly_storyboard_cards_into_prologue,
  update_card_scrub,
  clear_card_location,
} from "@media";

// Callers gate fly_card_in / fly_card_out explicitly with motion.is_reduced
if (!motion.is_reduced && card_node && from_rect && to_rect) {
  await fly_card_in(card_node, from_rect, to_rect, { glide_ms: 380 });
}

// Synchronous void trigger (do not await fly_card_out)
if (!motion.is_reduced && old_card_node && deck_rect) {
  fly_card_out(old_card_node, deck_rect, { duration_ms: 300, tilt_deg: -8 });
}

// Storyboard -> Prologue transfer (internally checks motion.is_reduced & _begin_flight_running)
const assets = capture_storyboard_flight();
// ...switch view & flushSync()...
await fly_storyboard_cards_into_prologue(assets, destination_rects);

// Static prologue card visibility helpers (0 arguments)
update_card_scrub();
clear_card_location();
```

## 7. Token Resolution, Damped `Spring` & Keyframes

Resolve `DESIGN.md` tokens inside `src/media/` with `@utils`, and pair Svelte `Spring` (`svelte/motion`) with `$effect.root` teardown in `destroy()` (`roll()` pattern):

```javascript
import { Spring } from "svelte/motion";
import { resolve_ms, resolve_string, resolve_number } from "@utils";
import { motion } from "./motion.svelte.js";

export function spin_action(node) {
  const duration = resolve_ms("--duration-standard", 300, node);
  const easing = resolve_string("--ease-out", "cubic-bezier(0.23, 1, 0.32, 1)", node);
  const angle_spring = new Spring(0, {
    stiffness: resolve_number("--spring-stiffness-default", 0.15, node),
    damping: resolve_number("--spring-damping-default", 0.8, node),
  });

  let cleanup_effect = null;
  if (typeof window !== "undefined") {
    cleanup_effect = $effect.root(() => {
      $effect(() => {
        const intensity = motion.is_reduced ? 0 : motion.intensity;
        if (intensity === 0) {
          angle_spring.set(0, { instant: true });
          node.style.transform = "rotate(0deg)";
          return;
        }
        node.style.transform = `rotate(${angle_spring.current}deg)`;
      });
    });
  }

  return {
    duration,
    easing,
    destroy() {
      if (cleanup_effect) cleanup_effect();
    },
  };
}
```

- **Keyframes in `DESIGN.md`**: Reuse `wing-item-slide-down` (`var(--motion-elastic)`) for wing reveals and `undo-countdown-shrink` (`transform: scaleX(1)` -> `scaleX(0)`) for GPU-composited progress bars.
