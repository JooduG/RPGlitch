<script>
  /**
   * @file Storyboard.svelte
   * ❄️ THE STORYBOARD CONSOLE
   * Visual orchestration of active entities and narrative focus.
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM
   */

  import { Skeleton } from "@atoms";
  import { app } from "@state";
  import { StoryboardDynamicTitle, CardHand, Layout } from "@organisms";
  import { UnifiedConsole, EntityCard } from "@molecules";

  // --- SNIPPETS ---
</script>

{#snippet Slot(
  /** @type {"ai" | "user" | "fractal"} */ type,
  /** @type {any} */ entity,
  /** @type {string} */ label,
  /** @type {string} */ width,
  /** @type {string} */ height,
)}
  {#if !app.entities_loaded}
    <Skeleton variant="card" {width} {height} />
  {:else}
    <EntityCard
      variant={entity ? "panel" : "slot"}
      {type}
      {entity}
      role_label={label}
      on_select={() => {
        if (entity) {
          app.toggle_profile(true, entity);
        } else {
          app.open_card_hand(type);
        }
      }}
      on_swap={() => app.open_card_hand(type)}
      on_view_profile={() => app.toggle_profile(true, entity)}
    />
  {/if}
{/snippet}

<Layout align="center">
  {#snippet header()}
    {#if app.entities_loaded}
      <StoryboardDynamicTitle />
    {/if}
  {/snippet}

  {#snippet left()}
    <div
      class="
        flex
        h-full
        w-full
        items-center
        justify-center
      "
      style:view-transition-name={app.transitioning_profile
        ? app.transition_target_id === app.selected_ai?.id
          ? "entity-morph-ai"
          : undefined
        : "entity-morph-ai"}
    >
      {@render Slot(
        "ai",
        app.selected_ai,
        "AI Character",
        app.viewport.mobile ? "100%" : "var(--spacing-storyboard-character-card-width)",
        app.viewport.mobile ? "100%" : "var(--spacing-storyboard-character-card-height)",
      )}
    </div>
  {/snippet}

  {#snippet center()}
    <div
      class="
        flex
        h-full
        w-full
        items-center
        justify-center
      "
      style:view-transition-name={app.transitioning_profile
        ? app.transition_target_id === app.selected_fractal?.id
          ? "entity-morph-fractal"
          : undefined
        : "entity-morph-fractal"}
    >
      {@render Slot(
        "fractal",
        app.selected_fractal,
        "Fractal",
        app.viewport.mobile ? "100%" : "var(--spacing-storyboard-fractal-card-width)",
        app.viewport.mobile ? "100%" : "var(--spacing-storyboard-fractal-card-height)",
      )}
    </div>
  {/snippet}

  {#snippet right()}
    <div
      class="
        flex
        h-full
        w-full
        items-center
        justify-center
      "
      style:view-transition-name={app.transitioning_profile
        ? app.transition_target_id === app.selected_user?.id
          ? "entity-morph-user"
          : undefined
        : "entity-morph-user"}
    >
      {@render Slot(
        "user",
        app.selected_user,
        "User Persona",
        app.viewport.mobile ? "100%" : "var(--spacing-storyboard-character-card-width)",
        app.viewport.mobile ? "100%" : "var(--spacing-storyboard-character-card-height)",
      )}
    </div>
  {/snippet}

  {#snippet footer()}
    {#if app.entities_loaded}
      <UnifiedConsole />
    {/if}
  {/snippet}
</Layout>

{#if app.entities_loaded}
  <CardHand />
{/if}
