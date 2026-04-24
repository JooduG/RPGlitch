<script>
  /**
   * Security Alert Modal
   * Simple informational dialog.
   */
  import Button from "@ui/atoms/Button.svelte";
  import { quintOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";
  let {
    title = "System Alert",
    message = "Notice",
    button_label = "OK",
    on_close = () => {},
    open = $bindable(false),
  } = $props();
  let dialog = $state();
  let ok_btn = $state();
  $effect(() => {
    if (open && dialog) {
      dialog.showModal();
      // Manual focus management to clear a11y warning
      ok_btn?.focus();
    } else if (!open && dialog) {
      dialog.close();
    }
  });
  function handle_close() {
    on_close();
    open = false;
  }
  function handle_keydown(e) {
    if (e.key === "Escape") handle_close();
  }
</script>

{#if open}
  <dialog
    bind:this={dialog}
    onclose={handle_close}
    onkeydown={handle_keydown}
    onclick={(e) => { if (e.target === dialog) handle_close(); }}
    transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}
  >
    <article class="security-modal">
      <header>
        <h3>{title}</h3>
      </header>
      <div class="content">
        <p>{message}</p>
      </div>
      <footer>
        <Button variant="primary" onclick={handle_close} bind:this={ok_btn} label={button_label} />
      </footer>
    </article>
  </dialog>
  <!-- Backdrop -->
  <div
    class="backdrop"
    transition:fade={{ duration: 150 }}
    onclick={handle_close}
    role="presentation"
  ></div>
{/if}

<style>
  dialog {
    background: transparent;
    border: none;
    padding: 0;
    margin: auto;
    max-width: 90vw;
    width: var(--panel-xs);
    color: inherit;
    z-index: var(--z-index-xl);
    overflow: visible;
  }

  dialog::backdrop {
    background: transparent;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--glass-xs);
    z-index: calc(var(--z-index-xl) - 1);
  }

  /* Matched to the Wing container aesthetic */
  .security-modal {
    background: var(--glass-s);
    backdrop-filter: var(--blur-l);
    border: var(--border-m);
    box-shadow: var(--shadow-xl);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-m);
    gap: var(--spacing-m);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .security-modal header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: var(--spacing-xs); /* align with group-label */
  }

  /* Match the .group-label styling from Wing.svelte */
  .security-modal h3 {
    margin: 0;
    font-size: var(--font-size-xxs);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-body);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--font-color-s);
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .security-modal h3::before {
    content: "ℹ";
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--spacing-xl);
    height: var(--spacing-xl);
    background: rgb(var(--color-frozen-rgb) / var(--opacity-s));
    color: var(--color-frozen);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-s);
  }

  .security-modal .content {
    padding: 0 var(--spacing-xs);
    color: var(--font-color-m);
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
  }

  .security-modal footer {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--spacing-s);
  }

  /* button styles removed - utilizing Button component */
</style>
