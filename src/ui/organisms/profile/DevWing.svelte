<script>
  /**
   * @file DevWing.svelte
   * 🛠️ DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   */
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
   * Maps the internal keys from dynamics_engine to user-facing text.
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
   * Scans both standard 'dynamics' and runtime 'fractal_dynamics'.
   */
  let active_dynamics = $derived.by(() => {
    const list = [];
    // 1. Scan Unified Dynamics (Character, Fractal, or custom Entity)
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

<div class="dev-wing-content glass-overlay">
  <div class="group dynamics-group">
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
              <span class="value-display" style="--val: {char[dynamic.source][dynamic.key]}%">
                {char[dynamic.source][dynamic.key]}%
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div class="group meta-group">
    <div class="raw-explorer">
      <details>
        <summary>System Manifest</summary>
        <div class="json-wrap">
          <pre>{JSON.stringify(char, null, 2)}</pre>
        </div>
      </details>
    </div>
    <footer class="footer-meta">
      <div class="meta-item">
        <span class="tag">Created</span>
        <span class="val">{format_timestamp(char.created_at)}</span>
      </div>
      <div class="meta-item">
        <span class="tag">Updated</span>
        <span class="val">{format_timestamp(char.updated_at)}</span>
      </div>
    </footer>
  </div>
</div>

<style>
  .dev-wing-content {
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    height: 100%;
    overflow-y: auto;
  }

  .dev-wing-content::-webkit-scrollbar {
    width: var(--spacing-xxs);
  }

  .dev-wing-content::-webkit-scrollbar-thumb {
    background: var(--glass-l);
    border-radius: var(--border-radius-full);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  /* 1. Dynamics Display */
  .dynamics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-s);
  }

  .dynamic-box {
    background: var(--glass-xs);
    box-shadow: inset 0 0 0 1px var(--glass-edge-l);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    transition: all var(--motion-fast);
    min-height: var(--spacing-xxl);
    overflow: hidden;
  }

  .dynamic-box.is-editing:hover {
    background: var(--glass-l);
    box-shadow: inset 0 0 0 1px var(--glass-edge-l);
  }

  .dynamic-label {
    font-family: var(--font-header);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    color: var(--font-color-s);
    opacity: var(--opacity-xl);
    margin-bottom: var(--spacing-xxs);
    display: block;
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
    color: var(--color-white);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-l);
    text-align: center;
    padding: 0;
    outline: none;
  }

  .step-controls {
    position: absolute;
    right: var(--spacing-xxs);
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step-controls button {
    background: transparent;
    border: none;
    color: var(--font-color-s);
    font-size: var(--font-size-xxs);
    padding: 0 var(--spacing-xxs);
    cursor: pointer;
    opacity: var(--opacity-s);
    transition: all var(--motion-fast);
  }

  .step-controls button:hover {
    opacity: var(--opacity-full);
    color: var(--color-frozen);
  }

  /* 4. Meta & Raw Explorer */
  .raw-explorer summary {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    color: var(--font-color-s);
    text-transform: uppercase;
    cursor: pointer;
    opacity: var(--opacity-l);
    letter-spacing: var(--letter-spacing-m);
    transition: all var(--motion-fast);
  }

  .raw-explorer summary:hover {
    opacity: var(--opacity-full);
    color: var(--color-white);
  }

  .json-wrap {
    margin-top: var(--spacing-xs);
    background: rgb(var(--color-black-rgb) / 20%);
    box-shadow:
      inset 0 0 0 1px var(--glass-edge-l),
      inset 0 0.125rem 0.25rem rgb(var(--color-black-rgb) / 50%);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-xs);
    max-height: 10rem;
    overflow: auto;
  }

  .json-wrap pre {
    font-size: var(--font-size-xs);
    color: var(--glass-l);
    font-family: var(--font-family-mono);
    margin: 0;
  }

  .footer-meta {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .meta-item {
    display: flex;
    justify-content: flex-start;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-s);
  }

  .meta-item .tag {
    color: var(--font-color-s);
    opacity: var(--opacity-l);
    font-weight: var(--font-weight-xl);
  }

  .meta-item .val {
    color: var(--font-color-m);
    opacity: var(--opacity-l);
  }
</style>
