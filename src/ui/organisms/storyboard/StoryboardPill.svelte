<script>
  import { app } from "@state/app.svelte.js";
  import Button from "@ui/atoms/Button.svelte";
  import { pulse, shimmy, spin } from "@ui/utils/actions/kinetic.js";
  import { storyboard } from "./storyboard-actions.svelte.js";
  // Derived State
  let ready_to_begin = $derived(app.selected_ai && app.selected_user && app.selected_fractal);
</script>

<div class="pill-container">
  <div class="unified-capsule glass-base">
    <!-- Option 1: "The Twitch" (Subtle nervous energy) -->
    <Button
      className="capsule-flank icon-glow"
      variant="ghost"
      onclick={() => storyboard.shuffle()}
      aria-label="Shuffle All"
      title="Randomize Entities"
      actions={[shimmy]}
    >
      <svg viewBox="0 0 24 24" class="icon-small">
        <path
          fill="currentColor"
          d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
        />
      </svg>
    </Button>
    <Button
      className="capsule-flank icon-glow"
      variant="ghost"
      onclick={app.toggle_control_panel}
      aria-label="Settings"
      title="Open Control Panel"
      data-testid="settings-button"
      actions={[spin]}
    >
      <svg viewBox="0 0 24 24" class="icon-small">
        <path
          fill="currentColor"
          d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.35 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.35 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.95C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
        />
      </svg>
    </Button>
    <!-- Option 3: "The Pop" (Scale + Brightness) -->
    <Button
      className="capsule-action pop"
      variant="ghost"
      disabled={!ready_to_begin}
      onclick={storyboard.begin}
      actions={[pulse]}
    >
      <div class="core-content">
        <span class="label">Begin Story</span>
      </div>
    </Button>
  </div>
</div>

<style>
  .pill-container {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-bottom: var(--spacing-m);
    position: relative;
    z-index: var(--z-index-l);
    pointer-events: auto;
  }

  .unified-capsule {
    display: flex;
    align-items: center;
    border-radius: var(--border-radius-full);
    padding: var(--spacing-xxs) var(--spacing-m);
  }

  /* --- Scoped UI Overrides --- */
  :global(.unified-capsule .button) {
    background: transparent;
    filter: none;
    transition: all var(--motion-fast);
  }

  :global(.unified-capsule .button:hover:not(:disabled)) {
    background: transparent;
    filter: none;
    color: var(--font-color-m);
    opacity: var(--opacity-full);
  }

  /* Flank Buttons (Shuffle/Settings) */
  :global(.unified-capsule .capsule-flank.button) {
    flex: 0 0 var(--spacing-xxxl);
    width: var(--spacing-xxxl);
    height: 100%;
    border-radius: 0;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--font-color-s);
  }

  :global(.unified-capsule .capsule-flank.button:hover svg) {
    fill: var(--font-color-m);
    stroke: var(--font-color-m);
  }

  /* Primary Action Button (Begin) */
  :global(.unified-capsule .capsule-action.button) {
    height: 100%;
    min-width: 8.125rem; /* ~130px */
    border: none;
    border-radius: 0;
    background: transparent;
    position: relative;
    overflow: hidden;
    margin-right: var(--spacing-s);
    padding: var(--spacing-xs);
    opacity: var(--opacity-m);
  }

  :global(.unified-capsule .capsule-action.button:disabled) {
    opacity: var(--opacity-s);
    cursor: not-allowed;
  }

  /* Extra Label Polish */
  :global(.unified-capsule .capsule-action.button:hover .label) {
    text-shadow: 0 0 var(--spacing-m) var(--color-white);
  }

  /* Ensure icons reset nicely */
  .icon-small {
    width: var(--spacing-l);
    height: var(--spacing-l);
    transition:
      transform var(--motion-fast) var(--motion-elastic),
      filter var(--motion-fast) ease;
  }

  .core-content {
    position: relative;
    z-index: var(--z-index-m);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .label {
    font-family: var(--font-family-body);
    font-weight: var(--font-weight-l);
    font-size: var(--font-size-s);
    letter-spacing: var(--letter-spacing-m);
    color: var(--font-color-m);
    text-shadow: var(--shadow-font);
    transition: all var(--motion-fast) var(--motion-elastic);
  }
</style>
