<script>
  /**
   * @file src/ui/profile/ProfileArray.svelte
   * THE VECTOR ARRAY INSTRUMENT
   * A high-fidelity list orchestrator for entity characteristics.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Button, TextField, tooltip } from "@atoms";

  /**
   * @typedef {Object} VectorItem
   * @property {string} id
   * @property {number} timestamp
   * @property {string} text
   * @property {string} type
   * @property {number} base_weight
   * @property {string[]} vector_tags
   */

  /**
   * @typedef {Object} Props
   * @property {import('./profile.svelte.js').ProfileState} state - The profile state controller
   * @property {string} path - The dot-path to the array in state.char
   * @property {string} signature_color - The theme accent color
   * @property {string} [unit_label] - Display label for individual items
   */

  /** @type {Props} */
  let { state, path, signature_color, unit_label = "Vector" } = $props();

  // --- DERIVED STATE ---

  /** Normalized array of vector objects. */
  const items = $derived.by(() => {
    const raw = state.get_safe_value(path) || [];
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" && raw.trim() ? [raw] : [];

    return arr.map((val) => {
      if (typeof val === "object" && val !== null) {
        return {
          ...val,
          base_weight: val.base_weight ?? 5,
          vector_tags: val.vector_tags ?? [],
        };
      }
      // This case should be rare now as state.add_vector_item handles initialization
      return { text: String(val || ""), base_weight: 5, vector_tags: [] };
    });
  });

  // --- HANDLERS ---

  /** @param {number} i @param {string} raw */
  function update_tags(i, raw) {
    const vector_tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    state.patch_vector_item(path, i, { vector_tags });
  }
</script>

<div class="root" style="--accent-color: {signature_color}">
  {#each items as item, i (item.id || i)}
    <div class="vector-item-wrapper">
      <TextField
        is_edit={state.is_editing}
        {signature_color}
        value={item.text}
        oninput={(/** @type {Event & { currentTarget: HTMLTextAreaElement }} */ e) =>
          state.patch_vector_item(path, i, { text: e.currentTarget.value })}
        placeholder="Enter {unit_label.toLowerCase()} detail..."
        weight={item.base_weight}
      >
        {#snippet status()}
          <div class="stepper" use:tooltip={{ text: "Influence weight of this vector" }}>
            {#if state.is_editing}
              <Button
                variant="invisible"
                size="small"
                square
                class="
                  step
                  down
                "
                onclick={() => state.update_vector_weight(path, i, -1)}
                aria-label="Decrease Weight"
              >
                <span class="step-char">&lt;</span>
              </Button>
            {/if}

            <span class="weight">{item.base_weight}</span>

            {#if state.is_editing}
              <Button
                variant="invisible"
                size="small"
                square
                class="
                  step
                  up
                "
                onclick={() => state.update_vector_weight(path, i, 1)}
                aria-label="Increase Weight"
              >
                <span class="step-char">&gt;</span>
              </Button>
            {/if}
          </div>

          <div class="tags">
            {#if state.is_editing}
              <input
                type="text"
                class="tags-input"
                value={item.vector_tags.join(", ")}
                placeholder="TAGS (COMMA SEPARATED)..."
                onchange={(e) => update_tags(i, e.currentTarget.value)}
              />
            {:else}
              {#each item.vector_tags as tag (tag)}
                <span class="tag">{tag}</span>
              {/each}
            {/if}
          </div>
        {/snippet}

        {#snippet header_actions()}
          {#if state.is_editing}
            <Button
              variant="invisible"
              size="small"
              square
              actions={[tooltip]}
              tooltip="Remove {unit_label}"
              aria-label="Remove {unit_label}"
              class="delete"
              onclick={() => state.remove_vector_item(path, i)}
            >
              <svg
                viewBox="0 0 24 24"
                class="
                  icon-small
                  icon-outline
                "
                fill="none"
              >
                <polyline points="3 6 5 6 21 6" stroke="var(--pure-white)"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="var(--pure-white)"
                ></path>
              </svg>
            </Button>
          {/if}
        {/snippet}
      </TextField>
    </div>
  {/each}

  {#if items.length === 0 && !state.is_editing}
    <div class="empty-state">
      <span class="empty-msg">
        <svg
          viewBox="0 0 24 24"
          class="icon-small"
          style="width: var(--font-size-small); height: var(--font-size-small);"
        >
          <path
            fill="currentColor"
            d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
        AWAITING {unit_label.toUpperCase()} DATA STREAM...
      </span>
    </div>
  {/if}
</div>

<style>
  /* --- LAYOUT --- */

  .vector-item-wrapper,
  .empty-state {
    animation: slide-down-item 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }

  @keyframes slide-down-item {
    from {
      opacity: 0;
      transform: translateY(calc(var(--spacing-unit) * -2.5));
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .root {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    position: relative;
  }

  /* --- STEPPER --- */

  .stepper {
    display: grid;
    grid-template-columns: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 8) calc(
        var(--spacing-unit) * 6
      );
    place-items: center;
    min-width: calc(var(--spacing-unit) * 16);
    height: 100%;
    margin-right: var(--margin-standard);
    user-select: none;
    align-self: center;
  }

  .weight {
    grid-column: 2;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    color: var(--pure-white);
    min-width: calc(var(--spacing-unit) * 3);
    text-align: center;
    pointer-events: none;
    z-index: var(--z-index-surface);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .step-char {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.step) {
    opacity: 0;
  }

  :global(.textfield.is-expanded .header) :global(.step) {
    opacity: 0.9;
  }

  .stepper :global(.step:hover) {
    opacity: 1;
    color: var(--pure-white);
  }

  :global(.step.down) {
    grid-column: 1;
  }

  :global(.step.up) {
    grid-column: 3;
  }

  /* --- TAGS --- */

  .tags {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--gap-tight);
    overflow: hidden;
    height: 100%;
  }

  .tags-input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--pure-white);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    padding: 0;
    outline: none;
    opacity: 0.8;
    transition: opacity var(--duration-fast);
  }

  .tags-input:focus {
    opacity: 1;
  }

  .tags-input::placeholder {
    color: var(--pure-white);
    opacity: 0.3;
  }

  .tag {
    font-size: var(--font-size-tiny);
    background: rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    padding: var(--gap-tight) var(--padding-tight);
    border: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-sharp);
    color: var(--pure-white);
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    white-space: nowrap;
    text-shadow: var(--shadow-font);
    display: flex;
    align-items: center;
    height: calc(100% - var(--spacing-unit));
  }

  /* --- EMPTY STATE --- */

  .empty-state {
    padding: var(--padding-tight) var(--padding-standard);
    min-height: calc(var(--spacing-unit) * 12);
    display: flex;
    align-items: center;
  }

  .empty-msg {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    color: var(--frisk);
    opacity: var(--opacity-whisper);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    pointer-events: none;
    user-select: none;
    display: flex;
    align-items: center;
    gap: var(--gap-standard);
  }
</style>
