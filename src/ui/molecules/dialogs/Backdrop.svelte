<script>
  /**
   * Backdrop.svelte
   * The standard darkening layer for Modals, Drawers, and Overlays.
   */
  /**
   * @typedef {Object} Props
   * @property {(e: MouseEvent) => void} [onclick]
   * @property {number|string} [z_index]
   * @property {boolean} [blur]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props} */
  let { onclick, z_index = 100, blur = true, children = undefined } = $props();
  import { fade } from "svelte/transition";
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="backdrop {blur ? 'blur' : ''}"
  transition:fade={{ duration: 200 }}
  style="z-index: {z_index};"
  {onclick}
>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--surface-void); /* Standard dark overlay */
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  /* Blur is optional (performance) */
</style>
