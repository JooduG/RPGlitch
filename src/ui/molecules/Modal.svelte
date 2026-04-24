<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   */
  import { quartOut } from "svelte/easing";
  import { scale } from "svelte/transition";
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
  <div
    class="modal-content glass-xxl {variant}"
    transition:scale={{ duration: 400, easing: quartOut, start: 0.9 }}
  >
    {@render children()}
  </div>
</div>

<style>
  .modal-layout {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-index-xl) + 1); /* Above backdrop */
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    pointer-events: none;
  }

  .modal-content {
    background: var(--glass-s);
    backdrop-filter: var(--blur-l);
    border: var(--border-m);
    border-radius: var(--border-radius-m);
    box-shadow: var(--shadow-xl);
    width: var(--panel-m);
    max-width: 95vw;
    max-height: 90vh;
    padding: var(--spacing-m);
    position: relative;
    overflow: hidden;
    pointer-events: auto;
  }

  .modal-content.profile {
    max-width: none;
    width: fit-content;
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow: visible;
    max-height: 100vh;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content.preview {
    width: var(--panel-s);
  }
</style>
