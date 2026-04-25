<script>
  import TextField from "@ui/atoms/TextField.svelte";
  import Button from "@ui/atoms/Button.svelte";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  let {
    char,
    path,
    is_editing,
    set_value,
    get_value,
    signature_color,
    unit_label = "Vector",
  } = $props();

  let raw_items = $derived(get_value(char, path) || []);
  let items = $derived.by(() => {
    const val = raw_items;
    if (!Array.isArray(val)) {
      return typeof val === "string" && val.trim() ? [val.trim()] : [];
    }
    return val;
  });

  function get_item_text(item) {
    if (typeof item === "string") return item;
    return item?.text || item?.summary || "";
  }

  function update_item(index, new_text) {
    const current = Array.isArray(items) ? [...items] : [];
    if (typeof current[index] === "object") {
      current[index] = { ...current[index], text: new_text };
    } else {
      current[index] = new_text;
    }
    set_value(char, path, current);
  }

  function update_weight(index, delta) {
    const current = Array.isArray(items) ? [...items] : [];
    const item = current[index];
    const weight = typeof item === "object" ? (item.base_weight ?? 5) : 5;
    const new_weight = Math.min(10, Math.max(1, weight + delta));

    if (typeof item === "object") {
      current[index] = { ...item, base_weight: new_weight };
    } else {
      current[index] = { text: item, base_weight: new_weight };
    }
    set_value(char, path, current);
  }

  function remove_item(index) {
    const current = [...items];
    current.splice(index, 1);
    set_value(char, path, current);
  }

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

<div class="vector-panel" style="--accent-color: {signature_color}">
  <div class="vector-list">
    {#each items as item, i (i)}
      <div
        class="vector-item"
        class:editing={is_editing}
        transition:slide={{ duration: 400, easing: quintOut }}
      >
        <TextField
          is_edit={is_editing}
          value={get_item_text(item)}
          oninput={(e) => update_item(i, e.target.value)}
          placeholder="Enter {unit_label.toLowerCase()} detail..."
          weight={typeof item === "object" ? (item.base_weight ?? 5) : 5}
        >
          {#snippet actions()}
            <div class="vector-header-rich">
              <div class="weight-control">
                <div class="weight-stack">
                  {#if is_editing}
                    <button onclick={() => update_weight(i, 1)} aria-label="Increase weight">
                      <svg viewBox="0 0 24 24" class="icon-xxs"><path d="M7 14l5-5 5 5H7z" fill="currentColor"/></svg>
                    </button>
                  {/if}
                  <span class="weight-val">{typeof item === "object" ? (item.base_weight ?? 5) : 5}</span>
                  {#if is_editing}
                    <button onclick={() => update_weight(i, -1)} aria-label="Decrease weight">
                      <svg viewBox="0 0 24 24" class="icon-xxs"><path d="M7 10l5 5 5-5H7z" fill="currentColor"/></svg>
                    </button>
                  {/if}
                </div>
                <span class="weight-label">GRAV</span>
              </div>

              <div class="tag-cloud">
                {#each item?.vector_tags || [] as tag (tag)}
                  <span class="vector-tag">{tag}</span>
                {/each}
              </div>

              {#if is_editing}
                <Button
                  variant="ghost"
                  size="sm"
                  square={true}
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
            </div>
          {/snippet}
        </TextField>
      </div>
    {/each}

    {#if items.length === 0 && !is_editing}
      <div class="placeholder-wrap" in:slide>
        <span class="system-placeholder">
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
  .vector-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .vector-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    position: relative;
    overflow: visible;
  }

  .vector-item {
    position: relative;
    width: 100%;
    overflow: visible;
    transition: all var(--motion-m);
    display: flex;
    align-items: flex-start;
  }

  .vector-header-rich {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    justify-content: space-between;
  }

  .weight-control {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-family: var(--font-family-mono);
    color: var(--color-white);
    text-shadow: 0 1px 3px rgb(0 0 0 / 80%);
  }

  .weight-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 1.2rem;
    line-height: 1;
    margin-bottom: -1px; /* Visual centering adjustment for mono font */
  }

  .weight-val {
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-xl);
    margin: -1px 0;
  }

  .weight-stack button {
    background: transparent;
    border: none;
    color: var(--color-white);
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
    transition: all var(--motion-m);
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 80%));
  }

  .weight-stack button:hover {
    opacity: 1;
    transform: scale(1.3);
  }

  .weight-label {
    font-size: var(--font-size-xxxs);
    letter-spacing: 0.15em;
    opacity: 0.8;
    font-weight: var(--font-weight-xl);
    margin-top: 1px;
  }

  .icon-xxs {
    width: 0.8rem;
    height: 0.8rem;
  }

  .tag-cloud {
    flex: 1;
    display: flex;
    gap: var(--spacing-xxs);
    overflow: hidden;
    align-items: center;
    height: 100%;
  }

  .vector-tag {
    font-size: 0.6rem;
    background: rgb(var(--color-white-rgb) / 10%); /* High-end glass tag */
    padding: 2px 8px;
    border: 1px solid rgb(var(--color-white-rgb) / 5%);
    border-radius: var(--border-radius-s);
    color: var(--color-white);
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgb(0 0 0 / 80%);
  }

  :global(.delete-btn) {
    color: var(--color-white) !important;
    transition: all var(--motion-m) !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 80%));
  }

  :global(.delete-btn:hover) {
    color: var(--color-red) !important;
    background: transparent !important;
    transform: scale(1.1);
  }

  .placeholder-wrap {
    padding: var(--spacing-xs) var(--spacing-s);
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }

  /* System Placeholder: For empty system slots */
  .system-placeholder {
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
