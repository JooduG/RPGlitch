<script>
  /**
   * @file Storymode.svelte
   * â„ï¸ THE MAIN STAGE
   * Container for the active game session, simulation log, and side panels.
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import { ProfilePicture, Skeleton, tooltip } from "@atoms";
  import { get_signature_color } from "@media";
  import { UnifiedConsole } from "@molecules";
  import { Layout, StorymodeFeed } from "@organisms";
  import { app, runtime } from "@state";

  // --- ON MOUNT ---
  $effect(() => {
    if (!runtime.is_ready) {
      runtime.sync();
    }
  });
</script>

<Layout mode="storymode">
  {#snippet left()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="100%" height="100%" />
    {:else}
      {@const entity = app.selected_ai}
      {@const name = entity?.name || "Unknown"}
      {@const signature_color = get_signature_color(entity, "var(--color-gunmetal)")}
      {@const a11y_label = `View Profile: ${name}`}
      <article
        class="
          pointer-events-auto
          relative
          h-full
          w-full
          overflow-hidden
        "
        style:--signature-color={signature_color}
        style="view-transition-name: entity-morph-ai;"
      >
        <button
          class="
            relative
            flex
            h-full
            w-full
            cursor-pointer
            items-center
            justify-center
            border-none
            bg-transparent
            p-0
            transition-all
            duration-300

            hover:scale-lift
            hover:brightness-glow
          "
          use:tooltip={{ text: a11y_label }}
          onclick={() => app.toggle_profile(true, entity)}
          aria-label={a11y_label}
        >
          <div
            class="
              absolute
              inset-0
              z-0
              border-r
              border-solid
              border-white/10
              bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--signature-color),transparent_30%)_0%,color-mix(in_srgb,var(--color-void-black),var(--signature-color)_5%)_50%,var(--color-void-black)_100%)]
            "
          ></div>
          <div class="relative z-20 flex h-full w-full items-center justify-center">
            <ProfilePicture {entity} class="[&_.profile-placeholder]:bg-transparent! [&_.profile-placeholder]:bg-none!" />
          </div>
        </button>
      </article>
    {/if}
  {/snippet}

  {#snippet center()}
    <div
      class="
      relative
      flex
      h-full
      w-full
      flex-col
      overflow-hidden
    "
    >
      {#if !app.entities_loaded}
        <Skeleton variant="card" width="100%" height="100%" />
      {:else}
        <StorymodeFeed />
        <div
          class="
          z-30
          w-full
          shrink-0
          pb-row-unit
        "
        >
          <UnifiedConsole />
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet right()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="100%" height="100%" />
    {:else}
      {@const entity = app.selected_user}
      {@const name = entity?.name || "Unknown"}
      {@const signature_color = get_signature_color(entity, "var(--color-gunmetal)")}
      {@const a11y_label = `View Profile: ${name}`}
      <article
        class="
          pointer-events-auto
          relative
          h-full
          w-full
          overflow-hidden
        "
        style:--signature-color={signature_color}
        style="view-transition-name: entity-morph-user;"
      >
        <button
          class="
            relative
            flex
            h-full
            w-full
            cursor-pointer
            items-center
            justify-center
            border-none
            bg-transparent
            p-0
            transition-all
            duration-300

            hover:scale-lift
            hover:brightness-glow
          "
          use:tooltip={{ text: a11y_label }}
          onclick={() => app.toggle_profile(true, entity)}
          aria-label={a11y_label}
        >
          <div
            class="
              absolute
              inset-0
              z-0
              border-l
              border-solid
              border-white/10
              bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--signature-color),transparent_30%)_0%,color-mix(in_srgb,var(--color-void-black),var(--signature-color)_5%)_50%,var(--color-void-black)_100%)]
            "
          ></div>
          <div class="relative z-20 flex h-full w-full items-center justify-center">
            <ProfilePicture {entity} class="[&_.profile-placeholder]:bg-transparent! [&_.profile-placeholder]:bg-none!" />
          </div>
        </button>
      </article>
    {/if}
  {/snippet}
</Layout>
