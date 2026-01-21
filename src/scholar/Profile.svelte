<script>
    import Button from "../artificer/Button.svelte"
    import Modal from "../artificer/Modal.svelte"
    import { CONFIG } from "../gamemaster/config.js"
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
    let promptText = $state("") // Unified text field
    let fileInput = $state() // Reference to hidden input
    let visualOptions = $state({
        noBackground: false,
        flip: false,
    })
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

    // Sync specific visual options from character
    $effect(() => {
        if (char?.visuals) {
            visualOptions.noBackground = char.visuals.noBackground || false
            visualOptions.flip = char.visuals.flip || false
        }
    })

    // Utility: Check if text is URL
    function isUrl(text) {
        return text && (text.startsWith("http") || text.startsWith("data:"))
    }

    function handleClose() {
        app.toggleProfile(false)
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

    // --- LEFT WING LOGIC ---

    // 1. Extract: Pull visual description from character data
    function handleExtract() {
        const physical = char.physical || char.description || ""
        const tags = char.tags ? char.tags.join(", ") : ""
        promptText = [physical, tags].filter(Boolean).join(". ")
    }

    // 2. Upload: Handle file selection
    async function handleUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        try {
            visualBusy = true
            const url = await TextToImage.upload(file)
            if (url) {
                char.visuals = char.visuals || {}
                char.visuals.profilePictureUrl = url
                promptText = "" // Clear after successful upload
            }
        } catch (err) {
            console.error("Upload failed:", err)
        } finally {
            visualBusy = false
        }
    }

    // 3. Save URL: Commit the URL in the text field
    function handleSaveUrl() {
        if (isUrl(promptText)) {
            char.visuals = char.visuals || {}
            char.visuals.profilePictureUrl = promptText
            promptText = "" // Clear after save? Or keep? User didn't specify. Clearing feels cleaner.
        }
    }

    // 4. Enhance: Polish the prompt with AI
    async function handleEnhance() {
        if (!promptText || isUrl(promptText)) return
        try {
            visualBusy = true
            // Mocking an "Enhance" call - In reality, this would be a specific LLM call
            // For now, we'll pretend by consulting the Scholar for a refinement
            // OR we can just use the existing generic consult if adapted.
            // Let's assume we pass it to Scholar to "refine"
            const enhanced = await Scholar.consult("visual_refinement", {
                ...char,
                userPrompt: promptText,
            })
            if (enhanced) promptText = enhanced
        } catch (e) {
            console.error("Enhance failed:", e)
        } finally {
            visualBusy = false
        }
    }

    // 5. Generate: Create image from text
    async function handleGenerate() {
        if (!promptText || isUrl(promptText)) return
        try {
            visualBusy = true
            const url = await TextToImage.generate(promptText, {
                resolution: "512x768",
                removeBackground: visualOptions.noBackground,
            })
            if (url) {
                char.visuals = char.visuals || {}
                char.visuals.profilePictureUrl = url
            }
        } catch (e) {
            console.error("Generation failed:", e)
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
        <div
            class="profile-container"
            class:editing={isEditing}
            class:dev-mode={app.settings.devMode}
        >
            <aside class="wing-left">
                <div class="content">
                    <div class="group">
                        <div class="color-picker">
                            {#each Object.entries(CONFIG.PALETTE) as [name, hex] (name)}
                                <button
                                    class="swatch-dot"
                                    class:active={(char.visuals
                                        ?.signatureColor || signatureColor) ===
                                        hex}
                                    style="background-color: {hex}"
                                    onclick={() => {
                                        char.visuals = char.visuals || {}
                                        char.visuals.signatureColor = hex
                                    }}
                                    aria-label="Select {name}"
                                ></button>
                            {/each}
                        </div>
                    </div>

                    <div class="group">
                        <textarea
                            class="visual-prompt"
                            bind:value={promptText}
                            placeholder="Describe appearance, or paste an image URL..."
                            disabled={!isEditing || visualBusy}
                            rows="3"
                        ></textarea>
                        <input
                            type="file"
                            accept="image/*"
                            style="display: none;"
                            bind:this={fileInput}
                            onchange={handleUpload}
                        />
                    </div>
                    <div class="group-row">
                        {#if !promptText}
                            <!-- EMPTY STATE -->
                            <Button
                                variant="secondary"
                                size="sm"
                                onclick={handleExtract}
                                disabled={!isEditing || visualBusy}
                            >
                                Extract
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onclick={() => fileInput.click()}
                                disabled={!isEditing || visualBusy}
                            >
                                {visualBusy ? "Uploading..." : "Upload"}
                            </Button>
                        {:else if isUrl(promptText)}
                            <!-- URL STATE -->
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={true}
                            >
                                Enhance
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onclick={handleSaveUrl}
                                disabled={!isEditing || visualBusy}
                            >
                                Save URL
                            </Button>
                        {:else}
                            <!-- TEXT STATE -->
                            <Button
                                variant="primary"
                                size="sm"
                                onclick={handleEnhance}
                                disabled={!isEditing || visualBusy}
                            >
                                {visualBusy ? "Enhancing..." : "Enhance"}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onclick={handleGenerate}
                                disabled={!isEditing || visualBusy}
                            >
                                {visualBusy ? "Generating..." : "Generate"}
                            </Button>
                        {/if}
                    </div>
                    <div class="group-row">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={visualOptions.noBackground}
                                disabled={!isEditing}
                                onchange={() => {
                                    char.visuals = char.visuals || {}
                                    char.visuals.noBackground =
                                        visualOptions.noBackground
                                }}
                            />
                            <span>No Background</span>
                        </label>
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={visualOptions.flip}
                                disabled={!isEditing}
                                onchange={() => {
                                    char.visuals = char.visuals || {}
                                    char.visuals.flip = visualOptions.flip
                                }}
                            />
                            <span>Flip Image</span>
                        </label>
                    </div>

                    <div class="dropdown">
                        <button class="dropbtn" type="button"
                            >Voice: {char?.voiceId || "Default"}</button
                        >
                        <div class="dropdown-content">
                            <input
                                type="text"
                                placeholder="Change voice ID..."
                                bind:value={char.voiceId}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </div>
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
                    <header>
                        <h1 class="char-name">
                            {char.name || "Unnamed Entity"}
                        </h1>
                        {#if char.description}
                            <p>{char.description}</p>
                        {:else}
                            <p class="muted-info">No description provided.</p>
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
                                                class="text-area"
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
    /* Triptych Layout & Wings */
    .profile-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md);
        transition: gap 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

        &.editing {
            gap: var(--spacing-lg);

            .wing-left,
            .wing-right {
                min-width: 10rem;
                max-width: 20rem;
                opacity: 1;
                pointer-events: auto;
                transform: scale(1);
                filter: blur(0);
            }
        }
    }

    .wing-left,
    .wing-right {
        width: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: scale(0.9);
        filter: blur(10px);
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid var(--ui-glass-border);
        border-radius: var(--spacing-lg);
        height: 38rem;
        display: flex;
        flex-direction: column;

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
        }
    }

    /* Left Wing Specifics */
    .wing-left {
        .group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }

        .visual-prompt {
            width: 100%;
            min-height: 8rem;
            padding: var(--spacing-sm);
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--ui-glass-border);
            color: white;
            border-radius: var(--spacing-sm);
            font-size: 0.9rem;
            font-family: inherit;
            resize: none;
            transition: all 0.3s ease;

            &:focus:not(:disabled) {
                background: rgba(0, 0, 0, 0.5);
                border-color: var(--signature-color);
                box-shadow: 0 0 15px
                    color-mix(in oklab, var(--signature-color) 20%, transparent);
                outline: none;
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }

        .color-picker {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;

            .swatch-dot {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.2);
                cursor: pointer;
                transition: all 0.2s;

                &:hover:not(:disabled) {
                    transform: scale(1.1);
                    border-color: rgba(255, 255, 255, 0.5);
                }

                &.active {
                    border-color: white;
                    transform: scale(1.2);
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
                }

                &:disabled {
                    cursor: not-allowed;
                    opacity: 0.3;
                }
            }
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            cursor: pointer;
            font-size: 0.85rem;
            color: var(--app-muted);

            input[type="checkbox"] {
                margin: 0;
            }

            &:hover:not(:has(input:disabled)) {
                color: white;
            }
        }

        /* Voice Dropdown Polish */
        .dropdown {
            position: relative;
            width: 100%;
            grid-column: span 2;

            .dropbtn {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ui-glass-border);
                color: var(--app-muted);
                padding: var(--spacing-sm);
                border-radius: var(--spacing-sm);
                font-size: 0.85rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
            }

            &:hover .dropdown-content {
                display: block;
            }

            .dropdown-content {
                display: none;
                position: absolute;
                bottom: 100%;
                left: 0;
                width: 100%;
                background: var(--card-background);
                border: 1px solid var(--ui-glass-border);
                border-radius: var(--spacing-sm);
                padding: var(--spacing-sm);
                margin-bottom: var(--spacing-xs);
                z-index: 10;
                box-shadow: var(--shadow-lg);

                input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--ui-glass-border);
                    color: white;
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: var(--spacing-xs);
                    font-size: 0.8rem;

                    &:focus {
                        outline: none;
                        border-color: var(--signature-color);
                    }
                }
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
        height: 38rem;
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
            overflow: scroll;

            header {
                padding: var(--spacing-lg);
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                text-align: left;
            }

            .char-name {
                color: var(--signature-color);
                font-size: 2.8rem;
                font-weight: 800;
                margin: 0;
                line-height: 1;
                letter-spacing: -0.02em;
                text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            }

            p {
                margin: var(--spacing-xs) 0 0;
                font-size: 0.95rem;
                color: var(--app-muted);
                line-height: 1.4;

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
                            height: 100%;
                            min-height: 8rem;
                            background: rgba(255, 255, 255, 0.03);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: var(--spacing-sm);
                            color: white;
                            padding: var(--spacing-sm);
                            font-family: inherit;
                            font-size: 0.85rem;
                            line-height: 1.5;
                            resize: vertical;
                            transition: all 0.2s;

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

                            &[readonly] {
                                cursor: default;
                            }
                        }

                        .spark-btn {
                            position: absolute;
                            top: var(--spacing-xs);
                            right: var(--spacing-xs);
                            background: rgba(0, 0, 0, 0.4);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            color: white;
                            width: 26px;
                            height: 26px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-size: 0.8rem;
                            opacity: 0;

                            &:hover {
                                background: var(--signature-color);
                                transform: scale(1.1);
                            }

                            &.active {
                                opacity: 1;
                                animation: spin 1s linear infinite;
                            }
                        }

                        &:hover .spark-btn {
                            opacity: 1;
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

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
