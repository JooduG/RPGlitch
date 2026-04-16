<script>
  /**
   * @file src/ui/organisms/profile/wings/DevWing.svelte
   * 🛠️ DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   */
  import DataBox from "@ui/atoms/DataBox.svelte";
  import Wing from "./Wing.svelte";

  let { char = $bindable(), is_editing } = $props();

  /**
   * Formats timestamps to a standard Swedish/ISO-adjacent format.
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
        <div class="dynamic-box" class:is-editing={is_editing}>
          <span class="dynamic-label" title={dynamic.desc}>{dynamic.label}</span>
          <div class="value-container">
            {#if is_editing}
              <input
                type="number"
                bind:value={char[dynamic.source][dynamic.key]}
                min="0"
                max="100"
              />
              <div class="step-controls">
                <button
                  onclick={() =>
                    (char[dynamic.source][dynamic.key] = Math.min(
                      100,
                      char[dynamic.source][dynamic.key] + 1,
                    ))}>+</button
                >
                <button
                  onclick={() =>
                    (char[dynamic.source][dynamic.key] = Math.max(
                      0,
                      char[dynamic.source][dynamic.key] - 1,
                    ))}>-</button
                >
              </div>
            {:else}
              <span class="value-display">
                {char[dynamic.source][dynamic.key]}%
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="group">
    <div class="raw-explorer">
      <details>
        <summary>View JSON Data</summary>
        <DataBox maxHeight="20rem">
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
    min-height: 4rem;
    background: var(--glass-xs);
    border: 1px solid var(--border-l);
    border-radius: var(--border-radius-m);
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  .dynamic-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-cyan);
    margin-bottom: var(--spacing-xs);
    cursor: help;
  }

  .value-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
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
    padding: var(--spacing-xxs);
    outline: none;
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  .value-container input:focus {
    background: transparent;
  }

  .value-display {
    color: var(--font-color-m);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-bold);
  }

  .step-controls {
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step-controls button {
    background: transparent;
    border: none;
    color: var(--font-color-s);
    font-size: 0.8rem;
    padding: 0 var(--spacing-xs);
    cursor: pointer;
    opacity: 0.5;
    transition: all var(--motion-fast);
  }

  .step-controls button:hover {
    opacity: 1;
    color: var(--color-frozen);
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
