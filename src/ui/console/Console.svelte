<script>
  /**
   * @file src/ui/console/Console.svelte
   * 🎛️ THE SOVEREIGN CORE CONSOLE
   * Polymorphic command control system merging GlassPill, StoryboardPill,
   * ControlPanel, and StorymodeBar. Standard: Ultra-Lean DOM shell — the accordion
   * decks live in ControlPanel, the gear in SettingsButton, the storyboard bar
   * in StoryboardBar, and the shuffle / begin-story choreography in
   * Storyboard.svelte.js (via @ui).
   */
  import { click_outside } from "@ui";
  import { Backdrop, Button } from "@primitives";
  import { Shimmer } from "@motion";
  import { session_driver, db } from "@data";
  import { gamemaster } from "@intelligence";
  import { get_signature_color } from "@media";
  import { app, runtime, simulation_log, simulation_state } from "@state";
  import { download_text_file, export_story_markdown } from "@utils";
  import { install_begin_flight_effect } from "@ui";
  import ControlPanel from "./ControlPanel.svelte";
  import SettingsButton from "./SettingsButton.svelte";
  import StoryboardBar from "./StoryboardBar.svelte";
  import StorymodeBar from "./StorymodeBar.svelte";

  // --- STORYMODE CONSOLE STATE ---
  let is_focused = $state(false);
  let has_text = $state(false);

  // A story is concluded once its log carries the epilogue entry (the app's
  // semantic conclusion marker) — covers manual END STORY, Director-declared
  // conclusions, and reloads of a concluded story, not just the lock phase.
  // Scoped to the ACTIVE story: an epilogue written by another story's delayed
  // write must never lock this one (cross-story epilogue contamination).
  let story_concluded = $derived(
    simulation_log.feed.some((e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(runtime.story_id))),
  );
  let story_locked = $derived(simulation_state.phase === "locked" || story_concluded);
  let signature_color = $derived(get_signature_color(runtime.active_user || app.selected_user, "var(--color-gunmetal)"));

  // --- BEGIN-STORY FLIGHT ORCHESTRATION (see Storyboard.svelte.js via @ui) ---
  install_begin_flight_effect();

  let is_ending_story = $state(false);
  let is_exporting = $state(false);
  let is_rewinding = $state(false);

  /**
   * REWIND / "KEEP CHATTING" — the rewind path for a concluded or collapsed
   * story. Lifts the story back to life: removes every epilogue entry for the
   * active story (persisted + in-memory), clears the conclusion status so the
   * 💀/✨ badge and lock release, and re-activates the story so its entities
   * stay claimed in the lobby. The user can then keep chatting instead of being
   * forced to conclude. Both positive (CONCLUDED) and negative (COLLAPSED) ends
   * offer this — a story collapsing does not have to be the final word.
   */
  async function handle_rewind() {
    if (is_rewinding || !runtime.story_id) return;
    is_rewinding = true;
    try {
      const epilogues = simulation_log.feed.filter(
        (e) => e?.meta?.is_epilogue && (e.story_id === undefined || String(e.story_id) === String(runtime.story_id)),
      );
      for (const ep of epilogues) {
        if (ep?.id != null) await simulation_log.delete_entry(String(ep.id));
      }
      simulation_state.phase = "idle";
      app.conclusion_status = null;
      if (runtime.story_id) {
        await session_driver.set_active(runtime.story_id);
      }
      app.log("Story rewound — you can continue chatting.", "system");
    } catch (err) {
      console.error("[Rewind Error]", err);
      app.log(`Rewind failed: ${err.message || err}`, "error");
    } finally {
      is_rewinding = false;
    }
  }

  async function handle_export_story() {
    if (is_exporting) return;
    is_exporting = true;
    try {
      const story_id = runtime.story_id;
      if (!story_id) return;
      const md = await export_story_markdown(story_id, db);
      const title = runtime.active_story?.title || "story";
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-export.md`;
      download_text_file(filename, md);
      app.log("Story exported as Markdown.", "system");
    } catch (err) {
      console.error("[Export Error]", err);
      app.log(`Export failed: ${err.message || err}`, "error");
    } finally {
      is_exporting = false;
    }
  }

  async function handle_end_story() {
    if (is_ending_story) return;
    is_ending_story = true;
    try {
      app.control_panel_open = false;
      await gamemaster.execute_epilogue(runtime.story_id);
    } catch (err) {
      console.error("[End Story Error]", err);
      app.log(`Failed to end story: ${err.message || err}`, "error");
    } finally {
      is_ending_story = false;
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape" && app.control_panel_open) {
      app.control_panel_open = false;
    }
  }}
/>

{#if app.control_panel_open}
  <Backdrop layer="console" onclick={() => (app.control_panel_open = false)} />
{/if}

<div
  class="
    pointer-events-none
    relative
    z-50
    flex
    w-full
    items-center
    justify-center
  "
>
  <div
    use:click_outside={() => {
      if (!app.control_panel_open) return;
      const target = document.activeElement;
      if (target?.closest?.(".custom-dropdown-panel") || target?.closest?.(".modal-backdrop") || target?.closest?.("[role='dialog']")) {
        return;
      }
      app.control_panel_open = false;
    }}
    class="
      pointer-events-auto
      z-50
      flex flex-col
      {app.control_panel_open ? 'justify-end' : 'justify-center'}
      bg-glass-elevated
      shadow-2xl
      shadow-black/50 [backdrop-filter:var(--blur-mist)]
      transition-all
      duration-500
      ease-in-out
      md:max-h-[calc(var(--spacing-row-unit)*9)]

      {app.control_panel_open
      ? 'absolute bottom-0 w-full rounded-none p-4 md:w-[calc(var(--spacing-column-unit)*5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'
      : 'relative h-auto w-full rounded-none px-4 py-2 md:absolute md:bottom-0 md:h-auto md:min-h-[calc(var(--spacing-row-unit)*0.5)] md:rounded-[calc(var(--spacing-row-unit)*0.5)]'}
    {!app.control_panel_open && has_text && app.view === 'storymode'
      ? `
      border-(--signature-color,var(--color-slate-600))
      shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color,var(--color-slate-600))_30%,transparent)]
      md:w-[calc(var(--spacing-column-unit)*5)]
    `
      : !app.control_panel_open
        ? 'md:w-[max(24rem,calc(var(--spacing-column-unit)*4))]'
        : ''}
  "
    style:--signature-color={app.view === "storymode" ? signature_color : undefined}
    style:view-transition-name="unified-console"
    style:width={!app.control_panel_open && story_locked ? "fit-content" : null}
    data-testid="unified-console"
  >
    {#if app.simulation.loading || app.is_ghostwriting || (simulation_state.busy && app.control_panel_open)}
      <Shimmer />
    {/if}

    {#if app.control_panel_open || !story_locked}
      <ControlPanel {is_ending_story} on_end_story={handle_end_story} />
    {/if}

    <!-- BOTTOM CONSOLE / INPUT AREA -->
    <div class="flex w-full items-center justify-between gap-2 transition-colors duration-300 {app.control_panel_open ? 'pt-2' : ''}">
      {#if app.view === "storyboard"}
        <StoryboardBar />
      {:else if story_locked}
        <div class="flex w-full flex-col items-center gap-2">
          {#if app.conclusion_status === "COLLAPSED"}
            <span class="text-[10px] font-bold tracking-widest text-rose-400/90 uppercase">💀 Story Collapsed</span>
          {:else}
            <span class="text-[10px] font-bold tracking-widest text-amber-300/90 uppercase">✨ Story Concluded</span>
          {/if}
          <div class="flex w-full items-center justify-center gap-2">
            <Button
              label="Return to Storyboard"
              variant="primary"
              size="small"
              onclick={async () => {
                app.control_panel_open = false;
                await session_driver.clear_active();
                app.set_view("storyboard");
              }}
            />
            <Button label="Export Story" variant="primary" size="small" loading={is_exporting} onclick={handle_export_story} />
            <Button
              label={is_rewinding ? "Rewinding…" : "⟲ Keep Chatting"}
              variant="secondary"
              size="small"
              loading={is_rewinding}
              onclick={handle_rewind}
            />
          </div>
        </div>
      {:else}
        <SettingsButton variant={app.control_panel_open ? "secondary" : "invisible"} />

        <StorymodeBar bind:is_focused bind:has_text />
      {/if}
    </div>
  </div>
</div>

<style>
  /* Shuffle deal reveal — flying clones are art-only (strip_card_text); the
     landed cards fade their text/badges back in after arrival. */
  :global(.deal-reveal [data-card-text]),
  :global(.deal-reveal [data-card-badge]) {
    opacity: 0 !important;
    transition: none !important;
  }

  :global(.deal-revealed [data-card-text]),
  :global(.deal-revealed [data-card-badge]) {
    opacity: 1 !important;
    transition: opacity 0.45s ease 0.1s !important;
  }
</style>
