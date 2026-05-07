<script>
  /**
   * @file DevTelemetryBlock.svelte
   * 📡 THE TELEMETRY MODULE
   * Renders internal simulation physics, state changes (deltas), and memory vectors.
   */
  import DataBox from "@devmode/DataBox.svelte";

  /**
   * @typedef {Object} TelemetryMeta
   * @property {string} [type] - The type of telemetry event.
   * @property {Object} [ai] - AI character state.
   * @property {Object} [dynamics] - Dynamic simulation state.
   * @property {Object} [snapshot] - State snapshot.
   * @property {Object} [snapshot.ai] - AI snapshot.
   * @property {Object} [snapshot.fractal] - Fractal snapshot.
   * @property {Object} [fractal] - Fractal entity state.
   * @property {Object} [fractal_dynamics] - Fractal dynamic state.
   * @property {Object} [vectors] - Narrative vectors.
   * @property {any[]} [vectors.past] - Past memory vectors.
   * @property {any[]} [vectors.future] - Future intent vectors.
   * @property {any[]|Object} [signals] - Atmospheric signals.
   * @property {any[]} [deltas] - State deltas.
   */
  /**
   * @typedef {Object} Props
   * @property {TelemetryMeta} [meta={}] - The telemetry metadata object.
   * @property {string} [time=""] - Optional timestamp to display.
   */

  /** @type {Props} */
  let { meta = {}, time = "" } = $props();

  let ai = $derived(meta.ai || meta.dynamics || meta.snapshot?.ai || {});
  let fractal = $derived(meta.fractal || meta.fractal_dynamics || meta.snapshot?.fractal || {});
  let vectors = $derived({
    past: meta.vectors?.past || [],
    future: meta.vectors?.future || [],
  });
  let signals = $derived(
    Array.isArray(meta.signals) ? meta.signals : Object.keys(meta.signals || {}),
  );
  let deltas = $derived(meta.deltas || []);

  /** @param {number} val */
  function get_pct(val) {
    return Math.max(0, Math.min(100, Math.round(val || 50)));
  }
</script>

<div
  class="telemetry-block"
  class:is-standalone={meta.type === "telemetry" ||
    meta.type === "MEMORY_FORMATION" ||
    meta.type === "VECTOR_RESOLUTION"}
