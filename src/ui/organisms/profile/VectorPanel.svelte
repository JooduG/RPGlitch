<script>
    import Button from "@ui/atoms/Button.svelte"
    import VectorCard from "./VectorCard.svelte"

    let { char, path, isEditing, setValue, getValue, signatureColor, unitLabel = "Vector" } = $props()

    let rawItems = $derived(getValue(char, path) || [])
    let items = $derived.by(() => {
        const val = rawItems
        if (!Array.isArray(val)) {
            return typeof val === "string" && val.trim() ? [val.trim()] : []
        }
        // Self-Healing: If we received a character-split array, merge it
        if (val.length > 5 && val.every((v) => typeof v === "string" && v.length === 1)) {
            return [val.join("")]
        }
        return val
    })

    function updateItem(index, newText) {
        const current = Array.isArray(items) ? [...items] : []
        if (typeof current[index] === "object") {
            current[index] = { ...current[index], text: newText }
        } else {
            current[index] = newText
        }
        setValue(char, path, current)
    }

    function removeItem(index) {
        const current = [...items]
        current.splice(index, 1)
        setValue(char, path, current)
    }

    function addItem() {
        const current = [...items]
        current.unshift("")
        setValue(char, path, current)
    }
</script>

<div class="vector-panel" style="--accent-color: {signatureColor}">
    <div class="vector-list">
        {#if isEditing}
            <Button variant="ghost" onclick={addItem} style="width: 100%; font-size: 0.85rem; border: 0.0625rem dashed rgba(255,255,255,0.2);">
                + Add {unitLabel}
            </Button>
        {/if}

        {#each items as item, i (i)}
            <VectorCard vector={item} {isEditing} {signatureColor} {unitLabel} onUpdate={(val) => updateItem(i, val)} onDelete={() => removeItem(i)} />
        {/each}

        {#if items.length === 0 && !isEditing}
            <div class="empty-state">No {unitLabel.toLowerCase()} recorded for this timeline.</div>
        {/if}
    </div>
</div>

<style lang="scss">
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
        color: var(--text-dim);
        font-size: var(--font-size-xs);
        font-style: italic;
        opacity: 0.6;
    }
</style>
