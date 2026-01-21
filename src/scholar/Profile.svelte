<script>
    import Button from "../artificer/Button.svelte"
    import Modal from "../artificer/Modal.svelte"
    import { app } from "../gamemaster/state.svelte.js"
    import { themeStore } from "../mesmer/logic/theme.svelte.js"
    import ProfilePicture from "../mesmer/ui/ProfilePicture.svelte"
    import { PROFILE_SECTIONS } from "./config.js"
    import { runtime } from "./runtime.svelte.js"

    let { entityId, entityType, onClose } = $props()

    // State
    let isEditing = $state(false)
    let isDevMode = $state(false)
    let isSaving = $state(false)

    // Character data
    let char = $state(
        themeStore.normalizeEntity(app.editingEntity || runtime.character)
    )

    let signatureColor = $derived(themeStore.getSignatureColor(char))
    let signatureRgb = $derived(themeStore.hexToRgb(signatureColor))

    function handleClose() {
        app.toggleProfile(false)
    }

    // Helper to get nested value (e.g. "eternal.mental")
    function getValue(obj, path) {
        if (!path) return ""
        return (
            path.split(".").reduce((acc, part) => acc && acc[part], obj) || ""
        )
    }
</script>

{#if char && char.id}
    <Modal variant="profile" onclose={handleClose}>
        <div
            class="profile-presentation"
            style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
        >
            <aside class="left">
                <ProfilePicture entity={char} />
            </aside>
            <main class="right">
                <header>
                    <h1 class="char-name">{char.name}</h1>
                    {#if char.description}
                        <p>{char.description}</p>
                    {/if}
                </header>
                <div class="content">
                    {#each PROFILE_SECTIONS as section}
                        <div class="row">
                            <div class="label">
                                <h2>{section.label}</h2>
                                <p>{section.sublabel}</p>
                            </div>
                            {#if section.layout === "split"}
                                <div class="split">
                                    {#each section.fields as field}
                                        <div>
                                            {#if field.label}
                                                <h2>{field.label}</h2>
                                            {/if}
                                            <textarea
                                                class="field"
                                                placeholder={field.placeholder}
                                                value={getValue(
                                                    char,
                                                    field.key
                                                )}
                                                readonly={!isEditing}
                                            ></textarea>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <div>
                                    {#each section.fields as field}
                                        <textarea
                                            class="field"
                                            placeholder={field.placeholder}
                                            value={getValue(char, field.key)}
                                            readonly={!isEditing}
                                        ></textarea>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
                <footer>
                    <Button
                        variant="edit"
                        onclick={() => (isEditing = !isEditing)}
                    >
                        {isEditing ? "Save" : "Edit"}
                    </Button>
                </footer>
            </main>
        </div>
    </Modal>
{/if}

<style lang="scss">
    .profile-presentation {
        width: 50rem;
        max-width: 90vw;
        height: 40rem;
        max-height: 80vh;
        background-color: color-mix(
            in oklab,
            var(--signature-color) 20%,
            var(--card-background) 60%
        );
        border-radius: var(--spacing-lg);
        display: grid;
        grid-template-columns: 35% 65%;
        overflow: hidden;
        margin: 0;
        align-content: center;
    }

    .left:global(.profile-picture) {
        padding: 0;
        border-radius: 0;
    }

    .right {
        overflow: scroll;
        padding: var(--spacing-lg);
        header {
            margin-bottom: var(--spacing-xl);
            h1 {
                color: var(--signature-color);
                font-size: 3rem;
                font-weight: 700;
                margin: 0;
                text-align: left;
            }
            p {
                margin: 0;
                font-size: 1rem;
                line-height: 1.25;
            }
        }

        .content {
            .row {
                display: grid;
                grid-template-columns: 80px 1fr;
                gap: var(--spacing-sm-md);
                color: var(--app-text-on-dark, #fff);
                margin-bottom: var(--spacing-sm);
                align-items: center;

                .label {
                    text-align: right;
                    h2 {
                        margin: 0;
                        font-size: 1.2rem;
                        color: var(--signature-color);
                    }

                    p {
                        margin: 0;
                        font-size: 0.75rem;
                        color: rgba(255, 255, 255, 0.7);
                    }
                }

                .split {
                    gap: var(--spacing-sm-md);
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    text-align: center;
                    h2 {
                        margin: 0 0 var(--spacing-sm-md) 0;
                        font-size: 0.9rem;
                        color: rgba(255, 255, 255, 0.9);
                    }
                }

                .field {
                    width: 100%;
                    min-height: 8rem;
                    padding: var(--spacing-sm-md);
                    background-color: color-mix(
                        in oklab,
                        var(--signature-color) 30%,
                        var(--form-background) 50%
                    );
                    border: 0;
                    border-radius: var(--spacing-sm);
                    color: white;
                    font-family: inherit;
                    font-size: 0.8rem;
                    line-height: 1.5;
                    resize: vertical;
                    text-align: left;
                    overflow: scroll;

                    &::placeholder {
                        color: var(--app-muted);
                    }

                    &[readonly] {
                        cursor: default;
                        opacity: 0.8;
                    }

                    &:focus {
                        outline: none;
                        border-color: var(--app-muted);
                        background-color: color-mix(
                            in oklab,
                            var(--signature-color) 40%,
                            var(--form-background) 40%
                        );
                    }
                }
            }
        }
        footer {
            text-align: right;
            color: white;

            :global(.btn-edit) {
                background-color: color-mix(
                    in oklab,
                    var(--signature-color) 50%,
                    var(--form-background) 30%
                );
            }
        }
    }
</style>
