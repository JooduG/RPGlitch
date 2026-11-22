<script>
  /**
   * @file src/ui/molecules/Modal.svelte
   * Frameless modal wrapper built on bits-ui Dialog and @atoms Backdrop.
   */
  import { Backdrop } from "@atoms";
  import { Dialog } from "bits-ui";

  let {
    busy = null,
    blur = true,
    is_pass_through = false,
    dismissible = true,
    open = $bindable(true),
    layer = "modal",
    animate = true,
    class: className = "",
    on_close = () => {},
    children = null,
    actions = [],
    ...rest
  } = $props();

  let is_busy = $derived(busy !== null ? busy : false);

  $effect(() => {
    if (!open && dismissible) {
      on_close();
    }
  });
</script>

<Dialog.Root
  {open}
  onOpenChange={(v) => {
    if (!v && dismissible) on_close();
  }}
  preventScroll={false}>
  <Dialog.Portal>
    <Dialog.Overlay forceMount>
      {#snippet child({ props: overlayProps })}
        {#if open}
          <Backdrop
            {...overlayProps}
            onclick={() => {
              if (dismissible) {
                on_close();
              }
            }}
            {layer}
            {animate}
            is_blurred={blur}
            busy={is_busy}
            {is_pass_through}
            {actions}>
            <Dialog.Content
              {...rest}
              forceMount
              interactOutsideBehavior="ignore"
              escapeKeydownBehavior={dismissible ? "close" : "ignore"}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
              }}
              class={className ? ["pointer-events-auto", className] : "pointer-events-none contents [&>*:not(.pointer-events-none)]:pointer-events-auto"}>
              {@render children?.()}
            </Dialog.Content>
          </Backdrop>
        {/if}
      {/snippet}
    </Dialog.Overlay>
  </Dialog.Portal>
</Dialog.Root>
