<script>
    import Button from "@ui/atoms/Button.svelte"
    import VectorCard from "./VectorCard.svelte"

    let { char, path, is_editing, set_value, get_value, signature_color, unit_label = "Vector" } = $props()

    let raw_items = $derived(get_value(char, path) || [])
    let items = $derived.by(() => {
        const val = raw_items
        if (!Array.isArray(val)) {
            return typeof val === "string" && val.trim() ? [val.trim()] : []
        }
        // Self-Healing: If we received a character-split array, merge it
        if (val.length > 5 && val.every((v) => typeof v === "string" && v.length === 1)) {
            return [val.join("")]
        }
        return val
    })

    function update_item(index, new_text) {
        const current = Array.isArray(items) ? [...items] : []
        if (typeof current[index] === "object") {
            current[index] = { ...current[index], text: new_text }
        } else {
            current[index] = new_text
        }
        set_value(char, path, current)
    }

    function remove_item(index) {
        const current = [...items]
        current.splice(index, 1)
        set_value(char, path, current)
    }

    function add_item() {
        const current = [...items]
        current.unshift("")
        set_value(char, path, current)
    }
</script>

<div class="vector-panel" style="--accent-color: {signature_color}">
    <div class="vector-list">
        {#if is_editing}
            <Button variant="ghost" className="btn-add-unit" onclick={add_item}>
                + Add {unit_label}
            </Button>
        {/if}

        {#each items as item, i (i)}
            <VectorCard vector={item} {is_editing} {signature_color} {unit_label} on_update={(val) => update_item(i, val)} on_delete={() => remove_item(i)} />
        {/each}

        {#if items.length === 0 && !is_editing}
            <div class="empty-state">No {unit_label.toLowerCase()} recorded for this timeline.</div>
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

    .empty-state {
        padding: var(--spacing-m);
        text-align: center;
        color: var(--font-muted);
        font-size: var(--font-size-xs);
        font-style: italic;
        opacity: var(--opacity-m);
    }

    :global(.btn-add-unit) {
        width: 100%;
        font-size: var(--font-size-s);
        border: var(--spacing-px) dashed var(--border-light);
        border-radius: var(--border-radius);
        transition: all var(--transition-speed) var(--physics-transition-elastic);
    }

    :global(.btn-add-unit):hover {
        background: var(--surface-sunken);
        border-color: rgb(var(--pure-white-rgb) / var(--opacity-m));
        transform: translateY(var(--physics-btn-hover-y));
    }
</style>
