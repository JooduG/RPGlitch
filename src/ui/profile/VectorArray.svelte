<script>
  /**
   * @file src/ui/profile/VectorArray.svelte
   * THE VECTOR ARRAY INSTRUMENT
   * A high-fidelity list orchestrator for entity characteristics.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { generateUUID } from "@core/utils.js";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";

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
   * @property {any} char - The entity object being edited
   * @property {string} path - The dot-path to the array in char
   * @property {boolean} is_editing - Global editing state
   * @property {Function} set_value - Utility to update char state
   * @property {Function} get_value - Utility to read char state
   * @property {string} signature_color - The theme accent color
   * @property {string} [unit_label] - Display label for individual items
   */

  /** @type {Props} */
  let {
    char,
    path,
    is_editing,
    set_value,
    get_value,
    signature_color,
    unit_label = "Vector",
  } = $props();

  // --- FACTORY ---

  /** @returns {VectorItem} */
  function make_item() {
    return {
      id: generateUUID(),
      timestamp: Date.now(),
      text: "",
      type: path,
      base_weight: 5,
      vector_tags: [],
    };
  }

  // --- DERIVED STATE ---

  /** Normalized array of vector objects. */
  const items = $derived.by(() => {
    const raw = get_value(char, path) || [];
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" && raw.trim() ? [raw] : [];

    return arr.map((val) => {
      if (typeof val === "object" && val !== null) {
        return {
          ...val,
          base_weight: val.base_weight ?? 5,
          vector_tags: val.vector_tags ?? [],
        };
      }
      return { ...make_item(), text: String(val || "") };
    });
  });

  // --- HANDLERS ---

  /**
   * Patches a specific item and triggers state sync.
   * @param {number} index
   * @param {Partial<VectorItem>} patch
   */
  function patch_item(index, patch) {
    const current = [...items];
    current[index] = { ...current[index], ...patch };
    set_value(char, path, current);
  }

  /** @param {number} i @param {number} delta */
  function update_weight(i, delta) {
    const weight = items[i]?.base_weight ?? 5;
    patch_item(i, { base_weight: Math.min(10, Math.max(1, weight + delta)) });
  }

  /** @param {number} i @param {string} raw */
  function update_tags(i, raw) {
    const vector_tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    patch_item(i, { vector_tags });
  }

  /** @param {number} index */
  function remove_item(index) {
    set_value(
      char,
      path,
      items.filter((_, i) => i !== index),
    );
  }

  /** Expose add_item for external orchestration. */
  export function add_item() {
    set_value(char, path, [make_item(), ...items]);
  }
</script>

<div class="wrapper" style="--accent-color: {signature_color}">
  {#each items as item, i (item.id || i)}
    <div
      class="item"
      class:is-editing={is_editing}
      transition:slide={{ duration: 400, easing: quintOut }}
    >
      <TextField
        is_edit={is_editing}
        {signature_color}
        value={item.text}
        oninput={(/** @type {Event & { currentTarget: HTMLTextAreaElement }} */ e) =>
          patch_item(i, { text: e.currentTarget.value })}
        placeholder="Enter {unit_label.toLowerCase()} detail..."
        weight={item.base_weight}
      >
        {#snippet status()}
          <div class="stepper" use:tooltip={{ text: "Influence weight of this vector" }}>
            {#if is_editing}
              <Button
                variant="invisible"
                size="sm"
                square
                className="step down"
                onclick={() => update_weight(i, -1)}
                aria-label="Decrease Weight"
              >
                <span class="step-char">&lt;</span>
              </Button>
            {/if}

            <span class="weight">{item.base_weight}</span>

            {#if is_editing}
              <Button
                variant="invisible"
                size="sm"
                square
                className="step up"
                onclick={() => update_weight(i, 1)}
                aria-label="Increase Weight"
              >
                <span class="step-char">&gt;</span>
              </Button>
            {/if}
          </div>

          <div class="tags">
            {#if is_editing}
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
          {#if is_editing}
            <Button
              variant="invisible"
              size="sm"
              square
              actions={[tooltip]}
              tooltip="Remove {unit_label}"
              aria-label="Remove {unit_label}"
              className="delete"
              onclick={() => remove_item(i)}
            >
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <polyline points="3 6 5 6 21 6" stroke="var(--color-white)"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="var(--color-white)"
                ></path>
              </svg>
            </Button>
          {/if}
        {/snippet}
      </TextField>
    </div>
  {/each}

  {#if items.length === 0 && !is_editing}
    <div class="empty-state" in:slide>
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

  .wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    position: relative;
  }

  .item {
    position: relative;
    width: 100%;
    transition: all var(--duration-fast);
    display: flex;
    align-items: flex-start;
  }

  .item:hover {
    z-index: var(--surface-z-index);
  }

  /* --- STEPPER --- */

  .stepper {
    display: grid;
    grid-template-columns: var(--spacing-6) var(--spacing-8) var(--spacing-6);
    place-items: center;
    min-width: var(--spacing-16);
    height: 100%;
    margin-right: var(--spacing-3);
    user-select: none;
    align-self: center;
  }

  .weight {
    grid-column: 2;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-heavy);
    color: var(--color-white);
    min-width: var(--spacing-3);
    text-align: center;
    pointer-events: none;
    z-index: var(--surface-z-index);
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
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    color: var(--color-text-pri);
    font-size: var(--font-size-small);
    cursor: pointer;
    opacity: 0;
    transition: all var(--duration-fast);
    z-index: var(--surface-peak-z-index);
    padding: 0;
  }

  :global(.textfield.is-expanded .header) :global(.step) {
    opacity: 0.9;
  }

  .stepper :global(.step:hover) {
    opacity: 1;
    color: var(--color-white);
    background: transparent;
    filter: none;
  }

  :global(.step.down) {
    grid-column: 1;
  }

  :global(.step.up) {
    grid-column: 3;
  }

  :global(.step:active) {
    transform: scale(0.85);
  }

  /* --- TAGS --- */

  .tags {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    overflow: hidden;
    height: 100%;
  }

  .tags-input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--color-white);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-l);
    padding: 0;
    outline: none;
    opacity: 0.8;
    transition: opacity var(--duration-fast);
  }

  .tags-input:focus {
    opacity: 1;
  }

  .tags-input::placeholder {
    color: var(--color-white);
    opacity: 0.3;
  }

  .tag {
    font-size: var(--font-size-tiny);
    background: rgb(from var(--color-white) r g b / 10%);
    padding: var(--spacing-px) var(--spacing-2);
    border: var(--spacing-px) solid rgb(from var(--color-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-sharp);
    color: var(--color-white);
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-l);
    white-space: nowrap;
    text-shadow: var(--shadow-font);
    display: flex;
    align-items: center;
    height: calc(100% - var(--spacing-1));
  }

  /* --- ACTIONS --- */

  :global(.delete) {
    color: var(--color-white);
    transition: all var(--duration-fast);
    background: transparent;
    filter: drop-shadow(0 1px 2px rgb(from var(--color-black) r g b / 80%));
  }

  :global(.delete:hover) {
    color: var(--color-red);
    background: transparent;
    transform: scale(1.1);
  }

  /* --- EMPTY STATE --- */

  .empty-state {
    padding: var(--spacing-2) var(--spacing-3);
    min-height: calc(var(--spacing-4) * 2.5);
    display: flex;
    align-items: center;
  }

  .empty-msg {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-nano);
    color: var(--color-frisk);
    opacity: var(--opacity-whisper);
    letter-spacing: var(--font-spacing-l);
    text-transform: uppercase;
    pointer-events: none;
    user-select: none;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }
</style>
