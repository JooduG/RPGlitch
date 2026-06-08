<script>
  /**
   * @file Dialog.svelte
   * ðŸ›¡ï¸ THE UNIFIED SYSTEM DIALOG
   * Standardizes Alert and Confirm into a single, sleek bits-ui/AlertDialog primitive.
   * RUTHLESSLY FLATTENED: Fully accessible, headless, Svelte 5 runes-powered.
   */
  import { Backdrop, Button } from "@atoms";
  import { resolve_ms, resolve_px } from "@components";
  import { AlertDialog } from "bits-ui";
  import { quartOut } from "svelte/easing";
  import { fly, scale } from "svelte/transition";

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

  // derived values from tokens
  const offset = resolve_px("--spacing-5", 20);
  const duration_in = resolve_ms("--duration-standard", 350);
  const duration_out = resolve_ms("--duration-fast", 250);
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Portal>
    <AlertDialog.Overlay forceMount>
      {#snippet child({ props: overlayProps, open: isOpen })}
        {#if isOpen}
          <Backdrop
            {...overlayProps}
            onclick={handle_cancel}
            z_index="var(--z-index-max)"
            {busy}
            is_blurred={true}
            class="mini-backdrop"
          >
            <AlertDialog.Content forceMount>
              {#snippet child({ props: contentProps, open: isContentOpen })}
                {#if isContentOpen}
                  <div
                    {...contentProps}
                    class="root glass-elevated mini"
                    class:is-busy={busy}
                    in:fly={{ y: offset, duration: duration_in, easing: quartOut }}
                    out:scale={{ duration: duration_out, easing: quartOut, start: 0.95 }}
                  >
                    <header class="header">
                      {#if type === "alert"}
                        <span class="icon" aria-hidden="true">i</span>
                      {/if}
                      <AlertDialog.Title class="title-el">
                        <h6 class="title">{title}</h6>
                      </AlertDialog.Title>
                    </header>

                    <AlertDialog.Description class="body">
                      <p class="message">{message}</p>
                    </AlertDialog.Description>

                    <footer class="actions">
                      {#if type === "confirm"}
                        <AlertDialog.Cancel>
                          {#snippet child({ props: cancelProps })}
                            <Button
                              {...cancelProps}
                              variant="invisible"
                              onclick={handle_cancel}
                              label={cancel_label}
                              disabled={busy}
                            />
                          {/snippet}
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                          {#snippet child({ props: actionProps })}
                            <Button
                              {...actionProps}
                              variant="danger"
                              onclick={handle_confirm}
                              label={confirm_label}
                              disabled={busy}
                            />
                          {/snippet}
                        </AlertDialog.Action>
                      {:else}
                        <AlertDialog.Action>
                          {#snippet child({ props: actionProps })}
                            <Button
                              {...actionProps}
                              variant="primary"
                              onclick={handle_confirm}
                              label={ok_label}
                              disabled={busy}
                            />
                          {/snippet}
                        </AlertDialog.Action>
                      {/if}
                    </footer>
                  </div>
                {/if}
              {/snippet}
            </AlertDialog.Content>
          </Backdrop>
        {/if}
      {/snippet}
    </AlertDialog.Overlay>
  </AlertDialog.Portal>
</AlertDialog.Root>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - The core dialog container.
   * .header, .title, .body, .message, .actions - Structural regions.
   */
  .root {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    justify-content: space-between;

    /* Dimensions grounded in Grid Foundation */
    width: clamp(calc(var(--column-unit) * 3), 90vw, var(--modal-width-thin));
    height: clamp(calc(var(--row-unit) * 3), auto, var(--modal-height-standard));
    padding: var(--padding-standard);
    gap: var(--gap-standard);
    border-radius: var(--radius-standard);
    cursor: default;
    pointer-events: auto;
    transition: filter var(--duration-standard);

    /* Extreme z-index overlay to prevent collision under parent modal layers */
    z-index: var(--z-index-max);
  }

  /* Nordic Collection Noise Texture */
  .root::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: var(--z-index-below);
    background-image: var(--noise-url);
    opacity: var(--opacity-ghost);
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--gap-tight);
  }

  :global(.title-el) {
    display: block;
    margin: 0;
    padding: 0;
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
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .title {
    color: var(--frisk);
    text-transform: uppercase;
    margin: 0;
  }

  .body {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 0;
  }

  .message {
    margin: 0;
    color: var(--frozen);
    font-size: var(--font-size-base);
    line-height: var(--font-height-base);
    white-space: pre-wrap;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--gap-standard);
  }

  /* Busy State Logic: Kinetic Grayout */
  .root.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
    pointer-events: none;
  }
</style>
