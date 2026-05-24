<script>
  /**
   * @file Storyboard.svelte
   * ❄️ THE STORYBOARD CONSOLE
   * Visual orchestration of active entities and narrative focus.
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */

  import Layout from "@ui/Layout.svelte";
  import Drawer from "@drawer/Drawer.svelte";
  import Skeleton from "@atoms/Skeleton.svelte";
  import StoryboardCard from "@storyboard/StoryboardCard.svelte";
  import StoryboardPill from "@storyboard/StoryboardPill.svelte";
  import StoryboardDynamicTitle from "@storyboard/StoryboardDynamicTitle.svelte";
  import { app } from "@state/app.svelte.js";
  import { context_broker } from "@intelligence/context.svelte.js";

  // --- EVENT BROADCAST: CONTEXT SWAP ---

  /**
   * Fires a `context-swap` signal to the ContextBroker whenever the active
   * "Chin" (view/tab) changes. Zero-latency — no engine re-initialization.
   */
  $effect(() => {
    context_broker.loadViewContext(app.view);
  });

  // --- DERIVATIONS ---

  /**
   * Card configuration for DRY slot rendering
   */
  const slots = $derived({
    ai: {
      type: "ai",
      entity: app.selected_ai,
      label: "AI Character",
      width: "var(--storyboard-character-card-width)",
      height: "var(--storyboard-character-card-height)",
    },
    fractal: {
      type: "fractal",
      entity: app.selected_fractal,
      label: "Fractal",
      width: "var(--storyboard-fractal-card-width)",
      height: "var(--storyboard-fractal-card-height)",
    },
    user: {
      type: "user",
      entity: app.selected_user,
      label: "User Persona",
      width: "var(--storyboard-character-card-width)",
      height: "var(--storyboard-character-card-height)",
    },
  });
</script>

{#snippet Slot(
  /** @type {{ type: any; entity: any; label: any; width: any; height: any; }} */ config,
)}
  {#if !app.entities_loaded}
    <Skeleton variant="card" width={config.width} height={config.height} />
  {:else}
    <StoryboardCard
      type={config.type}
      entity={config.entity}
      role_label={config.label}
      on_select={() => app.open_drawer(config.type)}
      on_view_profile={() => app.toggle_profile(true, config.entity)}
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
    {@render Slot(slots.ai)}
  {/snippet}

  {#snippet center()}
    {@render Slot(slots.fractal)}
  {/snippet}

  {#snippet right()}
    {@render Slot(slots.user)}
  {/snippet}

  {#snippet footer()}
    {#if app.entities_loaded}
      <StoryboardPill />
    {/if}
  {/snippet}
</Layout>

{#if app.entities_loaded}
  <Drawer />
{/if}
