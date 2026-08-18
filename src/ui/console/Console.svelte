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
  import { stories } from "@data";
  import { session_driver } from "@data";
  import { db } from "@data";
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

  // A story is concluded once its log carries the epilogue entry (the app's
  // semantic conclusion marker) — covers manual END STORY, Director-declared
  // conclusions, and reloads of a concluded story, not just the lock phase.
  let story_concluded = $derived(simulation_log.feed.some((e) => e?.meta?.is_epilogue));
  let story_locked = $derived(simulation_state.phase === "locked" || story_concluded);
  let signature_color = $derived(get_signature_color(runtime.active_user || app.selected_user, "var(--color-gunmetal)"));

  // --- BEGIN-STORY FLIGHT ORCHESTRATION (see Storyboard.svelte.js via @ui) ---
  install_begin_flight_effect();

  let is_ending_story = $state(false);
  let is_exporting = $state(false);

  async function handle_end_story() {
    if (is_ending_story || !runtime.story_id) return;
    is_ending_story = true;
    try {
      await gamemaster.execute_epilogue(runtime.story_id, "CONCLUDED");
      // Conclude the story so its entities are released back to the lobby and
      // the story card reports "concluded".
      await stories.conclude(runtime.story_id);
      await app.load_entities();
      simulation_state.lock();
    } catch (e) {
      console.error("[End Story Error]", e);
      app.log(`End Story failed: ${e.message || e}`, "error");
    } finally {
      is_ending_story = false;
    }
  }

  async function handle_export_story() {
    if (is_exporting || !runtime.story_id) return;
    is_exporting = true;
    try {
      const story = runtime.active_story || (await db.stories.get(runtime.story_id));
      const entries = [...simulation_log.feed];
      const md = export_story_markdown(story, entries);
      const filename = `${(story?.title || "story").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-transcript.md`;
      download_text_file(filename, md, "text/markdown;charset=utf-8");
    } catch (e) {
      console.error("[Export Story Error]", e);
      app.log(`Export failed: ${e.message || e}`, "error");
    } finally {
      is_exporting = false;
    }
  }

  function handle_window_keydown(e) {
    if (e.key === "Escape" && app.control_panel_open) {
      e.preventDefault();
      app.control_panel_open = false;
    }
  }
</script>

<svelte:window onkeydown={handle_window_keydown} />

<div class="pointer-events-none relative flex h-full w-full justify-center {app.control_panel_open ? 'z-50' : 'z-10'}">
  {#if app.control_panel_open}
    <Backdrop layer="console" onclick={() => (app.control_panel_open = false)} />
  {/if}

  <div
    use:click_outside={(event) => {
      const target = event?.target;
      if (
        target instanceof Element &&
        (target.closest(".menu") ||
          target.closest("[data-dropdown-menu]") ||
          target.closest(".dropdown-portal-wrapper") ||
          target.closest(".tooltip-portal") ||
          target.closest("[data-backdrop]") ||
          target.closest("[data-modal-variant]"))
      ) {
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
    {!app.control_panel_open && is_focused && app.view === 'storymode'
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
    {#if app.simulation.loading}
      <div class="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[inherit]" aria-hidden="true">
        <div class="console-shimmer h-full w-full"></div>
      </div>
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
          <span class="text-[10px] font-bold tracking-widest text-amber-300/90 uppercase">✨ Story Concluded</span>
          <div class="flex w-full items-center justify-center gap-2">
            <Button
              label="Return to Storyboard"
              variant="primary"
              size="small"
              onclick={async () => {
                await session_driver.clear_active();
                app.set_view("storyboard");
              }}
            />
            <Button label="Export Story" variant="primary" size="small" loading={is_exporting} onclick={handle_export_story} />
          </div>
        </div>
      {:else}
        <SettingsButton variant={app.control_panel_open ? "secondary" : "invisible"} />

        <StorymodeBar bind:is_focused />
      {/if}
    </div>
  </div>
</div>

<style>
  /* Prologue-writing shimmer — a light band sweeps the console left-to-right
     while loading (reading/progress direction). Animated via background-position
     (NOT transform): the console carries a view-transition-name, and transform
     keyframe animations freeze on view-transition-captured elements. */
  .console-shimmer {
    position: absolute;
    background: linear-gradient(115deg, transparent 42%, color-mix(in srgb, var(--color-electric-cyan) 10%, transparent) 50%, transparent 58%);
    background-size: 250% 100%;
    animation: console-shimmer-sweep 2.4s linear infinite;
  }

  @keyframes console-shimmer-sweep {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -150% 0;
    }
  }

  /* Concluded bar shrinks to fit its centered action buttons — implemented
     as an inline style (style:width) rather than a Tailwind class, because
     no width utility is guaranteed to exist in every prebuilt CSS vault, and
     a custom class trips better-tailwindcss/no-unknown-classes. */

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
