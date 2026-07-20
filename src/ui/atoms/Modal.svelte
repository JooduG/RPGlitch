<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   * Headless refactor powered by bits-ui/Dialog and Svelte 5.
   */
  import { Backdrop } from "@atoms";
  import { simulationState } from "@state";
  import { use_actions } from "@actions";
  import { Dialog } from "bits-ui";

  let {
    // State
    busy = null, // Dynamic fallback
    blur = true, // Pass-through for Backdrop blur
    is_pass_through = false, // Interaction pass-through

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

  // Determine active busy state using the unified simulationState if busy is not explicitly passed
  let is_busy = $derived(busy !== null ? busy : simulationState.busy);

  // Bind dialog open state
  let open = $state(true);

  // Track active state for mount/unmount gating
  let activeOpen = $derived(open);

  // Trigger on_close only when open changes from true to false
  $effect(() => {
    if (!open) {
      on_close();
    }
  });
</script>

<Dialog.Root bind:open preventScroll={false}>
  <Dialog.Portal>
    <Dialog.Overlay forceMount>
      {#snippet child({ props: overlayProps })}
        {#if activeOpen}
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
              if (variant !== "profile") {
                open = false;
              }
            }}
            {z_index}
            busy={is_busy}
            is_blurred={blur}
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
                {#if activeOpen}
                  <div
                    {...contentProps}
                    data-modal-variant={variant}
                    class="
                      relative
                      flex
                      h-auto
                      max-h-screen
                      min-h-48
                      {variant === 'lightbox' ? 'w-[clamp(20rem,95vw,80rem)] max-w-[95vw]' : 'w-[clamp(16rem,90vw,28rem)]'}
                      cursor-default
                      scrollbar-none
                      flex-col
                      justify-between
                      gap-4
                      overflow-x-hidden
                      overflow-y-auto
                      rounded-xl
                      bg-glass-elevated
                      p-4
                      transition-[filter]
                      duration-300
                      [&::-webkit-scrollbar]:hidden

                      {variant}
                      {variant !== 'profile'
                      ? `
                        before:pointer-events-none
                        before:absolute
                        before:inset-0
                        before:z-[-1]
                        before:bg-(--noise-url)
                        before:opacity-10
                        before:mix-blend-overlay
                        before:content-[\\'\\']
                      `
                      : `
                        h-auto
                        max-h-none!
                        min-h-0
                        w-fit
                        max-w-none!
                        overflow-visible!
                        border-none!
                        bg-transparent!
                        p-0!
                        shadow-none!
                        backdrop-blur-none!
                      `}
                      {variant === 'preview' || variant === 'mini' ? 'max-w-md' : ''} {is_busy
                      ? `
                        pointer-events-none
                        cursor-wait
                        brightness-90
                        grayscale-50
                      `
                      : ''}
                      {className}"
                    onclick={(/** @type {MouseEvent} */ e) => {
                      e.stopPropagation();
                    }}
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
