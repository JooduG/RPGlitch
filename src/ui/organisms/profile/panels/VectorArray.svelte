<script>
  import TextField from "@ui/atoms/TextField.svelte";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  let {
    char,
    path,
    is_editing,
    set_value,
    get_value,
    signature_color,
    unit_label = "Vector",
    is_peeking = false, // Controlled by parent header hover
  } = $props();

  let raw_items = $derived(get_value(char, path) || []);
  let items = $derived.by(() => {
    const val = raw_items;
    if (!Array.isArray(val)) {
      return typeof val === "string" && val.trim() ? [val.trim()] : [];
    }
    // Self-Healing
    if (val.length > 5 && val.every((v) => typeof v === "string" && v.length === 1)) {
      return [val.join("")];
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

  function remove_item(index) {
    const current = [...items];
    current.splice(index, 1);
    set_value(char, path, current);
  }

  /**
   * Public-facing add method
   */
  export function add_item() {
    const current = [...items];
    current.unshift("");
    set_value(char, path, current);
  }
</script>

<div class="vector-panel" style="--accent-color: {signature_color}">
  <div class="vector-list">
    <!-- The Horizon Line (Aperture) -->
    <div 
      class="aperture-line" 
      class:visible={is_peeking && is_editing}
      title="Click Header to Append"
    ></div>

    {#each items as item, i (i)}
      <div 
        class="vector-card" 
        class:editing={is_editing}
        transition:slide={{ duration: 800, easing: quintOut }}
      >
        <div class="textfield">
          <TextField
            is_edit={is_editing}
            value={get_item_text(item)}
            oninput={(e) => update_item(i, e.target.value)}
            placeholder="Enter {unit_label.toLowerCase()} detail..."
          />
          {#if is_editing}
            <div class="actions">
              <button
                class="remove-button"
                onclick={() => remove_item(i)}
                title="Remove {unit_label}"
              >
                ×
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/each}
    
    {#if items.length === 0 && !is_editing}
      <div class="empty-state">
        No {unit_label.toLowerCase()} recorded for this timeline.
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
    gap: var(--spacing-s);
    position: relative;
  }

  /* The 1px Horizon Line (Physically Zero-Height) */
  .aperture-line {
    position: absolute;

    /* Float in the mid-point of the parent layout gap */
    top: calc(var(--spacing-m) / -2); 
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--accent-color);
    opacity: 0;
    transform: scaleX(0);
    transform-origin: center;
    transition: 
      transform 0.8s cubic-bezier(0.2, 1, 0.2, 1),
      opacity 0.8s cubic-bezier(0.2, 1, 0.2, 1);
    box-shadow: 0 0 8px var(--accent-color);
    z-index: var(--z-index-m);
    pointer-events: none;
  }

  .aperture-line.visible {
    opacity: 0.6;
    transform: scaleX(1);
  }

  .vector-card {
    position: relative;
    width: 100%;
    overflow: visible;
  }

  .textfield {
    display: block;
    width: 100%;
    position: relative;
  }

  .actions {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    z-index: var(--z-index-l);
    opacity: 0;
    pointer-events: none;
    transition: all var(--motion-fast);
  }

  .vector-card:hover .actions {
    opacity: 1;
    pointer-events: auto;
    right: var(--spacing-xs);
  }

  .remove-button {
    background: var(--glass-l);
    backdrop-filter: var(--glass-blur-s);
    border: var(--glass-edge-s);
    border-radius: var(--border-radius-s);
    color: var(--font-color-s);
    font-size: var(--font-size-l);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--motion-fast);
    box-shadow: var(--shadow-s);
  }

  .remove-button:hover {
    color: var(--color-red);
    background: var(--glass-xl);
    transform: scale(1.1);
    box-shadow: 0 0 10px rgb(var(--color-red-rgb) / 40%);
  }

  .empty-state {
    padding: var(--spacing-m);
    text-align: center;
    color: var(--font-color-s);
    font-size: var(--font-size-xs);
    font-style: italic;
    opacity: var(--opacity-m);
  }
</style>
