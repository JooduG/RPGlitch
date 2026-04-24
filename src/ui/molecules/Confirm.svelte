<script>
  /**
   * Security Confirm Modal
   * A promise-based confirmation dialog.
   */
  import Button from "@ui/atoms/Button.svelte";
  import { quintOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";
  let {
    title = "Confirm Action",
    message = "Are you sure?",
    confirm_label = "Confirm",
    cancel_label = "Cancel",
    on_confirm = () => {},
    on_cancel = () => {},
    open = $bindable(false),
  } = $props();
  let dialog = $state();
  let confirm_button = $state();
  $effect(() => {
    if (open && dialog) {
      if (!dialog.open) {
        dialog.showModal();
        confirm_button?.focus();
      }
    } else if (!open && dialog) {
      if (dialog.open) {
        dialog.close();
      }
    }
  });
  function handle_confirm() {
    on_confirm();
    open = false;
  }
  function handle_cancel() {
    on_cancel();
    open = false;
  }
  function handle_keydown(e) {
    if (e.key === "Escape") {
      handle_cancel();
    }
  }
</script>

{#if open}
  <dialog
    bind:this={dialog}
    onclose={handle_cancel}
    onkeydown={handle_keydown}
    onclick={(e) => { if (e.target === dialog) handle_cancel(); }}
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
        <Button variant="ghost" onclick={handle_cancel} label={cancel_label} />
        <Button
          variant="danger"
          onclick={handle_confirm}
          bind:this={confirm_button}
          label={confirm_label}
        />
      </footer>
    </article>
  </dialog>
  <!-- Backdrop -->
  <div
    class="backdrop"
    transition:fade={{ duration: 150 }}
    onclick={handle_cancel}
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
    width: var(--panel-s);
    color: inherit;
    z-index: var(--z-index-xxl);
    overflow: visible;
  }

  dialog::backdrop {
    background: transparent; /* Handled by our custom backdrop div */
  }

  p {
    margin: 0;
  }

  /* Nordic backdrop: token-based to match the main Modal's Backdrop component */
  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--glass-xs);
    backdrop-filter: var(--blur-m);
    z-index: calc(var(--z-index-xxl) - 1);
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
    gap: var(--spacing-s);
  }

  /* Button styling delegated to Button component */
</style>
