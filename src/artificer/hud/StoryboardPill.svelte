<script>
  import { app } from "../stores/app.svelte.js";

  // Dispatch Global Events for Legacy Wiring
  // We use window events because the receivers are in legacy JS files (storyboard.js)
  const onShuffle = () => {
    window.dispatchEvent(new CustomEvent("RPGLITCH_SHUFFLE"));
  };

  const onBegin = () => {
    window.dispatchEvent(new CustomEvent("RPGLITCH_BEGIN_STORY"));
  };
</script>

<div class="storyboard-pill">
  <!-- SHUFFLE -->
  <button
    class="pill-btn btn-shuffle"
    onclick={onShuffle}
    title="Shuffle Entities"
    aria-label="Shuffle"
  >
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
      />
    </svg>
  </button>

  <div class="separator"></div>

  <!-- SETTINGS (Middle) -->
  <button
    class="pill-btn btn-settings"
    onclick={() => app.toggleControlPanel()}
    class:active={app.controlPanelOpen}
    title="Settings"
    aria-label="Settings"
  >
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  </button>

  <div class="separator"></div>

  <!-- BEGIN STORY -->
  <button
    class="pill-btn btn-begin"
    onclick={onBegin}
    disabled={!app.lobbyReady}
    title="Start Simulation"
  >
    Begin Story
    <svg class="icon icon-right" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  </button>
</div>

<style lang="scss">
  .storyboard-pill {
    display: flex;
    align-items: center;
    background: rgba(20, 20, 25, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px; // Full pill
    padding: 0.25rem 0.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
    transition:
      transform 0.2s,
      box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }

  .pill-btn {
    background: transparent;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
    border-radius: 8px;

    &:hover:not(:disabled) {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.96);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &.active {
      color: #fff;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
      display: block;
    }

    .icon-right {
      margin-left: 0.25rem;
    }
  }

  .btn-begin {
    color: #e4e4e7;
    padding-right: 1.2rem;

    &:hover:not(:disabled) {
      color: #fff;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
    }
  }

  .separator {
    width: 1px;
    height: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 0.25rem;
  }
</style>
