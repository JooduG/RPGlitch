<script>
  import { app } from "@state/app.svelte.js";
  import Skeleton from "@atoms/Skeleton.svelte";
  import Layout from "@ui/Layout.svelte";
  import Drawer from "@drawer/Drawer.svelte";
  import StoryboardCard from "@storyboard/StoryboardCard.svelte";
  import StoryboardDynamicTitle from "@storyboard/StoryboardDynamicTitle.svelte";
  import StoryboardPill from "@storyboard/StoryboardPill.svelte";
</script>

<Layout align="center">
  {#snippet header()}
    {#if app.entities_loaded}
      <div class="header-container">
        <StoryboardDynamicTitle />
      </div>
    {/if}
  {/snippet}

  <!-- LEFT: AI -->
  {#snippet left()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="var(--card-width, 25vh)" height="var(--card-height, 40vh)" />
    {:else}
      <StoryboardCard
        type="ai"
        entity={app.selected_ai}
        role_label="AI Character"
        on_select={() => app.open_drawer("ai")}
        on_view_profile={() => app.toggle_profile(true, app.selected_ai)}
      />
    {/if}
  {/snippet}

  <!-- CENTER: Fractal -->
  {#snippet center()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="var(--card-height, 40vh)" height="var(--card-width, 25vh)" />
    {:else}
      <StoryboardCard
        type="fractal"
        entity={app.selected_fractal}
        role_label="Fractal"
        on_select={() => app.open_drawer("fractal")}
        on_view_profile={() => app.toggle_profile(true, app.selected_fractal)}
      />
    {/if}
  {/snippet}

  <!-- RIGHT: User -->
  {#snippet right()}
    {#if !app.entities_loaded}
      <Skeleton variant="card" width="var(--card-width, 25vh)" height="var(--card-height, 40vh)" />
    {:else}
      <StoryboardCard
        type="user"
        entity={app.selected_user}
        role_label="User Persona"
        on_select={() => app.open_drawer("user")}
        on_view_profile={() => app.toggle_profile(true, app.selected_user)}
      />
    {/if}
  {/snippet}

  {#snippet footer()}
    {#if app.entities_loaded}
      <div class="controls-layer">
        <StoryboardPill />
      </div>
    {/if}
  {/snippet}
</Layout>

<!-- Entity Drawer (The Library) -->
{#if app.entities_loaded}
  <Drawer />
{/if}

<style>
  .header-container {
    text-align: center;
  }

  .controls-layer {
    margin-top: auto;
    pointer-events: auto;
    display: flex;
    justify-content: center;
  }
</style>
