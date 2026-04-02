<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   */
  import { quintOut } from "svelte/easing";
  import { fly } from "svelte/transition";
  import Backdrop from "./Backdrop.svelte";

  /** @type {{
   *    on_close?: (e: any) => void,
   *    variant?: "standard" | "profile" | "preview",
   *    z_index?: string,
   *    children: import('svelte').Snippet
   *  }} */
  let {
    on_close = () => {},
    variant = "standard",
    z_index = "var(--z-index-xl)",
    children,
  } = $props();

  /** @param {KeyboardEvent} e */
  function handle_keydown(e) {
    if (e.key === "Escape") on_close(e);
  }

  /** @param {MouseEvent} e */
  function handle_close(e) {
    on_close(e);
  }
</script>

<svelte:window onkeydown={handle_keydown} />

<!-- Visual Layer -->
<Backdrop onclick={handle_close} {z_index} />

<!-- Interaction & Layout Layer -->
<div class="modal-layout">
  <!-- Content -->
  <div class="modal-content {variant}" transition:fly={{ y: 20, duration: 300, easing: quintOut }}>
    {@render children()}
  </div>
</div>

<style>
  .modal-layout {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-index-xl) + 1); /* Above backdrop */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-m);
    pointer-events: none;
  }

  .modal-content {
    background: var(--glass-xl);
    backdrop-filter: var(--glass-blur-xl);
    border: var(--glass-edge-l);
    border-top: var(--glass-edge-xl);
    border-radius: var(--border-radius-l);
    box-shadow: var(--shadow-xxl);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    pointer-events: auto;
    z-index: calc(var(--z-index-xl) + 2);
  }

  .modal-content.profile {
    max-width: 90vw;
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow-y: visible;
  }

  .modal-content.preview {
    max-width: 400px;
  }
</style>
