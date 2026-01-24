<script>
    import Button from "../artificer/Button.svelte"
    import Modal from "../artificer/Modal.svelte"
    import { app } from "../gamemaster/state.svelte.js"
    import { themeStore } from "../mesmer/logic/theme.svelte.js"
    import ProfilePicture from "../mesmer/ui/ProfilePicture.svelte"
    import VisualWing from "../mesmer/ui/VisualWing.svelte"
    import VoiceWing from "../mesmer/ui/VoiceWing.svelte"
    import { PROFILE_SECTIONS } from "./config.js"
    import { runtime } from "./runtime.svelte.js"

    let { entityId, entityType } = $props()

    /**
     * Svelte 5 Action: Auto-resize textarea to fit content and sync heights with row siblings.
     */
    function autoResize(node, options = {}) {
        let frame
        const update = () => {
            if (frame) cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                node.style.height = "auto"
                const height = node.scrollHeight
                node.style.height = height + "px"

                // Synchronization logic for rows
                if (options.syncId) {
                    const siblings = document.querySelectorAll(
                        `[data-sync-id="${options.syncId}"]`
                    )
                    let maxHeight = 0
                    siblings.forEach((s) => {
                        s.style.height = "auto"
                        maxHeight = Math.max(maxHeight, s.scrollHeight)
                    })
                    siblings.forEach((s) => (s.style.height = maxHeight + "px"))
                }
            })
        }
        node.addEventListener("input", update)
        const observer = new ResizeObserver(update)
        observer.observe(node)
        update()
        return {
            destroy() {
                if (frame) cancelAnimationFrame(frame)
                node.removeEventListener("input", update)
                observer.disconnect()
            },
        }
    }

    // State
    let isEditing = $state(false)
    let isSaving = $state(false)
    let busyField = $state(null) // String key of field being AI-processed
    let activeField = $state({ key: "visual-prompt", label: "Image Prompt" })

    let visualOptions = $state({
        noBackground: false,
        flip: false,
    })

    // Character data
    let char = $state(
        themeStore.normalizeEntity(app.editingEntity || runtime.character)
    )

    // Ensure prompt exists for CreativeWing
    $effect(() => {
        if (char.visuals && !char.visuals.prompt) {
            char.visuals.prompt = ""
        }
    })

    // Visuals: Bind directly to character data, fallback for display
    let signatureColor = $derived(
        char.visuals?.signatureColor || themeStore.getSignatureColor(char)
    )
    let signatureRgb = $derived(themeStore.hexToRgb(signatureColor))

    // Sync specific visual options from character
    $effect(() => {
        if (char?.visuals) {
            visualOptions.noBackground = char.visuals.noBackground || false
            visualOptions.flip = char.visuals.flip || false
        }
    })

    // Reset focus tracking when exiting edit mode
    $effect(() => {
        if (!isEditing) {
            activeField = { key: "visual-prompt", label: "Image Prompt" }
        }
    })

    function handleClose() {
        if (isEditing) {
            isEditing = false
        } else {
            app.toggleProfile(false)
        }
    }

    async function handleSave() {
        isEditing = false
        isSaving = true
        try {
            await runtime.saveEntity(entityType || "character", char)
        } catch (err) {
            console.error("Failed to save profile:", err)
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

    // --- UTILITIES ---

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

    // Handles clicking on the dossier background to reset focus
    function handleBackgroundClick(e) {
        if (!isEditing) return

        // If clicking something that is definitely NOT interactive dossier space
        // and NOT an input/button, reset to prompt
        if (!e.target.closest("textarea, input, button, .swatch")) {
            activeField = { key: "visual-prompt", label: "Image Prompt" }

            // Explicitly blur any focused element to remove browser highlight
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
            }
        }
    }
</script>

{#if char && char.id}
    <Modal variant="profile" onclose={handleClose}>
        <div
            class="profile-container"
            class:editing={isEditing}
            class:dev-mode={app.settings.devMode}
            class:show-dev-wing={app.settings.devMode}
            onclick={handleBackgroundClick}
            role="presentation"
        >
            <aside class="wing-left">
                <VisualWing
                    bind:char
                    {isEditing}
                    bind:busyField
                    bind:activeField
                />
                <VoiceWing bind:char {isEditing} />
            </aside>

            <div
                class="profile-presentation"
                style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
            >
                <div
                    class="left"
                    style:transform={visualOptions.flip ? "scaleX(-1)" : ""}
                >
                    <ProfilePicture entity={char} />
                </div>

                <main class="right">
                    <header class:is-editing={isEditing}>
                        {#if isEditing}
                            <input
                                class="char-name-input"
                                bind:value={char.name}
                                placeholder="Entity Name"
                                onfocus={() =>
                                    (activeField = {
                                        key: "name",
                                        label: "Name",
                                    })}
                            />
                            <textarea
                                use:autoResize
                                class="char-description-input"
                                bind:value={char.description}
                                placeholder="Entity Description"
                                onfocus={() =>
                                    (activeField = {
                                        key: "description",
                                        label: "Description",
                                    })}
                            ></textarea>
                        {:else}
                            <h1 class="char-name">
                                {char.name || "Unnamed Entity"}
                            </h1>
                            <textarea
                                use:autoResize
                                class="char-description"
                                class:muted-info={!char.description}
                                readonly
                                value={char.description ||
                                    "No description provided."}
                                tabindex="-1"
                            ></textarea>
                        {/if}
                    </header>

                    <div class="content">
                        {#each PROFILE_SECTIONS as section (section.label)}
                            <div class="row">
                                <div class="label">
                                    <h2>{section.label}</h2>
                                    <p>{section.sublabel}</p>
                                </div>

                                <div
                                    class={section.layout === "split"
                                        ? "split"
                                        : "full"}
                                >
                                    {#each section.fields as field (field.key)}
                                        <div class="field-group">
                                            {#if field.label}
                                                <span class="field-label"
                                                    >{field.label}</span
                                                >
                                            {/if}
                                            <textarea
                                                use:autoResize={{
                                                    syncId: section.label,
                                                }}
                                                data-sync-id={section.label}
                                                class="text-area"
                                                class:active={isEditing &&
                                                    activeField.key ===
                                                        field.key}
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
                                                onfocus={() => {
                                                    if (isEditing) {
                                                        activeField = {
                                                            key: field.key,
                                                            label:
                                                                field.label ||
                                                                section.label,
                                                        }
                                                    }
                                                }}
                                                tabindex={isEditing ? 0 : -1}
                                                readonly={!isEditing ||
                                                    busyField === field.key}
                                                disabled={busyField ===
                                                    field.key}
                                                onwheel={(e) => {
                                                    const target =
                                                        e.currentTarget
                                                    const isScrollable =
                                                        target.scrollHeight >
                                                        target.clientHeight
                                                    if (isScrollable) {
                                                        e.stopPropagation()
                                                    }
                                                }}
                                            ></textarea>
                                        </div>
                                    {/each}
                                </div>
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
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        {:else}
                            <Button
                                variant="edit"
                                onclick={() => (isEditing = true)}
                            >
                                Edit
                            </Button>
                        {/if}
                    </footer>
                </main>
            </div>

            <!-- RIGHT WING (Dev Mode / System) -->
            {#if app.settings.devMode}
                <aside class="wing-right">
                    <div class="content">
                        <div class="group-row">
                            <span class="label">UUID</span>
                            <code class="uuid">{entityId || char.id}</code>
                        </div>
                        <div class="group-row">
                            <Button
                                variant="danger"
                                size="sm"
                                disabled={!isEditing}
                                onclick={handleDelete}>DELETE ENTITY</Button
                            >
                        </div>
                        <hr />
                        <div class="group-row">
                            <details class="raw-data">
                                <summary>Raw Data Explorer</summary>
                                <pre>{JSON.stringify(char, null, 2)}</pre>
                            </details>
                        </div>
                    </div>
                </aside>
            {/if}
        </div></Modal
    >
{/if}

<style lang="scss">
    /* Winged Layout & Wings */
    .profile-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md);
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        width: 100%;
        max-width: 100vw;
        padding: 0 var(--spacing-lg);

        &.editing,
        &.show-dev-wing {
            gap: var(--spacing-lg);
        }

        &.editing .wing-left,
        &.editing .wing-right,
        &.show-dev-wing .wing-right {
            min-width: 15rem;
            max-width: 24rem;
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
            filter: blur(0);
        }
    }

    .wing-left,
    .wing-right {
        width: 0;
        opacity: 0;
        overflow: visible; /* Allow tooltips and stack behavior */
        pointer-events: none;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: scale(0.9);
        filter: blur(10px);
        height: auto;
        max-height: 48rem;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .wing-left {
        background: transparent; /* Panels have their own background */
        border: none;
        border-radius: 0;
    }

    .wing-right {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid var(--ui-glass-border);
        border-radius: var(--spacing-lg);
    }

    /* Right Wing (Dev Tools) */
    .wing-right {
        .content {
            padding: var(--spacing-lg);
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }

        .group-row {
            display: grid;
            grid-template-columns: 80px 1fr;
            gap: var(--spacing-sm);
            align-items: center;

            .label {
                font-size: 0.7rem;
                font-weight: 800;
                color: var(--app-muted);
                text-transform: uppercase;
            }

            .uuid {
                font-family: monospace;
                font-size: 0.8rem;
                color: var(--signature-color);
                opacity: 0.8;
            }
        }

        hr {
            border: none;
            border-top: 1px dashed rgba(255, 255, 255, 0.1);
            margin: var(--spacing-sm) 0;
        }

        .raw-data {
            summary {
                cursor: pointer;
                font-size: 0.8rem;
                color: var(--app-muted);
                margin-bottom: var(--spacing-xs);

                &:hover {
                    color: white;
                }
            }

            pre {
                background: rgba(0, 0, 0, 0.3);
                padding: var(--spacing-sm);
                border-radius: var(--spacing-sm);
                font-size: 0.75rem;
                max-height: 18rem;
                overflow: auto;
                color: var(--app-muted);
            }
        }
    }

    /* Right Wing Specifics (Dev Tools) */
    .wing-right {
        .group-row {
            .label {
                font-size: 0.7rem;
                font-weight: 800;
                color: var(--app-muted);
                text-transform: uppercase;
            }

            .uuid {
                font-family: monospace;
                font-size: 0.8rem;
                color: var(--signature-color);
                opacity: 0.8;
            }
        }

        hr {
            border: none;
            border-top: 1px dashed rgba(255, 255, 255, 0.1);
            margin: var(--spacing-sm) 0;
        }

        .raw-data {
            summary {
                cursor: pointer;
                font-size: 0.8rem;
                color: var(--app-muted);
                margin-bottom: var(--spacing-xs);

                &:hover {
                    color: white;
                }
            }

            pre {
                background: rgba(0, 0, 0, 0.3);
                padding: var(--spacing-sm);
                border-radius: var(--spacing-sm);
                font-size: 0.75rem;
                max-height: 18rem;
                overflow: auto;
                color: var(--app-muted);
            }
        }
    }

    /* Presentation Card */
    .profile-presentation {
        width: 50rem;
        max-width: 90vw;
        height: 48rem; /* Target desktop height */
        max-height: 85vh; /* Responsive safety */
        min-height: 20rem;
        position: relative;
        background-color: color-mix(
            in oklab,
            var(--signature-color) 12%,
            var(--card-background, #1a1c1e) 88%
        );
        border: 1px solid var(--ui-glass-border, rgba(255, 255, 255, 0.1));
        border-radius: var(--spacing-lg);
        display: grid;
        grid-template-columns: 35% 65%;
        overflow: hidden;
        backdrop-filter: blur(25px);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.05) 0%,
                transparent 50%,
                rgba(0, 0, 0, 0.1) 100%
            );
            pointer-events: none;
        }

        .left {
            height: 100%;
            background: rgba(0, 0, 0, 0.2);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.4s ease;

            :global(.profile-picture) {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        .right {
            display: flex;
            flex-direction: column;
            overflow-y: scroll;
            overflow-x: hidden;

            /* Custom Scrollbar */
            &::-webkit-scrollbar {
                width: 6px;
            }
            &::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
            }
            &::-webkit-scrollbar-thumb {
                background: color-mix(
                    in oklab,
                    var(--signature-color) 30%,
                    transparent
                );
                border-radius: 10px;
            }

            header {
                padding: var(--spacing-lg);
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                text-align: left;
            }

            .char-name {
                color: var(--signature-color);
                font-family: inherit;
                font-size: 2.8rem;
                font-weight: 800;
                margin: 0;
                line-height: 1;
                letter-spacing: -0.02em;
                text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                border: 1px solid transparent; /* Box model stabilization */
                padding: 0;
            }

            .char-name-input {
                width: 100%;
                background: transparent;
                border: 1px dashed rgba(255, 255, 255, 0.1);
                border-radius: var(--spacing-sm);
                color: var(--signature-color);
                font-family: inherit;
                font-size: 2.8rem;
                font-weight: 800;
                padding: 0;
                margin: 0;
                line-height: 1;
                letter-spacing: -0.02em;
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
                display: block;

                &:focus {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--signature-color);
                    border-style: solid;
                }
            }

            .char-description-input {
                width: 100%;
                background: transparent;
                border: 1px dashed rgba(255, 255, 255, 0.05);
                border-radius: var(--spacing-sm);
                color: var(--app-muted);
                font-family: inherit;
                font-size: 0.95rem;
                padding: 0;
                margin: var(--spacing-xs) 0 0; /* Align with P margin */
                resize: none;
                outline: none;
                transition: all 0.2s;
                line-height: 1.4;
                min-height: 1.4em; /* Lock height */
                box-sizing: border-box;
                display: block;
                overflow: hidden;

                &:focus {
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                    border-style: solid;
                    background: rgba(255, 255, 255, 0.01);
                }
            }

            .char-description {
                width: 100%;
                background: transparent;
                border: 1px solid transparent; /* Box model stabilization */
                color: var(--app-muted);
                font-family: inherit;
                font-size: 0.95rem;
                padding: 0;
                margin: var(--spacing-xs) 0 0;
                resize: none;
                outline: none;
                line-height: 1.4;
                min-height: 1.4em;
                box-sizing: border-box;
                display: block;
                overflow: hidden;
                cursor: default;

                &.muted-info {
                    font-style: italic;
                    opacity: 0.5;
                }
            }

            .content {
                flex: 1;
                overflow: visible;
                padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
                mask-image: linear-gradient(
                    to bottom,
                    transparent,
                    black var(--spacing-md),
                    black calc(100% - var(--spacing-md)),
                    transparent
                );

                .row {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    gap: var(--spacing-sm-md);

                    .label {
                        text-align: right;
                        align-self: center;
                        padding-top: var(--spacing-xs);

                        h2 {
                            margin: 0;
                            font-size: 1rem;
                            font-weight: 700;
                            color: var(--signature-color);
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }

                        p {
                            margin: 0;
                            font-size: 0.75rem;
                            color: rgba(255, 255, 255, 0.9);
                            font-weight: 500;
                            letter-spacing: 0.02em;
                        }
                    }

                    .split,
                    .full {
                        display: grid;
                        gap: var(--spacing-md);
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
                        gap: var(--spacing-sm-md);

                        .field-label {
                            font-size: 0.65rem;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 0.1em;
                            color: var(--signature-color);
                            opacity: 0.8;
                            margin-left: 2px;
                            text-align: center;
                        }

                        .text-area {
                            width: 100%;
                            height: auto;
                            min-height: 4rem;
                            max-height: 24rem; /* Cap expansion */
                            overflow-y: auto !important; /* Allow internal scroll if capped */
                            background: rgba(255, 255, 255, 0.03);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: var(--spacing-sm);
                            color: white;
                            padding: var(--spacing-sm);
                            font-family: inherit;
                            font-size: 0.85rem;
                            line-height: 1.5;
                            resize: none;
                            transition: all 0.2s;

                            &.active:not([readonly]) {
                                border-color: color-mix(
                                    in oklab,
                                    var(--signature-color) 50%,
                                    transparent
                                );
                                background: rgba(255, 255, 255, 0.05);
                            }

                            &:focus:not([readonly]) {
                                background: rgba(255, 255, 255, 0.07);
                                border-color: var(--signature-color);
                                outline: none;
                                box-shadow: 0 0 0 2px
                                    color-mix(
                                        in oklab,
                                        var(--signature-color) 20%,
                                        transparent
                                    );
                            }

                            &:focus {
                                outline: none;
                            }

                            &[readonly] {
                                cursor: default;
                            }

                            &:disabled {
                                cursor: wait;
                                opacity: 0.8;
                            }
                        }
                    }
                }
            }

            footer {
                margin-top: auto;
                display: flex;
                justify-content: flex-end;
                padding: var(--spacing-md) var(--spacing-lg);
                background: rgba(0, 0, 0, 0.3);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(15px);
                z-index: 10;

                :global(.btn-edit) {
                    background: var(--signature-color) !important;
                    color: white !important;
                    font-weight: 700 !important;
                    box-shadow: 0 4px 15px
                        color-mix(
                            in oklab,
                            var(--signature-color) 40%,
                            transparent
                        ) !important;

                    &:hover {
                        filter: brightness(1.1);
                        transform: translateY(-1px);
                    }
                }
            }
        }
    }
</style>
