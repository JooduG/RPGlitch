<script>
  /**
   * @file src/ui/molecules/Dialog.svelte
   * 🛡️ THE UNIFIED SYSTEM DIALOG
   * Standardizes Alert and Confirm into a single, cute Nordic module.
   * Uses the Header -> Body -> Footer pattern from the Profile panels.
   */
  import Button from "@ui/atoms/Button.svelte";
  import Modal from "./Modal.svelte";
  import { quartOut } from "svelte/easing";
  import { fade } from "svelte/transition";

  let {
    title = "System Message",
    message = "",
    type = "alert", // 'alert' | 'confirm'
    confirm_label = "Confirm",
    cancel_label = "Cancel",
    on_confirm = () => {},
    on_cancel = () => {},
    open = $bindable(false),
  } = $props();

  let confirm_btn = $state();

  /** Handle Confirm Action */
  function handle_confirm() {
    on_confirm();
    open = false;
  }

  /** Handle Cancel/Close Action */
  function handle_cancel() {
    on_cancel();
    open = false;
  }
</script>

{#if open}
  <Modal variant="mini" on_close={handle_cancel} z_index="var(--z-index-max)">
    <article class="dialog-wrapper" class:is-confirm={type === 'confirm'}>
      <header>
        <div class="title-row">
          {#if type === "alert"}
            <span class="status-icon info" aria-hidden="true">ℹ</span>
          {/if}
          <h3>{title}</h3>
        </div>
      </header>

      <div class="content">
        <p>{message}</p>
      </div>

      <footer>
        <div class="actions">
          {#if type === "confirm"}
            <Button variant="ghost" onclick={handle_cancel} label={cancel_label} />
            <Button
              variant="danger"
              onclick={handle_confirm}
              bind:this={confirm_btn}
              label={confirm_label}
            />
          {:else}
            <Button
              variant="primary"
              onclick={handle_cancel}
              bind:this={confirm_btn}
              label="OK"
            />
          {/if}
        </div>
      </footer>
    </article>
  </Modal>
{/if}

<style>
  .dialog-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    animation: slide-up var(--motion-m) var(--motion-elastic);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-s);
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: rgb(var(--color-frozen-rgb) / var(--opacity-s));
    color: var(--color-frozen);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-xs);
    font-weight: bold;
  }

  h3 {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-l);
    color: var(--font-color-m);
    letter-spacing: -0.01em;
  }

  .content {
    padding: var(--spacing-xs) 0 var(--spacing-l);
    color: var(--font-color-s);
    font-size: var(--font-size-m);
    line-height: var(--line-height-m);
  }

  footer {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
  }

  .actions {
    display: flex;
    gap: var(--spacing-s);
  }

  @keyframes slide-up {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
