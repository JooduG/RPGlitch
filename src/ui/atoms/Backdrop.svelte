<script>
  /**
   * @file Backdrop.svelte
   * 🕹️ SOTA ATOMIC BACKDROP
   * Standard shielding overlay for Modals, Drawers, and Panels.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@actions";
  import { fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let {
    // State
    is_blurred = true,
    busy = false,
    is_pass_through = false,

    // Design
    z_index = "100",
    class: className = "",

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();

  const is_profile = $derived(className === "profile");

  /**
   * For the profile backdrop: animate backdrop-filter and background directly
   * using Svelte's CSS transition API so the blur increases gradually in sync
   * with the card flip (rather than snapping from a View Transition snapshot).
   *
   * View Transition snapshots are pixel images — any backdrop-filter on a
   * ::view-transition-new pseudo-element has nothing to filter, so the blur
   * was already 100% baked into the captured image from frame 1.
   * @param {HTMLElement} _node
   * @returns {import('svelte/transition').TransitionConfig}
   */
  function profileTransition(_node) {
    const duration = 500;
    return {
      duration,
      easing: cubicOut,
      css: (t) => `
        backdrop-filter: blur(${t * 16}px) brightness(${1 - t * 0.1}) saturate(${1 - t * 0.6});
        background: radial-gradient(circle at center, rgb(22 36 59 / ${t * 0.3}), rgb(0 0 0 / ${t * 0.3}));
        opacity: 1;
      `,
    };
  }

  /**
   * Dispatch the right transition: custom CSS animation for profile,
   * standard fade for everything else.
   * @param {HTMLElement} node
   * @returns {import('svelte/transition').TransitionConfig}
   */
  function backdropTransition(node) {
    if (is_profile) {
      return profileTransition(node);
    }
    return fade(node, { duration: 150 });
  }
</script>

<div
  {...rest}
  class="
    fixed
    inset-0
    cursor-pointer
    overflow-y-auto
    bg-[radial-gradient(circle_at_center,rgba(22,36,59,0.3),rgba(0,0,0,0.3))]
    select-none
    [-webkit-tap-highlight-color:transparent]

    {is_pass_through ? 'pointer-events-none' : 'pointer-events-auto'}
    {is_blurred
    ? `
      backdrop-blur-lg
      backdrop-brightness-90
      backdrop-saturate-40
    `
    : ''}
    {busy
    ? `
      pointer-events-none
      cursor-wait
    `
    : ''}
    {className}"
  style:z-index={z_index}
  transition:backdropTransition
  use:use_actions={actions}
>
  <div class="flex min-h-full w-full items-center justify-center p-4 sm:p-8">
    <div class="contents {is_pass_through ? '*:pointer-events-auto' : ''}">
      {@render children?.()}
    </div>
  </div>
</div>
