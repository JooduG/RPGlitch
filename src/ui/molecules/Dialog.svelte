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

<AlertDialog.Root bind:open preventScroll={false}>
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
            data-backdrop="mini"
          >
            <AlertDialog.Content forceMount>
              {#snippet child({ props: contentProps, open: isContentOpen })}
                {#if isContentOpen}
                  <div
                    {...contentProps}
                    class="
                      pointer-events-auto
                      relative
                      z-(--z-index-max)
                      flex
                      min-h-48
                      w-[90vw]
                      cursor-default
                      flex-col
                      justify-between
                      gap-4
                      overflow-hidden
                      rounded-md
                      border
                      border-white/5
                      bg-black/25
                      p-4
                      backdrop-blur-sm
                      transition-[filter]
                      duration-300

                      before:pointer-events-none
                      before:absolute
                      before:inset-0
                      before:-z-10
                      before:bg-(image:--noise-url)
                      before:opacity-10
                      before:mix-blend-overlay

                      sm:w-(--modal-width-thin)

                      {busy
                      ? `
                        pointer-events-none
                        cursor-wait
                        brightness-75
                        grayscale
                      `
                      : ''}"
                    in:fly={{ y: offset, duration: duration_in, easing: quartOut }}
                    out:scale={{ duration: duration_out, easing: quartOut, start: 0.95 }}
                  >
                    <header
                      class="
                      flex
                      items-center
                      gap-2
                    "
                    >
                      {#if type === "alert"}
                        <span
                          class="
                            flex
                            h-6
                            w-6
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-600/15
                            text-[10px]
                            font-bold
                            text-slate-600
                            uppercase
                          "
                          aria-hidden="true">i</span
                        >
                      {/if}
                      <AlertDialog.Title
                        class="
                        m-0
                        block
                        p-0
                      "
                      >
                        <h6
                          class="
                          m-0
                          text-slate-50
                          uppercase
                        "
                        >
                          {title}
                        </h6>
                      </AlertDialog.Title>
                    </header>

                    <AlertDialog.Description
                      class="
                      m-0
                      min-h-0
                      flex-1
                      p-0
                    "
                    >
                      <p
                        class="
                        m-0
                        text-base
                        leading-relaxed
                        whitespace-pre-wrap
                        text-slate-600
                      "
                      >
                        {message}
                      </p>
                    </AlertDialog.Description>

                    <footer
                      class="
                      flex
                      justify-end
                      gap-4
                    "
                    >
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
