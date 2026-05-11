<script>
  /**
   * @file src/ui/DevWing.svelte
   * ⚙️ DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   */
  import Button from "@atoms/Button.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import DataBox from "@devmode/DataBox.svelte";

  let { char = $bindable(), is_editing } = $props();

  /**
   * Formats timestamps to a standard Swedish/ISO-adjacent format.
   * @param {string | number | null} ts
   */
  function format_timestamp(ts) {
    if (!ts) return "---";
    return new Date(ts).toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Dictionary for human-readable labels and descriptions.
   * @type {Record<string, { label: string; desc: string }>}
   */
  const DYNAMICS_META = {
    // Character (Somatic) axes
    chaos: { label: "Chaos", desc: "Randomness vs Control" },
    intensity: { label: "Intensity", desc: "Internal Energy / Adrenaline" },
    openness: { label: "Openness", desc: "Receptivity vs Guardedness" },
    affinity: { label: "Affinity", desc: "Inter-Entity Bond / Empathy" },
    // Fractal (Environmental) axes
    velocity: { label: "Velocity", desc: "Environmental Pacing / Speed" },
    entropy: { label: "Entropy", desc: "Structural Reality / Weirdness" },
  };

  /**
   * Dynamically computes which dynamics are available on the current character.
   */
  let active_dynamics = $derived.by(() => {
    const list = [];
    if (char?.dynamics) {
      for (const key of Object.keys(char.dynamics)) {
        list.push({
          source: "dynamics",
          key: key,
          label: DYNAMICS_META[key]?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: DYNAMICS_META[key]?.desc || "Metric",
        });
      }
    }
    return list;
  });
</script>

<section class="wing glass-elevated">
  <div class="group">
    <div class="dynamics-grid">
      {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
        <div
          class="dynamic-box"
          class:is-editing={is_editing}
          style="--dynamic-value: {char[dynamic.source][dynamic.key]}%"
        >
          <span class="dynamic-label" use:tooltip={dynamic.desc}>{dynamic.label}</span>
          <div class="value-container">
            {#if is_editing}
              <input
                type="number"
                bind:value={char[dynamic.source][dynamic.key]}
                min="0"
                max="100"
              />
              <div class="step-controls">
                <Button
                  variant="invisible"
                  size="sm"
                  square={true}
                  className="step-up"
                  actions={[[tooltip, "Increase"]]}
                  onclick={() =>
                    (char[dynamic.source][dynamic.key] = Math.min(
                      100,
                      char[dynamic.source][dynamic.key] + 1,
                    ))}
                  aria-label="Increase"
                >
                  <svg viewBox="0 0 24 24" class="icon-small"
                    ><path d="M7 14l5-5 5 5H7z" fill="currentColor" /></svg
                  >
                </Button>
                <Button
                  variant="invisible"
                  size="sm"
                  square={true}
                  className="step-down"
                  actions={[[tooltip, "Decrease"]]}
                  onclick={() =>
                    (char[dynamic.source][dynamic.key] = Math.max(
                      0,
                      char[dynamic.source][dynamic.key] - 1,
                    ))}
                  aria-label="Decrease"
                >
                  <svg viewBox="0 0 24 24" class="icon-small"
                    ><path d="M7 10l5 5 5-5H7z" fill="currentColor" /></svg
                  >
                </Button>
              </div>
            {:else}
              <span class="value-display">
                {char[dynamic.source][dynamic.key]}%
              </span>
            {/if}
          </div>
          <div class="dynamic-meter"></div>
        </div>
      {/each}
    </div>
  </div>

  <div class="group">
    <div class="raw-explorer">
      <details>
        <summary>View JSON Data</summary>
        <DataBox maxHeight="var(--spacing-60)">
          <pre>{JSON.stringify(char, null, 2)}</pre>
        </DataBox>
      </details>
    </div>
  </div>

  <div class="group meta-group">
    <footer class="footer-meta">
      <div class="meta-item">
        <span class="tag">Born</span>
        <span class="val">{format_timestamp(char.created_at)}</span>
      </div>
      <div class="meta-item">
        <span class="tag">Sync</span>
        <span class="val">{format_timestamp(char.updated_at)}</span>
      </div>
    </footer>
  </div>
</section>

<style>
  .wing {
    width: 100%;
    overflow: visible;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    transition: all var(--duration-standard) var(--motion-elastic);
    background-color: rgb(from var(--color-gunmetal) r g b / 45%);
    padding: var(--spacing-4);
    gap: var(--spacing-4);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    width: 100%;
  }

  .dynamics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3);
  }

  .dynamic-box {
    padding: var(--spacing-3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: var(--spacing-16);
    background: var(--glass-sunken);
    border-radius: var(--radius-subtle);
    transition: all var(--duration-standard) var(--motion-elastic);
    position: relative;
    overflow: hidden;
  }

  .dynamic-box::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--spacing-2);
    background: var(--color-cyan);
    opacity: 0.2;
  }

  .dynamic-meter {
    position: absolute;
    bottom: 0;
    left: 0;
    height: var(--spacing-2);
    width: var(--dynamic-value, 0%);
    background: var(--color-cyan);
    box-shadow: 0 0 var(--spacing-3) var(--color-cyan);
    transition: width var(--duration-reflex) var(--motion-dissolve);
    z-index: var(--mid-z-index);
  }

  .dynamic-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-frisk);
    margin-bottom: var(--spacing-1);
    cursor: help;
    z-index: var(--mid-z-index);
  }

  .value-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    z-index: var(--mid-z-index);
  }

  .value-container input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--font-color-base);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    text-align: center;
    padding: var(--spacing-2) 0;
    outline: none;
    appearance: textfield;
  }

  .value-container input::-webkit-outer-spin-button,
  .value-container input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .value-display {
    color: var(--font-color-base);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    padding: var(--spacing-2) 0;
  }

  .step-controls {
    position: absolute;
    right: -var(--spacing-2);
    display: flex;
    flex-direction: column;
    gap: 0;
    opacity: 0;
    transition: opacity var(--duration-fast);
  }

  .dynamic-box:hover .step-controls,
  .dynamic-box:focus-within .step-controls {
    opacity: 1;
  }

  .step-controls :global(*) {
    background: transparent;
    border: none;
    color: var(--color-cyan);
    padding: var(--spacing-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--duration-standard);
    border-radius: var(--radius-sharp);
  }

  .step-controls :global(:hover) {
    color: var(--color-white);
  }

  .icon-small {
    width: var(--icon-small);
    height: var(--icon-small);
  }

  .raw-explorer summary {
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    color: var(--color-cyan);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.05em;
  }

  .raw-explorer summary:hover {
    color: var(--color-white);
  }

  .footer-meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-3);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-item .tag {
    color: var(--font-color-muted);
    width: var(--spacing-16);
  }

  .meta-item .val {
    color: var(--font-color-base);
  }
</style>
