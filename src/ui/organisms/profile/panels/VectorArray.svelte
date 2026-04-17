<script>
  import TextField from "@ui/atoms/TextField.svelte";
  import { danger } from "@ui/utils/actions/danger.js";
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
    is_peeking = false,
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

  let danger_index = $state(-1);

  function remove_item(index) {
    if (danger_index !== -1) return;

    danger_index = index;
    setTimeout(() => {
      const current = [...items];
      current.splice(index, 1);
      set_value(char, path, current);
      danger_index = -1;
    }, 800);
  }

  export function add_item() {
    const current = [...items];
    current.unshift("");
    set_value(char, path, current);
  }
</script>

<div class="vector-panel" style="--accent-color: {signature_color}">
  <div class="vector-list">
    <div
      class="aperture-line"
      class:visible={is_peeking && is_editing}
      title="Click Header to Append"
    ></div>

    {#each items as item, i (i)}
      <div
        class="vector-item"
        class:editing={is_editing}
        class:dissolving={danger_index === i}
        transition:slide={{ duration: 800, easing: quintOut }}
      >
        <div class="textfield">
          <TextField
            is_edit={is_editing}
            value={get_item_text(item)}
            oninput={(e) => update_item(i, e.target.value)}
            placeholder="Enter {unit_label.toLowerCase()} detail..."
          />
        </div>

        {#if is_editing}
          <div
            class="danger-zone"
            use:danger={{ type: "hold", onComplete: () => remove_item(i) }}
            title="Charge to Disintegrate"
          ></div>
        {/if}
      </div>
    {/each}

    {#if items.length === 0 && !is_editing}
      <div class="placeholder-wrap" in:slide>
        <span class="diegetic-placeholder">
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
  }

  .aperture-line {
    position: absolute;
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
    opacity: 0.4;
    transform: scaleX(1);
    width: 95%;
    left: 2.5%;
  }

  .vector-item {
    position: relative;
    width: 100%;
    overflow: visible;
    transition: all var(--motion-standard);
  }

  .textfield {
    display: block;
    width: 100%;
    position: relative;
  }

  .placeholder-wrap {
    padding: var(--spacing-xs) var(--spacing-s);
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }

  .dissolving {
    animation: dissolve-out 0.8s forwards cubic-bezier(0.4, 0, 1, 1);
    pointer-events: none;
  }

  /* Diegetic Placeholder: For empty system slots */
  .diegetic-placeholder {
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
