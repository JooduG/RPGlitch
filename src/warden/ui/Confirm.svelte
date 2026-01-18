<script>
  /**
   * Warden Confirm Modal
   * A promise-based confirmation dialog.
   */
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  let {
    title = "Confirm Action",
    message = "Are you sure?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm = () => {},
    onCancel = () => {},
    open = $bindable(false),
  } = $props();

  let dialog = $state();
  let confirmBtn = $state();

  $effect(() => {
    if (open && dialog) {
      dialog.showModal();
      confirmBtn?.focus();
    } else if (!open && dialog) {
      dialog.close();
    }
  });

  function handleConfirm() {
    onConfirm();
    open = false;
  }

  function handleCancel() {
    onCancel();
    open = false;
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      handleCancel();
    }
  }
</script>

{#if open}
  <dialog
    bind:this={dialog}
    onclose={handleCancel}
    onkeydown={handleKeydown}
    transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}
  >
    <article class="warden-modal">
      <header>
        <h3>{title}</h3>
        <button
          class="btn-ghost icon-only"
          onclick={handleCancel}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="icon"
          >
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </header>

      <div class="content">
        <p>{message}</p>
      </div>

      <footer>
        <button class="btn-ghost" onclick={handleCancel}>
          {cancelLabel}
        </button>
        <button
          class="btn-danger"
          onclick={handleConfirm}
          bind:this={confirmBtn}
        >
          {confirmLabel}
        </button>
      </footer>
    </article>
  </dialog>

  <!-- Backdrop -->
  <div
    class="backdrop"
    transition:fade={{ duration: 150 }}
    onclick={handleCancel}
    role="presentation"
  ></div>
{/if}

<style lang="scss">
  @use "../../scss/abstracts" as *;

  dialog {
    background: transparent;
    border: none;
    padding: 0;
    margin: auto;
    max-width: 90vw;
    width: 400px;
    color: inherit;
    z-index: z(modal);
    overflow: visible;

    &::backdrop {
      background: transparent; /* Handled by our custom backdrop div */
    }
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: calc(z(modal) - 1);
  }

  .warden-modal {
    background: #1a1b26;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        font-family: var(--font-heading);
        color: #e2e8f0;
      }
    }

    .content {
      padding: 1.5rem;
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    footer {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: rgba(0, 0, 0, 0.2);
    }
  }

  /* Buttons */
  button {
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    transition: all 0.2s;

    &.btn-ghost {
      background: transparent;
      color: #94a3b8;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #f1f5f9;
      }
    }

    &.btn-danger {
      background: #ef4444;
      color: white;

      &:hover {
        background: #dc2626;
      }
    }

    &.icon-only {
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  }
</style>
