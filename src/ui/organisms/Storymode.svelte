<script>
  /**
   * @file Storymode.svelte
   * â„ï¸ THE MAIN STAGE
   * Container for the active game session, simulation log, and side panels.
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import { ProfilePicture, Skeleton, tooltip } from "@atoms";
  import { themeStore } from "@media";
  import { app, runtime } from "@state";
  import { StorymodeFeed, Layout } from "@organisms";
  import { UnifiedConsole } from "@molecules";

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
      {@const signature_color = themeStore.get_signature_color(entity, "var(--gunmetal)")}
      {@const a11y_label = `View Profile: ${name}`}
      <article class="panel-root is-left" style:--signature-color={signature_color}>
        <button
          class="panel-anchor interactable"
          use:tooltip={{ text: a11y_label }}
          onclick={() => app.toggle_profile(true, entity)}
          aria-label={a11y_label}
        >
          <div class="panel-background"></div>
          <div class="panel-content">
            <ProfilePicture {entity} class="panel-pic" />
          </div>
        </button>
      </article>
    {/if}
  {/snippet}

  {#snippet center()}
    <div class="root">
      {#if !app.entities_loaded}
        <Skeleton variant="card" width="100%" height="100%" />
      {:else}
        <StorymodeFeed />
        <div class="input-wrapper">
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
      {@const signature_color = themeStore.get_signature_color(entity, "var(--gunmetal)")}
      {@const a11y_label = `View Profile: ${name}`}
      <article class="panel-root is-right" style:--signature-color={signature_color}>
        <button
          class="panel-anchor interactable"
          use:tooltip={{ text: a11y_label }}
          onclick={() => app.toggle_profile(true, entity)}
          aria-label={a11y_label}
        >
          <div class="panel-background"></div>
          <div class="panel-content">
            <ProfilePicture {entity} class="panel-pic" />
          </div>
        </button>
      </article>
    {/if}
  {/snippet}
</Layout>

<style>
  .root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .input-wrapper {
    flex-shrink: 0;
    width: 100%;
    padding: 0 0 var(--row-unit) 0;
    z-index: var(--z-index-elevated);
  }

  /* Atmospheric side panel styles absorbed from StorymodePanel */
  .panel-root {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    pointer-events: auto;
  }

  .panel-anchor {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--motion-standard),
      filter var(--motion-standard);
  }

  .panel-anchor:hover {
    transform: var(--scale-lift);
    filter: var(--brightness-glow);
  }

  /* Full-bleed vertical atmospheric pillar: signature color top fading to abyssal black bottom */
  .panel-background {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--signature-color), transparent 30%) 0%,
      color-mix(in srgb, var(--void-black), var(--signature-color) 5%) 50%,
      var(--void-black) 100%
    );
    z-index: var(--z-index-base);
  }

  /* Subtle border line on the inner side of the panel */
  .is-left .panel-background {
    border-right: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .is-right .panel-background {
    border-left: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .panel-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-index-surface);
  }

  /* Target ProfilePicture custom class to make background transparent so our panel background shows through */
  :global(.panel-pic .profile-placeholder) {
    background-color: transparent !important;
    background-image: none !important;
  }
</style>
