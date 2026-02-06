<script>
    import { PROFILE_SECTIONS } from "@data/config.js"
    import { themeStore } from "@mesmer/visuals/theme.svelte.js"
    import { app } from "@state/app.svelte.js"
    import { runtime } from "@state/runtime.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"
    import Modal from "@ui/molecules/Modal.svelte"
    import DevWing from "@ui/organisms/profile/DevWing.svelte"
    import VisualWing from "@ui/organisms/profile/VisualWing.svelte"
    import VoiceWing from "@ui/organisms/profile/VoiceWing.svelte"
    import { fitText } from "@ui/utils/actions/fitText.js"
    import DOMPurify from "dompurify"

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
                        if (s instanceof HTMLElement) {
                            s.style.height = "auto"
                            maxHeight = Math.max(maxHeight, s.scrollHeight)
                        }
                    })
                    siblings.forEach((s) => {
                        if (s instanceof HTMLElement) {
                            s.style.height = maxHeight + "px"
                        }
                    })
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
        flipped: false,
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
            visualOptions.flipped =
                char.visuals.flipped || char.visuals.flip || false
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

    // Resets active field when focus leaves interactive elements
    function handleFocusOut(e) {
        // We wait a tick to see where focus landed (e.g. clicking the 'Enhance' button)
        setTimeout(() => {
            const active = document.activeElement
            const isInput =
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                (active instanceof HTMLElement &&
                    active.contentEditable === "true")
            const isWing = active?.closest(".wing-left, .wing-right")

            // If we are definitely not focused on an input or a wing, reset the label
            // unless we are busy processing something (we don't want to lose context mid-ai call)
            if (!isInput && !isWing && !busyField) {
                activeField = { key: "visual-prompt", label: "Image Prompt" }
            }
        }, 50)
    }

    // --- MARKDOWN LITE ---
    function renderMarkdown(text) {
        if (!text) return ""
        // Bold: **text** -> <strong>text</strong>
        let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italics: *text* -> <em>text</em> (avoiding conflicts with bold)
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Newlines -> <br>
        html = html.replace(/\n/g, "<br>")

        return DOMPurify.sanitize(html)
    }

    // Handles clicking on the dossier background to reset focus/exit edit/close modal
    function handleBackgroundClick(e) {
        // If clicking something that is definitely NOT interactive dossier space
        // and NOT an input/button/wing, decide whether to exit edit or close modal
        if (
            !e.target.closest(
                "textarea, input, button, .swatch, .wing-left, .wing-right, .profile-presentation"
            )
        ) {
            if (isEditing) {
                isEditing = false
                activeField = { key: "visual-prompt", label: "Image Prompt" }
            } else {
                handleClose()
            }

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
            onfocusout={handleFocusOut}
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
                <div class="left">
                    <ProfilePicture entity={char} />
                </div>

                <main class="right">
                    <header class:is-editing={isEditing}>
                        {#if isEditing}
                            <h1
                                class="name edit"
                                aria-label="Edit Character Name"
                            >
                                <span
                                    contenteditable="true"
                                    bind:innerText={char.name}
                                    onfocus={() => {
                                        // Sacred Field: Do not set activeField.
                                        // Keeping enhancer focused on Visual Prompt or previous state.
                                    }}
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
                                oninput={(e) =>
                                    (char.description = e.target.value)}
                                placeholder="Entity Description"
                            ></textarea>
                        {:else}
                            <div
                                class="description readonly"
                                class:muted-info={!char.description}
                            >
                                {@html renderMarkdown(
                                    char.description ||
                                        "No description provided."
                                )}
                            </div>
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
                                            {#if isEditing}
                                                <textarea
                                                    use:autoResize={{
                                                        syncId: section.label,
                                                    }}
                                                    data-sync-id={section.label}
                                                    class="text-area"
                                                    class:edit={isEditing}
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
                                                        activeField = {
                                                            key: field.key,
                                                            label:
                                                                field.label ||
                                                                section.label,
                                                        }
                                                    }}
                                                    disabled={busyField ===
                                                        field.key}
                                                ></textarea>
                                            {:else}
                                                <div
                                                    class="text-area readonly"
                                                    class:muted-info={!getValue(
                                                        char,
                                                        field.key
                                                    )}
                                                    data-sync-id={section.label}
                                                >
                                                    {@html renderMarkdown(
                                                        getValue(
                                                            char,
                                                            field.key
                                                        ) || "Record undefined."
                                                    )}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <footer>
                        {#if isEditing}
                            <div class="footer-actions">
                                <Button
                                    variant="danger"
                                    className="profile-btn"
                                    onclick={handleDelete}
                                    disabled={isSaving}
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="edit"
                                    className="profile-btn"
                                    onclick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        {:else}
                            <Button
                                variant="edit"
                                className="profile-btn"
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
                    <DevWing bind:char {isEditing} />
                </aside>
            {/if}
        </div></Modal
    >
{/if}

<style lang="scss">
    @use "@theme/abstracts/variables" as vars;
    @use "@theme/abstracts/placeholders" as *;

    /* Winged Layout & Wings */
    .profile-container {
        display: flex;
        align-items: center; /* Restore: Independent vertical centering */
        justify-content: center;
        /* Gap removed to prevent whitespace from hidden wings */
        gap: 0;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        width: 100%;
        max-width: 100vw;
        padding: 0;

        &.editing .wing-left,
        &.editing .wing-right,
        &.show-dev-wing .wing-right {
            width: auto;
            min-width: 15rem;
            max-width: 24rem;
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
            filter: blur(0);
            /* Add spacing when visible */
            margin: 0 var(--spacing-l);
        }
    }

    .wing-left,
    .wing-right {
        width: 0;
        min-width: 0;
        max-width: 0; /* Animate this for smooth open/close */
        opacity: 0;
        overflow: hidden; /* FIX: Contain children (System Manifest) strictly */
        pointer-events: none;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: scale(0.9);
        filter: blur(10px);
        height: auto;
        max-height: 48rem; /* Restore: Cap height independently */
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        background: transparent;
        border: none;
        border-radius: var(--spacing-l);
    }

    /* Presentation Card */
    .profile-presentation {
        width: 50rem;
        max-width: 90vw;
        height: 48rem; /* Target desktop height */
        max-height: 85vh; /* Responsive safety */
        min-height: 20rem;
        position: relative;

        /* Dynamic Tints (Opaque) */
        /* Body: Frozen Pole + 15% Sig */
        --tint-base: color-mix(
            in oklab,
            var(--signature-color) 10%,
            var(--frozen-pole, #555d66)
        );

        /* Header/Footer: Gunmetal + 5% Sig */
        --tint-dark-surface: color-mix(
            in oklab,
            var(--signature-color) 10%,
            var(--gunmetal, #363840)
        );

        background-color: var(--tint-base);
        border: 0;
        border-radius: var(--spacing-l);
        display: grid;
        grid-template-columns: 35% 65%;
        overflow: hidden;
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
            background: var(--tint-dark-surface); /* Opaque match */
            overflow: hidden;
            transition: transform 0.4s ease;
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
                padding: var(--spacing-l);
                background: var(--tint-dark-surface);
                text-align: left;
                border-bottom: 0;
            }

            .name {
                width: 100%;
                color: var(--signature-color);
                font-size: var(
                    --font-size-xxxxxl
                ); /* Large base size for scaling */
                letter-spacing: -0.02em;
                text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                transition: all 0.2s;
                cursor: default;
                margin: 0;
                padding: 4px 0;
                text-align: left;
                border: 1px solid transparent;
                min-height: 1.1em;
                white-space: pre-wrap; /* Preserve spacing while editing */
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
                color: rgba(255, 255, 255, 0.9); /* Promoted from muted */
                font-family: inherit;
                font-size: 1rem; /* Promoted from 0.95rem */
                padding: 4px 0;
                margin: var(--spacing-xs) 0 0;
                line-height: 1.5; /* Better readability */
                min-height: 1.4em;
                cursor: default;
                transition: all 0.2s;
                border-radius: 0; /* User request: Square edges */
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
                            /* Luminance Boosting: Mix with white for visibility on dark hulls */
                            color: color-mix(
                                in srgb,
                                var(--signature-color),
                                white 40%
                            );
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
                            /* Luminance Boosting: High contrast for Physical/Mental labels */
                            color: color-mix(
                                in srgb,
                                var(--signature-color),
                                white 50%
                            );
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
                            pointer-events: auto; /* Enable scrolling */
                            text-wrap-style: pretty;

                            /* --- View Mode (Readonly but not busy) --- */
                            /* Should look clean and transparent */
                            &:read-only {
                                opacity: 1;
                                filter: none;
                                cursor: default;
                            }

                            /* --- System State (Busy/Disabled) --- */
                            /* Applies when LLM is writing or field is locked */
                            &:disabled {
                                opacity: 0.4;
                                filter: grayscale(100%) blur(0.5px);
                                cursor: wait;
                                background: rgba(0, 0, 0, 0.3);
                                color: var(--app-muted);
                                border: 1px dashed rgba(255, 255, 255, 0.1);
                                pointer-events: none; /* Lock interaction during generation/busy */
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
                                white-space: pre-wrap;
                                pointer-events: auto;
                                min-height: 4rem;
                                max-height: 24rem; /* Parity for scrolling */
                                overflow-y: auto; /* Parity for scrolling */
                                display: block;

                                :global(strong) {
                                    font-weight: 800;
                                    color: white;
                                    text-shadow: 0 0 10px
                                        rgba(var(--signature-rgb), 0.3);
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

            footer {
                margin-top: auto;
                display: flex;
                justify-content: flex-end;
                padding: var(--spacing-m) var(--spacing-l);
                background: var(--tint-dark-surface);
                border-top: 1px solid var(--glass-border);
                /* Removed backdrop-filter */
                z-index: 10;

                :global(.profile-btn.btn) {
                    height: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: var(--spacing-s) var(--spacing-xl);
                    transition: all 0.3s ease;
                    min-width: 10rem;
                    width: calc((100% - 100px) / 2 - var(--spacing-s));
                }

                .footer-actions {
                    display: flex;
                    gap: var(--spacing-m);
                    justify-content: end;
                    width: 100%;

                    :global(.btn-danger) {
                        background: transparent;
                        border-color: rgba(255, 255, 255, 0.1);
                        color: var(--app-muted);
                        box-shadow: none;
                        transition: all 0.3s ease;
                        width: calc((100% - 100px) / 2 - var(--spacing-m));

                        &:hover {
                            background: var(--app-del);
                            border-color: var(--app-del);
                            color: white;
                            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
                            filter: brightness(1.2);
                        }
                    }
                }

                :global(.btn-edit) {
                    background: var(--signature-color);
                    color: white;
                    box-shadow: 0 4px 15px
                        color-mix(
                            in oklab,
                            var(--signature-color) 40%,
                            transparent
                        );

                    &:hover {
                        filter: brightness(1.1);
                        transform: translateY(-1px);
                        box-shadow: 0 6px 20px
                            color-mix(
                                in oklab,
                                var(--signature-color) 60%,
                                transparent
                            );
                    }
                }
            }
        }
    }
</style>
