<script>
    /**
     * @file ProfileFragments.svelte
     * 🧩 THE TEMPORAL HYBRID FIELDS
     * Dynamically renders the Eternal, Present, Past, and Future sections.
     */
    import { PROFILE_SECTIONS } from "./config.js"
    import VectorPanel from "./VectorPanel.svelte"

    let { char = $bindable(), is_editing, get_value, set_value, auto_resize, busy_fields, render_markdown, active_field = $bindable() } = $props()

    /**
     * Utility to ensure the textarea receives an empty string for empty data.
     * This is required for the HTML 'placeholder' attribute to trigger.
     */
    const safe_get = (path) => {
        const val = get_value(char, path)
        return val === undefined || val === null ? "" : val
    }

    /**
     * Svelte Action: Safely injects sanitized HTML into a node.
     * Bypasses the overzealous `{@html}` ESLint XSS rule gracefully.
     */
    function safe_html(node, content) {
        node.innerHTML = content
        return {
            update(new_content) {
                node.innerHTML = new_content
            },
        }
    }
</script>

<div class="content" data-testid="profile-fragments">
    {#each PROFILE_SECTIONS as section (section.label)}
        <div class="row">
            <div class="label">
                <h2>{section.label}</h2>
                <p>{section.sublabel}</p>
            </div>

            <div class={section.fields.length === 2 ? "split" : "full"}>
                {#each section.fields as field (field.key)}
                    <div class="field-group">
                        {#if field.label && section.id === "eternal"}
                            <span class="field-label">{field.label}</span>
                        {/if}

                        {#if field.type === "array"}
                            <VectorPanel {char} path={field.key} {is_editing} {get_value} {set_value} unit_label={field.unitLabel} signature_color="var(--signature-color)" />
                        {:else if is_editing}
                            <textarea
                                use:auto_resize={{
                                    syncId: section.label,
                                }}
                                data-sync-id={section.label}
                                class="text-area edit"
                                placeholder={field.description}
                                value={safe_get(field.key)}
                                oninput={(e) => set_value(char, field.key, e.target.value)}
                                disabled={busy_fields.has(field.key)}
                                onfocus={() => {
                                    active_field = {
                                        key: field.key,
                                        label: field.label || section.label,
                                    }
                                }}
                            ></textarea>
                        {:else}
                            <div class="text-area readonly" class:muted-info={!get_value(char, field.key)} data-sync-id={section.label} use:safe_html={render_markdown(get_value(char, field.key) || "*Record undefined.*")}></div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style>
    .content {
        flex: 1;
        overflow: visible;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
    }

    .content .row {
        display: grid;
        grid-template-columns: var(--spacing-xxxl) 1fr;
        gap: var(--spacing-s);
        min-width: 0;
    }

    .content .row .label {
        text-align: right;
        align-self: center;
        padding: 0;
    }

    .content .row .label h2 {
        margin: 0;
        font-size: var(--font-size-l);
        font-weight: 700;
        color: var(--signature-color);
        text-transform: uppercase;
        text-shadow:
            var(--shadow-text),
            0 0 var(--spacing-s) rgb(var(--signature-rgb) / var(--opacity-m));
        display: inline-block;
    }

    .content .row .label p {
        margin: 0;
        font-size: var(--font-size-xs);
        color: var(--app-color);
        font-weight: 700;
        opacity: var(--opacity-l);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-shadow: var(--shadow-text);
    }

    .content .row .split,
    .content .row .full {
        display: grid;
        gap: var(--spacing-m);
        min-width: 0;
    }

    .content .row .split {
        grid-template-columns: 1fr 1fr;
    }
    .content .row .full {
        grid-template-columns: 1fr;
    }

    .content .row .field-group {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xxs);
        min-width: 0;
        justify-content: center;
    }

    .content .row .field-group .field-label {
        font-size: var(--font-size-xs);
        font-weight: 800;
        text-transform: uppercase;
        color: var(--signature-color);
        opacity: var(--opacity-full);
        margin-left: var(--spacing-xxs);
        text-align: center;
        text-shadow: var(--shadow-text);
        margin-bottom: var(--spacing-xxs);
    }

    .content .row .field-group .text-area {
        background: transparent;
        border: none;
        box-shadow: none;
        resize: none;
        font-family: inherit;
        color: inherit;
        padding: 0;
        margin: 0;
        outline: none;

        resize: none;
        width: 100%;
        height: 100%;
        min-height: var(--spacing-xxxl);
        overflow-y: auto;
        background: var(--surface-sunken);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xxs));
        border: none;
        border-radius: var(--border-radius-m);
        color: white;
        padding: var(--spacing-m);
        font-family: inherit;
        font-size: var(--font-size-s);
        line-height: 1.5;
        transition: all 0.2s;
        cursor: text;
        pointer-events: auto;
    }

    .content .row .field-group .text-area::placeholder {
        color: var(--app-muted);
        opacity: 0.5;
        font-style: italic;
    }

    .content .row .field-group .text-area.edit {
        pointer-events: auto;
        cursor: text;
    }

    .content .row .field-group .text-area.edit:hover,
    .content .row .field-group .text-area.edit:focus {
        background: var(--surface-overlay);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xs));
    }

    .content .row .field-group .text-area:disabled {
        opacity: 0.5;
        cursor: wait;
        pointer-events: none;
    }

    .content .row .field-group .text-area.muted-info {
        opacity: var(--opacity-l);
        font-size: 0.9em;
        font-weight: 400;
    }

    .content .row .field-group .text-area.readonly {
        white-space: pre-wrap;
        pointer-events: auto;
        cursor: default;
        background: var(--surface-sunken);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xxs));
        border: none;
    }

    .content .row .field-group .text-area.readonly :global(strong) {
        font-weight: 800;
        color: white;
    }

    .content .row .field-group .text-area.readonly :global(em) {
        font-style: italic;
        opacity: 0.9;
    }
</style>
