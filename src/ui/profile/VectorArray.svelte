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
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { generateUUID } from "@core/utils.js";

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

  // --- DERIVED STATE ---

  /** @type {VectorItem[] | string} */
  const raw_items = $derived(get_value(char, path) || []);

  /** @type {VectorItem[]} */
  const items = $derived.by(() => {
    const val = raw_items;
    if (!Array.isArray(val)) {
      return typeof val === "string" && val.trim()
        ? [
            {
              id: generateUUID(),
              timestamp: Date.now(),
              text: val.trim(),
              type: path,
              base_weight: 5,
              vector_tags: [],
            },
          ]
        : [];
    }
    return val;
  });

  // --- LOGIC HANDLERS ---

  /**
   * Patches a specific item in the array and triggers a state sync.
   * @param {number} index
   * @param {Partial<VectorItem>} patch
   */
  function patch_item(index, patch) {
    const current = [...items];
    const item = current[index];
    const base =
      typeof item === "object" && item !== null
        ? item
        : {
            id: generateUUID(),
            timestamp: Date.now(),
            text: String(item || ""),
            type: path,
            base_weight: 5,
            vector_tags: [],
          };
    current[index] = { ...base, ...patch };
    set_value(char, path, current);
  }

  /** @param {number} i, @param {string} text */
  const update_text = (i, text) => patch_item(i, { text });

  /** @param {number} i, @param {number} delta */
  const update_weight = (i, delta) => {
    const item = items[i];
    const weight = typeof item === "object" ? (item.base_weight ?? 5) : 5;
    patch_item(i, { base_weight: Math.min(10, Math.max(1, weight + delta)) });
  };

  /** @param {number} i, @param {string} raw */
  const update_tags = (i, raw) => {
    const vector_tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    patch_item(i, { vector_tags });
  };

  /** @param {number} index */
  const remove_item = (index) => {
    const current = [...items];
    current.splice(index, 1);
    set_value(char, path, current);
  };

  /** Expose add_item for external orchestration (e.g. from parent fragment labels) */
  export function add_item() {
    const current = [...items];
    current.unshift({
      id: generateUUID(),
      timestamp: Date.now(),
      text: "",
      type: path,
      base_weight: 5,
      vector_tags: [],
    });
    set_value(char, path, current);
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
        value={typeof item === "string" ? item : item?.text || ""}
        oninput={(/** @type {any} */ e) => update_text(i, e.currentTarget.value)}
        placeholder="Enter {unit_label.toLowerCase()} detail..."
        weight={typeof item === "object" ? (item.base_weight ?? 5) : 5}
      >
        {#snippet status()}
          <div class="status">
            <div class="stepper">
              <span class="label" use:tooltip={{ text: "Influence weight of this vector" }}
                >WEIGHT</span
              >
              <div class="control">
                {#if is_editing}
                  <div class="buttons">
                    <Button
                      variant="invisible"
                      size="sm"
                      square
                      actions={[tooltip]}
                      tooltip="Increase Weight"
                      onclick={() => update_weight(i, 1)}
                      aria-label="Increase Weight"
                      className="up"
                    >
                      <svg viewBox="0 0 24 24" class="icon"
                        ><path d="M7 14l5-5 5 5H7z" fill="currentColor" /></svg
                      >
                    </Button>
                    <Button
                      variant="invisible"
                      size="sm"
                      square
                      actions={[tooltip]}
                      tooltip="Decrease Weight"
                      onclick={() => update_weight(i, -1)}
                      aria-label="Decrease Weight"
                      className="down"
                    >
                      <svg viewBox="0 0 24 24" class="icon"
                        ><path d="M7 10l5 5 5-5H7z" fill="currentColor" /></svg
                      >
                    </Button>
                  </div>
                {/if}
                <span class="value">{typeof item === "object" ? (item.base_weight ?? 5) : 5}</span>
              </div>
            </div>

            <div class="meta">
              {#if is_editing}
                <input
                  type="text"
                  class="tags-input"
                  value={(item?.vector_tags || []).join(", ")}
                  placeholder="TAGS (COMMA SEPARATED)..."
                  onchange={(/** @type {any} */ e) => update_tags(i, e.currentTarget.value)}
                />
              {:else}
                {#each item?.vector_tags || [] as tag (tag)}
                  <span class="tag">{tag}</span>
                {/each}
              {/if}
            </div>
          </div>
        {/snippet}

        {#snippet actions()}
          {#if is_editing}
            <Button
              variant="invisible"
              size="sm"
              square
              actions={[tooltip]}
              tooltip="Remove {unit_label}"
              aria-label="Remove {unit_label}"
              className="delete-btn"
              onclick={() => remove_item(i)}
            >
              <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
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
    <div class="placeholder" in:slide>
      <span class="label">
        <svg viewBox="0 0 24 24" class="icon-xs" style="width: 14px; height: 14px;">
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
  .wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    position: relative;
    overflow: visible;
  }

  .item {
    position: relative;
    width: 100%;
    overflow: visible;
    transition: all var(--motion-m);
    display: flex;
    align-items: flex-start;
  }

  .item:hover {
    z-index: calc(var(--z-index-xxl) + 1);
  }

  .status {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    justify-content: space-between;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    height: 100%;
    padding-left: var(--spacing-xs);
  }

  .stepper .label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxxs);
    color: var(--color-white);
    opacity: 0.4;
    letter-spacing: var(--letter-spacing-l);
    cursor: help;
  }

  .stepper .control {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
  }

  .stepper .value {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
  }

  .stepper .buttons {
    position: absolute;
    right: -1.2rem;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: opacity var(--motion-m);
    pointer-events: none;
  }

  .stepper .control:hover .buttons {
    opacity: 1;
    pointer-events: auto;
  }

  .stepper :global(.button) {
    height: 0.8rem;
    width: 1rem;
    padding: 0;
    min-height: 0;
    color: var(--color-white);
    opacity: 0.5;
    background: transparent;
    border: none;
    transition: all var(--motion-l);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stepper :global(.button:hover) {
    opacity: 1;
    color: var(--color-white);
    transform: scale(1.1);
  }

  .stepper .icon {
    width: 1.2rem;
    height: 1.2rem;
  }

  .meta {
    flex: 1;
    display: flex;
    gap: var(--spacing-xxs);
    overflow: hidden;
    align-items: center;
    height: 100%;
  }

  .tags-input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--color-white);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 2px 0;
    outline: none;
    opacity: 0.8;
    transition: opacity var(--motion-m);
  }

  .tags-input:focus {
    opacity: 1;
  }

  .tags-input::placeholder {
    color: var(--color-white);
    opacity: 0.3;
  }

  .tag {
    font-size: var(--font-size-xxs);
    background: rgb(var(--color-white-rgb) / 10%);
    padding: 2px 8px;
    border: var(--border-m);
    border-color: rgb(var(--color-white-rgb) / var(--opacity-xxs));
    border-radius: var(--border-radius-s);
    color: var(--color-white);
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgb(var(--color-black-rgb) / 80%);
  }

  :global(.delete-btn) {
    color: var(--color-white);
    transition: all var(--motion-m);
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    filter: drop-shadow(0 1px 2px rgb(var(--color-black-rgb) / 80%));
  }

  :global(.delete-btn:hover) {
    color: var(--color-red);
    background: transparent;
    transform: scale(1.1);
  }

  .placeholder {
    padding: var(--spacing-xs) var(--spacing-s);
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }

  .placeholder .label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    color: var(--color-frisk);
    opacity: var(--opacity-s);
    letter-spacing: var(--letter-spacing-l);
    text-transform: uppercase;
    pointer-events: none;
    user-select: none;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
</style>
