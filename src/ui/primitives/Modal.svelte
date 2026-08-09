<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   * Headless refactor powered by bits-ui/Dialog and Svelte 5.
   */
  import { Backdrop } from "@primitives";
  import { overlay_in, overlay_out } from "@motion";
  import { use_actions } from "@ui";
  import { Dialog } from "bits-ui";

  let {
    // State
    busy = null, // Dynamic fallback
    blur = true, // Pass-through for Backdrop blur
    is_pass_through = false, // Interaction pass-through
    // Bindable open state. Consumers may bind:open so the Modal stays mounted
    // and its exit transition can play when the value flips false; otherwise it
    // defaults to open and the parent controls the full lifecycle.
    open = $bindable(true),

    // Design
    variant = "standard",
    z_index = "200",
    class: className = "",

    // Handlers
    on_close = () => {},

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();

  // Determine active busy state. Defaults to false — modals stay interactive
  // during generation so the user can browse/view. Individual action buttons
  // inside already auto-disable via simulation_state.intent_active. Only pass
  // busy={true} explicitly when whole-modal graying is desired (e.g. local loading).
  let is_busy = $derived(busy !== null ? busy : false);

  // Track active state for mount/unmount gating
  let active_open = $derived(open);

  // Trigger on_close only when open changes from true to false
  $effect(() => {
    if (!open) {
      on_close();
    }
  });
</script>

<Dialog.Root
  {open}
  onOpenChange={(v) => {
    if (!v) on_close();
  }}
  preventScroll={false}
>
  <Dialog.Portal>
    <Dialog.Overlay forceMount>
      {#snippet child({ props: overlayProps })}
        {#if active_open}
          <Backdrop
            {...overlayProps}
            onpointerdown={(/** @type {PointerEvent} */ e) => {
              // Intercept the bits-ui overlay pointerdown to stop it from closing the Profile modal.
              // The Profile manages its own outside clicks via `click_outside`.
              if (variant === "profile") {
                // Do not call e.preventDefault() as it breaks text input focus bubbling.
                // Simply swallowing the event from bits-ui is enough.
              } else if (overlayProps.onpointerdown) {
                overlayProps.onpointerdown(e);
              }
            }}
            onclick={() => {
              // Route close through on_close so the consumer's bound `open`
              // flips false and the internal {#if} can play the exit transition.
              if (variant !== "profile") {
                on_close();
              }
            }}
            {z_index}
            is_blurred={blur}
            busy={is_busy}
            {is_pass_through}
            class={variant}
            data-modal-backdrop={variant}
          >
            <Dialog.Content
              {...rest}
              forceMount
              onInteractOutside={(/** @type {any} */ e) => {
                // Suppress bits-ui's built-in dismiss. The Backdrop's own onclick
                // already handles the genuine close-on-click-outside gesture.
                // Without this, portalled children (Select, Tooltip) that render
                // outside the Dialog DOM tree would trigger an unwanted close.
                e.preventDefault();
              }}
              onOpenAutoFocus={(/** @type {any} */ e) => {
                e.preventDefault();
              }}
            >
              {#snippet child({ props: contentProps })}
                {#if active_open}
                  <div
                    {...contentProps}
                    data-modal-variant={variant}
                    class={[
                      variant !== "bare" &&
                        variant !== "profile" &&
                        `
                          relative
                          flex
                          h-auto
                          max-h-screen
                          min-h-48
                          ${variant === "lightbox" ? "w-[clamp(20rem,95vw,80rem)] max-w-[95vw]" : "w-[clamp(16rem,90vw,28rem)]"}
                          cursor-default
                          scrollbar-none
                          flex-col
                          justify-between
                          gap-4
                          overflow-x-hidden
                          overflow-y-auto
                          rounded-xl
                          bg-glass-elevated
                          transition-[filter]
                          duration-300
                          before:pointer-events-none

                          before:absolute
                          before:inset-0
                          before:z-[-1]
                          before:bg-(--noise-url)
                          before:opacity-10
                          before:mix-blend-overlay
                          before:content-['']
                          [&::-webkit-scrollbar]:hidden
                        `,
                      (variant === "preview" || variant === "mini") && "max-w-md",
                      is_busy &&
                        `
                          pointer-events-none
                          cursor-wait
                          brightness-90
                          grayscale-50
                        `,
                      className,
                    ]}
                    onclick={(/** @type {MouseEvent} */ e) => {
                      if (variant !== "lightbox") e.stopPropagation();
                    }}
                    in:overlay_in={{ duration: variant === "profile" ? 0 : 300 }}
                    out:overlay_out
                    use:use_actions={actions}
                  >
                    {@render children?.()}
                  </div>
                {/if}
              {/snippet}
            </Dialog.Content>
          </Backdrop>
        {/if}
      {/snippet}
    </Dialog.Overlay>
  </Dialog.Portal>
</Dialog.Root>
