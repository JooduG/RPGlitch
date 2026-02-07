<script>
    import { fitText } from "@ui/utils/actions/fitText.js"

    let { char = $bindable(), isEditing, renderMarkdown, autoResize } = $props()
</script>

<header class:is-editing={isEditing} data-testid="profile-header">
    {#if isEditing}
        <h1 class="name edit" aria-label="Edit Character Name">
            <span
                contenteditable="true"
                bind:innerText={char.name}
                role="textbox"
                tabindex="0"
            ></span>
        </h1>
    {:else}
        <h1
            class="name"
            aria-label="Character Name"
            use:fitText={{
                maxSize: 80,
                minSize: 16,
                lineHeight: "1.1",
            }}
        >
            {char.name || "Unnamed Entity"}
        </h1>
    {/if}
    {#if isEditing}
        <textarea
            use:autoResize
            class="description"
            class:edit={isEditing}
            value={char.description}
            oninput={(e) => (char.description = e.target.value)}
            placeholder="Entity Description"
        ></textarea>
    {:else}
        <div class="description readonly" class:muted-info={!char.description}>
            {@html renderMarkdown(
                char.description || "No description provided."
            )}
        </div>
    {/if}
</header>

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    header {
        background: color-mix(
            in srgb,
            rgba(0, 0, 0, 0.4),
            var(--signature-color) 12%
        );
        border-bottom: 0;
        padding: var(--spacing-l);
    }

    .name {
        width: 100%;
        color: var(--signature-color);
        font-size: var(--font-size-xxxxl);
        letter-spacing: -0.02em;
        text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        transition: all 0.2s;
        cursor: default;
        margin: 0;
        padding: 4px 0;
        text-align: left;
        border: 1px solid transparent;
        min-height: 1.1em;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        border-radius: var(--spacing-s);

        &:empty::before {
            content: "Unnamed Entity";
            opacity: 0.3;
            font-style: italic;
            font-weight: 400;
        }

        span[contenteditable="true"] {
            display: block;
            width: 100%;
            outline: none;
            min-height: 1.1em;

            &:empty::before {
                content: "Entity Name";
                opacity: 0.2;
            }
        }

        &.edit {
            @extend %textarea-clean;
            pointer-events: auto;
            caret-color: var(--signature-color);
            cursor: text;

            &:focus-within {
                background: rgba(255, 255, 255, 0.05);
            }
        }
    }

    .description {
        @extend %textarea-clean;
        width: 100%;
        color: rgba(255, 255, 255, 0.9);
        font-family: inherit;
        font-size: 1rem;
        padding: 4px 0;
        margin: var(--spacing-xs) 0 0;
        line-height: 1.5;
        min-height: 1.4em;
        cursor: default;
        transition: all 0.2s;
        border-radius: 0;
        pointer-events: none;
        background: transparent;
        border: 1px solid transparent;
        resize: none;

        &.muted-info {
            @extend %muted-ghost;
        }

        &.edit {
            pointer-events: auto;
            caret-color: white;
            cursor: text;

            &:focus {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid transparent;
                outline: none;
            }
        }

        &.readonly {
            pointer-events: auto;
            white-space: pre-wrap;

            :global(strong) {
                font-weight: 800;
                color: white;
            }

            :global(em) {
                font-style: italic;
                opacity: 0.9;
            }
        }
    }
</style>
