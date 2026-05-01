<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   */
  import { quartOut } from "svelte/easing";
  import { scale } from "svelte/transition";
  import Backdrop from "@atoms/Backdrop.svelte";

  /** @type {{
   *    on_close?: (e: any) => void,
   *    variant?: "standard" | "profile" | "preview" | "mini",
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
<div class="modal-layout" style="z-index: calc({z_index} + 1);">
  <!-- Content -->
  <div
    class="modal-content glass-xxl {variant}"
    role="dialog"
    aria-modal="true"
    transition:scale={{ duration: 400, easing: quartOut, start: 0.9 }}
  >
    {@render children()}
  </div>
</div>

<style>
  .modal-layout {
    position: fixed;
    inset: 0;

    /* z-index moved to inline style for dynamic control */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-m);
    pointer-events: none;
  }

  .modal-content {
    position: relative;
    width: 95%;
    max-width: calc(var(--grid-unit) * 4);
    min-width: 280px;
    max-height: 90vh;
    padding: var(--spacing-xl);
    z-index: calc(var(--z-index-max) + 1);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
    overflow: hidden;
    pointer-events: auto;
  }

  .modal-content.profile {
    max-width: 90vw;
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow: visible;
  }

  .modal-content.preview,
  .modal-content.mini {
    max-width: calc(var(--grid-unit) * 2);
  }

  .modal-content.mini {
    padding: var(--spacing-l);
    gap: var(--spacing-m);
  }
</style>
