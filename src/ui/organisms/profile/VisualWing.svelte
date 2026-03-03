<script>
    import { PALETTE } from "@core/engine/config.js"
    import { LlmService } from "@core/intelligence/intelligence_service.js"
    import { ImageGeneration } from "@media/image_engine.js"
    import { app } from "@state/app.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import Tooltip from "@ui/atoms/Tooltip.svelte"

    /* eslint-disable svelte/prefer-svelte-reactivity */
    let { char = $bindable(), isEditing, busyFields = $bindable(), activeField = $bindable() } = $props()

    // Derived: Check if the visual-prompt specifically is busy
    let isPromptBusy = $derived(busyFields.has("visual-prompt"))

    let fileInput = $state()

    // Tooltip State
    let currTooltip = $state({
        visible: false,
        text: "",
        x: 0,
        y: 0,
        position: "top",
    })
    let tooltipTimer = null

    // Determine current state
    const promptValue = $derived((char.visuals.prompt || "").trim())
    const hasPromptText = $derived(promptValue.length > 0 && !promptValue.startsWith("http") && !promptValue.startsWith("data:"))

    // Determine the active target value (prompt or focused field)
    const targetValue = $derived(activeField?.key === "visual-prompt" ? promptValue : activeField ? getValue(char, activeField.key) : "")

    // Action is "Enhance" if the target we are looking at has text (ready for AI)
    let isEnhanceMode = $derived(isEditing && targetValue.trim().length > 0)

    // Button Logic:
    // User Requirement: Allow multiple Fragment fields to be enhanced simultaneously.
    // Buttons should only be disabled when:
    // 1. Not editing
    // 2. visual-prompt is busy AND (no field selected OR visual-prompt is selected)
    // If a Fragment field is selected, buttons are enabled (even if prompt is busy)
    let isCreativeDisabled = $derived(
        !isEditing || (isPromptBusy && (!activeField || activeField.key === "visual-prompt")) || (!activeField && hasPromptText) // Protect: no target but text exists
    )

    // Label Logic:
    let creativeLabel = $derived.by(() => {
        if (isPromptBusy && (!activeField || activeField.key === "visual-prompt")) return "Busy..."

        // If we have an active field, we map to specific "Enhance X" labels
        if (activeField) {
            const key = activeField.key
            const label = activeField.label?.toLowerCase() || ""

            if (key === "visual-prompt") return hasPromptText ? "Enhance" : "Fetch"

            // Map specific fields (Unified Vector Architecture)
            if (key.startsWith("past")) return "Enhance Memories"
            if (key.startsWith("future")) return "Enhance Vectors"

            // Map "Present" and "Eternal" groups (checking label or key)
            if (key.includes("present") || label.includes("present")) return "Enhance Present"
            if (key.includes("eternal") || label.includes("eternal")) return "Enhance Eternal"

            // Fallback for Name/Desc or others
            return "Enhance" // General fallback
        }

        // Fallback: If no field is active, we are in Fetch mode
        return "Fetch"
    })

    // Design Variants:
    // Magic (Pink/Hot) = Enhance, Generate
    // Tech (Blue/Cold) = Fetch, Upload
    let creativeVariant = $derived(activeField && isEnhanceMode ? "magic" : "tech")

    let generationVariant = $derived(hasPromptText ? "magic" : "tech")

    async function handleCreativeAction() {
        // If the specific target is already busy, don't proceed
        const currentTargetKey = activeField?.key || "visual-prompt"
        if (busyFields.has(currentTargetKey)) return

        // Mark this field as busy
        busyFields = new Set([...busyFields, currentTargetKey])

        try {
            // Capture the label before we potentially nullify activeField

            // Deselect field immediately when enhancement starts (so button label changes)
            // But only for fragment fields, not for visual-prompt
            if (activeField && activeField.key !== "visual-prompt") {
                activeField = null
            }

            if (currentTargetKey === "visual-prompt" && isEnhanceMode) {
                // --- ENHANCE PROMPT (for Image Gen) ---
                const result = await LlmService.enhance(char.visuals.prompt, "visuals.prompt")
                if (result) char.visuals.prompt = result
            } else if (currentTargetKey !== "visual-prompt") {
                // --- ENHANCE FRAGMENT FIELD ---
                const fieldVal = getValue(char, currentTargetKey)
                if (fieldVal) {
                    const result = await LlmService.enhance(fieldVal, currentTargetKey)
                    if (result) setValue(char, currentTargetKey, result)
                }
            } else {
                // --- FETCH LOGIC (Base Formula) ---
                // Only reachable if visual-prompt is selected but empty (no enhance mode)
                char.visuals.prompt = ImageGeneration.composeBasePrompt(char)
            }
        } catch (err) {
            console.error("Creative action failed:", err)
        } finally {
            // Remove this field from busy set
            const updated = new Set(busyFields)
            updated.delete(currentTargetKey)
            busyFields = updated
        }
    }

    async function handleGenerationAction() {
        if (busyFields.has("visual-prompt")) return
        busyFields = new Set([...busyFields, "visual-prompt"])

        if (hasPromptText) {
            // --- GENERATE LOGIC ---
            // --- GENERATE LOGIC ---
            app.log(`[VisualWing] Triggering Generate. Prompt: ${promptValue}`, "system")
            try {
                if (!window.pluginTextToImage) {
                    const msg = "[VisualWing] CRITICAL: window.pluginTextToImage is MISSING!"
                    console.error(msg, window)
                    app.log(msg, "error")
                    return
                }

                const url = await ImageGeneration.generate(promptValue, {
                    noBackground: char.visuals.noBackground,
                })
                app.log(`[VisualWing] Generation Result: ${url}`, "system")
                if (url) char.visuals.profilePicture = url
            } catch (err) {
                console.error("Generation failed:", err)
                app.log(`Generation failed: ${err.message}`, "error")
            } finally {
                const updated = new Set(busyFields)
                updated.delete("visual-prompt")
                busyFields = updated
            }
        } else {
            // --- UPLOAD LOGIC ---
            fileInput.click()
            const updated = new Set(busyFields)
            updated.delete("visual-prompt")
            busyFields = updated
        }
    }

    // --- UTILITIES ---

    async function handleUpload(e) {
        const file = e.target.files[0]
        if (!file) return
        try {
            const url = await ImageGeneration.upload(file)
            if (url) {
                char.visuals = char.visuals || {}
                char.visuals.profilePicture = url
            }
        } catch (err) {
            console.error("Upload failed:", err)
        }
    }

    function handleSwatchHover(e, name) {
        if (tooltipTimer) clearTimeout(tooltipTimer)
        const target = e.currentTarget

        tooltipTimer = setTimeout(() => {
            const rect = target.getBoundingClientRect()
            // Capitalize name for display
            const displayName = name.charAt(0).toUpperCase() + name.slice(1)

            currTooltip = {
                visible: true,
                text: displayName,
                x: rect.left + rect.width / 2,
                y: rect.top + 8, // Offset to counter CSS margin-top: -12px
                position: "top",
            }
        }, 500) // 500ms Delay
    }

    function handleSwatchLeave() {
        if (tooltipTimer) clearTimeout(tooltipTimer)
        currTooltip.visible = false
    }

    function getValue(obj, path) {
        if (!path) return ""
        return path.split(".").reduce((acc, part) => acc && acc[part], obj) || ""
    }

    function setValue(obj, path, val) {
        const keys = path.split(".")
        const last = keys.pop()
        const target = keys.reduce((acc, key) => (acc[key] = acc[key] || {}), obj)
        target[last] = val
    }

    function autoResize(node) {
        let frame
        const update = () => {
            if (frame) cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                node.style.height = "auto"
                node.style.height = node.scrollHeight + "px"
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
</script>

<div
    class="visual-wing-content"
    onfocusout={(e) => {
        // Fix: Reset active field if focus leaves the wing and isn't going to a valid target
        // We capture currentTarget synchronousely because it is recycled/null inside setTimeout
        const wingRoot = e.currentTarget
        setTimeout(() => {
            const currentFocus = document.activeElement
            // Protection: Don't clear if focus is in a valid input or we have busy fields
            if (wingRoot && !wingRoot.contains(currentFocus) && busyFields.size === 0 && !currentFocus?.closest(".text-area")) {
                activeField = null
            }
        }, 50)
    }}
>
    <!-- 1. Spectrum Grid -->
    <div class="group">
        <div class="spectrum-grid">
            {#each Object.entries(PALETTE).filter(([name]) => name !== "default") as [name, hex] (name)}
                <button
                    class="swatch"
                    class:active={char.visuals?.signatureColor === hex}
                    style="background-color: {hex}"
                    aria-label="Select color {name}"
                    onclick={() => {
                        char.visuals = char.visuals || {}
                        char.visuals.signatureColor = hex
                    }}
                    disabled={!isEditing}
                    onmouseenter={(e) => handleSwatchHover(e, name)}
                    onmouseleave={handleSwatchLeave}
                ></button>
            {/each}
        </div>
    </div>

    <!-- Tooltip (Portal-ish) -->

    <!-- 2. Visual Prompting -->
    <div class="group">
        <div class="prompt-box">
            <div class="visual-prompt-container">
                <textarea
                    use:autoResize
                    class="visual-prompt"
                    bind:value={char.visuals.prompt}
                    placeholder="Enter image prompt or paste a URL..."
                    disabled={!isEditing || isPromptBusy}
                    onfocus={() => {
                        if (isEditing) {
                            activeField = {
                                key: "visual-prompt",
                                label: "Image Prompt",
                            }
                        }
                    }}
                    onblur={(e) => {
                        // Fix: Clear active field on blur to prevent "sticky" enabled state.
                        // We use a small timeout to allow button clicks to register first.
                        setTimeout(() => {
                            if (activeField?.key === "visual-prompt") {
                                const focused = document.activeElement
                                // Protection: Don't disable if we are busy or moving to a valid action/input
                                if (!focused?.closest(".action-btn") && !focused?.closest(".text-area") && busyFields.size === 0) {
                                    activeField = null
                                }
                            }
                        }, 150)
                    }}
                ></textarea>
                {#if isPromptBusy}
                    <div class="spinner-overlay">
                        <div class="spinner"></div>
                    </div>
                {/if}
            </div>

            <div class="action-row">
                <Button variant="ghost" size="sm" label={creativeLabel} className="action-btn mode-{creativeVariant}" onclick={handleCreativeAction} disabled={isCreativeDisabled} />
                <Button variant="ghost" size="sm" label={isPromptBusy ? "Busy..." : hasPromptText ? "Generate" : "Upload"} className="action-btn mode-{generationVariant}" onclick={handleGenerationAction} disabled={!isEditing || isPromptBusy} />
            </div>

            <input type="file" accept="image/*" style="display: none;" bind:this={fileInput} onchange={handleUpload} />
        </div>
    </div>

    <!-- 3. Toggles -->
    <div class="toggle-stack">
        <label class="toggle-control" title="Removes background from generated image">
            <span class="label">No Background</span>
            <input type="checkbox" bind:checked={char.visuals.noBackground} disabled={!isEditing} />
            <div class="switch"></div>
        </label>

        <label class="toggle-control">
            <span class="label">Flip Profile Picture</span>
            <input type="checkbox" bind:checked={char.visuals.flipped} disabled={!isEditing} />
            <div class="switch"></div>
        </label>
    </div>
    <Tooltip {...currTooltip} fixed={true} />
</div>

<style lang="scss">
    @use "../../../theme/abstracts/placeholders" as *;

    .visual-wing-content {
        @extend %material-glass-heavy;
        padding: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-l);
        color: white;
        border-radius: inherit;
        background: var(--chalk, #222326);
        background-image: radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.05) 10%, transparent 70%);
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-s);
    }

    .spectrum-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        padding: 0;
        .swatch {
            width: 100%;
            aspect-ratio: 1;
            border: 0; /* Semi-flat */
            border-radius: var(--spacing-xs);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

            &:hover:not(:disabled) {
                transform: scale(1.15);
                z-index: 2;
                border-color: white;
            }

            &.active {
                /* Use outline for crisp white border that sits outside/on-top */
                outline: 2px solid white;
                outline-offset: 2px;
                box-shadow: 0 0 15px var(--swatch-color);
                transform: scale(1.15);
                border-color: transparent; /* Reset border to avoid conflict */
                z-index: 10;
            }

            &:disabled {
                cursor: default;
                opacity: 0.8;
            }
        }
    }

    .prompt-box {
        background: rgba(0, 0, 0, 0.2);
        border: 0; /* Semi-flat */
        border-radius: var(--border-radius);
        overflow: hidden;

        .visual-prompt-container {
            position: relative;
            width: 100%;

            .visual-prompt {
                width: 100%;
                background: transparent;
                border: none;
                color: white;
                padding: var(--spacing-s);
                font-size: 0.85rem;
                font-family: var(--font-body); /* Enforce consistent font */
                resize: none;
                outline: none;
                display: block;

                &:disabled {
                    opacity: 0.5; /* Fix: Make it clearly disabled */
                    color: var(--app-muted);
                    cursor: not-allowed;
                    background: rgba(0, 0, 0, 0.1);
                    filter: grayscale(100%);
                }

                &::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                    font-style: italic;
                    font-weight: 400;
                }
            }

            .spinner-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(2px);
                z-index: 5;
                cursor: wait; /* Show wait cursor on overlay */

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 0.125rem solid rgba(255, 255, 255, 0.1);
                    border-top-color: var(--app-accent);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
            }
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        .action-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 0.0625rem solid var(--ui-glass-border);

            :global(.btn) {
                width: 100%;
                border: none;
                border-radius: 0;
                background: rgba(255, 255, 255, 0.03);
                font-size: 0.6rem;
                padding: 0.4rem;
                transition: all 0.3s ease;
                text-transform: capitalize;

                &:not(:last-child) {
                    border-right: 0.0625rem solid var(--ui-glass-border);
                }

                &:hover {
                    background: rgba(255, 255, 255, 0.08);
                }

                &:global(.action-btn) {
                    font-weight: 600;
                    letter-spacing: 0.02em;

                    /* --- TECH MODE (Fetch/Upload) --- */
                    /* Cool, reliable, utility. */
                    &:global(.mode-tech):not(:disabled) {
                        color: var(--app-secondary);
                        background: color-mix(in oklab, var(--app-secondary) 5%, transparent);

                        &:hover {
                            background: color-mix(in oklab, var(--app-secondary) 10%, transparent);
                            color: color-mix(in oklab, var(--app-secondary), white 10%);
                        }
                    }

                    /* --- MAGIC MODE (Enhance/Generate) --- */
                    /* Hot, creative, AI. */
                    &:global(.mode-magic):not(:disabled) {
                        color: var(--app-accent);
                        font-weight: 700;

                        &:hover {
                            color: white;
                        }
                    }
                }
            }
        }
    }

    .toggle-stack {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-s);

        .toggle-control {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: capitalize;
            letter-spacing: 0.05em;
            color: var(--app-muted);
            opacity: 0.9;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
            transition: all 0.2s ease;

            &:hover {
                color: white;
                .switch {
                    border-color: rgba(255, 255, 255, 0.3);
                }
            }

            input {
                display: none;
            }

            .switch {
                position: relative;
                width: 32px;
                height: 16px;
                background: rgba(0, 0, 0, 0.4);
                box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                transition: all 0.3s ease;

                &::after {
                    content: "";
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
                }
            }

            input:checked + .switch {
                background: var(--app-accent);
                border-color: var(--app-accent);
                &::after {
                    left: 18px;
                }
            }
        }
    }
</style>
