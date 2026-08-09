<script>
  /**
   * @file Dialog.svelte
   * 🛡️ THE UNIFIED SYSTEM DIALOG
   * Standardizes Alert and Confirm into a single bits-ui/AlertDialog primitive.
   * Svelte 5 runes · Fully accessible.
   */
  import { Backdrop, Button } from "@primitives";
  import { overlay_in, overlay_out } from "@motion";
  import { resolve_ms } from "@utils";
  import { AlertDialog } from "bits-ui";

  let {
    // Data
    title = "System Message",
    message = "",
    type = "alert", // 'alert' | 'confirm'

    // State
    open = $bindable(false),
    busy = false,

    // Labels
    confirm_label = "Confirm",
    ok_label = "OK",

    // Input support
    input_value = $bindable(""),
    show_input = false,
    input_placeholder = "",

    // Handlers
    on_confirm = () => {},
    on_cancel = () => {},
  } = $props();

  // Derived action config — single source of truth for the action button
  const action = $derived(
    type === "confirm"
      ? { variant: /** @type {"danger"} */ ("danger"), label: confirm_label }
      : { variant: /** @type {"primary"} */ ("primary"), label: ok_label },
  );

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

  const duration_in = resolve_ms("--duration-standard", 300);
  const duration_out = resolve_ms("--duration-fast", 150);
</script>

<svelte:window
  onkeydown={(e) => {
    if (open && e.key === "Enter" && !e.shiftKey) {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.tagName === "INPUT" || target.isContentEditable) return;
      e.preventDefault();
      handle_confirm();
    }
  }}
/>

<AlertDialog.Root bind:open preventScroll={false}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay forceMount>
      {#snippet child({ props: overlayProps, open: is_open })}
        {#if is_open}
          <Backdrop {...overlayProps} onclick={handle_cancel} layer="max" {busy} variant="mini">
            <AlertDialog.Content forceMount>
              {#snippet child({ props: contentProps })}
                <div
                  {contentProps}
                  class="
                    pointer-events-auto
                    relative
                    z-max
                    flex
                    w-(--dialog-width)
                    cursor-default
                    flex-col
                    justify-between
                    gap-gap-standard
                    overflow-hidden
                    rounded-standard
                    bg-glass-elevated
                    p-padding-standard
                    duration-300

                    before:pointer-events-none
                    before:absolute
                    before:inset-0
                    before:-z-10
                    before:bg-(--noise-url)
                    before:opacity-10
                    before:mix-blend-overlay

                    sm:w-[calc(var(--spacing-column-unit)*3)]

                    {busy ? 'pointer-events-none cursor-wait brightness-75 grayscale' : ''}"
                  style="
                    --dialog-width: 90vw;

                    backdrop-filter: var(--blur-mist);
                    transition-property: filter;
                  "
                  in:overlay_in={{ duration: duration_in }}
                  out:overlay_out={{ duration: duration_out }}
                >
                  <AlertDialog.Title class="m-0 p-0 text-left">
                    <h6 class="m-0 uppercase">{title}</h6>
                  </AlertDialog.Title>

                  <AlertDialog.Description class="m-0 min-h-0 flex-1 p-0 text-left">
                    <p class="m-0 text-left text-base leading-relaxed whitespace-pre-wrap text-frisk">
                      {message}
                    </p>
                  </AlertDialog.Description>

                  {#if show_input}
                    <input
                      bind:value={input_value}
                      placeholder={input_placeholder}
                      class="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-base text-slate-50 outline-none focus:border-white/40"
                      onkeydown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handle_confirm();
                        }
                      }}
                    />
                  {/if}

                  <footer class="flex w-full justify-end gap-gap-standard outline-none">
                    <AlertDialog.Action>
                      {#snippet child({ props: actionProps })}
                        <Button {...actionProps} variant={action.variant} onclick={handle_confirm} label={action.label} disabled={busy} />
                      {/snippet}
                    </AlertDialog.Action>
                  </footer>
                </div>
              {/snippet}
            </AlertDialog.Content>
          </Backdrop>
        {/if}
      {/snippet}
    </AlertDialog.Overlay>
  </AlertDialog.Portal>
</AlertDialog.Root>
