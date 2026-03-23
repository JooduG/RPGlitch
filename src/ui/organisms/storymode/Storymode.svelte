<script>
  /**
   * @file Storymode.svelte
   * 🎭 THE MAIN STAGE
   * Container for the active game session, simulation log, and side panels.
   * Flattened Schema Compliant.
   */
  import { entities } from "@/data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import Layout from "@ui/organisms/Layout.svelte";
  import { onMount } from "svelte";
  import InputBar from "./InputBar.svelte";
  import ProsePanel from "./ProsePanel.svelte";
  import StorymodePanel from "./StorymodePanel.svelte";
  // [FIX] Target flattened profile_picture
  let fractalBg = $derived(runtime?.storyFractal?.profile_picture || "");
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
  {#if fractalBg}
    <div class="fractal-wallpaper" style="background-image: url('{fractalBg}')"></div>
  {/if}
  <Layout mode="cinematic">
    {#snippet left()}
      <StorymodePanel entity={app.selected_ai} side="left" />
    {/snippet}
    {#snippet center()}
      <div class="game-stage">
        <ProsePanel />
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

  .fractal-wallpaper {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: var(--opacity-xs);
    z-index: 0;
    pointer-events: none;
    mix-blend-mode: overlay;
    filter: grayscale(100%) contrast(120%);
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
    z-index: 10;
  }
</style>
