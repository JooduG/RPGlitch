<script>
  /**
   * @file Dialog.svelte
   * 🛡️ THE UNIFIED SYSTEM DIALOG
   * Standardizes Alert and Confirm into a single, sleek Nordic module.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import Button from "@atoms/Button.svelte";
  import Modal from "@atoms/Modal.svelte";

  let {
    // Data
    title = "System Message",
    message = "",
    type = "alert", // 'alert' | 'confirm'

    // State
    open = $bindable(false),
    busy = false,

    // Design
    confirm_label = "Confirm",
    cancel_label = "Cancel",
    ok_label = "OK",

    // Handlers
    on_confirm = () => {},
    on_cancel = () => {},
  } = $props();

  const handle_confirm = () => {
    if (busy) return;
    on_confirm();
    open = false;
  };

  const handle_cancel = () => {
    if (busy) return;
    on_cancel();
    open = false;
  };

  // Derived state for SOTA logic
  const show_icon = $derived(type === "alert");
</script>

<svelte:window onkeydown={(e) => open && !busy && e.key === "Enter" && handle_confirm()} />

{#if open}
  <Modal variant="mini" on_close={handle_cancel} z_index="var(--max-z-index)" {busy}>
    <header class="header">
      {#if show_icon}
        <span class="icon" aria-hidden="true">i</span>
      {/if}
      <h3 class="title">{title}</h3>
    </header>

    <div class="body">
      <p class="message">{message}</p>
    </div>

    <footer class="actions">
      {#if type === "confirm"}
        <Button variant="invisible" onclick={handle_cancel} label={cancel_label} {busy} />
        <Button variant="danger" onclick={handle_confirm} label={confirm_label} {busy} />
      {:else}
        <Button variant="primary" onclick={handle_confirm} label={ok_label} {busy} />
      {/if}
    </footer>
  </Modal>
{/if}

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .header, .title, .body, .message, .actions - Structural regions.
   */
  .header {
    display: flex;
    align-items: center;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-small);
    height: var(--icon-small);
    background: color-mix(in srgb, var(--frozen), transparent 85%);
    color: var(--frozen);
    border-radius: var(--radius-full);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-heavy);
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .title {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-h6);
    font-weight: var(--font-weight-bold);
    color: var(--font-color-base);
    letter-spacing: var(--font-spacing-tight);
    line-height: var(--font-height-short);
    text-transform: uppercase;
  }

  .body {
    flex: 1;
    min-height: 0;
  }

  .message {
    margin: 0;
    color: var(--font-color-muted);
    font-size: var(--font-size-base);
    line-height: var(--font-height-base);
    white-space: pre-wrap;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--gap-standard);
  }
</style>
