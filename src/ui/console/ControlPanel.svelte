<script>
  /**
   * @file src/ui/console/ControlPanel.svelte
   * 🎛️ CONSOLE CONTROL PANEL — the accordion "settings" decks that expand
   * when the gear is toggled: Audio, Storyboard, Storymode, Library, Advanced.
   */
  import { Accordion, Button, ScrollArea, TextField } from "@primitives";
  import { session_driver } from "@engine";
  import { app, simulation_state } from "@state";
  import { StoryManager } from "@story";
  import AudioControls from "./AudioControls.svelte";
  import DevControls from "./DevControls.svelte";

  let { is_ending_story = false, on_end_story = undefined } = $props();

  let is_locked = $derived(simulation_state.busy);
</script>

<!-- ACCORDION SETTINGS (VERTICAL EXPANSION) -->
<div
  class="grid min-h-0 w-full transition-[grid-template-rows] duration-500 ease-in-out {app.control_panel_open
    ? 'grid-rows-[1fr]'
    : 'grid-rows-[0fr]'}"
>
  <div class="flex min-h-0 w-full flex-col overflow-hidden">
    <div
      class="mx-auto flex min-h-0 w-full flex-col gap-4 pb-4 opacity-0 transition-opacity md:w-[calc(var(--spacing-column-unit)*5-2rem)] {app.control_panel_open
        ? 'opacity-100 delay-300 duration-200'
        : 'delay-0 duration-150'}"
    >
      <ScrollArea class="min-h-0 w-full">
        <div class="flex w-full flex-col gap-2 px-2" style="--signature-color: var(--color-frozen);">
          <!-- DECK A: AUDIO -->
          <Accordion label="Audio" content_class="flex flex-col gap-4">
            <AudioControls />
          </Accordion>

          <!-- DECK B: STORYBOARD (Contextual) -->
          {#if app.view === "storyboard"}
            <Accordion label="Storyboard" content_class="flex flex-col gap-4">
              <div class="w-full">
                <TextField is_edit={true} placeholder="Optional Prologue Instructions" bind:value={app.prologue} />
              </div>
            </Accordion>
          {/if}

          <!-- DECK C: STORYMODE (Contextual) -->
          {#if app.view === "storymode"}
            <Accordion label="Storymode" content_class="flex flex-row flex-wrap items-center gap-4">
              <Button
                label="Return to Storyboard"
                variant="secondary"
                size="small"
                onclick={async () => {
                  await session_driver.clear_active();
                  await app.load_entities(); // Keep lobby lists in sync with active-story claims
                  app.set_view("storyboard");
                }}
              />

              <Button
                label="END STORY"
                variant="danger"
                size="small"
                loading={is_ending_story}
                busy={is_ending_story}
                disabled={is_ending_story || is_locked}
                onclick={on_end_story}
              />
            </Accordion>
          {/if}

          <!-- DECK D: LIBRARY (Always available) -->
          <Accordion label="Library" content_class="flex flex-col gap-4">
            <StoryManager />
          </Accordion>

          <!-- DECK E: ADVANCED -->
          <Accordion label="Advanced" content_class="flex w-full flex-wrap items-center justify-between gap-4">
            <DevControls />
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  </div>
</div>
