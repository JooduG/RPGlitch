<script>
    import Button from "@ui/atoms/Button.svelte"

    let { vector, is_editing, on_update, on_delete, signature_color, unit_label = "Vector" } = $props()

    // Create a stable local state for editing
    let local_text = $state("")

    // Sync from props only when not in active edit mode or on mount
    $effect(() => {
        const text = vector?.text || vector?.summary || (typeof vector === "string" ? vector : "")
        local_text = text
    })

    function handle_input(e) {
        local_text = e.target.value
        on_update(local_text)
    }

    function parse_markdown(text) {
        if (!text) return []

        let paragraphs = text.split(/\n\s*\n/)

        return paragraphs.map((p) => {
            let normalized = p.replace(/\n/g, " ")
            let tokens = []
            const regex = /\*\*([\s\S]*?)\*\*|\*([\s\S]*?)\*/g
            let lastIndex = 0
            let match

            while ((match = regex.exec(normalized)) !== null) {
                if (match.index > lastIndex) {
                    tokens.push({ type: "text", content: normalized.substring(lastIndex, match.index) })
                }
                if (match[1] !== undefined) {
                    tokens.push({ type: "strong", content: match[1] })
                } else if (match[2] !== undefined) {
                    tokens.push({ type: "em", content: match[2] })
                }
                lastIndex = match.index + match[0].length
            }
            if (lastIndex < normalized.length) {
                tokens.push({ type: "text", content: normalized.substring(lastIndex) })
            }
            return tokens
        })
    }
</script>

<div class="vector-card" class:editing={is_editing} style="--accent-color: {signature_color}">
    <div class="card-inner">
        {#if is_editing}
            <div class="edit-area">
                <textarea value={local_text} oninput={handle_input} placeholder="Enter {unit_label.toLowerCase()} detail..."></textarea>
                <div class="actions">
                    <Button variant="danger" className="vector-delete-btn" onclick={on_delete} title="Remove {unit_label}">
                        <span class="icon">×</span>
                    </Button>
                </div>
            </div>
        {:else}
            <div class="display-area">
                <div class="content">
                    {#each parse_markdown(local_text) as paragraph, i (i)}
                        <p class="markdown-paragraph">
                            {#each paragraph as token, j (j)}
                                {#if token.type === "strong"}
                                    <strong>{token.content}</strong>
                                {:else if token.type === "em"}
                                    <em>{token.content}</em>
                                {:else}
                                    {token.content}
                                {/if}
                            {/each}
                        </p>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .vector-card {
        position: relative;
        width: 100%;
        transition: transform var(--transition-speed) var(--physics-transition-elastic);
    }

    .vector-card:hover {
        transform: translateX(var(--spacing-xxs));
    }

    .vector-card.editing:hover {
        transform: none;
    }

    .card-inner {
        background: var(--surface-sunken);
        box-shadow: var(--shadow-s);
        border-radius: var(--border-radius-m);
        padding: var(--spacing-s) var(--spacing-m);
        position: relative;
        overflow: hidden;
        transition: all var(--transition-speed) ease;
    }

    .display-area .content {
        font-family: inherit;
        font-size: var(--font-size-s);
        color: var(--font-color);
        line-height: var(--line-height-base);
        opacity: var(--opacity-full);
        word-break: break-word;
        overflow-wrap: break-word;
    }

    .edit-area {
        display: flex;
        flex-direction: row;
        gap: var(--spacing-s);
        align-items: stretch;
    }

    .edit-area textarea {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--font-color);
        font-family: inherit;
        font-size: var(--font-size-s);
        line-height: var(--line-height-base);
        resize: vertical;
        min-height: var(--spacing-xl);
        width: 100%;
        outline: none;
        padding: 0;
    }

    .edit-area textarea::placeholder {
        color: var(--text-dim);
        opacity: 0.5;
    }

    .edit-area .actions {
        display: flex;
        align-items: flex-start;
        margin-top: 0;
    }

    :global(.vector-delete-btn.btn) {
        background: transparent !important;
        color: var(--font-muted) !important;
        box-shadow: inset 0 0 0 var(--spacing-px) var(--signature-color, var(--border-light)) !important;
        width: var(--spacing-xl) !important;
        height: var(--spacing-xl) !important;
        padding: 0 !important;
        border-radius: var(--spacing-xs) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all var(--transition-speed) var(--physics-transition-elastic) !important;
    }

    :global(.vector-delete-btn.btn):hover {
        background: var(--app-del) !important;
        box-shadow: var(--shadow-m) !important;
        color: var(--font-color) !important;
        filter: brightness(1.2) !important;
        transform: translateY(var(--physics-hover-y-compact)) !important;
    }

    :global(.vector-delete-btn.btn) .icon {
        font-size: var(--font-size-xxl);
        line-height: 1;
        font-weight: 800;
        margin-bottom: 2px;
    }
    .display-area .content .markdown-paragraph {
        margin: 0 0 var(--spacing-m) 0;
    }

    .display-area .content .markdown-paragraph:last-child {
        margin-bottom: 0;
    }
</style>
