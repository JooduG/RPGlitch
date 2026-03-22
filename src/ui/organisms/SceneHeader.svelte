<script>
  /**
   * @file SceneHeader.svelte
   * 📍 THE SCENE BANNER
   * Displays environmental context during Storymode.
   * Structurally sound, styled to perfectly match new standards.
   */
  import { fade } from "svelte/transition";
  let { location = "Unknown", time = "Timeless", weather = "Stasis" } = $props();
  // Derived: Determine icon/mood based on weather string
  let weatherIcon = $derived.by(() => {
    const w = weather.toLowerCase();
    if (w.includes("rain") || w.includes("storm")) return "🌧️";
    if (w.includes("sunny") || w.includes("clear")) return "☀️";
    if (w.includes("night") || w.includes("dark")) return "🌑";
    if (w.includes("fog") || w.includes("mist")) return "🌫️";
    return "⚓";
  });
</script>

<div class="scene-header" transition:fade>
  <div class="glass-plate">
    <div class="info-group location">
      <span class="label">LOCATION</span>
      <span class="value">{location}</span>
    </div>
    <div class="separator"></div>
    <div class="info-group time">
      <span class="label">TIME</span>
      <span class="value">{time}</span>
    </div>
    <div class="separator"></div>
    <div class="info-group weather">
      <span class="label">ATMOS</span>
      <span class="value">
        <span class="weather-icon">{weatherIcon}</span>
        {weather}
      </span>
    </div>
  </div>
</div>

<style>
  .scene-header {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: var(--spacing-xl) 0 var(--spacing-m) 0;
    padding: 0 var(--spacing-m);
    pointer-events: none;
  }

  .glass-plate {
    display: flex;
    align-items: center;
    gap: var(--spacing-l);
    padding: var(--spacing-s) var(--spacing-xl);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-m);
    border-radius: var(--border-radius-xs);
    min-width: 18.75rem;
    max-width: 37.5rem;
  }

  .separator {
    width: var(--spacing-px);
    height: var(--spacing-l);
    box-shadow: 0 0 var(--spacing-m) var(--border-light);
  }

  .info-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-px);
  }

  .info-group .label {
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-l);
    color: var(--font-muted);
    text-transform: uppercase;
  }

  .info-group .value {
    font-family: var(--font-header);
    font-size: var(--font-size-s);
    font-weight: 500;
    color: var(--font-color);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-m);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .weather-icon {
    opacity: var(--opacity-xl);
    font-size: var(--font-size-s);
  }

  @media (width <= 576px) {
    .glass-plate {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-s);
      padding: var(--spacing-m);
      width: 100%;
    }

    .separator {
      width: 100%;
      height: var(--spacing-px);
    }

    .info-group {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .info-group .value {
      text-align: right;
    }
  }
</style>
