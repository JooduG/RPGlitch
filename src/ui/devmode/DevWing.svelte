<script>
  /**
   * @file src/ui/devmode/DevWing.svelte
   * ⚙️ DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";
  import Meter from "@atoms/Meter.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import DataBox from "@devmode/DataBox.svelte";

  /**
   * @typedef {Object} Props
   * @property {import('../profile/profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();
  const is_editing = $derived(profileState.is_editing);

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
    const entity = profileState.char;
    if (entity?.dynamics) {
      for (const key of Object.keys(entity.dynamics)) {
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

<section class="root glass-elevated">
  <!-- 📈 DYNAMICS GRID -->
  <div class="body grid">
    {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
      <div class="card" class:is-editable={is_editing}>
        <span class="label" use:tooltip={dynamic.desc}>{dynamic.label}</span>
        <div class="value">
          {#if is_editing}
            <input
              type="number"
              value={profileState.char[dynamic.source][dynamic.key]}
              oninput={(e) => {
                const val = Number(e.currentTarget.value);
                if (!isNaN(val)) {
                  profileState.char[dynamic.source][dynamic.key] = val;
                }
              }}
              min="0"
              max="100"
            />
            <div class="actions">
              <Button
                variant="secondary"
                size="small"
                square
                class="step"
                actions={[[tooltip, "Increase"]]}
                onclick={() =>
                  (profileState.char[dynamic.source][dynamic.key] = Math.min(
                    100,
                    profileState.char[dynamic.source][dynamic.key] + 1,
                  ))}
                aria-label="Increase"
              >
                <svg viewBox="0 0 24 24" class="icon-small"
                  ><path d="M7 14l5-5 5 5H7z" fill="currentColor" /></svg
                >
              </Button>
              <Button
                variant="secondary"
                size="small"
                square
                class="step"
                actions={[[tooltip, "Decrease"]]}
                onclick={() =>
                  (profileState.char[dynamic.source][dynamic.key] = Math.max(
                    0,
                    profileState.char[dynamic.source][dynamic.key] - 1,
                  ))}
                aria-label="Decrease"
              >
                <svg viewBox="0 0 24 24" class="icon-small"
                  ><path d="M7 10l5 5 5-5H7z" fill="currentColor" /></svg
                >
              </Button>
            </div>
          {:else}
            <span class="display">
              {profileState.char[dynamic.source][dynamic.key]}%
            </span>
          {/if}
        </div>
        {#key is_editing}
          <Meter
            class="meter"
            value={profileState.char[dynamic.source][dynamic.key]}
            min={0}
            max={100}
          />
        {/key}
      </div>
    {/each}
  </div>

  <!-- 📂 RAW EXPLORER -->
  <div class="body">
    <details class="explorer">
      <summary>View JSON Data</summary>
      <DataBox maxHeight="calc(var(--spacing-unit) * 60)">
        <pre class="font-mono">{JSON.stringify(profileState.char, null, 2)}</pre>
      </DataBox>
    </details>
  </div>

  <!-- 🏷️ META FOOTER -->
  <footer class="footer">
    <div class="meta">
      <span class="tag">Born:</span>
      <span class="val">{format_timestamp(profileState.char.created_at)}</span>
    </div>
    <div class="meta">
      <span class="tag">Sync:</span>
      <span class="val">{format_timestamp(profileState.char.updated_at)}</span>
    </div>
  </footer>
</section>

<style>
  /* --- ROOT SHELL --- */

  .root {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    padding: var(--padding-standard);
    border-radius: var(--radius-standard);
    --dev-accent: var(--electric-cyan);
  }

  /* --- BODY BLOCKS --- */

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    width: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--gap-standard);
  }

  /* --- DYNAMIC CARDS --- */

  .card {
    padding: var(--padding-standard);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(var(--spacing-unit) * 16);
    background: var(--glass-sunken);
    border-radius: var(--radius-sharp);
    transition: all var(--duration-standard) var(--ease-elastic);
    position: relative;
    overflow: hidden;
    border: var(--border-width-base) solid transparent;
    user-select: none;
  }

  .card.is-editable {
    cursor: pointer;
  }

  .card.is-editable:hover,
  .card.is-editable:focus-within {
    background: var(--glass-base);
    border-color: var(--dev-accent);
    box-shadow: var(--shadow-standard);
    z-index: var(--z-index-elevated);
  }

  .card::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--spacing-pixel);
    background: var(--dev-accent);
    opacity: var(--opacity-ghost);
  }

  :global(.card .meter) {
    position: absolute;
    bottom: 0;
    left: 0;
    height: var(--spacing-pixel) !important;
    width: 100% !important;
    z-index: var(--z-index-surface);
  }

  :global(.card .meter .indicator) {
    background: var(--dev-accent) !important;
    box-shadow: 0 0 calc(var(--spacing-unit) * 2) var(--dev-accent) !important;
  }

  .label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    color: var(--dev-accent);
    margin-bottom: var(--margin-tight);
    cursor: help;
    transition: filter var(--duration-fast) var(--ease-standard);
    z-index: var(--z-index-surface);
  }

  .card.is-editable:hover .label {
    filter: brightness(1.2);
  }

  /* --- VALUE CONTROLS --- */

  .value {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    z-index: var(--z-index-surface);
  }

  .value input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--frisk);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    text-align: center;
    padding: var(--padding-tight) 0;
    outline: none;
    appearance: textfield;
  }

  .value input::-webkit-outer-spin-button,
  .value input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .display {
    color: var(--frisk);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    padding: var(--padding-tight) 0;
  }

  .actions {
    position: absolute;
    right: calc(-1 * var(--padding-standard));
    display: flex;
    flex-direction: column;
    gap: var(--spacing-pixel);
    opacity: 0;
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-elastic);
    transform: translateX(var(--margin-tight));
    z-index: var(--z-index-elevated);
    pointer-events: none;
  }

  .card.is-editable:hover .actions,
  .card.is-editable:focus-within .actions {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  /* --- EXPLORER --- */

  .explorer summary {
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    color: var(--dev-accent);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: var(--font-spacing-loose);
    transition: filter var(--duration-fast) var(--ease-standard);
  }

  .explorer summary:hover {
    filter: brightness(1.2);
  }

  /* --- FOOTER --- */

  .footer {
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    padding-top: var(--padding-tight);
    border-top: var(--border-width-base) solid var(--border-whisper);
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: var(--gap-standard);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    font-family: var(--font-family-mono);
  }

  .meta .tag {
    opacity: var(--opacity-muted);
    color: var(--dev-accent);
  }

  .meta .val {
    color: var(--frisk);
  }
</style>
