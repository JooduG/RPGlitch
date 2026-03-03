<script>
    import Button from "@ui/atoms/Button.svelte"
    import DOMPurify from "dompurify"

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

    function render_markdown(text) {
        if (!text) return ""
        let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
        html = html.replace(/\n\s*\n/g, "<br><br>")
        html = html.replace(/\n/g, " ")
        return DOMPurify.sanitize(html)
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
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html render_markdown(local_text)}
                </div>
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/placeholders" as *;

    .vector-card {
        position: relative;
        width: 100%;
        transition: transform var(--transition-speed) var(--physics-transition-elastic);

        &:hover {
            transform: translateX(var(--spacing-xxs));
        }

        &.editing {
            &:hover {
                transform: none;
            }
        }
    }

    .card-inner {
        background: var(--glass-s);
        box-shadow: var(--shadow-s);
        border-radius: var(--border-radius-s);
        padding: var(--spacing-s) var(--spacing-m);
        position: relative;
        overflow: hidden;
        transition: all var(--transition-speed) ease;
    }

    .display-area {
        .content {
            font-family: inherit;
            font-size: var(--font-size-s);
            color: var(--app-color);
            line-height: var(--line-height-base);
            opacity: var(--opacity-full);
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
            color: var(--app-color);
            font-family: inherit;
            font-size: var(--font-size-s);
            line-height: var(--line-height-base);
            resize: vertical;
            min-height: var(--spacing-xl);
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
        box-shadow: inset 0 0 0 var(--spacing-px) var(--signature-color, var(--ui-glass-border)) !important;
        width: var(--spacing-xl) !important;
        height: var(--spacing-xl) !important;
        padding: 0 !important;
        border-radius: var(--spacing-xs) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all var(--transition-speed) var(--physics-transition-elastic) !important;

        &:hover {
            background: var(--app-del) !important;
            box-shadow: var(--shadow-m) !important;
            color: var(--app-color) !important;
            filter: brightness(1.2) !important;
            transform: translateY(var(--physics-hover-y-compact)) !important;
        }

        .icon {
            font-size: var(--font-size-xxl);
            line-height: 1;
            font-weight: 800;
            margin-bottom: 2px;
        }
    }
</style>
