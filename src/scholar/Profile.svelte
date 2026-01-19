<script>
    import DOMPurify from "dompurify"
    import Button from "../artificer/Button.svelte"
    import Modal from "../artificer/Modal.svelte"
    import { CONFIG } from "../gamemaster/config.js"
    import { app } from "../gamemaster/state.svelte.js"
    import { TextToImage } from "../mesmer/logic/text-to-image.js"
    import { themeStore } from "../mesmer/logic/theme.svelte.js"
    import ProfilePicture from "../mesmer/ui/ProfilePicture.svelte"
    import { entities } from "./database/repository.js"
    import { Scholar } from "./index.js"
    import { runtime } from "./runtime.svelte.js"

    // --- UTILS ---
    function formatMarkdownLite(text) {
        if (!text) return ""
        let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
        return html
    }

    let isEditing = $state(false)
    let isSaving = $state(false)

    function normalize() {
        char = themeStore.normalizeEntity(
            app.editingEntity || runtime.character
        )
    }

    let char = $state(
        themeStore.normalizeEntity(app.editingEntity || runtime.character)
    )

    // Logic for Visuals/Paint tools
    let visualPrompt = $state("")
    let visualBusy = $state(false)

    // Voice Logic

    let magicBusy = $state({})

    async function save() {
        isSaving = true
        try {
            const rawChar = JSON.parse(JSON.stringify(char))
            const type = rawChar.type || "character"
            await entities.upsert(type, rawChar)

            if (app.editingEntity && app.editingEntity.id === rawChar.id) {
                Object.assign(app.editingEntity, rawChar)
            }
            if (runtime.character.id === rawChar.id) {
                Object.assign(runtime.character, rawChar)
            }
            if (runtime.aiCharacter && runtime.aiCharacter.id === rawChar.id) {
                Object.assign(runtime.aiCharacter, rawChar)
            }
            if (
                runtime.storyFractal &&
                runtime.storyFractal.id === rawChar.id
            ) {
                Object.assign(runtime.storyFractal, rawChar)
            }

            isEditing = false
        } catch (e) {
            console.error("[RPGlitch] Failed to save character:", e)
            alert("Failed to save character.")
        } finally {
            isSaving = false
        }
    }

    async function deleteEntity() {
        if (!confirm("Are you sure?")) return
        try {
            await entities.remove(char.type, char.id)
            window.location.reload()
        } catch (e) {
            console.error("Delete failed:", e)
        }
    }

    $effect(() => {
        if (char?.id) {
            visualPrompt = ""
            magicBusy = {}
            isEditing = false
        }
    })

    // --- ACTIONS ---
    async function handlePaint() {
        try {
            visualBusy = true
            const url = await TextToImage.generate(visualPrompt, {
                resolution: "512x768",
                removeBackground: char.visuals.noBackground,
            })
            if (url) char.visuals.profilePictureUrl = url
        } catch (e) {
            console.error("Paint failed:", e)
        } finally {
            visualBusy = false
        }
    }

    async function consultScholar(field) {
        if (magicBusy[field]) return
        try {
            magicBusy[field] = true
            const result = await Scholar.consult(field, char)
            const keys = field.split(".")
            if (keys.length === 1) char[keys[0]] = result
            else if (keys.length === 2) {
                if (!char[keys[0]]) char[keys[0]] = {}
                char[keys[0]][keys[1]] = result
            }
        } catch (e) {
            console.error(`Magic failed for ${field}:`, e)
        } finally {
            magicBusy[field] = false
        }
    }

    function handleImplicitClose() {
        if (isEditing) {
            normalize()
            isEditing = false
        } else {
            app.toggleProfile(false)
        }
    }
</script>

