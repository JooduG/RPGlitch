<!--
  @file src/ui/console/EndStoryModal.svelte
  🛡️ END STORY & CONCLUDE MODAL
  Provides dual options to conclude an active narrative session:
  1. Generate Epilogue & Conclude (delivers concluding narrative beat then wraps up).
  2. Conclude Immediately (finalizes session in persistence without generating epilogue).
  Dismissible via standard click-outside backdrop or Escape key.
-->
<script>
  import { Backdrop, Button } from "@primitives";
  import { overlay_in, overlay_out } from "@motion";
  import { resolve_ms } from "@utils";
  import { AlertDialog } from "bits-ui";

  let {
    open = $bindable(false),
    busy = false,
    title = "Conclude Active Story",
    message = "Would you like to author a final epilogue before concluding, or conclude immediately?",
    on_epilogue_and_conclude = () => {},
    on_conclude_immediately = () => {},
    on_cancel = () => {},
  } = $props();

  const handle_cancel = () => {
    if (busy) return;
    open = false;
    on_cancel();
  };

  const handle_epilogue = async () => {
    if (busy) return;
    await on_epilogue_and_conclude();
    open = false;
  };

  const handle_conclude_immediately = async () => {
    if (busy) return;
    await on_conclude_immediately();
    open = false;
  };

  const duration_in = resolve_ms("--duration-standard", 300);
  const duration_out = resolve_ms("--duration-fast", 150);
</script>

<svelte:window
  onkeydown={(e) => {
    if (open && e.key === "Escape") {
      e.preventDefault();
      handle_cancel();
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

                    sm:w-[calc(var(--spacing-column-unit)*4)]

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

                  <footer class="flex w-full flex-col justify-end gap-2 outline-none sm:flex-row">
                    <Button variant="primary" onclick={handle_epilogue} label="Generate Epilogue & Conclude" disabled={busy} />
                    <Button variant="danger" onclick={handle_conclude_immediately} label="Conclude Immediately" disabled={busy} />
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

<!-- CHANGELOG
  - 2026-10-03: Created unified EndStoryModal offering Epilogue & Conclude vs Conclude Immediately with click-outside cancel.
-->
