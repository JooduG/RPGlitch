<script>
    import { PROFILE_SECTIONS } from "@data/config.js"

    let {
        char = $bindable(),
        isEditing,
        getValue,
        setValue,
        autoResize,
        busyFields,
        renderMarkdown,
        activeField = $bindable(),
    } = $props()
</script>

<div class="content" data-testid="profile-traits">
    {#each PROFILE_SECTIONS as section (section.label)}
        <div class="row">
            <div class="label">
                <h2>{section.label}</h2>
                <p>{section.sublabel}</p>
            </div>

            <div class={section.layout === "split" ? "split" : "full"}>
                {#each section.fields as field (field.key)}
                    <div class="field-group">
                        {#if field.label}
                            <span class="field-label">{field.label}</span>
                        {/if}
                        {#if isEditing}
                            <textarea
                                use:autoResize={{
                                    syncId: section.label,
                                }}
                                data-sync-id={section.label}
                                class="text-area"
                                class:edit={isEditing}
                                placeholder={field.placeholder}
                                value={getValue(char, field.key)}
                                oninput={(e) =>
                                    setValue(char, field.key, e.target.value)}
                                disabled={busyFields.has(field.key)}
                                onfocus={() => {
                                    activeField = {
                                        key: field.key,
                                        label: field.label || section.label,
                                    }
                                }}
                            ></textarea>
                        {:else}
                            <div
                                class="text-area readonly"
                                class:muted-info={!getValue(char, field.key)}
                                data-sync-id={section.label}
                            >
                                {@html renderMarkdown(
                                    getValue(char, field.key) ||
                                        "Record undefined."
                                )}
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
        padding: var(--spacing-m) var(--spacing-l) var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        mask-image: linear-gradient(
            to bottom,
            transparent,
            black var(--spacing-m),
            black calc(100% - var(--spacing-m)),
            transparent
        );

        .row {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: var(--spacing-s);

            .label {
                text-align: right;
                align-self: center;
                padding-top: var(--spacing-xs);

                h2 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--signature-color);
                    text-transform: uppercase;
                    text-shadow:
                        0 2px 4px rgba(0, 0, 0, 0.9),
                        0 0 10px rgba(var(--signature-rgb), 0.3);
                    display: inline-block;
                }

                p {
                    margin: 0;
                    font-size: 0.7rem;
                    color: white;
                    font-weight: 700;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
                }
            }

            .split,
            .full {
                display: grid;
                gap: var(--spacing-m);
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

                .field-label {
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: var(--signature-color);
                    opacity: 1;
                    margin-left: 2px;
                    text-align: center;
                    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
                    margin-bottom: 4px;
                }

                .text-area {
                    @extend %textarea-clean;
                    resize: none;
                    width: 100%;
                    height: auto;
                    min-height: 4rem;
                    max-height: 24rem;
                    overflow-y: auto;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid transparent;
                    border-radius: var(--spacing-s);
                    color: white;
                    padding: var(--spacing-s) var(--spacing-m);
                    font-family: inherit;
                    font-size: 0.85rem;
                    line-height: 1.2;
                    transition: all 0.2s;
                    cursor: default;
                    pointer-events: auto;
                    text-align: left;
                    text-wrap-style: pretty;

                    &:read-only {
                        opacity: 1;
                        filter: none;
                        cursor: default;
                    }

                    &:disabled {
                        opacity: 0.4;
                        filter: grayscale(100%) blur(0.5px);
                        cursor: wait;
                        background: rgba(0, 0, 0, 0.3);
                        color: var(--app-muted);
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                        pointer-events: none;
                    }

                    &.edit:not(:disabled) {
                        pointer-events: auto;
                        caret-color: white;
                        cursor: text;

                        &:focus {
                            background: rgba(255, 255, 255, 0.1);
                            outline: none;
                        }
                    }

                    &.muted-info {
                        @extend %muted-ghost;
                    }

                    &.readonly {
                        white-space: normal;
                        pointer-events: auto;
                        min-height: 4rem;
                        max-height: 24rem;
                        overflow-y: auto;
                        flex: 1;

                        :global(strong) {
                            font-weight: 900;
                            color: white;
                            letter-spacing: 0.02em;
                            text-shadow: 0 0 15px
                                rgba(var(--signature-rgb), 0.5);
                        }

                        :global(em) {
                            font-style: italic;
                            color: color-mix(
                                in srgb,
                                var(--signature-color),
                                white 80%
                            );
                        }
                    }
                }
            }
        }
    }
</style>
