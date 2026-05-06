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

    // Handlers
    on_confirm = () => {},
    on_cancel = () => {},

    ...rest
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
</script>

<svelte:window onkeydown={(e) => open && !busy && e.key === "Enter" && handle_confirm()} />

{#if open}
  <Modal variant="mini" on_close={handle_cancel} z_index="var(--z-index-xxl)" {busy}>
    <article class="wrapper" class:is-confirm={type === "confirm"} class:is-busy={busy} {...rest}>
      <header class="header">
        {#if type === "alert"}
          <span class="icon" aria-hidden="true">i</span>
        {/if}
        <h3 class="title">{title}</h3>
      </header>

      <div class="body">
        <p>{message}</p>
      </div>

      <footer class="footer">
        {#if type === "confirm"}
          <Button variant="invisible" onclick={handle_cancel} label={cancel_label} {busy} />
          <Button variant="danger" onclick={handle_confirm} label={confirm_label} {busy} />
        {:else}
          <Button variant="primary" onclick={handle_cancel} label="OK" {busy} />
        {/if}
      </footer>
    </article>
  </Modal>
{/if}

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .wrapper - Main layout container (animated).
   * .header, .body, .footer - Structural regions.
   */
  .wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    animation: slide-up var(--motion-m) var(--motion-elastic);
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: brightness(0.8) grayscale(0.5);
  }

  .wrapper.is-busy > * {
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    margin-bottom: var(--spacing-s);
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: rgb(var(--color-frozen-rgb) / 10%);
    color: var(--color-frozen);
    border-radius: var(--border-radius-full);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .title {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-l);
    color: var(--font-color-m);
    letter-spacing: -0.01em;
  }

  .body {
    padding: var(--spacing-xs) 0 var(--spacing-l);
    color: var(--font-color-s);
    font-size: var(--font-size-m);
    line-height: var(--line-height-m);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
    margin-top: auto;
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
