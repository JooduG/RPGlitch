<script>
  /**
   * @file ProfileWings.svelte
   * 🦅 THE EDITING PANELS
   * Slide-out sidebars for deeper entity configuration.
   * Passes the flattened `char` object to its children.
   */
  import { app } from "@state/app.svelte.js";
  import DevWing from "@ui/organisms/profile/DevWing.svelte";
  import VisualWing from "@ui/organisms/profile/VisualWing.svelte";
  import VoiceWing from "@ui/organisms/profile/VoiceWing.svelte";
  let {
    char = $bindable(),
    is_editing,
    busy_fields = $bindable(),
    active_field = $bindable(),
  } = $props();
</script>

<aside class="wing-left" class:is-visible={!!char && is_editing} data-testid="visual-wing">
  <VisualWing bind:char {is_editing} bind:busy_fields bind:active_field />
  <VoiceWing bind:char {is_editing} />
</aside>
<aside class="wing-right" class:is-visible={app.settings.dev_mode} data-testid="dev-wing">
  <DevWing bind:char {is_editing} />
</aside>

<style>
  .wing-left,
  .wing-right {
    width: 0;
    min-width: 0;
    max-width: 0;
    opacity: var(--opacity-none);
    overflow: visible;
    pointer-events: none;
    transition: all var(--motion-slow) var(--motion-elastic);
    transform: scale(0.9);
    filter: blur(var(--blur-m));
    height: auto;
    max-height: 50rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    background: transparent;
    border: none;
    border-radius: var(--spacing-l);
    transform-style: preserve-3d;
    z-index: var(--z-index-l);
  }

  .wing-left.is-visible,
  .wing-right.is-visible {
    width: 16rem;
    min-width: 16rem;
    max-width: 20rem;
    opacity: var(--opacity-full);
    pointer-events: auto;
    filter: blur(0);
  }

  .wing-left {
    order: 1;
  }

  .wing-left.is-visible {
    transform: scale(1) translateX(calc(var(--spacing-s) * -1));
  }

  .wing-right {
    order: 3;
  }

  .wing-right.is-visible {
    transform: scale(1) translateX(var(--spacing-s));
  }
</style>
