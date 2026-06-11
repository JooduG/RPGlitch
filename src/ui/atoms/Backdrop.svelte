<script>
  /**
   * @file Backdrop.svelte
   * 🕹️ SOTA ATOMIC BACKDROP
   * Standard shielding overlay for Modals, Drawers, and Panels.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@actions";
  import { fade } from "svelte/transition";

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

  // Sync transition with standard fast duration asset (150ms) to sever design.css dependencies
  let duration = $state(150);
</script>

<div
  {...rest}
  class="
    fixed
    inset-0
    flex
    cursor-pointer
    items-start
    justify-center
    overflow-y-auto
    bg-[radial-gradient(circle_at_center,rgba(22,36,59,0.3),rgba(0,0,0,0.3))]
    select-none
    [-webkit-tap-highlight-color:transparent]

    *:m-auto

    [&.profile-backdrop]:p-0

    {is_pass_through ? '*:pointer-events-auto' : 'pointer-events-auto'}
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
  transition:fade={{ duration }}
  use:use_actions={actions}
>
  {@render children?.()}
</div>
