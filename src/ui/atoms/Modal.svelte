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
  import { guardedTransition } from "@engine";
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

  // Synchronize open and activeOpen state using document.startViewTransition
  let activeOpen = $state(false);

  $effect(() => {
    if (open !== activeOpen) {
      guardedTransition(() => {
        activeOpen = open;
      });
    }
  });

  // Trigger on_close only when open changes from true to false
  $effect(() => {
    if (!open) {
      on_close();
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay forceMount>
      {#snippet child({ props: overlayProps })}
        {#if activeOpen}
          <Backdrop
            {...overlayProps}
            onclick={() => {
              open = false;
            }}
            {z_index}
            busy={is_busy}
            is_blurred={blur}
            {is_pass_through}
            class={variant}
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
            >
              {#snippet child({ props: contentProps })}
                {#if activeOpen}
                  <div
                    {...contentProps}
                    class="
                      pointer-events-auto
                      relative
                      flex
                      h-[clamp(12rem,auto,40rem)]
                      w-[clamp(16rem,90vw,28rem)]
                      cursor-default
                      flex-col
                      justify-between
                      gap-[var(--gap-standard)]
                      overflow-hidden
                      rounded-[var(--radius-standard)]
                      p-[var(--padding-standard)]
                      transition-[filter]
                      duration-300
                      [view-transition-name:modal-container]

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
                        h-screen
                        w-fit
                        max-w-none
                        overflow-visible!
                        border-none!
                        bg-transparent
                        p-0
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
                    onclick={(/** @type {MouseEvent} */ e) => e.stopPropagation()}
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
