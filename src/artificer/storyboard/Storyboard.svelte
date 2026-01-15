<script>
  import { onMount } from "svelte";
  import { app } from "../state.svelte.js";
  import { entities } from "../../scholar/database/repository.js";
  import { Session } from "../../gamemaster/engine/session.js";
  import { runtime } from "../../scholar/runtime.svelte.js";
  import { db } from "../../scholar/database/db.js";
  import Button from "../Button.svelte";
  import Panel from "../Panel.svelte";
  import Layout from "../Layout.svelte";
  import StoryboardPill from "./StoryboardPill.svelte";
  import StoryboardCard from "./StoryboardCard.svelte";

  let loading = $state(true);
  let initializing = $state(false);

  // For the "Mad Libs" header title
  let storyTitle = $derived(
    `The Journey of ${app.selectedAi?.name || "..."} & ${app.selectedUser?.name || "..."} in ${app.selectedFractal?.name || "..."}`,
  );

  onMount(async () => {
    try {
      const [ais, users, fractals] = await Promise.all([
        entities.list("character"),
        entities.list("character"),
        entities.list("fractal"),
      ]);

      app.aiList = ais;
      app.userList = users;
      app.fractalList = fractals;

      // Auto-select defaults
      if (!app.selectedAi && ais.length > 0) app.selectedAi = ais[0];
      if (!app.selectedUser && users.length > 0) {
        // Try to find a user that isn't the AI
        app.selectedUser =
          users.find((u) => u.id !== app.selectedAi?.id) || users[0];
      }
      if (!app.selectedFractal && fractals.length > 0)
        app.selectedFractal = fractals[0];

      loading = false;

      // Wire up Legacy Event Listeners from the Pill
      window.addEventListener("RPGLITCH_BEGIN_STORY", startStory);
      window.addEventListener("RPGLITCH_SHUFFLE", shuffleEntities);
    } catch (e) {
      console.error("Failed to load lobby:", e);
    }
  });

  async function startStory() {
    if (!app.selectedAi || !app.selectedUser || !app.selectedFractal) {
      alert("Please select an AI, a User, and a World.");
      return;
    }

    initializing = true;
    try {
      console.log("[Storyboard] Creating new session...");

      const newStoryId = await Session.createFromSelection({
        aiId: app.selectedAi.id,
        userId: app.selectedUser.id,
        fractalId: app.selectedFractal.id,
        storyTitle: storyTitle, // Use the generated title
      });

      console.log("[Storyboard] Story created:", newStoryId);

      // Wake up the Scholar
      await runtime.sync(newStoryId);

      console.log("[Storyboard] Session synced, switching view.");
      app.setView("game");

      // Remove listeners
      window.removeEventListener("RPGLITCH_BEGIN_STORY", startStory);
      window.removeEventListener("RPGLITCH_SHUFFLE", shuffleEntities);
    } catch (err) {
      console.error("Failed to start story:", err);
      alert("Failed to initialize session. Check console.");
    } finally {
      initializing = false;
    }
  }

  function shuffleEntities() {
    if (app.aiList.length > 0)
      app.selectedAi =
        app.aiList[Math.floor(Math.random() * app.aiList.length)];
    if (app.userList.length > 0)
      app.selectedUser =
        app.userList[Math.floor(Math.random() * app.userList.length)];
    if (app.fractalList.length > 0)
      app.selectedFractal =
        app.fractalList[Math.floor(Math.random() * app.fractalList.length)];
  }

  // --- Card Interaction Handlers ---

  function openProfile(entity) {
    // Top Half Click: Open the Entity Details Modal
    if (entity) app.toggleProfile(true, entity);
  }

  function openSelectionDrawer(type) {
    // Bottom Half Click: Open the Drawer to replace this entity
    console.log(`[Storyboard] Opening selection drawer for: ${type}`);
    alert(`Feature: Select new ${type} (Drawer coming soon)`);
  }
</script>

{#if loading}
  <div class="loading">Initializing Repository...</div>
{:else}
  <!-- The Universal Layout -->
  <Layout>
    <!-- Snippet: Header (Title) -->
    {#snippet header()}
      <div class="header-container">
        <h1>{storyTitle}</h1>
      </div>
    {/snippet}

    <!-- Viewport: Left (AI) -->
    {#snippet left()}
      <StoryboardCard
        type="ai"
        entity={app.selectedAi}
        roleLabel="AI Companion"
        onSelect={() => openSelectionDrawer("character")}
        onViewProfile={() => openProfile(app.selectedAi)}
      />
    {/snippet}

    <!-- Snippet: Center (Fractal Only) -->
    {#snippet center()}
      <StoryboardCard
        type="fractal"
        entity={app.selectedFractal}
        roleLabel="Current Reality"
        onSelect={() => openSelectionDrawer("fractal")}
        onViewProfile={() => openProfile(app.selectedFractal)}
      />
    {/snippet}

    <!-- Viewport: Right (User) -->
    {#snippet right()}
      <StoryboardCard
        type="user"
        entity={app.selectedUser}
        roleLabel="User Persona"
        onSelect={() => openSelectionDrawer("character")}
        onViewProfile={() => openProfile(app.selectedUser)}
      />
    {/snippet}

    <!-- Snippet: Footer (Pill controls) -->
    {#snippet footer()}
      <div class="controls-layer">
        <StoryboardPill />
      </div>
    {/snippet}
  </Layout>
{/if}

<style lang="scss">
  /* Header Styling */
  .header-container {
    text-align: center;
    width: 80vw;
    display: flex;
    justify-content: center;
    pointer-events: none;

    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      text-transform: capitalize;
      text-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
      max-width: 900px;
      line-height: 1.2;
      margin: 0;
      letter-spacing: -0.02em;
      pointer-events: auto;
    }
  }

  .loading {
    color: #94a3b8;
    font-size: 1.25rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* Center Stage Wrapper removed as Layout handles alignment now */

  .controls-layer {
    width: max-content;
    pointer-events: auto;
  }
</style>
