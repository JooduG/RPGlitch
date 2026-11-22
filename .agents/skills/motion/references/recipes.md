# RPGlitch Motion Recipes

Verified Svelte 5, Tailwind v4, `DESIGN.md`, `@atoms`, `@molecules`, and `@media` (`src/media/motion.svelte.js`) motion patterns. Use exact exported symbols and canonical aliases (`@atoms`, `@molecules`, `@media`, `@utils`).

## 1. Tactile Button Press & Kinetic Actions (`@atoms`)

Use `<Button actions={[...]}>` from `@atoms`; `Button.svelte` handles `active:scale-sink` and yields CSS `transform` transitions whenever `@media` kinetic actions set `data-kinetic="true"`:

```svelte
<script>
  import { stab } from "@media";
  import { Button } from "@atoms";
</script>

<Button actions={[stab]} onclick={submit_turn}>Send</Button>
```

When authoring a custom kinetic-compatible control in `src/ui/atoms/` or `src/ui/molecules/`, keep color/shadow transitions alive while dropping CSS `transform` transitions during active JS motion (verbatim `Button.svelte` pattern):

```svelte
<button
  class="
    transition-[background-color,color,box-shadow,transform,filter,border-color]
    duration-fast ease-out active:scale-sink
    data-[kinetic=true]:transition-[background-color,color,box-shadow,filter,border-color]
    data-[kinetic=true]:active:scale-100
  ">
  Action
</button>
```

## 2. Floating Overlays (`@atoms` `Tooltip` / `@molecules` `Dropdown`)

Organisms and views import `<Tooltip>` (`@atoms`) and `<Dropdown>` (`@molecules`) — direct `bits-ui` imports stay encapsulated in `src/ui/atoms/` and `src/ui/molecules/` (no `Popover` wrapper exists). Inside a `bits-ui` wrapper (`Tooltip.svelte` pattern), anchor transforms via `origin-(--transform-origin)` and scale from `0.95` (never `0`):

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

## 3. Modals, Dialogs & Lane 5 Inter-Surface Handoffs

Use `@media` `overlay_in` (`300ms` default) and `overlay_out` (`160ms` default) for overlay panels (both auto-collapse to `0ms` when `motion.is_reduced` is `true`), paired with `@atoms` `<Backdrop>`. When `is_profile_view` is `true`, pass `duration: 0` so Svelte's scale/translate does not collide with the View Transition profile flip (`Modal.svelte` pattern):

```svelte
<script>
  import { overlay_in, overlay_out } from "@media";
  import { Backdrop } from "@atoms";

  let { is_open = false, is_profile_view = false } = $props();
</script>

{#if is_open}
  <!-- class="profile" triggers Backdrop's internal 0ms View Transition snapshot transition -->
  <Backdrop class={is_profile_view ? "profile" : ""}>
    <div in:overlay_in={{ duration: is_profile_view ? 0 : 300 }} out:overlay_out={{ duration: is_profile_view ? 0 : 160 }}>
      <!-- Modal surface -->
    </div>
  </Backdrop>
{/if}
```

**Lane 5 Handoff (Card-Hand / ContextMenu -> Modal)**: Pass `launch_gesture={false}` on action cards inside a card-hand (`Import`, `Create New`) so they do not run a 350ms eject + `guarded_transition()`, and snap-close or keep the background stationary rather than animating two blurred backdrops simultaneously:

```svelte
<!-- Action card inside card-hand: no eject launch or View Transition -->
<EntityCard variant="library" role_label="Import" launch_gesture={false} onclick={handle_open_import} />
```

## 4. Compositor-Safe Accordions (CSS Grid Trick)

Toggle `grid-rows-[1fr]` and `grid-rows-[0fr]` with `min-h-0` around an `overflow-hidden` container instead of transitioning CSS `height`:

```svelte
<div class="grid min-h-0 transition-[grid-template-rows] duration-standard ease-drawer {is_open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
  <div class="min-h-0 overflow-hidden">
    <!-- Collapsible body -->
  </div>
</div>
```

## 5. View Transitions (`guarded_transition` + `flushSync`)

Always wrap root view switches and true `view-transition-name` slot swaps in `guarded_transition(callback, { className })` from `@utils`, using only canonical `DESIGN.md` `view-transition-name`s (`card-slot-ai`, `card-slot-user`, `card-slot-fractal`, `entity-morph-fractal`, `unified-console`):

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

if (!motion.is_reduced && card_node && from_rect && to_rect) {
  await fly_card_in(card_node, from_rect, to_rect, { glide_ms: 380 });
}

// Synchronous void trigger (do not await fly_card_out)
if (!motion.is_reduced && old_card_node && deck_rect) {
  fly_card_out(old_card_node, deck_rect, { duration_ms: 300, tilt_deg: -8 });
}

// Storyboard -> Prologue transfer (checks motion.is_reduced and serializes via _begin_flight_running)
const assets = capture_storyboard_flight();
// ...switch view & flushSync()...
await fly_storyboard_cards_into_prologue(assets, destination_rects);

// Zero-argument prologue card visibility helpers
update_card_scrub();
clear_card_location();
```

## 7. Token Resolution & Damped `Spring` (`svelte/motion`)

Resolve `DESIGN.md` spring tokens inside `src/media/` with `@utils`, set `node.dataset.kinetic = "true"`, and pair Svelte `Spring` with `$effect.root` teardown in `destroy()` (`roll()` pattern):

```javascript
import { Spring } from "svelte/motion";
import { resolve_number } from "@utils";
import { motion } from "./motion.svelte.js";

export function spin_action(node) {
  if (motion.is_reduced || motion.intensity === 0) {
    return { destroy() {} };
  }

  node.dataset.kinetic = "true";
  const angle_spring = new Spring(0, {
    stiffness: resolve_number("--spring-stiffness-default", 0.15, node),
    damping: resolve_number("--spring-damping-default", 0.8, node),
  });

  const cleanup_effect = $effect.root(() => {
    $effect(() => {
      if (motion.is_reduced || motion.intensity === 0) {
        angle_spring.set(0, { instant: true });
        node.style.transform = "rotate(0deg)";
        return;
      }
      node.style.transform = `rotate(${angle_spring.current}deg)`;
    });
  });

  return {
    destroy() {
      cleanup_effect();
      delete node.dataset.kinetic;
    },
  };
}
```
