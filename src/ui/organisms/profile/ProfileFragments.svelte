<script>
    import { PROFILE_SECTIONS } from "./config.js"
    import VectorPanel from "./VectorPanel.svelte"

    let { char = $bindable(), is_editing, get_value, set_value, auto_resize, busy_fields, render_markdown, active_field = $bindable() } = $props()
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
                                class="text-area"
                                class:edit={is_editing}
                                placeholder={field.description}
                                value={get_value(char, field.key)}
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
                            <div class="text-area readonly" class:muted-info={!get_value(char, field.key)} data-sync-id={section.label}>
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                                {@html render_markdown(get_value(char, field.key) || "Record undefined.")}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    .content {
        flex: 1;
        overflow: visible;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);

        .row {
            display: grid;
            grid-template-columns: var(--spacing-xxxl) 1fr;
            gap: var(--spacing-s);
            min-width: 0;

            .label {
                text-align: right;
                align-self: center;
                padding: 0;

                h2 {
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

                p {
                    margin: 0;
                    font-size: var(--font-size-xs);
                    color: var(--app-color);
                    font-weight: 700;
                    opacity: var(--opacity-l);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    text-shadow: var(--shadow-text);
                }
            }

            .split,
            .full {
                display: grid;
                gap: var(--spacing-m);
                min-width: 0;
            }

            .split {
                grid-template-columns: 1fr 1fr;
            }
            .full {
                grid-template-columns: 1fr;
            }

            .field-group {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xxs);
                min-width: 0;
                justify-content: center;

                .field-label {
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

                .text-area {
                    @extend %textarea-clean;
                    resize: none;
                    width: 100%;
                    height: 100%;
                    min-height: var(--spacing-xxxl);
                    overflow-y: auto;
                    background: var(--surface-sunken);
                    box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xxs));
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
                    outline: none;

                    &.edit {
                        pointer-events: auto;
                        cursor: text;

                        &:hover,
                        &:focus {
                            background: var(--surface-overlay);
                            box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xs));
                        }
                    }

                    &:disabled {
                        opacity: 0.5;
                        cursor: wait;
                        pointer-events: none;
                    }

                    &.muted-info {
                        @extend %muted-ghost;
                    }

                    &.readonly {
                        white-space: pre-wrap;
                        pointer-events: auto;
                        cursor: default;
                        background: var(--surface-sunken);
                        box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xxs));
                        border: none;

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
            }
        }
    }
</style>
