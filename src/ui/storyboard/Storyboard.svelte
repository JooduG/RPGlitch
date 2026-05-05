<script>
  import { app } from "@state/app.svelte.js";
  import LoadingSkeleton from "@atoms/LoadingSkeleton.svelte";
  import Layout from "@ui/Layout.svelte";
  import Drawer from "@drawer/Drawer.svelte";
  import StoryboardCard from "@storyboard/StoryboardCard.svelte";
  import StoryboardDynamicTitle from "@storyboard/StoryboardDynamicTitle.svelte";
  import StoryboardPill from "@storyboard/StoryboardPill.svelte";
  import { onMount } from "svelte";

  // --- STATE ---
  let loading = $state(true);

  onMount(async () => {
    try {
      await app.load_entities();
    } catch (e) {
      console.error("[Storyboard] Failed to load lobby:", e);
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <!-- Global Skeleton Loader -->
  <div class="skeleton-boot">
    <LoadingSkeleton
      variant="card"
      width="var(--card-width, 25vh)"
      height="var(--card-height, 40vh)"
    />
    <LoadingSkeleton
      variant="card"
      width="var(--card-height, 40vh)"
      height="var(--card-width, 25vh)"
    />
    <LoadingSkeleton
      variant="card"
      width="var(--card-width, 25vh)"
      height="var(--card-height, 40vh)"
    />
  </div>
{:else}
  <Layout align="center">
    {#snippet header()}
      <div class="header-container">
        <StoryboardDynamicTitle />
      </div>
    {/snippet}

    <!-- LEFT: AI -->
    {#snippet left()}
      <StoryboardCard
        type="ai"
        entity={app.selected_ai}
        role_label="AI Character"
        on_select={() => app.open_drawer("ai")}
        on_view_profile={() => app.toggle_profile(true, app.selected_ai)}
      />
    {/snippet}

    <!-- CENTER: Fractal -->
    {#snippet center()}
      <StoryboardCard
        type="fractal"
        entity={app.selected_fractal}
        role_label="Fractal"
        on_select={() => app.open_drawer("fractal")}
        on_view_profile={() => app.toggle_profile(true, app.selected_fractal)}
      />
    {/snippet}

    <!-- RIGHT: User -->
    {#snippet right()}
      <StoryboardCard
        type="user"
        entity={app.selected_user}
        role_label="User Persona"
        on_select={() => app.open_drawer("user")}
        on_view_profile={() => app.toggle_profile(true, app.selected_user)}
      />
    {/snippet}

    {#snippet footer()}
      <div class="controls-layer">
        <StoryboardPill />
      </div>
    {/snippet}
  </Layout>

  <!-- Entity Drawer (The Library) -->
  <Drawer />
{/if}

<style>
  .header-container {
    text-align: center;
  }

  /* Boot Loader: Matches Layout.svelte 12-col grid */
  .skeleton-boot {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    height: 100vh;
    width: 100%;
    position: fixed;
    inset: 0;
    align-items: center;
    align-content: center;
    background: var(--bg-base);
  }

  .skeleton-boot :global(.skeleton:nth-child(1)) {
    grid-column: 2 / span 2;
    justify-self: center;
  }

  .skeleton-boot :global(.skeleton:nth-child(2)) {
    grid-column: 4 / span 6;
    justify-self: center;
  }

  .skeleton-boot :global(.skeleton:nth-child(3)) {
    grid-column: 10 / span 2;
    justify-self: center;
  }

  /* Mobile Stack */
  @media (width <= 768px) {
    .skeleton-boot {
      grid-template-columns: 1fr;
      padding-bottom: 0;
      align-items: center;
    }

    .skeleton-boot :global(.skeleton:nth-child(1)),
    .skeleton-boot :global(.skeleton:nth-child(3)) {
      display: none;
    }

    .skeleton-boot :global(.skeleton:nth-child(2)) {
      grid-column: 1 / -1;
    }
  }

  .controls-layer {
    margin-top: auto;
    pointer-events: auto;
    display: flex;
    justify-content: center;
  }
</style>
