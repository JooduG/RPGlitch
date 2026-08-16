<script>
  /**
   * @file src/ui/message/Epilogue.svelte
   * 📜 THE END / STORY CONCLUDED SCREEN
   * Culminating story summary header, final entity trio, outcome badge, and action deck.
   */
  import { Button, StyleBadge } from "@primitives";
  import { EntityCard } from "@entity";
  import { session_driver } from "@engine";
  import { app, runtime, simulation_log } from "@state";
  import { db } from "@data";
  import { export_story_markdown, download_text_file } from "@utils";

  let {
    /** @type {{ ai: any[], user: any[], fractal: any[] }} */
    card_actions = { ai: [], user: [], fractal: [] },
    status = "CONCLUDED", // 'CONCLUDED' | 'COLLAPSED' | 'EPILOGUE'
  } = $props();

  let is_exporting = $state(false);

  async function handle_return_to_storyboard() {
    await session_driver.clear_active();
    await app.load_entities();
    app.set_view("storyboard");
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
</script>

<div class="my-6 flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-6 text-center backdrop-blur-md" data-msg-epilogue>
  <!-- OUTCOME BADGE -->
  <div class="flex items-center gap-2">
    {#if status === "COLLAPSED"}
      <span
        class="rounded-full border border-red-500/40 bg-red-950/60 px-3 py-1 text-xs font-semibold tracking-wider text-red-300 uppercase shadow-[0_0_12px_rgba(239,68,68,0.3)]"
      >
        💀 Story Collapsed
      </span>
    {:else if status === "CONCLUDED"}
      <span
        class="rounded-full border border-amber-400/40 bg-amber-950/60 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300 uppercase shadow-[0_0_12px_rgba(251,191,36,0.3)]"
      >
        ✨ Story Concluded
      </span>
    {:else}
      <span
        class="rounded-full border border-cyan-400/40 bg-cyan-950/60 px-3 py-1 text-xs font-semibold tracking-wider text-cyan-300 uppercase shadow-[0_0_12px_rgba(34,211,238,0.3)]"
      >
        📜 The End
      </span>
    {/if}
  </div>

  <!-- CURSIVE STORY TITLE -->
  {#if app.story_title}
    <h2 class="text-center text-[clamp(1.5rem,3.2vw,2.6rem)] font-normal text-balance" style="font-family: Satisfy, cursive;">
      {#if app.story_title_parts.length > 0}
        {#each app.story_title_parts as part, i (i)}
          {#if part.color}
            <span
              class="inline px-1 whitespace-nowrap text-(--signature-color) text-shadow-[0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]"
              style:--signature-color={part.color}>{part.text}</span
            >
          {:else}
            <span class="inline px-1 text-shadow-[0_0_var(--spacing-unit)_var(--color-void-black)]">{part.text}</span>
          {/if}
        {/each}
      {:else}
        {app.story_title}
      {/if}
    </h2>
  {/if}

  <!-- FINAL ENTITY TRIO -->
  <div class="my-2 flex h-character-card-height w-full items-stretch gap-2 md:gap-4">
    {#if runtime.active_ai || app.selected_ai}
      {@const a = runtime.active_ai || app.selected_ai}
      <div class="min-w-0" style="flex-grow: 1">
        <EntityCard
          entity={a}
          type="ai"
          variant="message"
          actions={card_actions.ai}
          onclick={() => app.open_profile(a)}
          onViewProfile={() => app.open_profile(a)}
        />
      </div>
    {/if}
    {#if runtime.active_fractal || app.selected_fractal}
      {@const f = runtime.active_fractal || app.selected_fractal}
      <div class="min-w-0" style="flex-grow: 2">
        <div class="flex h-full w-full flex-col gap-2 md:gap-4">
          <div class="min-h-0 flex-1">
            <EntityCard
              entity={f}
              type="fractal"
              variant="message"
              actions={card_actions.fractal}
              onclick={() => app.open_profile(f)}
              onViewProfile={() => app.open_profile(f)}
            />
          </div>
          <div class="flex w-full shrink-0 justify-center gap-2 md:gap-4">
            <StyleBadge entity={f} layout="prologue" class="flex w-full justify-center gap-2 md:gap-4" />
          </div>
        </div>
      </div>
    {/if}
    {#if runtime.active_user || app.selected_user}
      {@const u = runtime.active_user || app.selected_user}
      <div class="min-w-0" style="flex-grow: 1">
        <EntityCard
          entity={u}
          type="user"
          variant="message"
          actions={card_actions.user}
          onclick={() => app.open_profile(u)}
          onViewProfile={() => app.open_profile(u)}
        />
      </div>
    {/if}
  </div>

  <!-- ACTION DECK -->
  <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
    <Button label="Return to Storyboard" variant="secondary" size="medium" onclick={handle_return_to_storyboard} />
    <Button label="Export Story (.md)" variant="primary" size="medium" loading={is_exporting} onclick={handle_export_story} />
  </div>
</div>
