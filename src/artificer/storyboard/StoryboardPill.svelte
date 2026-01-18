<script>
  import Button from "../../artificer/Button.svelte";
  import { app } from "../../gamemaster/state.svelte.js";
  import { storyboard } from "./storyboardActions.svelte.js";

  // Direct function calls (CustomEvents blocked in Perchance sandbox)
  const onShuffle = () => storyboard.shuffle();
  const onBegin = () => storyboard.beginStory();
</script>

<div class="storyboard-pill">
  <!-- SHUFFLE -->
  <!-- SHUFFLE -->
  <Button
    class="pill-btn btn-shuffle"
    variant="ghost"
    onclick={onShuffle}
    title="Shuffle Entities"
    aria-label="Shuffle"
  >
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
      />
    </svg>
  </Button>

  <div class="separator"></div>

  <!-- SETTINGS (Middle) -->
  <!-- SETTINGS (Middle) -->
  <Button
    class="pill-btn btn-settings {app.controlPanelOpen ? 'active' : ''}"
    variant="ghost"
    onclick={() => app.toggleControlPanel()}
    title="Settings"
    aria-label="Settings"
  >
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  </Button>

  <div class="separator"></div>

  <!-- BEGIN STORY -->
  <!-- BEGIN STORY -->
  <Button
    class="pill-btn btn-begin"
    variant="ghost"
    onclick={onBegin}
    disabled={!app.canStart}
    title={app.canStart
      ? "Start Simulation"
      : "Select an AI, User, and Reality first"}
  >
    Begin Story
    <svg class="icon icon-right" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  </Button>
</div>

<style lang="scss">
  .storyboard-pill {
    display: flex;
    align-items: center;
    background: rgba(
      var(--app-component-bg-rgb),
      0.85
    ); /* Slightly darker for better contrast */
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px; /* Full pill */
    padding: 0.25rem 0.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
    /* Removed hover transform to keep pill static */
  }

  /* Use :global to target classes passed to child Button component */
  :global(.storyboard-pill .pill-btn) {
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
    border-radius: 9999px; /* Rounded buttons inside pill */
  }

  :global(.storyboard-pill .pill-btn:hover:not(:disabled)) {
    color: #fff;
    background: transparent; /* No background fill */
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    transform: scale(1.08); /* Slightly more pronounced raise */
  }

  :global(.storyboard-pill .pill-btn:active:not(:disabled)) {
    transform: scale(0.96);
  }

  :global(.storyboard-pill .pill-btn:disabled) {
    opacity: 0.3;
    cursor: not-allowed;
  }

  :global(.storyboard-pill .pill-btn.active) {
    color: #fff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  :global(.storyboard-pill .pill-btn .icon) {
    width: 1.3rem; /* Slightly larger icons */
    height: 1.3rem;
    display: block;
    transition: filter 0.2s ease;
  }

  :global(.storyboard-pill .pill-btn .icon-right) {
    margin-left: 0.3rem;
  }

  :global(.storyboard-pill .btn-begin.btn) {
    color: #e4e4e7;
    padding-right: 1.2rem;
  }

  :global(.storyboard-pill .btn-begin.btn:not(:disabled)) {
    color: #4ade80; /* Force override */
    text-shadow: 0 0 12px rgba(74, 222, 128, 0.4);
  }

  :global(.storyboard-pill .btn-begin.btn:not(:disabled) .icon) {
    filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.5));
  }

  :global(.storyboard-pill .btn-begin.btn:not(:disabled):hover) {
    color: #5ff595;
    background: transparent; /* No background fill */
    filter: drop-shadow(0 0 15px rgba(74, 222, 128, 0.8));
    text-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
    transform: scale(1.1); /* Stronger pop for the main action */
  }

  .separator {
    width: 1px;
    height: 1.6rem;
    background: rgba(255, 255, 255, 0.08);
    margin: 0 0.3rem;
  }
</style>
