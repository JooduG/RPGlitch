<script>
  import { onMount } from "svelte";
  import Layout from "./artificer/Layout.svelte";

  import Profile from "./scholar/Profile.svelte";
  import ControlPanel from "./warden/ControlPanel.svelte";
  import Lightbox from "./mesmer/Lightbox.svelte";
  import Storyboard from "./artificer/storyboard/Storyboard.svelte";
  import Storymode from "./artificer/storymode/Storymode.svelte";

  import { app } from "./artificer/state.svelte.js";
  import { runtime } from "./scholar/runtime.svelte.js";
  import { events, EVENTS, state as gameState } from "./gamemaster/bus.js";

  import { chrono } from "./gamemaster/chrono.svelte.js";

  // Init Bridges
  $effect(() => {
    // 1. Wake up the Warden (Load Settings)
    app.init();

    // 2. Wake up the Chrono (Time Service)
    // No more polling. The Director is now a reactive service (chrono).
  });

  // --- Global Effect: Settings Sync ---
  $effect(() => {
    if (typeof window !== "undefined") {
      window.RPGLITCH_CONFIG = {
        sound: app.settings.sound,
        autoScroll: app.settings.autoScroll,
        textSpeed: app.settings.streamText ? 30 : 0,
        devMode: app.settings.devMode,
      };
    }
  });

  // --- Message Sync Logic (Feed) ---
  function updateMessages() {
    if (runtime.storyId && gameState.messages.byStoryId[runtime.storyId]) {
      app.simulation.feed = gameState.messages.byStoryId[runtime.storyId];
    } else {
      app.simulation.feed = [];
    }
  }

  $effect(() => {
    if (runtime.storyId) {
      updateMessages();
    }
  });

  onMount(() => {
    const refreshHandler = (e) => {
      // Sync on events
      if (e.detail?.storyId === runtime.storyId || !e.detail) {
        updateMessages();
      }
    };

    events.addEventListener(EVENTS.CHAT_REFRESH, refreshHandler);
    events.addEventListener(EVENTS.STORY_LOADED, refreshHandler);
    events.addEventListener(EVENTS.MESSAGE_RECEIVED, refreshHandler);

    return () => {
      events.removeEventListener(EVENTS.CHAT_REFRESH, refreshHandler);
      events.removeEventListener(EVENTS.STORY_LOADED, refreshHandler);
      events.removeEventListener(EVENTS.MESSAGE_RECEIVED, refreshHandler);
    };
  });
</script>

<div
  class="app-container"
  class:view-lobby={app.view === "lobby"}
  class:view-game={app.view === "game"}
>
  <!-- GLOBAL: Lightbox Overlay -->
  {#if app.lightboxOpen}
    <Lightbox src={app.lightboxSrc} onClose={() => app.closeLightbox()} />
  {/if}

  <!-- GLOBAL: Profile Modal -->
  {#if app.profileOpen}
    <Profile
      entityId={app.profileTargetId}
      entityType={app.profileTargetType}
      onClose={() => app.closeProfile()}
    />
  {/if}

  <!-- GLOBAL: Control Panel (Settings / Admin) -->
  {#if app.controlPanelOpen}
    <div class="modal-overlay">
      <ControlPanel />
    </div>
  {/if}

  <!-- MAIN VIEW SWITCHER -->
  {#if app.view === "lobby"}
    <Storyboard />
  {:else if app.view === "game"}
    <Storymode />
  {/if}
</div>

<style lang="scss">
  /* Global Reset/Base is handled in index.scss */

  .app-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: #000;

    :global(html),
    :global(body) {
      overflow: hidden;
      width: 100%;
      height: 100%;
    }

    /* 
        GRID ARCHITECTURE Note:
        The 10-column system is managed strictly within Layout.svelte.
        App.svelte only handles the top-level app-container and modal overlays.
    */
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 150;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
