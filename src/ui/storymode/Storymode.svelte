<script>
  /**
   * @file Storymode.svelte
   * ❄️ THE MAIN STAGE
   * Container for the active game session, simulation log, and side panels.
   * Flattened Schema Compliant.
   */
  import { entities } from "@/data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import Layout from "@ui/Layout.svelte";
  import { onMount } from "svelte";
  import InputBar from "@storymode/InputBar.svelte";
  import StorymodeFeed from "@storymode/StorymodeFeed.svelte";
  import StorymodePanel from "@storymode/StorymodePanel.svelte";

  // Derived
  let is_thinking = $derived(simulationState.phase === "generating");

  // --- ON MOUNT: Hydrate Entity Lists for Color Lookups ---
  onMount(async () => {
    if (app.ai_list.length === 0) {
      try {
        const [ais, users, fractals] = await Promise.all([
          entities.list("character"),
          entities.list("character"),
          entities.list("fractal"),
        ]);
        app.ai_list = ais;
        app.user_list = users;
        app.fractal_list = fractals;
      } catch (e) {
        console.error("[Storymode] Failed to hydrate colors:", e);
      }
    }
    if (!runtime.is_ready) {
      await runtime.sync();
    }
  });
</script>

<div class="storymode-container">
  <Layout mode="cinematic">
    {#snippet left()}
      <StorymodePanel entity={app.selected_ai} side="left" />
    {/snippet}
    {#snippet center()}
      <div class="game-stage">
        <StorymodeFeed />
        <div class="input-container">
          <InputBar disabled={is_thinking} />
        </div>
      </div>
    {/snippet}
    {#snippet right()}
      <StorymodePanel entity={app.selected_user} side="right" />
    {/snippet}
  </Layout>
</div>

<style>
  .storymode-container {
    width: 100%;
    height: 100%;
    background: inherit;
    position: relative;
  }

  .game-stage {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .input-container {
    flex-shrink: 0;
    width: 100%;
    padding-bottom: 0;
    z-index: var(--z-index-m);
  }
</style>
