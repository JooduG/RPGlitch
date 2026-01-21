<script>
    import Button from "../artificer/Button.svelte"
    import Modal from "../artificer/Modal.svelte"
    import { app } from "../gamemaster/state.svelte.js"
    import { TextToImage } from "../mesmer/logic/text-to-image.js"
    import { themeStore } from "../mesmer/logic/theme.svelte.js"
    import ProfilePicture from "../mesmer/ui/ProfilePicture.svelte"
    import { PROFILE_SECTIONS } from "./config.js"
    import { Scholar } from "./index.js"
    import { runtime } from "./runtime.svelte.js"

    let { entityId, entityType } = $props()

    // State
    let isEditing = $state(false)
    let isSaving = $state(false)
    let visualBusy = $state(false)
    let visualPrompt = $state("")
    let magicBusy = $state({})

    // Character data
    let char = $state(
        themeStore.normalizeEntity(app.editingEntity || runtime.character)
    )

    // Visuals: Bind directly to character data, fallback for display
    let signatureColor = $derived(
        char.visuals?.signatureColor || themeStore.getSignatureColor(char)
    )
    let signatureRgb = $derived(themeStore.hexToRgb(signatureColor))

    function handleClose() {
        app.toggleProfile(false)
    }

    async function handleSave() {
        isEditing = false
        isSaving = true
        try {
            await runtime.saveEntity(entityType || "character", char)
            // If this was the active entity, force a UI refresh if needed,
            // but the runtime store should handle reactivity.
        } catch (err) {
            console.error("Failed to save profile:", err)
            // Revert editing state?
            isEditing = true
        } finally {
            isSaving = false
        }
    }

    async function handleDelete() {
        if (
            !confirm(
                "Are you sure you want to delete this entity? This cannot be undone."
            )
        )
            return

        try {
            await runtime.deleteEntity(
                entityType || "character",
                entityId || char.id
            )
            handleClose()
        } catch (err) {
            console.error("Failed to delete entity:", err)
        }
    }

    async function handlePaint() {
        try {
            visualBusy = true
            const url = await TextToImage.generate(visualPrompt, {
                resolution: "512x768",
            })
            if (url) char.visuals.profilePictureUrl = url
        } catch (e) {
            console.error("Paint failed:", e)
        } finally {
            visualBusy = false
        }
    }

    async function handleConsult(field) {
        if (magicBusy[field]) return
        try {
            magicBusy[field] = true
            const result = await Scholar.consult(field, char)
            setValue(char, field, result)
        } catch (e) {
            console.error(`Magic failed for ${field}:`, e)
        } finally {
            magicBusy[field] = false
        }
    }

    // Helper to get nested value (e.g. "eternal.mental")
    function getValue(obj, path) {
        if (!path) return ""
        return (
            path.split(".").reduce((acc, part) => acc && acc[part], obj) || ""
        )
    }

    // Helper to set nested value
    function setValue(obj, path, val) {
        const keys = path.split(".")
        const last = keys.pop()
        const target = keys.reduce(
            (acc, key) => (acc[key] = acc[key] || {}),
            obj
        )
        target[last] = val
    }
</script>

