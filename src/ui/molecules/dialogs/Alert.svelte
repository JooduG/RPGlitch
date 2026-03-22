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
    width: 350px;
    color: inherit;
    z-index: var(--z-modal);
    overflow: visible;
  }

  dialog::backdrop {
    background: transparent;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--surface-void);
    z-index: calc(var(--z-modal) - 1);
  }

  .security-modal {
    background: var(--surface-raised);
    box-shadow:
      inset 0 0 0 1px var(--border-light),
      var(--shadow-xxl);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .security-modal header {
    padding: var(--spacing-m) var(--spacing-xl);
    background: var(--surface-raised);
  }

  .security-modal h3 {
    margin: 0;
    font-size: var(--font-size-l);
    font-weight: 700;
    font-family: var(--font-heading);
    color: var(--font-color);
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
    padding: var(--spacing-xl);
    color: var(--font-muted);
    font-size: var(--font-size-m);
    line-height: var(--line-height-relaxed);
  }

  .security-modal footer {
    padding: var(--spacing-m) var(--spacing-xl);
    display: flex;
    justify-content: flex-end;
    background: var(--surface-sunken);
  }

  /* button styles removed - utilizing Button component */
</style>
