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

  function remove_item(index) {
    const current = [...items];
    current.splice(index, 1);
    set_value(char, path, current);
  }

  export function add_item() {
    const current = [...items];
    current.unshift("");
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
        <div class="textfield">
          <TextField
            is_edit={is_editing}
            value={get_item_text(item)}
            oninput={(e) => update_item(i, e.target.value)}
            placeholder="Enter {unit_label.toLowerCase()} detail..."
          />
        </div>

        {#if is_editing}
          <Button
            variant="danger"
            size="sm"
            square={true}
            aria-label="Remove {unit_label}"
            className="delete-btn no-tooltip"
            onclick={() => remove_item(i)}
          >
            <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
            </svg>
          </Button>
        {/if}
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
    align-items: center;
    gap: var(--spacing-xs);
  }

  .textfield {
    flex: 1;
    position: relative;
  }

  :global(.delete-btn) {
    transform: translateX(10px);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--motion-l) var(--motion-elastic),
      transform var(--motion-l) var(--motion-elastic);
    background: transparent;
    margin-left: auto;
  }

  .vector-item:hover :global(.delete-btn),
  .vector-item:focus-within :global(.delete-btn) {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
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
