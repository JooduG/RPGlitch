<script>
  import Button from "@atoms/Button.svelte";
  import TextField from "@atoms/TextField.svelte";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";
  import Tooltip from "@atoms/Tooltip.svelte";

  /**
   * @typedef {Object} Props
   * @property {any} char
   * @property {string} path
   * @property {boolean} is_editing
   * @property {Function} set_value
   * @property {Function} get_value
   * @property {string} signature_color
   * @property {string} [unit_label]
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

  // --- Reactive State ---

  let raw_items = $derived(get_value(char, path) || []);
  let items = $derived.by(() => {
    const val = raw_items;
    if (!Array.isArray(val)) {
      return typeof val === "string" && val.trim() ? [val.trim()] : [];
    }
    return val;
  });

  // --- Logic Helpers ---

  /** @param {any} item */
  const get_text = (item) => (typeof item === "string" ? item : item?.text || item?.summary || "");

  /** @param {any} item */
  const get_weight = (item) => (typeof item === "object" ? (item.base_weight ?? 5) : 5);

  /**
   * Universal patcher for array items
   * @param {number} index
   * @param {Object} patch
   */
  function patch_item(index, patch) {
    const current = [...items];
    const base = typeof current[index] === "object" ? current[index] : { text: current[index] };
    current[index] = { ...base, ...patch };
    set_value(char, path, current);
  }

  /**
   * @param {number} i
   * @param {string} text
   */
  const update_text = (i, text) => patch_item(i, { text });

  /**
   * @param {number} i
   * @param {number} delta
   */
  const update_weight = (i, delta) => {
    const weight = get_weight(items[i]);
    patch_item(i, { base_weight: Math.min(10, Math.max(1, weight + delta)) });
  };

  /**
   * @param {number} i
   * @param {string} raw
   */
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

  export function add_item() {
    const current = [...items];
    current.unshift({
      id: crypto.randomUUID(),
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
  <div class="list">
    {#each items as item, i (i)}
      <div
        class="item"
        class:editing={is_editing}
        transition:slide={{ duration: 400, easing: quintOut }}
      >
        <TextField
          is_edit={is_editing}
          value={get_text(item)}
          oninput={(/** @type {any} */ e) => update_text(i, e.currentTarget.value)}
          placeholder="Enter {unit_label.toLowerCase()} detail..."
          weight={get_weight(item)}
        >
          {#snippet status()}
            <div class="status">
              <div class="weight-stepper">
                <Tooltip text="Influence weight of this vector">
                  <span class="weight-label">WEIGHT</span>
                </Tooltip>
                <div class="weight-control-wrapper">
                  {#if is_editing}
                    <div class="step-controls">
                      <Tooltip text="Increase Weight">
                        <Button
                          variant="invisible"
                          size="sm"
                          square
                          onclick={() => update_weight(i, 1)}
                          aria-label="Increase Weight"
                          className="step-up"
                        >
                          <svg viewBox="0 0 24 24" class="icon-stepper">
                            <path d="M7 14l5-5 5 5H7z" fill="currentColor" />
                          </svg>
                        </Button>
                      </Tooltip>
                      <Tooltip text="Decrease Weight">
                        <Button
                          variant="invisible"
                          size="sm"
                          square
                          onclick={() => update_weight(i, -1)}
                          aria-label="Decrease Weight"
                          className="step-down"
                        >
                          <svg viewBox="0 0 24 24" class="icon-stepper">
                            <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                          </svg>
                        </Button>
                      </Tooltip>
                    </div>
                  {/if}
                  <span class="weight-val">{get_weight(item)}</span>
                </div>
              </div>

              <div class="tags">
                {#if is_editing}
                  <input
                    type="text"
                    class="input"
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
              <Tooltip text="Remove {unit_label}">
                <Button
                  variant="invisible"
                  size="sm"
                  square
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
              </Tooltip>
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
</div>

<style>
  .wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .list {
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

  .weight-stepper {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    height: 100%;
    padding-left: var(--spacing-xs);
  }

  .weight-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxxs);
    color: var(--color-white);
    opacity: 0.4;
    letter-spacing: var(--letter-spacing-l);
    cursor: help;
  }

  .weight-control-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
  }

  .weight-val {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
  }

  .step-controls {
    position: absolute;
    right: -1.2rem;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: opacity var(--motion-m);
    pointer-events: none;
  }

  .weight-control-wrapper:hover .step-controls {
    opacity: 1;
    pointer-events: auto;
  }

  .weight-stepper :global(.button) {
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

  .weight-stepper :global(.button:hover) {
    opacity: 1;
    color: var(--color-white);
    transform: scale(1.1);
  }

  .icon-stepper {
    width: 1.2rem;
    height: 1.2rem;
  }

  .tags {
    flex: 1;
    display: flex;
    gap: var(--spacing-xxs);
    overflow: hidden;
    align-items: center;
    height: 100%;
  }

  .tags .input {
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

  .tags .input:focus {
    opacity: 1;
  }

  .tags .input::placeholder {
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
