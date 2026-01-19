<script>
  import DOMPurify from "dompurify";
  import { fade, fly } from "svelte/transition";

  // Props
  let { chronoValue = 0, entropyValue = 0, fateActive = false } = $props();

  // State
  let isExpanded = $state(false);

  // Icons (Inline SVG for performance)
  const Icons = {
    Eye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    Cards: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/></svg>`,
    Clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    Brain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
    Chaos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  };
</script>

<div class="hud-container" class:expanded={isExpanded}>
  <!-- MAIN BAR (Glassmorphism) -->
  <div class="status-bar">
    <!-- P1: CHRONOMANCY (Time) -->
    <div class="pillar chrono">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="icon">{@html DOMPurify.sanitize(Icons.Clock)}</span>
      <span class="value">{chronoValue}</span>
      <span class="label">Turn</span>
    </div>

    <!-- P2: MIND CONTROL (Cogito) -->
    <div class="pillar mesmer">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="icon">{@html DOMPurify.sanitize(Icons.Brain)}</span>
      <span class="label">Cogito</span>
      <div class="pulse-dot"></div>
    </div>

    <!-- CENTER: CLAIRVOYANCE (The Eye/Warden) -->
    <button
      class="pillar warden center-eye"
      class:active={fateActive}
      onclick={() => (isExpanded = !isExpanded)}
      aria-label="Toggle Fate HUD"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="icon-eye">{@html DOMPurify.sanitize(Icons.Eye)}</span>
      {#if fateActive}
        <div class="fate-aura" transition:fade></div>
      {/if}
    </button>

    <!-- P3: METAPHYSICS (Artificer/Entropy) -->
    <div class="pillar artificer">
      <div
        class="pulse-dot entropy-dot"
        style="opacity: {entropyValue / 100}"
      ></div>
      <span class="label">Entropy</span>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="icon">{@html DOMPurify.sanitize(Icons.Chaos)}</span>
    </div>

    <!-- P4: FORTUNE (The Deck) -->
    <div class="pillar fortune">
      <span class="label">Fortune</span>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="icon">{@html DOMPurify.sanitize(Icons.Cards)}</span>
    </div>
  </div>

  <!-- EXPANDED DRAWER (Details) -->
  {#if isExpanded}
    <div class="hud-drawer" transition:fly={{ y: -20, duration: 300 }}>
      <div class="drawer-content">
        <h6>SYSTEM STATUS</h6>
        <div class="grid">
          <div class="stat-block">
            <small>CHRONO</small>
            <strong>Active</strong>
          </div>
          <div class="stat-block">
            <small>COGITO</small>
            <strong>Listening</strong>
          </div>
          <div class="stat-block">
            <small>FORTUNE</small>
            <strong>{fateActive ? "Fate Branch" : "Dormant"}</strong>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .hud-container {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;

    font-family: "Inter", sans-serif;
  }

  .status-bar {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.5rem 1.5rem;

    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

    &:hover {
      background: rgba(15, 15, 25, 0.8);
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
  }

  .pillar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: color 0.2s;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    .icon {
      width: 16px;
      height: 16px;
      opacity: 0.8;

      :global(svg) {
        display: block;
      }
    }
  }

  .chrono .value {
    font-feature-settings: "tnum";
    color: var(--pico-primary);
  }

  .mesmer .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pico-color-jade-400);
    box-shadow: 0 0 8px var(--pico-color-jade-500);
    animation: breath 4s infinite ease-in-out;
  }

  .artificer .entropy-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pico-color-pumpkin-500);
  }

  .center-eye {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: white;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.1);
    }

    &.active {
      border-color: var(--pico-color-violet-400);
      box-shadow: 0 0 15px var(--pico-color-violet-900);

      .icon-eye {
        color: var(--pico-color-violet-300);
      }
    }

    .fate-aura {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid var(--pico-color-violet-500);
      opacity: 0.5;
      animation: ripple 2s infinite;
    }
  }

  .hud-drawer {
    margin-top: 0.5rem;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1rem;
    min-width: 250px;
    pointer-events: auto;

    h6 {
      margin: 0 0 0.75rem 0;
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .stat-block {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.8rem;

      small {
        color: rgba(255, 255, 255, 0.5);
      }
      strong {
        color: white;
      }
    }
  }

  @keyframes breath {
    0%,
    100% {
      opacity: 0.5;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes ripple {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
</style>
