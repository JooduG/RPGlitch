<script>
  import { onMount } from "svelte";
  import { app } from "../stores/app.svelte.js";
  import { entities } from "../../scholar/database/repository.js";
  import { Session } from "../../js/gamemaster/session.js";
  import { runtime } from "../../scholar/stores/runtime.svelte.js";
  import { db } from "../../scholar/database/db.js";
  import Button from "../Button.svelte";
  import Panel from "../Panel.svelte";

  let loading = $state(true);
  let initializing = $state(false);

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

      // Auto-select defaults if list is populated
      // This ensures we have a valid state even if the user just clicks a fractal card
      if (!app.selectedAi && ais.length > 0) app.selectedAi = ais[0];
      if (!app.selectedUser && users.length > 0) {
        // Try to find a user that isn't the AI
        app.selectedUser =
          users.find((u) => u.id !== app.selectedAi?.id) || users[0];
      }

      loading = false;
    } catch (e) {
      console.error("Failed to load lobby:", e);
    }
  });

  async function handleFractalSelect(fractal) {
    app.selectedFractal = fractal;
    await startStory();
  }

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
        storyTitle: `The ${app.selectedFractal.name} Protocol`,
      });

      console.log("[Storyboard] Story created:", newStoryId);

      // Wake up the Scholar
      await runtime.sync(newStoryId);

      console.log("[Storyboard] Session synced, switching view.");
      app.setView("game");
    } catch (err) {
      console.error("Failed to start story:", err);
      alert("Failed to initialize session. Check console.");
    } finally {
      initializing = false;
    }
  }
</script>

<div class="lobby-layout">
  <div class="header">
    <h1>New Story</h1>
    <p>Select a Reality to Initialize</p>
  </div>

  {#if loading}
    <div class="loading">Initializing Repository...</div>
  {:else}
    <div class="roster-section">
      <!-- Optional: Allow changing AI/User from top bar? For now, focused on cards per prompt -->
      <div class="roster-controls">
        <label>
          <span>AI Companion:</span>
          <select bind:value={app.selectedAi} class="entity-select compact">
            {#each app.aiList as entity}
              <option value={entity}>{entity.name}</option>
            {/each}
          </select>
        </label>
        <label>
          <span>User Persona:</span>
          <select bind:value={app.selectedUser} class="entity-select compact">
            {#each app.userList as entity}
              <option value={entity}>{entity.name}</option>
            {/each}
          </select>
        </label>
      </div>
    </div>

    <div class="card-grid">
      {#each app.fractalList as fractal}
        <button
          class="fractal-card"
          onclick={() => handleFractalSelect(fractal)}
          disabled={initializing}
        >
          <div
            class="card-bg"
            style="background-image: url({fractal.profilePictureUrl || ''})"
          ></div>
          <div class="card-overlay">
            <h3>{fractal.name}</h3>
            <p>{fractal.summary || "No description available."}</p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .lobby-layout {
    max-width: 1200px;
    margin: 0 auto;
    padding: 4rem 2rem;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .header {
    text-align: center;
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }
    p {
      color: #94a3b8;
      margin-top: 0.5rem;
    }
  }

  .roster-section {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .roster-controls {
    display: flex;
    gap: 2rem;
    background: rgba(24, 24, 27, 0.8);
    padding: 1rem 2rem;
    border-radius: 12px;
    border: 1px solid #27272a;
    backdrop-filter: blur(8px);

    label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #a1a1aa;
      font-size: 0.9rem;
      font-weight: 500;
    }
  }

  .entity-select.compact {
    background: #09090b;
    border: 1px solid #27272a;
    color: #e4e4e7;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    outline: none;
    min-width: 200px;
    font-size: 0.9rem;
    cursor: pointer;

    &:focus {
      border-color: #3b82f6;
    }
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    overflow-y: auto;
    padding-bottom: 2rem;

    /* Scrollbar styling */
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 4px;
    }
  }

  .fractal-card {
    position: relative;
    height: 320px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #27272a;
    background: #09090b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0;
    text-align: left;
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
      border-color: #3f3f46;

      .card-bg {
        transform: scale(1.05);
      }
    }

    &:disabled {
      opacity: 0.7;
      cursor: wait;
    }
  }

  .card-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: transform 0.5s ease;
    z-index: 1;
  }

  .card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.95),
      rgba(0, 0, 0, 0.6),
      transparent
    );
    padding: 2rem 1.5rem 1.5rem;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    h3 {
      margin: 0;
      font-size: 1.5rem;
      color: white;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: #d4d4d8;
      font-size: 0.9rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .loading {
    text-align: center;
    color: #94a3b8;
    font-size: 1.25rem;
    margin-top: 4rem;
  }
</style>
