<script>
  /**
   * @file src/ui/molecules/Modal.svelte
   * Frameless modal wrapper built on bits-ui Dialog and @atoms Backdrop.
   */
  import { Backdrop } from "@atoms";
  import { Dialog } from "bits-ui";

  let {
    dismissible = true,
    open = $bindable(true),
    layer = "modal",
    animate = true,
    class: className = "",
    on_close = () => {},
    children = null,
    ...rest
  } = $props();

  function dismiss() {
    if (!open || !dismissible) return;
    open = false;
    on_close();
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(next) => {
    if (!next) dismiss();
  }}
  preventScroll={false}>
  <Dialog.Portal>
    <Dialog.Overlay forceMount>
      {#snippet child({ props: overlayProps })}
        {#if open}
          <Backdrop {...overlayProps} onclick={dismiss} {layer} {animate}>
            <Dialog.Content
              {...rest}
              forceMount
              interactOutsideBehavior="ignore"
              escapeKeydownBehavior={dismissible ? "close" : "ignore"}
              onOpenAutoFocus={(e) => e.preventDefault()}
              class={className ? ["pointer-events-auto", className] : "pointer-events-none contents [&>*:not(.pointer-events-none)]:pointer-events-auto"}>
              {@render children?.()}
            </Dialog.Content>
          </Backdrop>
        {/if}
      {/snippet}
    </Dialog.Overlay>
  </Dialog.Portal>
</Dialog.Root>
