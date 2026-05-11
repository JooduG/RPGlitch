<script>
  /**
   * @file Storymode.svelte
   * ❄️ THE MAIN STAGE
   * Container for the active game session, simulation log, and side panels.
   * Flattened Schema Compliant.
   */
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import Layout from "@ui/Layout.svelte";
  import Skeleton from "@atoms/Skeleton.svelte";
  import InputBar from "@storymode/InputBar.svelte";
  import StorymodeFeed from "@storymode/StorymodeFeed.svelte";
  import StorymodePanel from "@storymode/StorymodePanel.svelte";

  // Derived
  let is_thinking = $derived(simulationState.phase === "generating");

  // --- ON MOUNT ---
  $effect(() => {
    if (!runtime.is_ready) {
      runtime.sync();
    }
  });
</script>

<Layout mode="cinematic">
  {#snippet left()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="100%" height="100%" />
    {:else}
      <StorymodePanel entity={app.selected_ai} side="left" />
    {/if}
  {/snippet}
  {#snippet center()}
    <div class="game-stage">
      {#if !app.entities_loaded}
        <Skeleton variant="card" width="100%" height="100%" />
      {:else}
        <StorymodeFeed />
        <div class="input-container">
          <InputBar disabled={is_thinking} />
        </div>
      {/if}
    </div>
  {/snippet}
  {#snippet right()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="100%" height="100%" />
    {:else}
      <StorymodePanel entity={app.selected_user} side="right" />
    {/if}
  {/snippet}
</Layout>

<style>
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
    z-index: var(--mid-z-index);
  }
</style>
