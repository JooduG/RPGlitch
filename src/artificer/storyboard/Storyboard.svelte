<script>
  import { onMount } from "svelte";
  import { app } from "../state.svelte.js";
  import { session } from "../../gamemaster/session.svelte.js";
  import { entities } from "../../scholar/database/repository.js";
  import Layout from "../Layout.svelte";
  import StoryboardPill from "./StoryboardPill.svelte";
  import StoryboardCard from "./StoryboardCard.svelte";
  import Skeleton from "../Skeleton.svelte";

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

      // Auto-select defaults if empty
      if (!app.selectedAi && ais.length > 0) app.selectedAi = ais[0];
      if (!app.selectedUser && users.length > 0) {
        // Simple avoid-duplicate logic
        app.selectedUser =
          users.find((u) => u.id !== app.selectedAi?.id) || users[0];
      }
      if (!app.selectedFractal && fractals.length > 0)
        app.selectedFractal = fractals[0];

      loading = false;

      // Listeners
      window.addEventListener("RPGLITCH_BEGIN_STORY", startStory);
      window.addEventListener("RPGLITCH_SHUFFLE", shuffleEntities);
    } catch (e) {
      console.error("Failed to load lobby:", e);
    }

    return () => {
      window.removeEventListener("RPGLITCH_BEGIN_STORY", startStory);
      window.removeEventListener("RPGLITCH_SHUFFLE", shuffleEntities);
    };
  });

  // --- ACTIONS ---

  async function startStory() {
    // 🛡️ LOBBY BYPASS LOGIC
    if (app.settings.devMode) {
      app.log("Lobby Bypass Triggered (DEV_MODE)", "system");

      const selection = {
        ai: app.selectedAi || { id: "dev_ai", name: "Dev AI" },
        user: app.selectedUser || { id: "dev_user", name: "Dev User" },
        fractal: app.selectedFractal || { id: "dev_world", name: "Dev World" },
      };

      await session.start(selection);
      return;
    }

    if (!app.selectedAi || !app.selectedUser || !app.selectedFractal) return;

    await session.start({
      ai: app.selectedAi,
      user: app.selectedUser,
      fractal: app.selectedFractal,
    });
  }

  function shuffleEntities() {
    if (app.aiList.length)
      app.selectedAi =
        app.aiList[Math.floor(Math.random() * app.aiList.length)];
    if (app.userList.length)
      app.selectedUser =
        app.userList[Math.floor(Math.random() * app.userList.length)];
    if (app.fractalList.length)
      app.selectedFractal =
        app.fractalList[Math.floor(Math.random() * app.fractalList.length)];
  }
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
        <h1>{storyTitle}</h1>
      </div>
    {/snippet}

    <!-- LEFT: AI -->
    {#snippet left()}
      <StoryboardCard
        type="ai"
        entity={app.selectedAi}
        roleLabel="AI Companion"
        onSelect={() => console.log("Swap AI")}
        onViewProfile={() => app.toggleProfile(true, app.selectedAi)}
      />
    {/snippet}

    <!-- CENTER: Fractal -->
    {#snippet center()}
      <StoryboardCard
        type="fractal"
        entity={app.selectedFractal}
        roleLabel="Current Reality"
        onSelect={() => console.log("Swap Fractal")}
        onViewProfile={() => app.toggleProfile(true, app.selectedFractal)}
      />
    {/snippet}

    <!-- RIGHT: User -->
    {#snippet right()}
      <StoryboardCard
        type="user"
        entity={app.selectedUser}
        roleLabel="User Persona"
        onSelect={() => console.log("Swap User")}
        onViewProfile={() => app.toggleProfile(true, app.selectedUser)}
      />
    {/snippet}

    {#snippet footer()}
      <div class="controls-layer">
        <StoryboardPill />
      </div>
    {/snippet}
  </Layout>
{/if}

<style lang="scss">
  .header-container {
    text-align: center;
    h1 {
      font-size: 1.5rem;
      text-transform: capitalize;
      color: #fff;
    }
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
  }
</style>
