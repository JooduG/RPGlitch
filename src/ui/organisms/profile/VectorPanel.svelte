<script>
  import Button from "@ui/atoms/Button.svelte";
  import TextField from "@ui/atoms/TextField.svelte";
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
    // Self-Healing: If we received a character-split array, merge it
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
  function add_item() {
    const current = [...items];
    current.unshift("");
    set_value(char, path, current);
  }
</script>

<div class="vector-panel" style="--accent-color: {signature_color}">
  <div class="vector-list">
    {#if is_editing}
      <Button variant="dashed" onclick={add_item}>
        + Add {unit_label}
      </Button>
    {/if}
    {#each items as item, i (i)}
      <div class="vector-card" class:editing={is_editing}>
        <div class="textfield">
          <TextField
            is_edit={is_editing}
            value={get_item_text(item)}
            oninput={(e) => update_item(i, e.target.value)}
            placeholder="Enter {unit_label.toLowerCase()} detail..."
          />
          {#if is_editing}
            <div class="actions">
              <Button
                variant="danger"
                square={true}
                size="sm"
                onclick={() => remove_item(i)}
                title="Remove {unit_label}"
              >
                <span class="icon">×</span>
              </Button>
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
  }

  .vector-card {
    position: relative;
    width: 100%;
    transition: transform var(--motion-fast) var(--motion-elastic);
    overflow: hidden;
  }

  .vector-card.editing:hover {
    transform: none;
  }

  .textfield {
    display: flex;
    gap: var(--spacing-s);
    align-items: stretch;
  }

  .actions {
    display: flex;
    align-items: center;
  }

  .icon {
    font-size: var(--font-size-xxl);
    line-height: 1;
    font-weight: var(--font-weight-xl);
    margin-bottom: 2px;
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
