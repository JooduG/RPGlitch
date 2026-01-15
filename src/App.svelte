<script>
  import { onMount } from "svelte";
  import Layout from "./artificer/Layout.svelte";

  import Profile from "./scholar/Profile.svelte";
  import ControlPanel from "./warden/ControlPanel.svelte";
  import Button from "./artificer/Button.svelte";
  import StoryboardPill from "./artificer/storyboard/StoryboardPill.svelte";
  import Lightbox from "./mesmer/Lightbox.svelte";
  import Storyboard from "./artificer/storyboard/Storyboard.svelte";
  import Storymode from "./artificer/storymode/Storymode.svelte";

  import { app } from "./artificer/state.svelte.js";
  import { runtime } from "./scholar/runtime.svelte.js";
  import { events, EVENTS, state as gameState } from "./gamemaster/bus.js";
  import { Session } from "./gamemaster/engine/session.js";

  // Init Bridges
  $effect(() => {
    // 1. Wake up the Warden (Load Settings)
    app.init();

    // 2. Wake up the GM (Start Listening)
    // status.init(); // Start listening to GM events (Removed legacy store ref)

    // 3. Wake up the Scholar (Sync Loop)
    // Note: Ideally, we pass the active Story ID here from the URL router
    // For now, we let it try to auto-discover
    const interval = setInterval(() => runtime.sync(), 2000); // Poll every 2s

    return () => clearInterval(interval);
  });

  // --- Global Effect: Settings Sync ---
  $effect(() => {
    // Keep overlay in sync with App Store
    // status.overlay = app.showSettings; // (Removed legacy store ref)

    if (typeof window !== "undefined") {
      window.RPGLITCH_CONFIG = {
        sound: app.settings.sound,
        autoScroll: app.settings.autoScroll,
        textSpeed: app.settings.streamText ? 30 : 0,
        devMode: app.settings.devMode,
      };
    }
  });

  // --- Message Sync Logic ---
  let messages = $state([]);

  function updateMessages() {
    if (runtime.storyId && gameState.messages.byStoryId[runtime.storyId]) {
      messages = gameState.messages.byStoryId[runtime.storyId];
    } else {
      messages = [];
    }
  }

  $effect(() => {
    // Initial sync interaction
    if (runtime.storyId) {
      updateMessages();
    }
  });

  onMount(() => {
    // Listen for Game Master events
    const refreshHandler = (e) => {
      if (e.detail?.storyId === runtime.storyId || !e.detail) {
        updateMessages();
      }
    };

    events.addEventListener(EVENTS.CHAT_REFRESH, refreshHandler);
    events.addEventListener(EVENTS.STORY_LOADED, refreshHandler);
    events.addEventListener(EVENTS.MESSAGE_RECEIVED, refreshHandler); // JIC

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

  <!-- VIEW: Lobby -->
  {#if app.view === "lobby"}
    <!-- Background Layer for Lobby -->
    <Layout transparent={true} />

    <div style="position: relative; z-index: 10;">
      <Storyboard />
    </div>
  {:else}
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
    background: #000; /* Fallback */

    :global(html),
    :global(body) {
      overflow: hidden;
      width: 100%;
      height: 100%;
    }

    /* Mode Switching Logic (Refactored to Unified 1-2-4-2-1 Grid) */
    :global(.universal-stage) {
      transition: grid-template-columns 0.4s ease;
      grid-template-columns: 1fr 2fr 4fr 2fr 1fr;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        grid-template-rows: 60px 1fr;
      }
    }
  }

  /* Shared Grid Config for all views */
  .app-container.view-lobby,
  .app-container.view-game {
    :global(.universal-stage) {
      /* Both views now share the same 5-column architecture */
      grid-template-columns: 1fr 2fr 4fr 2fr 1fr;
    }
  }

  /* Specific Layout constraints within the game view */
  .app-container.view-game {
    :global(.story-container) {
      grid-column: 3; /* Central pillar only */
    }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 150; /* Above HUD */
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
