<script>
    import Button from "@ui/atoms/Button.svelte"
    import DOMPurify from "dompurify"

    let { vector, isEditing, onUpdate, onDelete, signatureColor, unitLabel = "Vector" } = $props()

    // Create a stable local state for editing
    let localText = $state("")

    // Sync from props only when not in active edit mode or on mount
    $effect(() => {
        const text = vector?.text || vector?.summary || (typeof vector === "string" ? vector : "")
        localText = text
    })

    function handleInput(e) {
        localText = e.target.value
        onUpdate(localText)
    }

    function renderMarkdown(text) {
        if (!text) return ""
        let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
        html = html.replace(/\n\s*\n/g, "<br><br>")
        html = html.replace(/\n/g, " ")
        return DOMPurify.sanitize(html)
    }
</script>

<div class="vector-card" class:editing={isEditing} style="--accent-color: {signatureColor}">
    <div class="card-inner">
        {#if isEditing}
            <div class="edit-area">
                <textarea value={localText} oninput={handleInput} placeholder="Enter {unitLabel.toLowerCase()} detail..."></textarea>
                <div class="actions">
                    <Button variant="danger" className="vector-delete-btn" onclick={onDelete} title="Remove {unitLabel}">
                        <span class="icon">×</span>
                    </Button>
                </div>
            </div>
        {:else}
            <div class="display-area">
                <div class="content">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html renderMarkdown(localText)}
                </div>
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "../../../theme/abstracts/placeholders" as *;

    .vector-card {
        position: relative;
        width: 100%;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateX(4px);
        }

        &.editing {
            &:hover {
                transform: none;
            }
        }
    }

    .card-inner {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 0 1px transparent;
        border-radius: var(--spacing-s);
        padding: var(--spacing-s) var(--spacing-m);
        position: relative;
        overflow: hidden;
        transition: all 0.2s;
    }

    .display-area {
        .content {
            font-family: inherit;
            font-size: 0.85rem;
            color: white;
            line-height: 1.2;
            opacity: 1;
            word-break: break-word;
            overflow-wrap: break-word;
        }
    }

    .edit-area {
        display: flex;
        flex-direction: row;
        gap: var(--spacing-s);
        align-items: stretch;

        textarea {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            font-family: inherit;
            font-size: 0.85rem;
            line-height: 1.2;
            resize: vertical;
            min-height: 2.5rem;
            width: 100%;
            outline: none;
            padding: 0;

            &::placeholder {
                color: var(--text-dim);
                opacity: 0.5;
            }
        }

        .actions {
            display: flex;
            align-items: flex-start;
            margin-top: 0;
        }
    }

    :global(.vector-delete-btn.btn) {
        background: transparent !important;
        color: var(--app-muted) !important;
        border: 0.0625rem solid transparent !important;
        box-shadow: none !important;
        width: 2.5rem !important;
        height: 2.5rem !important;
        padding: 0 !important;
        border-radius: var(--spacing-xs) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.3s ease !important;

        &:hover {
            background: var(--app-del) !important;
            border-color: var(--app-del) !important;
            color: white !important;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5) !important;
            filter: brightness(1.2) !important;
            transform: translateY(-1px) !important;
        }

        .icon {
            font-size: 1.4rem;
            line-height: 1;
            font-weight: 800;
            margin-bottom: 2px;
        }
    }
</style>
