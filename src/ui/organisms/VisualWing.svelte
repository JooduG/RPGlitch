<script>
    import { LlmService } from "@core/llm/service.js"
    import { PALETTE } from "@core/session/config.js"
    import { TextToImage } from "@mesmer/visuals/text-to-image.js"
    import Button from "@ui/atoms/Button.svelte"

    let {
        char = $bindable(),
        isEditing,
        busyField = $bindable(),
        activeField = $bindable(),
    } = $props()

    let fileInput = $state()

    // Determine current state
    const promptValue = $derived((char.visuals.prompt || "").trim())
    const hasPromptText = $derived(
        promptValue.length > 0 &&
            !promptValue.startsWith("http") &&
            !promptValue.startsWith("data:")
    )

    // Determine the active target value (prompt or focused field)
    const targetValue = $derived(
        activeField?.key === "visual-prompt"
            ? promptValue
            : activeField
              ? getValue(char, activeField.key)
              : ""
    )

    // Action is "Enhance" if the target we are looking at has text (ready for AI)
    let isEnhanceMode = $derived(isEditing && targetValue.trim().length > 0)

    // Determine the type of enhancement
    let enhancementType = $derived(
        activeField?.key === "visual-prompt" ? "generative" : "narrative"
    )

    // Button Logic:
    // User Requirement: "when no field is selected the enhance button should not be enabled"
    // Button Logic:
    // 1. Busy -> Disabled
    // 2. Active Field -> Enabled (Enhance Mode)
    // 3. No Field + Text -> Disabled (Protect Prompt)
    // 4. No Field + No Text -> Enabled (Extract Mode)
    let isCreativeDisabled = $derived(
        !isEditing || !!busyField || (!activeField && hasPromptText) // Disable only if we have text but no target (Protect)
    )

    // Label Logic:
    let creativeLabel = $derived.by(() => {
        if (busyField) return "Busy..."

        // If we have an active field, we map to specific "Enhance X" labels
        if (activeField) {
            const key = activeField.key
            const label = activeField.label?.toLowerCase() || ""

            if (key === "visual-prompt")
                return hasPromptText ? "Enhance" : "Extract"

            // Map specific fields as requested
            if (label.includes("past")) return "Enhance Past"
            if (label.includes("future")) return "Enhance Future"

            // Map "Present" and "Eternal" groups (checking label or key)
            if (key.includes("present") || label.includes("present"))
                return "Enhance Present"
            if (key.includes("eternal") || label.includes("eternal"))
                return "Enhance Eternal"

            // Fallback for Name/Desc or others
            return "Enhance" // General fallback
        }

        // Fallback: If no field is active, we are in Extract mode
        return "Extract"
    })

    // Design Variants:
    // Magic (Pink/Hot) = Enhance, Generate
    // Tech (Blue/Cold) = Extract, Upload
    let creativeVariant = $derived(
        activeField && isEnhanceMode ? "magic" : "tech"
    )

    let generationVariant = $derived(hasPromptText ? "magic" : "tech")

    async function handleCreativeAction() {
        if (busyField) return

        // Fix: Determine key safely. If no activeField, we don't have a key yet.
        const currentTargetKey = activeField?.key

        // If we have a target key, we mark it busy. If pure extraction, mark prompt busy.
        busyField = currentTargetKey || "visual-prompt"

        try {
            if (activeField && isEnhanceMode) {
                // --- ENHANCE LOGIC (AI Optimization) ---
                if (enhancementType === "generative") {
                    // Optimize prompt for Image Gen
                    const result = await LlmService.optimizeImagePrompt(
                        char.visuals.prompt
                    )
                    if (result) char.visuals.prompt = result
                } else {
                    // Optimize specific dossier field
                    const fieldVal = getValue(char, currentTargetKey)
                    if (fieldVal) {
                        const result = await LlmService.enhanceStoryField(
                            fieldVal,
                            activeField.label
                        )
                        if (result) setValue(char, currentTargetKey, result)
                    }
                }

                // Deselect field after successful enhancement
                activeField = { key: "visual-prompt", label: "Image Prompt" }
            } else {
                // --- EXTRACT LOGIC (Base Formula) ---
                // Only reachable if activeField is null (or prompt is empty but that button disables)
                // We overwrite with composed prompt.
                char.visuals.prompt = TextToImage.composeBasePrompt(char)
            }
        } catch (err) {
            console.error("Creative action failed:", err)
        } finally {
            busyField = null
        }
    }

    async function handleGenerationAction() {
        if (busyField) return
        busyField = "visual-prompt"

        if (hasPromptText) {
            // --- GENERATE LOGIC ---
            try {
                const url = await TextToImage.generate(promptValue, {
                    removeBackground: char.visuals.noBackground,
                })
                if (url) char.visuals.profilePictureUrl = url
            } catch (err) {
                console.error("Generation failed:", err)
            } finally {
                busyField = null
            }
        } else {
            // --- UPLOAD LOGIC ---
            fileInput.click()
            busyField = null
        }
    }

    // --- UTILITIES ---

    async function handleUpload(e) {
        const file = e.target.files[0]
        if (!file) return
        try {
            const url = await TextToImage.upload(file)
            if (url) {
                char.visuals = char.visuals || {}
                char.visuals.profilePictureUrl = url
            }
        } catch (err) {
            console.error("Upload failed:", err)
        }
    }

    function getValue(obj, path) {
        if (!path) return ""
        return (
            path.split(".").reduce((acc, part) => acc && acc[part], obj) || ""
        )
    }

    function setValue(obj, path, val) {
        const keys = path.split(".")
        const last = keys.pop()
        const target = keys.reduce(
            (acc, key) => (acc[key] = acc[key] || {}),
            obj
        )
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
            if (wingRoot && !wingRoot.contains(currentFocus)) {
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
                ></button>
            {/each}
        </div>
    </div>

    <!-- 2. Visual Prompting -->
    <div class="group">
        <div class="prompt-box">
            <div class="visual-prompt-container">
                <textarea
                    use:autoResize
                    class="visual-prompt"
                    bind:value={char.visuals.prompt}
                    placeholder="Describe visuals..."
                    disabled={!isEditing || busyField === "visual-prompt"}
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
                                // Check if we moved focus to the button (optional, but clearing is safer)
                                // If the user clicked the button, the click handler fires before this timeout finishes usually?
                                // Actually mousedown fires before blur. Click fires after mouseup.
                                // If we disable the button here, click might not fire.
                                // BUT: The button logic depends on activeField.
                                // If we nullify activeField, button disables.
                                // TRICKY: We need to NOT disable if the target is the button.

                                const focused = document.activeElement
                                if (!focused?.closest(".action-btn")) {
                                    activeField = null
                                }
                            }
                        }, 150)
                    }}
                ></textarea>
                {#if busyField === "visual-prompt"}
                    <div class="spinner-overlay">
                        <div class="spinner"></div>
                    </div>
                {/if}
            </div>

            <div class="action-row">
                <Button
                    variant="ghost"
                    size="sm"
                    label={creativeLabel}
                    className="action-btn mode-{creativeVariant}"
                    onclick={handleCreativeAction}
                    disabled={isCreativeDisabled}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    label={busyField
                        ? "Busy..."
                        : hasPromptText
                          ? "Generate"
                          : "Upload"}
                    className="action-btn mode-{generationVariant}"
                    onclick={handleGenerationAction}
                    disabled={!isEditing || busyField}
                />
            </div>

            <input
                type="file"
                accept="image/*"
                style="display: none;"
                bind:this={fileInput}
                onchange={handleUpload}
            />
        </div>
    </div>

    <!-- 3. Toggles -->
    <div class="toggle-stack">
        <label class="toggle-control">
            <span class="label">No Background</span>
            <input
                type="checkbox"
                bind:checked={char.visuals.noBackground}
                disabled={!isEditing}
            />
            <div class="switch"></div>
        </label>

        <label class="toggle-control">
            <span class="label">Flip Visual</span>
            <input
                type="checkbox"
                bind:checked={char.visuals.flip}
                disabled={!isEditing}
            />
            <div class="switch"></div>
        </label>
    </div>
</div>

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    .visual-wing-content {
        @extend %material-glass-heavy;
        padding: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-l);
        color: white;
        border-radius: inherit;
        background: var(--chalk, #222326);
        background-image: radial-gradient(
            circle at bottom left,
            rgba(255, 255, 255, 0.05) 10%,
            transparent 70%
        );
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
                border-color: white;
                box-shadow: 0 0 10px white;
                transform: scale(1.1);
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
                    border: 2px solid rgba(255, 255, 255, 0.1);
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
            border-top: 1px solid var(--ui-glass-border);

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
                    border-right: 1px solid var(--ui-glass-border);
                }

                &:hover {
                    background: rgba(255, 255, 255, 0.08);
                }

                &:global(.action-btn) {
                    font-weight: 600;
                    letter-spacing: 0.02em;

                    /* --- TECH MODE (Extract/Upload) --- */
                    /* Cool, reliable, utility. */
                    &:global(.mode-tech):not(:disabled) {
                        color: var(--app-secondary);
                        background: color-mix(
                            in oklab,
                            var(--app-secondary) 5%,
                            transparent
                        );

                        &:hover {
                            background: color-mix(
                                in oklab,
                                var(--app-secondary) 10%,
                                transparent
                            );
                            color: color-mix(
                                in oklab,
                                var(--app-secondary),
                                white 10%
                            );
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
            opacity: 0.6; /* Hierarchy fix: Dim labels like DevWing */
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
                border: 1px solid rgba(255, 255, 255, 0.1);
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
