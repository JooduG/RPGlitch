<script>
  /**
   * @file Storyboard.svelte
   * ❄️ THE STORYBOARD CONSOLE
   * Visual orchestration of active entities and narrative focus.
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
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
      on_select={() => app.open_drawer(type)}
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
        [view-transition-name:entity-morph-ai]
      "
    >
      {@render Slot(
        "ai",
        app.selected_ai,
        "AI Character",
        "var(--spacing-storyboard-character-card-width)",
        "var(--spacing-storyboard-character-card-height)",
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
        [view-transition-name:entity-morph-fractal]
      "
    >
      {@render Slot(
        "fractal",
        app.selected_fractal,
        "Fractal",
        "var(--spacing-storyboard-fractal-card-width)",
        "var(--spacing-storyboard-fractal-card-height)",
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
        [view-transition-name:entity-morph-user]
      "
    >
      {@render Slot(
        "user",
        app.selected_user,
        "User Persona",
        "var(--spacing-storyboard-character-card-width)",
        "var(--spacing-storyboard-character-card-height)",
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