>
  <DataBox
    label={meta.type === "MEMORY_FORMATION"
      ? "[#] MEMORY_WEAVE"
      : meta.type === "VECTOR_RESOLUTION"
        ? "[A] VECTOR_ANCHOR"
        : meta.type === "telemetry"
          ? "[S] DYNAMICS_LOG"
          : "[S] Simulation Telemetry"}
    height="auto"
    className={meta.type === "MEMORY_FORMATION" || meta.type === "VECTOR_RESOLUTION"
      ? "resonance-pulse"
      : ""}
  >
    <div class="telemetry-container">
      {#if time}
        <div class="telemetry-meta">
          <span class="telemetry-time">{time}</span>
        </div>
      {/if}

      {#if meta.type === "MEMORY_FORMATION"}
        <!-- [#] WEAVED STATE (Memory Consolidation) -->
        <div class="resonance-state weaved">
          <div class="resonance-header">
            <span class="resonance-title">Consolidating Temporal Echoes</span>
            <p class="resonance-desc">Merging active impulses into persistent memory vectors.</p>
          </div>

          <div class="vector-fabric">
            <div class="vector-column full-width">
              <header class="sub-label">NEWLY_WEAVED_MEMORIES</header>
              <div class="vector-list">
                {#each vectors.past as v (v.id || v.text)}
                  <div class="vector-item past resonance-item">
                    <span class="vector-score">WEAVED</span>
                    <span class="vector-text">{v.text}</span>
                  </div>
                {:else}
                  <div class="empty-hint">NO_MEMORIES_WEAVED</div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {:else if meta.type === "VECTOR_RESOLUTION"}
        <!-- [A] ANCHORED STATE (Vector Engine) -->
        <div class="resonance-state anchored">
          <div class="resonance-header">
            <span class="resonance-title">Aligning Future Intent</span>
            <p class="resonance-desc">Resolving state deltas into directed narrative vectors.</p>
          </div>

          <div class="vector-fabric">
            <div class="vector-column">
              <header class="sub-label">RESOLVED_IMPULSES</header>
              <div class="vector-list">
                {#each vectors.future.slice(0, 5) as v (v.id || v.text)}
                  <div class="vector-item future resonance-item">
                    <span class="vector-score">ANCHOR</span>
                    <span class="vector-text">{v.text}</span>
                  </div>
                {:else}
                  <div class="empty-hint">NO_IMPULSES_RESOLVED</div>
                {/each}
              </div>
            </div>

            <div class="vector-column">
              <header class="sub-label">ACTIVE_CONTEXT</header>
              <div class="vector-list">
                {#each vectors.past.slice(0, 3) as v (v.id || v.text)}
                  <div class="vector-item past">
                    <span class="vector-score">{v._relevance?.toFixed(1) || v.base_weight}</span>
                    <span class="vector-text">{v.text}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- [S] DEFAULT SIMULATION TELEMETRY -->
        <!-- [D] STATE CHANGES (DELTAS) -->
        {#if deltas.length > 0}
          <div class="deltas-tray">
            <header class="sub-label">STATE_MUTATIONS</header>
            <div class="delta-grid">
              {#each deltas as delta (delta)}
                <div
                  class="delta-item"
                  class:is-positive={delta.includes("(+")}
                  class:is-negative={delta.includes("(-")}
                >
                  <span class="delta-text">{delta}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- [T] DYNAMICS GRID -->
        <div class="dynamics-grid">
          {#if Object.keys(ai).length > 0}
            <div class="dynamics-column">
              <header class="sub-label">AI_SOMATICS</header>
              {#each Object.entries(ai) as [axis, val] (axis)}
                <div class="metric-row">
                  <span class="metric-label">{axis}</span>
                  <div class="metric-visual">
                    <div class="metric-track">
                      <div
                        class="metric-fill"
                        style="
                          --metric-offset: {Math.min(50, get_pct(val))}%;
                          --metric-span: {Math.abs(get_pct(val) - 50)}%;
                          --metric-color: {get_pct(val) > 50
                          ? 'var(--color-cyan)'
                          : 'var(--color-frozen)'}
                        "
                      ></div>
                    </div>
                    <span class="metric-value">{get_pct(val)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          {#if Object.keys(fractal).length > 0}
            <div class="dynamics-column">
              <header class="sub-label">FRACTAL_PHYSICS</header>
              {#each Object.entries(fractal) as [axis, val] (axis)}
                <div class="metric-row">
                  <span class="metric-label">{axis}</span>
                  <div class="metric-visual">
                    <div class="metric-track">
                      <div
                        class="metric-fill"
                        style="
                          --metric-offset: {Math.min(50, get_pct(val))}%;
                          --metric-span: {Math.abs(get_pct(val) - 50)}%;
                          --metric-color: {get_pct(val) > 50
                          ? 'var(--color-cyan)'
                          : 'var(--color-frozen)'}
                        "
                      ></div>
                    </div>
                    <span class="metric-value">{get_pct(val)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- VECTOR FABRIC -->
        {#if vectors.future.length > 0 || vectors.past.length > 0}
          <div class="vector-fabric">
            <div class="vector-column">
              <header class="sub-label">ACTIVE_IMPULSES (FUTURE)</header>
              <div class="vector-list">
                {#each vectors.future.slice(0, 3) as v (v.id || v.text)}
                  <div class="vector-item future">
                    <span class="vector-score">{v._relevance?.toFixed(1) || v.base_weight}</span>
                    <span class="vector-text">{v.text}</span>
                  </div>
                {:else}
                  <div class="empty-hint">NO_ACTIVE_IMPULSES</div>
                {/each}
              </div>
            </div>

            <div class="vector-column">
              <header class="sub-label">HISTORICAL_ANCHORS (PAST)</header>
              <div class="vector-list">
                {#each vectors.past.slice(0, 3) as v (v.id || v.text)}
                  <div class="vector-item past">
                    <span class="vector-score">{v._relevance?.toFixed(1) || v.base_weight}</span>
                    <span class="vector-text">{v.text}</span>
                  </div>
                {:else}
                  <div class="empty-hint">NO_HISTORICAL_ANCHORS</div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- [!] SIGNALS -->
        {#if signals.length > 0}
          <div class="signals-tray">
            <header class="sub-label">TRIGGERED_SIGNALS</header>
            <div class="pill-grid">
              {#each signals as signal (signal)}
                <span class="signal-pill">{signal}</span>
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </DataBox>
</div>

<style>
  .telemetry-block {
    margin-bottom: var(--spacing-m);
    animation: slide-in var(--motion-m) var(--motion-elastic);
  }

  .telemetry-block.is-standalone {
    margin: var(--spacing-xs) 0;
    max-width: 85%;
    margin-left: auto;
    margin-right: auto;
  }

  @keyframes pulse-resonance {
    0% {
      box-shadow: 0 0 0 0 rgb(var(--color-cyan-rgb) / 40%);
    }

    70% {
      box-shadow: 0 0 0 var(--spacing-s) rgb(var(--color-cyan-rgb) / 0%);
    }

    100% {
      box-shadow: 0 0 0 0 rgb(var(--color-cyan-rgb) / 0%);
    }
  }

  :global(.resonance-pulse) {
    animation: pulse-resonance 3s infinite var(--motion-elastic);
    border-color: var(--color-cyan) !important;
  }

  .resonance-header {
    margin-bottom: var(--spacing-m);
  }

  .resonance-title {
    display: block;
    font-size: var(--font-size-s);
    color: var(--color-white);
    font-weight: var(--font-weight-xl);
    letter-spacing: -0.02em;
  }

  .resonance-desc {
    font-size: var(--font-size-xxs);
    color: var(--font-color-s);
    margin: var(--spacing-xxs) 0 0 0;
  }

  .resonance-item {
    background: rgb(var(--color-cyan-rgb) / 5%) !important;
    border-color: rgb(var(--color-cyan-rgb) / 20%) !important;
    animation: slide-in var(--motion-l) var(--motion-elastic) both;
  }

  .resonance-item:nth-child(2) {
    animation-delay: 0.1s;
  }

  .resonance-item:nth-child(3) {
    animation-delay: 0.2s;
  }

  .resonance-item:nth-child(4) {
    animation-delay: 0.3s;
  }

  .resonance-item:nth-child(5) {
    animation-delay: 0.4s;
  }

  .full-width {
    grid-column: span 2;
    margin-left: auto;
    margin-right: auto;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .telemetry-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    padding: var(--spacing-xxs);
  }

  .telemetry-meta {
    display: flex;
    justify-content: flex-end;
    margin-bottom: calc(-1 * var(--spacing-s));
    opacity: 0.5;
  }

  .telemetry-time {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxxxs);
    color: var(--font-color-s);
  }

  .sub-label {
    font-size: var(--font-size-xxxxs);
    color: var(--color-cyan);
    opacity: 0.6;
    margin-bottom: var(--spacing-xs);
    font-weight: var(--font-weight-xl);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Deltas */
  .deltas-tray {
    padding-bottom: var(--spacing-xs);
    border-bottom: var(--border-l);
  }

  .delta-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .delta-item {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxxs);
    color: var(--color-white);
    background: rgb(var(--color-black-rgb) / 30%);
    padding: var(--spacing-xxxs) var(--spacing-xs);
    border-radius: var(--border-radius-s);
    border: var(--border-l);
    white-space: nowrap;
    transition: all var(--motion-m);
  }

  .delta-item.is-positive {
    border-color: rgb(var(--color-cyan-rgb) / 30%);
    color: var(--color-cyan);
  }

  .delta-item.is-negative {
    border-color: rgb(var(--color-frozen-rgb) / 30%);
    color: var(--color-frozen);
  }

  .delta-text {
    opacity: 0.9;
  }

  /* Dynamics Grid */
  .dynamics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-l);
  }

  .dynamics-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-s);
  }

  .metric-label {
    font-size: var(--font-size-xxs);
    color: var(--font-color-s);
    text-transform: lowercase;
    min-width: 5rem;
  }

  .metric-visual {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .metric-track {
    flex: 1;
    height: var(--spacing-xxs);
    background: var(--glass-s);
    border-radius: var(--border-radius-full);
    position: relative;
    overflow: hidden;
  }

  .metric-track::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: var(--spacing-px);
    background: rgb(var(--color-white-rgb) / 20%);
    z-index: var(--z-index-m);
  }

  .metric-fill {
    position: absolute;
    left: var(--metric-offset, 0%);
    width: var(--metric-span, 0%);
    background: var(--metric-color, var(--color-cyan));
    height: 100%;
    border-radius: var(--border-radius-full);
    transition: all var(--motion-l);
  }

  .metric-value {
    font-size: var(--font-size-xxxs);
    color: var(--color-white);
    min-width: 1.5rem;
    text-align: right;
    font-family: var(--font-family-mono);
  }

  /* Vector Fabric */
  .vector-fabric {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-l);
    border-top: var(--border-l);
    padding-top: var(--spacing-m);
  }

  .vector-column {
    display: flex;
    flex-direction: column;
  }

  .vector-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .vector-item {
    display: flex;
    gap: var(--spacing-s);
    font-size: var(--font-size-xxs);
    line-height: var(--line-height-s);
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: var(--border-radius-s);
    background: rgb(var(--color-black-rgb) / 15%);
    border-left: var(--spacing-xxxs) solid transparent;
  }

  .vector-item.future {
    border-left-color: var(--color-cyan);
  }

  .vector-item.past {
    border-left-color: var(--color-frozen);
  }

  .vector-score {
    font-family: var(--font-family-mono);
    color: var(--color-cyan);
    font-weight: var(--font-weight-xl);
    opacity: 0.8;
  }

  .vector-text {
    color: var(--font-color-m);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .empty-hint {
    font-size: var(--font-size-xxxs);
    color: var(--font-color-s);
    opacity: 0.3;
    font-family: var(--font-family-mono);
  }

  /* Signals */
  .signals-tray {
    border-top: var(--border-l);
    padding-top: var(--spacing-m);
  }

  .pill-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .signal-pill {
    padding: var(--spacing-xxxs) var(--spacing-xs);
    background: var(--glass-s);
    border: var(--border-m);
    border-color: rgb(var(--color-cyan-rgb) / 20%);
    color: var(--color-cyan);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-xxxxs);
    font-family: var(--font-family-mono);
    text-transform: uppercase;
  }
</style>
