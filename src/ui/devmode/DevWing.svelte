<script>
  /**
   * @file src/ui/DevWing.svelte
   * ⚙️ DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   */
  import DataBox from "@devmode/DataBox.svelte";
  import Button from "@atoms/Button.svelte";
  import Wing from "@atoms/Wing.svelte";
  import Tooltip from "@atoms/Tooltip.svelte";

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

<Wing class="dev-wing">
  <div class="group">
    <div class="dynamics-grid">
      {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
        <div
          class="dynamic-box"
          class:is-editing={is_editing}
          style="--dynamic-value: {char[dynamic.source][dynamic.key]}%"
        >
          <Tooltip text={dynamic.desc}>
            <span class="dynamic-label">{dynamic.label}</span>
          </Tooltip>
          <div class="value-container">
            {#if is_editing}
              <input
                type="number"
                bind:value={char[dynamic.source][dynamic.key]}
                min="0"
                max="100"
              />
              <div class="step-controls">
                <Tooltip text="Increase">
                  <Button
                    variant="invisible"
                    size="sm"
                    square={true}
                    className="step-up"
                    onclick={() =>
                      (char[dynamic.source][dynamic.key] = Math.min(
                        100,
                        char[dynamic.source][dynamic.key] + 1,
                      ))}
                    aria-label="Increase"
                  >
                    <svg viewBox="0 0 24 24" class="icon-xxs"
                      ><path d="M7 14l5-5 5 5H7z" fill="currentColor" /></svg
                    >
                  </Button>
                </Tooltip>
                <Tooltip text="Decrease">
                  <Button
                    variant="invisible"
                    size="sm"
                    square={true}
                    className="step-down"
                    onclick={() =>
                      (char[dynamic.source][dynamic.key] = Math.max(
                        0,
                        char[dynamic.source][dynamic.key] - 1,
                      ))}
                    aria-label="Decrease"
                  >
                    <svg viewBox="0 0 24 24" class="icon-xxs"
                      ><path d="M7 10l5 5 5-5H7z" fill="currentColor" /></svg
                    >
                  </Button>
                </Tooltip>
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
        <DataBox maxHeight="15rem">
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
</Wing>

<style>
  .dynamics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-s);
  }

  .dynamic-box {
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 4.5rem;
    background: var(--glass-xs);
    border: var(--border-l);
    border-radius: var(--border-radius-m);
    transition: all var(--motion-l) var(--motion-elastic);
    position: relative;
    overflow: hidden;
  }

  .dynamic-box::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-cyan);
    opacity: 0.2;
  }

  .dynamic-meter {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: var(--dynamic-value, 0%);
    background: var(--color-cyan);
    box-shadow: 0 0 10px var(--color-cyan);
    transition: width var(--motion-s) var(--motion-dissolve);
    z-index: 2;
  }

  .dynamic-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-frisk);
    margin-bottom: var(--spacing-xxs);
    cursor: help;
    z-index: 1;
  }

  .value-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    z-index: 1;
  }

  .value-container input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--font-color-m);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-bold);
    text-align: center;
    padding: var(--spacing-xs) 0;
    outline: none;
    appearance: textfield;
  }

  .value-container input::-webkit-outer-spin-button,
  .value-container input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .value-display {
    color: var(--font-color-m);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-bold);
    padding: var(--spacing-xs) 0;
  }

  .step-controls {
    position: absolute;
    right: -var(--spacing-xs);
    display: flex;
    flex-direction: column;
    gap: 0;
    opacity: 0;
    transition: opacity var(--motion-m);
  }

  .dynamic-box:hover .step-controls,
  .dynamic-box:focus-within .step-controls {
    opacity: 1;
  }

  .step-controls :global(.button) {
    background: transparent;
    border: none;
    color: var(--color-cyan);
    padding: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--motion-l);
    border-radius: var(--border-radius-s);
  }

  .step-controls :global(.button:hover) {
    color: var(--color-white);
  }

  .icon-xxs {
    width: 1.25rem;
    height: 1.25rem;
  }

  .raw-explorer summary {
    font-size: var(--font-size-xs);
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
    gap: var(--spacing-xxs);
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-s);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-item .tag {
    color: var(--font-color-s);
    width: 4rem;
  }

  .meta-item .val {
    color: var(--font-color-m);
  }
</style>
