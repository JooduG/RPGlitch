<script>
    /**
     * @file Profile.svelte
     * 🗃️ THE ENTITY EDITOR
     * Handles viewing and editing of flattened entities.
     * ZERO NESTING — Purged all legacy `visuals` objects.
     */
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
    let { entity_id, entity_type } = $props()
    /**
     * Svelte 5 Action: Auto-resize textarea to fit content
     */
    function auto_resize(node, options = {}) {
        let frame
        const update = () => {
            if (frame) cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                node.style.height = "auto"
                const height = node.scrollHeight
                node.style.height = height + "px"
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
    // --- STATE ---
    let is_editing = $state(false)
    let is_saving = $state(false)
    let busy_fields = $state(new Set())
    let active_field = $state({ key: "visual-prompt", label: "Image Prompt" })
    // Normalizer guarantees flattened schema
    let char = $state(themeStore.normalize_entity(app.editing_entity || runtime.character))
    // Theme values derived directly from the flattened entity
    let signature_color = $derived(themeStore.get_signature_color(char))
    let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color))
    $effect(() => {
        if (!is_editing) {
            active_field = { key: "visual-prompt", label: "Image Prompt" }
        }
    })
    function handle_close() {
        if (is_editing) {
            is_editing = false
        } else {
            app.toggle_profile(false)
        }
    }
    async function handle_save() {
        is_editing = false
        is_saving = true
        try {
            await runtime.saveEntity(entity_type || "character", char)
            const eid = char.id
            const type = entity_type || "character"
            if (type === "character") {
                const characters = await entities.list("character")
                app.ai_list = characters
                app.user_list = characters
                // Refresh Selection
                const updatedEntity = characters.find((e) => e.id === eid)
                if (app.selected_ai?.id === eid) app.selected_ai = updatedEntity
                if (app.selected_user?.id === eid) app.selected_user = updatedEntity
            } else if (type === "fractal") {
                const fractals = await entities.list("fractal")
                app.fractal_list = fractals
                // Refresh Selection
                const updatedEntity = fractals.find((e) => e.id === eid)
                if (app.selected_fractal?.id === eid) app.selected_fractal = updatedEntity
            }
        } catch (err) {
            console.error("Failed to save profile:", err)
            is_editing = true
        } finally {
            is_saving = false
        }
    }
    async function handle_delete() {
        if (!confirm("Are you sure you want to delete this entity?")) return
        try {
            await runtime.deleteEntity(entity_type || "character", entity_id || char.id)
            handle_close()
        } catch (err) {
            console.error("Failed to delete entity:", err)
        }
    }
    // --- UTILITIES ---
    function get_value(obj, path) {
        if (!path) return ""
        return path.split(".").reduce((acc, part) => acc && acc[part], obj) || ""
    }
    function set_value(obj, path, val) {
        const keys = path.split(".")
        const last = keys.pop()
        const target = keys.reduce((acc, key) => (acc[key] = acc[key] || {}), obj)
        if (path === "past" || path === "future") {
            if (Array.isArray(val)) {
                target[last] = val
            } else {
                target[last] = val
                    .split("\n")
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0)
            }
        } else {
            target[last] = val
        }
    }
    function handle_focus_out() {
        setTimeout(() => {
            const active = document.activeElement
            const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active instanceof HTMLElement && active.contentEditable === "true")
            const isWing = active?.closest(".wing-left, .wing-right")
            if (!isInput && !isWing && busy_fields.size === 0) {
                active_field = { key: "visual-prompt", label: "Image Prompt" }
            }
        }, 50)
    }
    function render_markdown(text) {
        if (!text) return ""
        let source = Array.isArray(text) ? text.join("\n\n") : text
        let html = source.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
        html = html.replace(/\n\s*\n/g, "<br><br>")
        html = html.replace(/\n/g, " ")
        return DOMPurify.sanitize(html)
    }
    function handle_background_click(e) {
        if (!e.target.closest("textarea, input, button, .swatch, .wing-left, .wing-right, .profile-presentation")) {
            if (is_editing) {
                is_editing = false
                active_field = { key: "visual-prompt", label: "Image Prompt" }
            } else {
                handle_close()
            }
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
            }
        }
    }
</script>

{#if char && char.id}
    <Modal variant="profile" on_close={handle_close}>
        <div class="profile-container" class:editing={is_editing} class:dev-mode={app.settings.dev_mode} class:show-dev-wing={app.settings.dev_mode} onclick={handle_background_click} onfocusout={handle_focus_out} role="presentation" data-testid="profile-container" data-is-editing={is_editing}>
            <ProfileWings bind:char {is_editing} bind:busy_fields bind:active_field />
            <div class="profile-presentation" style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};">
                <div class="left">
                    <ProfilePicture entity={char} />
                </div>
                <main class="right">
                    <ProfileHeader bind:char {is_editing} {render_markdown} {auto_resize} />
                    <ProfileFragments bind:char {is_editing} {get_value} {set_value} {auto_resize} {busy_fields} {render_markdown} bind:active_field />
                    <ProfileFooter bind:is_editing {is_saving} {handle_save} {handle_delete} />
                </main>
            </div>
        </div>
    </Modal>
{/if}

<style>
    .profile-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-l);
        width: 100%;
        max-width: 90vw;
        perspective: 2000px;
        overflow: visible;
        padding: var(--spacing-xxl) 0;
        transform-style: preserve-3d;
    }
    .profile-presentation {
        order: 2;
        width: 56rem;
        height: 100%;
        background: var(--color-gunmetal);
        border-radius: var(--border-radius-l);
        box-shadow:
            var(--shadow-xl),
            0 0 var(--spacing-xxl) rgb(var(--signature-rgb) / var(--opacity-s));
        display: grid;
        grid-template-columns: 35% 1fr;
        position: relative;
        overflow: hidden;
        z-index: var(--z-modal);
        transform-style: preserve-3d;
    }
    .profile-presentation .left {
        background: transparent;
        border-right: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding: 0;
        gap: 0;
    }
    .profile-presentation main {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        max-height: 85vh;
        background: var(--surface-base);
        padding: var(--spacing-m);
    }
    .profile-presentation main::-webkit-scrollbar {
        width: var(--spacing-xxs);
    }
    .profile-presentation main::-webkit-scrollbar-track {
        background: transparent;
    }
    .profile-presentation main::-webkit-scrollbar-thumb {
        background: rgb(var(--signature-rgb) / var(--opacity-s));
        border-radius: var(--border-radius-full);
    }
</style>
