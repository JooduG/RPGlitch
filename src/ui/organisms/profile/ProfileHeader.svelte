<script>
    import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity_fragments.js"
    import { fitText } from "@ui/utils/actions/fitText.js"

    let { char = $bindable(), is_editing, render_markdown, auto_resize } = $props()
</script>

<header class:is-editing={is_editing} data-testid="profile-header">
    {#if is_editing}
        <h1 class="name edit" aria-label="Edit Character Name">
            <span contenteditable="true" bind:innerText={char.name} role="textbox" tabindex="0" data-placeholder={ENTITY_FRAGMENTS.name}></span>
        </h1>
    {:else}
        <h1
            class="name"
            aria-label="Character Name"
            use:fitText={{
                maxSize: 80,
                minSize: 16,
                lineHeight: "var(--line-height-heading)",
            }}
        >
            {char.name || ENTITY_FRAGMENTS.name}
        </h1>
    {/if}
    {#if is_editing}
        <textarea use:auto_resize class="description" class:edit={is_editing} value={char.description || ""} oninput={(e) => (char.description = e.target.value)} placeholder={ENTITY_FRAGMENTS.description}></textarea>
    {:else}
        <div class="description readonly" class:muted-info={!char.description}>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html render_markdown(char.description || ENTITY_FRAGMENTS.description)}
        </div>
    {/if}
</header>

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    header {
        background: transparent; /* Background handled by Profile.svelte container */
        padding: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .name {
        width: 100%;
        color: var(--signature-color);
        font-size: var(--font-size-xxxxl);
        font-weight: 700;
        letter-spacing: -0.02em;
        text-shadow: var(--shadow-text);
        margin: 0;
        padding: var(--spacing-xs); /* Fixed padding */
        text-align: left;
        border-radius: var(--border-radius-m);
        transition: background 0.2s;
        border: none; /* Removed transparent border */
        box-shadow: inset 0 0 0 1px transparent;
        min-height: 1.2em;
        line-height: var(--line-height-heading);
        outline: none;
        background: transparent;

        &.edit {
            cursor: text;
            pointer-events: auto;
            caret-color: var(--signature-color);

            &:hover,
            &:focus-within {
                background: rgba(var(--pure-white-rgb), var(--opacity-xxs));
                box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xs));
            }

            span {
                outline: none;

                &:empty::before {
                    content: attr(data-placeholder);
                    opacity: 0.3;
                    font-style: italic;
                    font-weight: 400;
                }
            }
        }

        &:not(.edit) {
            cursor: default;
            pointer-events: none;
        }
    }

    .description {
        @extend %textarea-clean;
        width: 100%;
        color: var(--app-color);
        font-family: inherit;
        font-size: var(--font-size-m);
        line-height: 1.5;
        min-height: 1.4em;
        transition: all 0.2s;
        border-radius: var(--border-radius-m);
        padding: var(--spacing-s);
        border: none;
        box-shadow: inset 0 0 0 1px transparent;
        background: transparent;
        resize: none;
        text-align: left;

        &.muted-info {
            @extend %muted-ghost;
        }

        &.edit {
            pointer-events: auto;
            caret-color: white;
            cursor: text;

            &:hover,
            &:focus {
                background: rgba(var(--pure-white-rgb), var(--opacity-xxs));
                box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xs));
                outline: none;
            }
        }

        &.readonly {
            pointer-events: auto;
            white-space: pre-wrap;
            cursor: default;

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
