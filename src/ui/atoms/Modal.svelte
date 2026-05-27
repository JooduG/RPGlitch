<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   * Headless refactor powered by bits-ui/Dialog and Svelte 5.
   */
  import Backdrop from "@atoms/Backdrop.svelte";
  import { simulationState } from "@state";
  import { use_actions } from "@ui/actions";
  import { resolve_ms, resolve_px } from "@ui/components";
  import { Dialog } from "bits-ui";
  import { quartOut } from "svelte/easing";
  import { fly, scale } from "svelte/transition";

  let {
    // State
    busy = null, // Dynamic fallback
    blur = true, // Pass-through for Backdrop blur
    is_pass_through = false, // Interaction pass-through

    // Design
    variant = "standard",
    z_index = "var(--z-index-modal)",
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

  // The 'Fly' offset and durations are resolved once from design tokens on initialization.
  const offset = resolve_px("--spacing-5", 20);
  const duration_in = resolve_ms("--duration-standard", 350);
  const duration_out = resolve_ms("--duration-fast", 250);

  // Bind dialog open state
  let open = $state(true);

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
      {#snippet child({ props: overlayProps, open: isOpen })}
        {#if isOpen}
          <Backdrop
            {...overlayProps}
            onclick={() => {
              open = false;
            }}
            {z_index}
            busy={is_busy}
            is_blurred={blur}
            {is_pass_through}
            class="{variant}-backdrop"
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
              {#snippet child({ props: contentProps, open: isContentOpen })}
                {#if isContentOpen}
                  <div
                    {...contentProps}
                    class="root glass-elevated {variant} {className}"
                    class:is-busy={is_busy}
                    onclick={(/** @type {MouseEvent} */ e) => e.stopPropagation()}
                    in:fly={{ y: offset, duration: duration_in, easing: quartOut }}
                    out:scale={{ duration: duration_out, easing: quartOut, start: 0.95 }}
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

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - The core modal container.
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
  }

  /* Nordic Collection Noise Texture */
  .root:not(.profile)::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: var(--z-index-below);
    background-image: var(--noise-url);
    opacity: var(--opacity-ghost);
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  /* Variant Specifics: Profile (Transparent Passthrough) */
  .root.profile {
    width: fit-content;
    height: 100vh;
    max-width: none;
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow: visible;
    padding: 0;
  }

  /* Variant Specifics: Preview/Mini (Compact) */
  .root.preview,
  .root.mini {
    max-width: var(--modal-width-thin);
    padding: var(--padding-standard);
  }

  /* Busy State Logic: Kinetic Grayout */
  .root.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
    pointer-events: none;
  }
</style>
