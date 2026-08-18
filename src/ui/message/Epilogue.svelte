<script>
  /**
   * @file src/ui/message/Epilogue.svelte
   * 📜 THE END / STORY CONCLUDED SCREEN
   * Culminating story summary header, final entity trio, and outcome badges.
   */
  import { StyleBadge } from "@primitives";
  import { EntityCard } from "@entity";
  import { app, runtime } from "@state";

  let {
    /** @type {{ ai: any[], user: any[], fractal: any[] }} */
    card_actions = { ai: [], user: [], fractal: [] },
  } = $props();
</script>

<div class="flex flex-col items-center gap-4 text-center" data-msg-epilogue>
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
</div>
