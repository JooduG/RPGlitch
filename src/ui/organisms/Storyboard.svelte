<script>
  /**
   * @file Storyboard.svelte
   * ❄️ THE STORYBOARD CONSOLE
   * Visual orchestration of active entities and narrative focus.
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */

  import { Skeleton } from "@atoms";
  import { context_broker } from "@intelligence";
  import { app } from "@state";
  import { StoryboardDynamicTitle, CardHand, Layout } from "@organisms";
  import { UnifiedConsole, EntityCard } from "@molecules";

  // --- EVENT BROADCAST: CONTEXT SWAP ---

  /**
   * Fires a `context-swap` signal to the ContextBroker whenever the active
   * "Chin" (view/tab) changes. Zero-latency â€” no engine re-initialization.
   */
  $effect(() => {
    context_broker.loadViewContext(app.view);
  });

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
      class="storyboard-card-ai"
      style="view-transition-name: entity-morph-ai; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      {@render Slot(
        "ai",
        app.selected_ai,
        "AI Character",
        "var(--storyboard-character-card-width)",
        "var(--storyboard-character-card-height)",
      )}
    </div>
  {/snippet}

  {#snippet center()}
    <div
      class="storyboard-card-fractal"
      style="view-transition-name: entity-morph-fractal; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      {@render Slot(
        "fractal",
        app.selected_fractal,
        "Fractal",
        "var(--storyboard-fractal-card-width)",
        "var(--storyboard-fractal-card-height)",
      )}
    </div>
  {/snippet}

  {#snippet right()}
    <div
      class="storyboard-card-user"
      style="view-transition-name: entity-morph-user; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      {@render Slot(
        "user",
        app.selected_user,
        "User Persona",
        "var(--storyboard-character-card-width)",
        "var(--storyboard-character-card-height)",
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
