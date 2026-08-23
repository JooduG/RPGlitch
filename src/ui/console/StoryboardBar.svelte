<script>
  /**
   * @file src/ui/console/StoryboardBar.svelte
   * 🃏 STORYBOARD BOTTOM BAR — the storyboard branch of the console: settings
   * gear, the models-progress / "BEGIN STORY" trigger, and the shuffle control.
   */
  import { Button, ProgressBar, tooltip } from "@primitives";
  import { pulse, shimmy } from "@motion";
  import { app } from "@state";
  import { storyboard } from "@ui";
  import SettingsButton from "./SettingsButton.svelte";

  let models_ready = $derived(app.models_ready);
  let ready_to_begin = $derived(app.is_ready && models_ready);
  let label_text = $derived(ready_to_begin ? "BEGIN STORY" : `SELECT ENTITIES (${app.selected_count}/3)`);
</script>

<SettingsButton variant={app.control_panel_open ? "secondary" : "invisible"} testid="settings-button" />

{#if !models_ready}
  <ProgressBar value={app.models_progress} class="flex-1" />
{:else}
  <Button
    class="group touch-target-coarse"
    data-ready={ready_to_begin}
    variant="invisible"
    busy={!ready_to_begin || app.simulation.loading}
    disabled={app.control_panel_open}
    onclick={storyboard.begin}
    actions={[pulse]}
  >
    <h6
      class="m-0 tracking-widest transition-all duration-300 {ready_to_begin
        ? 'group-hover:scale-105 group-hover:brightness-125'
        : 'text-slate-400 opacity-80'}"
      style={ready_to_begin
        ? "color: var(--color-emerald-green); text-shadow: 0 0 0.5rem color-mix(in srgb, var(--color-emerald-green) 25%, transparent);"
        : undefined}
    >
      {app.simulation.loading ? "Generating Prologue..." : label_text}
    </h6>
  </Button>
{/if}

<Button
  flank={true}
  variant="invisible"
  aria-label="Shuffle Entities"
  disabled={app.control_panel_open || app.simulation.loading}
  onclick={() => storyboard.shuffle()}
  actions={[shimmy, tooltip]}
  class="touch-target-coarse"
>
  <svg viewBox="0 0 24 24" class="block size-icon-medium">
    <path
      fill="currentColor"
      d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
    />
  </svg>
</Button>