{#if char && char.id}
    <Modal variant="canvas" onclose={handleImplicitClose}>
        <div
            class="orion-profile"
            style="--hero-color: {char.visuals.signatureColor}"
        >
            <!-- LEFT BLOCK: THE HERO SIDEBAR -->
            <aside class="hero-sidebar">
                <div class="avatar-container">
                    <ProfilePicture entity={char} />
                </div>

                {#if isEditing}
                    <div class="sidebar-tools">
                        <div class="color-picker-grid">
                            {#each Object.entries(CONFIG.PALETTE || {}) as [name, hex] (name)}
                                <button
                                    class="swatch"
                                    style="background: {hex}"
                                    class:active={char.visuals
                                        .signatureColor === hex}
                                    onclick={() =>
                                        (char.visuals.signatureColor = hex)}
                                ></button>
                            {/each}
                        </div>

                        <div class="visuals-draft">
                            <textarea
                                bind:value={visualPrompt}
                                placeholder="Paint description..."
                            ></textarea>
                            <Button
                                label={visualBusy ? "🎨 ..." : "🎨 Paint"}
                                onclick={handlePaint}
                                disabled={visualBusy}
                            />
                        </div>
                    </div>
                {/if}
            </aside>

            <!-- RIGHT BLOCK: THE DATA CONTENT -->
            <main class="content-area">
                <header class="profile-header">
                    {#if isEditing}
                        <textarea
                            class="name-edit"
                            bind:value={char.name}
                            rows="2"
                        ></textarea>
                    {:else}
                        <h1 class="name-display">{char.name}</h1>
                    {/if}
                    <textarea
                        class="tagline"
                        bind:value={char.description}
                        readonly={!isEditing}
                        placeholder="Identity Tagline"
                    ></textarea>
                </header>

                <section class="data-scroll">
                    <div class="dossier-grid">
                        <!-- Row: FOREVER -->
                        <div class="grid-row">
                            <div class="row-label">
                                <span class="main">FOREVER</span>
                                <span class="sub">Immutable Traits</span>
                            </div>
                            <div class="column-group">
                                <div class="category-header">NON-PHYSICAL</div>
                                {@render dataBox(
                                    char.eternal,
                                    "mental",
                                    "eternal.mental"
                                )}
                            </div>
                            <div class="column-group">
                                <div class="category-header">PHYSICAL</div>
                                {@render dataBox(
                                    char.eternal,
                                    "physical",
                                    "eternal.physical"
                                )}
                            </div>
                        </div>

                        <!-- Row: PRESENT -->
                        <div class="grid-row">
                            <div class="row-label">
                                <span class="main">PRESENT</span>
                                <span class="sub">Current State</span>
                            </div>
                            <div class="column-group">
                                {@render dataBox(
                                    char.present,
                                    "mental",
                                    "present.mental"
                                )}
                            </div>
                            <div class="column-group">
                                {@render dataBox(
                                    char.present,
                                    "physical",
                                    "present.physical"
                                )}
                            </div>
                        </div>

                        <!-- Row: PAST -->
                        <div class="grid-row full-width">
                            <div class="row-label">
                                <span class="main">PAST</span>
                                <span class="sub">Memories & History</span>
                            </div>
                            <div class="column-group">
                                {@render dataBox(char, "past", "past", 6)}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- FOOTER ACTIONS -->
                <footer class="profile-footer">
                    {#if isEditing}
                        <Button
                            label="Delete"
                            variant="danger"
                            onclick={deleteEntity}
                        />
                        <Button
                            label="Save"
                            variant="primary"
                            onclick={save}
                            disabled={isSaving}
                        />
                    {:else}
                        <Button
                            label="Edit Profile"
                            variant="secondary"
                            onclick={() => (isEditing = true)}
                        />
                    {/if}
                    <Button
                        label="Close"
                        variant="ghost"
                        onclick={handleImplicitClose}
                    />
                </footer>
            </main>
        </div>
    </Modal>
{/if}

{#snippet dataBox(parent, key, fieldKey, rows = 4)}
    <div class="data-box" class:editing={isEditing}>
        {#if isEditing}
            <textarea
                bind:value={parent[key]}
                {rows}
                disabled={magicBusy[fieldKey]}
            ></textarea>
            <button
                class="magic-trigger"
                onclick={() => consultScholar(fieldKey)}
                disabled={magicBusy[fieldKey]}
                title="Scholar Consult"
            >
                {magicBusy[fieldKey] ? "⏳" : "✨"}
            </button>
        {:else}
            <div class="read-only-content">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(
                    formatMarkdownLite(parent[key] || "")
                )}
            </div>
        {/if}
    </div>
{/snippet}

<style lang="scss">
    @use "../mesmer/scss/abstracts/variables" as *;
    @use "../mesmer/scss/abstracts/mixins" as *;

    .orion-profile {
        display: grid;
        grid-template-columns: 320px 1fr;
        width: 1300px;
        max-width: 95vw;
        height: 90vh;
        background: #0f172a;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        --hero-color: #ec4899;
        z-index: 10;
        position: relative;
    }

    /* SIDEBAR: Hero Color Block */
    .hero-sidebar {
        grid-column: 1;
        height: 100%;
        background: var(--hero-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        position: relative;
        z-index: 5;

        .avatar-container {
            width: 260px;
            height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 15px 40px rgba(0, 0, 0, 0.4));
            overflow: hidden;
            border-radius: 50%;
            border: 10px solid white;
            background: white;

            :global(.profile-picture) {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        .sidebar-tools {
            margin-top: $spacing-2xl;
            width: 100%;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(12px);
            padding: $spacing-xl;
            border-radius: 16px;
            color: white;

            .color-picker-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0.75rem;
                margin-bottom: $spacing-xl;

                .swatch {
                    aspect-ratio: 1;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition:
                        transform 0.2s,
                        border-color 0.2s;

                    &:hover {
                        transform: scale(1.1);
                    }

                    &.active {
                        border-color: white;
                        transform: scale(1.15);
                    }
                }
            }

            .visuals-draft {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;

                textarea {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    font-size: 0.9rem;
                    padding: 1rem;
                    border-radius: 10px;
                    resize: none;
                    min-height: 100px;
                    line-height: 1.5;

                    &::placeholder {
                        color: rgba(255, 255, 255, 0.4);
                    }
                }
            }
        }
    }

    /* CONTENT AREA: Dark Clean Terminal */
    .content-area {
        grid-column: 2;
        display: flex;
        flex-direction: column;
        padding: 5rem; /* Massive padding for dossiers */
        overflow: hidden;
        color: white;
        background: #0f172a;
        position: relative;
        z-index: 1;
        min-width: 0;

        .profile-header {
            margin-bottom: $spacing-2xl;
            padding-bottom: $spacing-xl;
            border-bottom: 2px solid rgba(255, 255, 255, 0.05);

            .name-display,
            .name-edit {
                font-family: var(--font-heading);
                font-size: 3.5rem;
                font-weight: 900;
                color: white; /* Changed to white for visibility */
                text-shadow: 0 0 20px rgba(var(--hero-color-rgb), 0.5);
                line-height: 1.1;
                text-transform: uppercase;
                margin-bottom: $spacing-sm;
                letter-spacing: -0.02em;
            }

            .name-edit {
                width: 100%;
                background: rgba(255, 255, 255, 0.03);
                border: 2px dashed var(--hero-color);
                border-radius: 12px;
                padding: 1rem;
                resize: none;
                outline: none;
            }

            .tagline {
                font-size: 1.25rem;
                color: rgba(255, 255, 255, 0.6);
                background: transparent;
                border: none;
                width: 100%;
                font-style: italic;
                outline: none;
                resize: none;
                padding: 0;
                line-height: 1.4;
            }
        }

        .data-scroll {
            flex: 1;
            overflow-y: auto;
            padding-right: $spacing-xl;

            &::-webkit-scrollbar {
                width: 8px;
            }
            &::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.02);
            }
            &::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                &:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            }
        }

        .dossier-grid {
            display: flex;
            flex-direction: column;
            gap: 4rem; /* Massive gap between sections */
            padding-bottom: 5rem;

            .grid-row {
                display: grid;
                grid-template-columns: 200px minmax(0, 1fr) minmax(0, 1fr);
                gap: 3rem; /* Generous gap between columns */

                &.full-width {
                    grid-template-columns: 200px minmax(0, 1fr);
                }
            }

            .row-label {
                display: flex;
                flex-direction: column;
                padding-top: $spacing-md;

                .main {
                    font-family: var(--font-heading);
                    font-size: 1.1rem;
                    font-weight: 900;
                    color: #38bdf8; /* Bright Blue (Sky-400) */
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                .sub {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.35);
                    text-transform: uppercase;
                    margin-top: 4px;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
            }

            .column-group {
                display: flex;
                flex-direction: column;
                gap: $spacing-md;

                .category-header {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.2);
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    padding-left: $spacing-xs;
                }
            }
        }

        .profile-footer {
            padding-top: $spacing-2xl;
            display: flex;
            gap: $spacing-xl;
            justify-content: flex-end;
            border-top: 1px solid rgba(255, 255, 255, 0.08);

            :global(button) {
                padding: $spacing-md $spacing-2xl;
                font-weight: 700;
                letter-spacing: 0.02em;

                &.secondary,
                &.btn-secondary {
                    background: var(--hero-color) !important;
                    border-color: var(--hero-color) !important;
                    color: white !important;
                }

                &.secondary:hover,
                &.btn-secondary:hover {
                    filter: brightness(1.1);
                }
            }
        }
    }

    .data-box {
        position: relative;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        padding: $spacing-xl;
        transition: all 0.25s ease;
        min-height: 100px;
        border: 1px solid rgba(255, 255, 255, 0.02);

        &:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.05);
        }

        &.editing {
            background: rgba(0, 0, 0, 0.4);
            border: 2px dashed rgba(255, 255, 255, 0.1);
        }

        textarea {
            width: 100%;
            background: transparent;
            border: none;
            color: white;
            font-size: 1rem;
            resize: vertical;
            outline: none;
            line-height: 1.5;
        }

        .read-only-content {
            font-size: 1rem;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.9);

            :global(strong) {
                color: white;
                font-weight: 800;
            }
            :global(em) {
                color: var(--hero-color);
                font-style: italic;
                font-weight: 500;
            }
        }

        .magic-trigger {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            opacity: 0.4;
            transition: all 0.2s;
            font-size: 1.2rem;

            &:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }

            &:disabled {
                opacity: 0.2;
                cursor: not-allowed;
            }
        }
    }

    @media (max-width: 1024px) {
        .orion-profile {
            width: 98vw;
            height: 95vh;
            grid-template-columns: 280px 1fr;
        }
        .hero-sidebar {
            padding: 2rem;
        }
    }

    @media (max-width: 768px) {
        .orion-profile {
            display: flex; /* Fallback to flex for mobile column stack */
            flex-direction: column;
            overflow-y: auto;
            border-radius: 0;
            width: 100vw;
            height: 100vh;
        }
        .hero-sidebar {
            width: 100%;
            height: auto;
            padding: $spacing-2xl;
        }
        .content-area {
            padding: $spacing-xl;
            height: auto;
            overflow: visible;

            .dossier-grid .grid-row {
                grid-template-columns: 1fr;
                gap: $spacing-md;
            }
        }
    }
</style>
