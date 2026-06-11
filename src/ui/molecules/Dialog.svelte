<script>
  /**
   * @file Dialog.svelte
   * 🛡️ THE UNIFIED SYSTEM DIALOG
   * Standardizes Alert and Confirm into a single bits-ui/AlertDialog primitive.
   * Svelte 5 runes · Chalk Regime · Fully accessible.
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

    // Labels
    confirm_label = "Confirm",
    ok_label = "OK",

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

  const offset = resolve_px("--spacing-5", 20);
  const duration_in = resolve_ms("--duration-standard", 350);
  const duration_out = resolve_ms("--duration-fast", 250);
</script>

<AlertDialog.Root bind:open preventScroll={false}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay forceMount>
      {#snippet child({ props: overlayProps, open: is_open })}
        {#if is_open}
          <Backdrop
            {...overlayProps}
            onclick={handle_cancel}
            z_index="var(--z-index-max)"
            {busy}
            is_blurred={true}
            data-backdrop="mini"
          >
            <AlertDialog.Content forceMount>
              {#snippet child({ props: contentProps })}
                <div
                  {...contentProps}
                  class="
                    pointer-events-auto
                    relative
                    z-(--z-index-max)
                    flex
                    w-[90vw]
                    cursor-default
                    flex-col
                    justify-between
                    gap-(--gap-standard)
                    overflow-hidden
                    rounded-(--radius-standard)
                    border
                    border-[color-mix(in_srgb,var(--frozen)_10%,transparent)]
                    bg-(--glass-elevated)
                    p-(--padding-standard)
                    [backdrop-filter:var(--blur-mist)]
                    transition-[filter]
                    duration-300

                    before:pointer-events-none
                    before:absolute
                    before:inset-0
                    before:-z-10
                    before:bg-(--noise-url)
                    before:opacity-10
                    before:mix-blend-overlay

                    sm:w-(--modal-width-thin)

                    {busy ? 'pointer-events-none cursor-wait brightness-75 grayscale' : ''}"
                  in:fly={{ y: offset, duration: duration_in, easing: quartOut }}
                  out:scale={{ duration: duration_out, easing: quartOut, start: 0.95 }}
                >
                  <AlertDialog.Title class="m-0 p-0">
                    <h6 class="m-0 uppercase">{title}</h6>
                  </AlertDialog.Title>

                  <AlertDialog.Description class="m-0 min-h-0 flex-1 p-0">
                    <p class="m-0 text-base leading-relaxed whitespace-pre-wrap text-(--frozen)">
                      {message}
                    </p>
                  </AlertDialog.Description>

                  <footer class="flex justify-end gap-(--gap-standard)">
                    <AlertDialog.Action>
                      {#snippet child({ props: actionProps })}
                        <Button
                          {...actionProps}
                          variant={action.variant}
                          onclick={handle_confirm}
                          label={action.label}
                          disabled={busy}
                        />
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
