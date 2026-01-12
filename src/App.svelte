<script>
  import Stage from "./artificer/Stage.svelte";
  import VitalsPane from "./scholar/VitalsPane.svelte";
  import Profile from "./scholar/Profile.svelte";
  import ControlPanel from "./warden/ControlPanel.svelte";
  import SettingsButton from "./artificer/hud/SettingsButton.svelte";

  import { app } from "./artificer/stores/app.svelte.js";
  import { runtime } from "./scholar/stores/runtime.svelte.js";
  import { status } from "./gamemaster/stores/status.svelte.js"; // New Svelte Store location

  // Init Bridges
  $effect(() => {
    status.init(); // Start listening to GM events
    const interval = setInterval(() => runtime.sync(), 1000);
    return () => clearInterval(interval);
  });

  // ⚡ SETTINGS SYNC (Svelte -> Legacy JS)
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
</script>

<main class="app-root">
  {#if app.view === "lobby"}
    <Stage transparent={true} />
    <div class="hud-layer">
      <div class="bottom-right"><SettingsButton /></div>
    </div>
  {:else}
    <Stage transparent={true} />
    <div class="hud-layer">
      <div class="top-right"><VitalsPane /></div>
      <div class="bottom-right"><SettingsButton /></div>
    </div>
  {/if}

  {#if app.controlPanelOpen}
    <ControlPanel />
  {/if}
  {#if app.profileOpen}
    <Profile />
  {/if}
</main>

<style lang="scss">
  @import "./scss/index.scss";
  .app-root {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    pointer-events: none;
  }
  .hud-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    padding: 1rem;
    .top-right {
      position: absolute;
      top: 1rem;
      right: 1rem;
      pointer-events: auto;
    }
    .bottom-right {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      pointer-events: auto;
    }
  }
</style>