{#if char && char.id}
    <Modal variant="profile" onclose={handleClose}>
        <div class="profile-container" class:editing={isEditing}>
            <!-- LEFT WING (Creative) -->
            <aside class="wing left-wing">
                <div class="content">
                    <h3>VISUALS</h3>
                    <!-- Color Picker Placeholder -->
                    <div class="control-group">
                        <label>
                            <span>Signature Color</span>
                            <input
                                type="color"
                                bind:value={char.visuals.signatureColor}
                                disabled={!isEditing}
                            />
                        </label>
                    </div>

                    <div class="control-group">
                        <label>
                            <span>Paint Profile</span>
                            <input
                                type="text"
                                bind:value={visualPrompt}
                                placeholder="Describe appearance..."
                                disabled={!isEditing}
                                onkeydown={(e) =>
                                    e.key === "Enter" && handlePaint()}
                            />
                        </label>
                        <Button
                            variant="primary"
                            size="sm"
                            onclick={handlePaint}
                            disabled={!isEditing || visualBusy}
                        >
                            {visualBusy ? "Painting..." : "Generate"}
                        </Button>
                    </div>
                </div>
            </aside>

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
                        {#each PROFILE_SECTIONS as section (section.label)}
                            <div class="row">
                                <div class="label">
                                    <h2>{section.label}</h2>
                                    <p>{section.sublabel}</p>
                                </div>
                                {#if section.layout === "split"}
                                    <div class="split">
                                        {#each section.fields as field (field.key)}
                                            <div class="field-container">
                                                {#if field.label}
                                                    <h2>{field.label}</h2>
                                                {/if}
                                                <div class="input-wrapper">
                                                    <textarea
                                                        class="field"
                                                        placeholder={field.placeholder}
                                                        value={getValue(
                                                            char,
                                                            field.key
                                                        )}
                                                        oninput={(e) =>
                                                            setValue(
                                                                char,
                                                                field.key,
                                                                e.target.value
                                                            )}
                                                        readonly={!isEditing}
                                                    ></textarea>
                                                    {#if isEditing}
                                                        <button
                                                            class="spark-btn"
                                                            class:active={magicBusy[
                                                                field.key
                                                            ]}
                                                            onclick={() =>
                                                                handleConsult(
                                                                    field.key
                                                                )}
                                                            title="Auto-generate with AI"
                                                        >
                                                            {magicBusy[
                                                                field.key
                                                            ]
                                                                ? "..."
                                                                : "✨"}
                                                        </button>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div>
                                        {#each section.fields as field (field.key)}
                                            <div class="input-wrapper">
                                                <textarea
                                                    class="field"
                                                    placeholder={field.placeholder}
                                                    value={getValue(
                                                        char,
                                                        field.key
                                                    )}
                                                    oninput={(e) =>
                                                        setValue(
                                                            char,
                                                            field.key,
                                                            e.target.value
                                                        )}
                                                    readonly={!isEditing}
                                                ></textarea>
                                                {#if isEditing}
                                                    <button
                                                        class="spark-btn"
                                                        class:active={magicBusy[
                                                            field.key
                                                        ]}
                                                        onclick={() =>
                                                            handleConsult(
                                                                field.key
                                                            )}
                                                        title="Auto-generate with AI"
                                                    >
                                                        {magicBusy[field.key]
                                                            ? "..."
                                                            : "✨"}
                                                    </button>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    <footer>
                        {#if isEditing}
                            <Button
                                variant="edit"
                                onclick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        {:else}
                            <Button
                                variant="edit"
                                onclick={() => (isEditing = true)}>Edit</Button
                            >
                        {/if}
                    </footer>
                </main>
            </div>

            <!-- RIGHT WING (System) -->
            <aside class="wing right-wing">
                <div class="content">
                    <h3>SYSTEM</h3>
                    <div class="control-group">
                        <span class="label">UUID</span>
                        <code class="uuid">{entityId || char.id}</code>
                    </div>
                    <div class="control-group">
                        <Button
                            variant="danger"
                            size="sm"
                            onclick={handleDelete}>DELETE ENTITY</Button
                        >
                    </div>
                    <div class="control-group">
                        <details class="raw-data">
                            <summary>Raw Data</summary>
                            <pre>{JSON.stringify(char, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            </aside>
        </div>
    </Modal>
{/if}

<style lang="scss">
    /* Responsive Scaling for the Triptych Layout */
    @media (max-width: 105rem) {
        .profile-container {
            transform: scale(0.85);
            transform-origin: center;
        }
    }
    @media (max-width: 80rem) {
        .profile-container {
            transform: scale(0.7);
            transform-origin: center;
        }
    }

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

                .input-wrapper {
                    position: relative;
                    .spark-btn {
                        position: absolute;
                        bottom: 8px;
                        right: 8px;
                        background: rgba(0, 0, 0, 0.4);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.9rem;

                        &:hover {
                            background: var(--signature-color);
                            transform: scale(1.1);
                        }

                        &.active {
                            animation: spin 1s linear infinite;
                        }
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

    .profile-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md);
        transition: gap 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

        &.editing {
            gap: var(--spacing-lg);

            .wing {
                width: 25rem;
                opacity: 1;
                pointer-events: auto;
                transform: scale(1);
                filter: blur(0);
            }
        }
    }

    .wing {
        width: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: scale(0.9);
        filter: blur(10px);
        background: rgba(0, 0, 0, 0.4);
        border-radius: var(--spacing-lg);
        height: 30rem;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--ui-glass-border);

        .content {
            padding: var(--spacing-md);
            width: 16rem; /* Fixed width to prevent text reflow during transition */

            h3 {
                color: var(--app-muted);
                font-size: 0.8rem;
                letter-spacing: 0.1em;
                margin-bottom: var(--spacing-md);
                border-bottom: 1px solid var(--ui-glass-border);
                padding-bottom: var(--spacing-sm);
            }

            .control-group {
                margin-bottom: var(--spacing-md);

                label,
                .label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--app-muted);
                    margin-bottom: var(--spacing-xs);
                    cursor: pointer;
                }

                label span {
                    display: block;
                    margin-bottom: var(--spacing-xs);
                }

                input[type="color"] {
                    width: 100%;
                    height: 2.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-radius: var(--spacing-sm);
                }

                .uuid {
                    font-size: 0.7rem;
                    color: var(--app-muted);
                    word-break: break-all;
                }

                .raw-data {
                    margin-top: var(--spacing-md);
                    font-size: 0.7rem;
                    color: var(--app-muted);

                    summary {
                        cursor: pointer;
                        margin-bottom: var(--spacing-xs);
                        color: rgba(255, 255, 255, 0.5);
                        &:hover {
                            color: white;
                        }
                    }

                    pre {
                        background: rgba(0, 0, 0, 0.5);
                        padding: var(--spacing-sm);
                        border-radius: var(--spacing-sm);
                        overflow: auto;
                        max-height: 15rem;
                        color: var(--app-muted);
                    }
                }
            }
        }
    }
</style>
