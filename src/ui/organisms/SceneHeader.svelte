<script>
  import { fade } from "svelte/transition";

  let {
    location = "Unknown",
    time = "Timeless",
    weather = "Stasis",
  } = $props();

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

<style lang="scss">
  .scene-header {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 2rem 0 1rem 0;
    padding: 0 1rem;
    pointer-events: none;
  }

  .glass-plate {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 2rem;

    background: rgba(15, 15, 20, 0.4);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

    min-width: 300px;
    max-width: 600px;
  }

  .separator {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
  }

  .info-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;

    .label {
      font-size: 0.6rem;
      letter-spacing: 0.15em;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }

    .value {
      font-family: "Ubuntu", sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.05em;

      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .weather-icon {
    opacity: 0.8;
    font-size: 0.8rem;
  }

  @media (max-width: 576px) {
    .glass-plate {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      width: 100%;
    }

    .separator {
      width: 100%;
      height: 1px;
    }

    .info-group {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      .value {
        text-align: right;
      }
    }
  }
</style>
