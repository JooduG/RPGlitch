<script>
    import { entities } from "@/data/repository.js"
    import { app } from "@state/app.svelte.js"
    import { runtime } from "@state/runtime.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"
    import Modal from "@ui/molecules/dialogs/Modal.svelte"
    import DOMPurify from "dompurify"
    // Modular Components
    import ProfileFooter from "./ProfileFooter.svelte"
    import ProfileFragments from "./ProfileFragments.svelte"
    import ProfileHeader from "./ProfileHeader.svelte"
    import ProfileWings from "./ProfileWings.svelte"

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
                    const siblings = document.querySelectorAll(`[data-sync-id="${options.syncId}"]`)
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

    $effect(() => {})
    let isSaving = $state(false)
    let busyFields = $state(new Set())
    let activeField = $state({ key: "visual-prompt", label: "Image Prompt" })

    // Character data
    let char = $state(themeStore.normalizeEntity(app.editingEntity || runtime.character))

    // Ensure prompt exists for CreativeWing
    $effect(() => {
        if (char.visuals && !char.visuals.prompt) {
            char.visuals.prompt = ""
        }
    })

    // Visuals: Bind directly to character data
    let signature_color = $derived(char.visuals?.signature_color || themeStore.getSignatureColor(char))
    let signatureRgb = $derived(themeStore.hexToRgb(signature_color))

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

            // [FIX] SYNC STORYBOARD STATE
            // If we are in Lobby, we must refresh the lists and selection
            if (app.view === "lobby") {
                const eid = char.id
                // 1. Refresh Lists
                const [ais, users, fractals] = await Promise.all([entities.list("character"), entities.list("character"), entities.list("fractal")])
                app.aiList = ais
                app.userList = users
                app.fractalList = fractals

                // 2. Refresh Selection if matches
                if (app.selectedAi?.id === eid) {
                    const fresh = ais.find((e) => e.id === eid)
                    if (fresh) app.selectedAi = fresh
                }
                if (app.selectedUser?.id === eid) {
                    const fresh = users.find((e) => e.id === eid)
                    if (fresh) app.selectedUser = fresh
                }
                if (app.selectedFractal?.id === eid) {
                    const fresh = fractals.find((e) => e.id === eid)
                    if (fresh) app.selectedFractal = fresh
                }
            }
        } catch (err) {
            console.error("Failed to save profile:", err)
            isEditing = true
        } finally {
            isSaving = false
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this entity?")) return

        try {
            await runtime.deleteEntity(entityType || "character", entityId || char.id)
            handleClose()
        } catch (err) {
            console.error("Failed to delete entity:", err)
        }
    }

    // --- UTILITIES ---
    function getValue(obj, path) {
        if (!path) return ""
        return path.split(".").reduce((acc, part) => acc && acc[part], obj) || ""
    }

    function setValue(obj, path, val) {
        const keys = path.split(".")
        const last = keys.pop()
        const target = keys.reduce((acc, key) => (acc[key] = acc[key] || {}), obj)

        // Handle Array Fields (Unified Vector Architecture)
        if (path === "past" || path === "future") {
            if (Array.isArray(val)) {
                target[last] = val
            } else {
                const arr = val
                    .split("\n")
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0)
                target[last] = arr
            }
        } else {
            target[last] = val
        }
    }

    function handleFocusOut(e) {
        setTimeout(() => {
            const active = document.activeElement
            const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active instanceof HTMLElement && active.contentEditable === "true")
            const isWing = active?.closest(".wing-left, .wing-right")
            if (!isInput && !isWing && busyFields.size === 0) {
                activeField = { key: "visual-prompt", label: "Image Prompt" }
            }
        }, 50)
    }

    function renderMarkdown(text) {
        if (!text) return ""
        let source = Array.isArray(text) ? text.join("\n\n") : text
        let html = source.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
        html = html.replace(/\n\s*\n/g, "<br><br>")
        html = html.replace(/\n/g, " ")
        return DOMPurify.sanitize(html)
    }

    function handleBackgroundClick(e) {
        if (!e.target.closest("textarea, input, button, .swatch, .wing-left, .wing-right, .profile-presentation")) {
            if (isEditing) {
                isEditing = false
                activeField = { key: "visual-prompt", label: "Image Prompt" }
            } else {
                handleClose()
            }
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
            }
        }
    }
</script>

{#if char && char.id}
    <Modal variant="profile" onclose={handleClose}>
        <div class="profile-container" class:editing={isEditing} class:dev-mode={app.settings.dev_mode} class:show-dev-wing={app.settings.dev_mode} onclick={handleBackgroundClick} onfocusout={handleFocusOut} role="presentation" data-testid="profile-container" data-is-editing={isEditing}>
            <ProfileWings bind:char {isEditing} bind:busyFields bind:activeField />

            <div class="profile-presentation" style="--signature-color: {signature_color}; --signature-rgb: {signatureRgb};">
                <div class="left">
                    <ProfilePicture entity={char} />
                </div>

                <main class="right">
                    <ProfileHeader bind:char {isEditing} {renderMarkdown} {autoResize} />
                    <ProfileFragments bind:char {isEditing} {getValue} {setValue} {autoResize} {busyFields} {renderMarkdown} bind:activeField />
                    <ProfileFooter bind:isEditing {isSaving} {handleSave} {handleDelete} />
                </main>
            </div>
        </div>
    </Modal>
{/if}

<style lang="scss">
    @use "../../../theme/abstracts/placeholders" as *;

    .profile-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-l);
        width: 100%;
        max-width: 90vw;
        perspective: 2000px;
        /* FIX: overflow visible to fix clipping */
        overflow: visible;
        padding: var(--spacing-xxl) 0;
        transform-style: preserve-3d;
    }

    .profile-presentation {
        order: 2;
        width: 56rem;
        height: 100%;
        background: color-mix(in srgb, var(--glass-l), var(--signature-color) 12%);
        border-radius: var(--spacing-l);
        box-shadow:
            0 30px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(var(--signature-rgb), 0.15);
        display: grid;
        grid-template-columns: 35% 1fr;
        position: relative;
        overflow: hidden;
        z-index: 10;
        transform-style: preserve-3d;
        backdrop-filter: blur(20px);

        .left {
            background: transparent;
            border-right: 0;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 0;
            gap: 0;
        }

        main {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            max-height: 85vh;
            background: var(--tint-dark-surface);

            /* Scrollbar styling */
            &::-webkit-scrollbar {
                width: 4px;
            }
            &::-webkit-scrollbar-track {
                background: transparent;
            }
            &::-webkit-scrollbar-thumb {
                background: rgba(var(--signature-rgb), 0.3);
                border-radius: 2px;
            }
        }
    }
</style>
