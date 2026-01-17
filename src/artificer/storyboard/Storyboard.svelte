<script>
  import { onMount } from "svelte";
  import { app } from "../../gamemaster/state.svelte.js";
  import { entities } from "../../scholar/database/repository.js";
  import Layout from "../Layout.svelte";
  import StoryboardPill from "./StoryboardPill.svelte";
  import StoryboardCard from "./StoryboardCard.svelte";
  import LibraryDrawer from "../../scholar/LibraryDrawer.svelte";
  import Skeleton from "../Skeleton.svelte";
  import StoryboardDynamicTitle from "./StoryboardDynamicTitle.svelte";

  // --- STATE ---
  let loading = $state(true);

  // Derived Title for Display
  let storyTitle = $derived(
    `The Journey of ${app.selectedAi?.name || "..."} & ${app.selectedUser?.name || "..."} in ${app.selectedFractal?.name || "..."}`,
  );

  onMount(async () => {
    try {
      const [ais, users, fractals] = await Promise.all([
        entities.list("character"),
        entities.list("character"), // Ideally filter for 'user' type if distinct
        entities.list("fractal"),
      ]);

      app.aiList = ais;
      // Filter out AI from User list if they are mixed, or logic in repository
      app.userList = users;
      app.fractalList = fractals;

      // Do NOT auto-select - let user choose via drawer
      loading = false;
    } catch (e) {
      console.error("Failed to load lobby:", e);
    }
  });
</script>

{#if loading}
  <!-- Global Skeleton Loader -->
  <div class="skeleton-boot">
    <Skeleton variant="card" width="15vw" height="24vw" />
    <Skeleton variant="card" width="24vw" height="15vw" />
    <Skeleton variant="card" width="15vw" height="24vw" />
  </div>
{:else}
  <Layout>
    {#snippet header()}
      <div class="header-container">
        <StoryboardDynamicTitle />
      </div>
    {/snippet}

    <!-- LEFT: AI -->
    {#snippet left()}
      <StoryboardCard
        type="ai"
        entity={app.selectedAi}
        roleLabel="Select AI Companion"
        onSelect={() => app.openDrawer("ai")}
        onViewProfile={() => app.toggleProfile(true, app.selectedAi)}
      />
    {/snippet}

    <!-- CENTER: Fractal -->
    {#snippet center()}
      <StoryboardCard
        type="fractal"
        entity={app.selectedFractal}
        roleLabel="Select Fractal"
        onSelect={() => app.openDrawer("fractal")}
        onViewProfile={() => app.toggleProfile(true, app.selectedFractal)}
      />
    {/snippet}

    <!-- RIGHT: User -->
    {#snippet right()}
      <StoryboardCard
        type="user"
        entity={app.selectedUser}
        roleLabel="Select User Persona"
        onSelect={() => app.openDrawer("user")}
        onViewProfile={() => app.toggleProfile(true, app.selectedUser)}
      />
    {/snippet}

    {#snippet footer()}
      <div class="controls-layer">
        <StoryboardPill />
      </div>
    {/snippet}
  </Layout>

  <!-- Entity Drawer (The Library) -->
  <LibraryDrawer />
{/if}

<style lang="scss">
  .header-container {
    text-align: center;
  }

  /* Boot Loader centering */
  .skeleton-boot {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    gap: 2rem;
  }

  .controls-layer {
    margin-top: auto;
    pointer-events: auto; /* Ensure clickable */
    display: flex;
    justify-content: center;
  }
</style>
