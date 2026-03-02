<script>
    import { app } from "@state/app.svelte.js"
    import { runtime } from "@state/runtime.svelte.js"
    import { DEFAULT_COLORS, themeStore } from "@theme/palette.svelte.js"
    import DOMPurify from "dompurify"
    import SceneHeader from "../SceneHeader.svelte"

    let {
        text = "",
        sender = "system", // 'ai', 'user', 'fractal', 'system'
        characterName = "",
        timestamp = new Date(),
        attachments = [],
        onDelete = () => {},
        onRegenerate = () => {},
        onContinue = () => {},
        onEdit = () => {},
        isLast = false,
        isThinking = false, // [R3] Renders as dot-dot-dot pill
    } = $props()

    let isUser = $derived(sender === "user")
    let isAi = $derived(sender === "ai")
    let isFractal = $derived(sender === "fractal")

    let entity = $derived.by(() => {
        // [R5] Resolution Order:
        // 1. Exact Name Match in Runtime (Active)
        // 2. Exact Name Match in App Lists (History)
        // 3. Fallback to Active Runtime Role (if name matches or is generic)

        if (!characterName) {
            // No name? Use active runtime by role
            if (isUser) return runtime.activeUser
            if (isAi) return runtime.activeAI
            if (isFractal) return runtime.activeFractal
            return null
        }

        // 1. Is it the ACTIVE character? (Fastest & most correct for edits)
        if (isUser && runtime.activeUser?.name === characterName) return runtime.activeUser
        if (isAi && runtime.activeAI?.name === characterName) return runtime.activeAI
        if (isFractal && runtime.activeFractal?.name === characterName) return runtime.activeFractal

        // 2. Is it in the LOBBY/CACHE lists? (For history)
        if (isUser) return app.userList.find((e) => e.name === characterName)
        if (isAi) return app.aiList.find((e) => e.name === characterName)
        if (isFractal) return app.fractalList.find((e) => e.name === characterName)

        // 3. Fallback: If we can't find it, assume it refers to the active one (Legacy)
        if (isUser) return runtime.activeUser
        if (isAi) return runtime.activeAI
        return null
    })

    let signatureColor = $derived.by(() => {
        // 1. Try Entity
        if (entity) {
            const color = themeStore.getSignatureColor(entity)
            return color
        }

        // 2. Try Character Name (Deterministic Fallback)
        if (characterName) {
            const color = themeStore.getDeterministicColor(characterName)
            return color
        }

        // 3. Fallback to App State (Lobby/Storyboard Mode)
        // When in lobby, runtime.* is null, so we must check app.selected*
        if (isUser && app.selectedUser?.visuals?.signatureColor) return themeStore.getSignatureColor(app.selectedUser)
        if (isAi && app.selectedAi?.visuals?.signatureColor) return themeStore.getSignatureColor(app.selectedAi)
        if (isFractal && app.selectedFractal?.visuals?.signatureColor) return themeStore.getSignatureColor(app.selectedFractal)

        // 4. Robust Fallback by Role
        if (isUser) return DEFAULT_COLORS.USER
        if (isFractal) return DEFAULT_COLORS.FRACTAL
        if (isAi) return DEFAULT_COLORS.AI

        return DEFAULT_COLORS.SYSTEM
    })

    let textColor = $derived(themeStore.getContrastColor(signatureColor))

    import { parseMessage } from "@core/engine/text_parser.js"

    // ... (keep props)

    // --- PARSING (Refactored to Core) ---
    // Text parsing is now handled by the Engine layer, ensuring UI remains "dumb".
    let parsed = $derived(parseMessage(text))

    let displayText = $derived(parsed.displayText)
    let thinkBlock = $derived(parsed.think)
    let sceneData = $derived(parsed.sceneData)
</script>

<div class="message-row" class:user-row={isUser} class:ai-row={isAi} class:fractal-row={isFractal} class:thinking-row={isThinking}>
    {#if isThinking}
        <!-- [R3] Thinking Pill: Pure signature color, white dots -->
        <div class="thinking-pill" style="background: {signatureColor};">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    {:else}
        <div class="message-bubble" class:user-bubble={isUser} class:ai-bubble={isAi} class:fractal-bubble={isFractal} style="--bubble-color: {signatureColor}; --signature-color: {signatureColor}; --bubble-text-color: {textColor};">
            <!-- SCENE HEADER (If detected) -->
            {#if sceneData}
                <div class="scene-header-wrapper">
                    <SceneHeader {...sceneData} />
                </div>
            {/if}

            <!-- DEV MODE: THINK BLOCK -->
            {#if app.settings.devMode && thinkBlock}
                <div class="think-block">
                    <div class="think-label">🎬 DevMode</div>
                    <div class="think-content">{thinkBlock}</div>
                </div>
            {/if}

            {#if attachments.length > 0}
                <div class="attachments">
                    {#each attachments as src (src)}
                        <button type="button" class="attachment-btn" onclick={() => app.openLightbox(src)} title="View Attachment">
                            <img
                                {src}
                                alt="Attachment"
                                class="attachment-image"
                                onerror={(e) => {
                                    // @ts-ignore - style exists on HTMLImageElement target
                                    e.target.style.display = "none"
                                    console.warn("Failed to load attachment:", src)
                                }}
                            />
                        </button>
                    {/each}
                </div>
            {/if}
            <div class="message-content">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(displayText)}
            </div>
            <div class="message-footer">
                <!-- NEW: Actions (Left of Timestamp, same row) -->
                {#if isAi}
                    <div class="message-actions">
                        <!-- AI-Specific Actions (Shown only on last message) -->
                        {#if isLast}
                            <button class="action-btn" type="button" title="Continue" onclick={(e) => onContinue(e)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            </button>
                            <button class="action-btn" type="button" title="Reroll" onclick={(e) => onRegenerate(e)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                            </button>
                        {/if}

                        <!-- Edit (Available on all AI messages) -->
                        <button class="action-btn" type="button" title="Edit" onclick={(e) => onEdit(e)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>

                        <!-- Copy -->
                        <button
                            class="action-btn"
                            type="button"
                            title="Copy"
                            onclick={async () => {
                                try {
                                    await navigator.clipboard.writeText(text)
                                } catch (e) {
                                    console.error("Failed to copy text:", e)
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                        <!-- Delete -->
                        <button class="action-btn delete" type="button" title="Delete" onclick={(e) => onDelete(e)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                {/if}

                <div class="message-timestamp">
                    {timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .attachments {
        margin-bottom: 0.75rem;

        .attachment-btn {
            background: none;
            border: none;
            padding: 0;
            margin: 0 0 0.5rem 0;
            cursor: pointer;
            transition: transform 0.2s;
            display: block;

            &:hover {
                transform: scale(1.02);
            }
        }

        .attachment-image {
            max-width: 100%;
            border-radius: 8px;
            display: block;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
    }
    .message-row {
        display: flex;
        width: 100%;
        padding: 0.75rem 1.5rem; /* More horizontal padding */

        &.user-row {
            justify-content: flex-end; /* [R3] Reverted: User bubbles on right */
        }

        &.ai-row {
            justify-content: flex-start;
        }

        &.fractal-row {
            justify-content: center;
        }
    }

    /* [R3] Thinking Pill */
    .thinking-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 12px 24px;
        border-radius: 9999px;
        height: 40px;

        .dot {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: dot-bounce 1.4s infinite ease-in-out both;

            &:nth-child(1) {
                animation-delay: -0.32s;
            }
            &:nth-child(2) {
                animation-delay: -0.16s;
            }
        }
    }

    @keyframes dot-bounce {
        0%,
        80%,
        100% {
            transform: scale(0);
        }
        40% {
            transform: scale(1);
        }
    }

    .message-bubble {
        width: max-content;
        max-width: 80%;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        background: var(--bubble-color); /* [R3] Pure signature color */
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        color: var(--app-color, #fff);
        position: relative;
        overflow: hidden;

        &.user-bubble {
            max-width: 75%;
            border-bottom-right-radius: 0; /* [R3] Tail on right */
            text-align: left; /* [R3] Force left text */
        }

        &.ai-bubble {
            max-width: 75%;
            border-bottom-left-radius: 0;
            text-align: left; /* [R3] Force left text */
        }

        &.fractal-bubble {
            width: 50%;
            max-width: 80%;
            text-align: center;
            color: var(--app-color, #fff);
            background: var(--bubble-color); /* [R3] Pure signature color */
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);

            .message-content {
                text-align: center;
            }
        }
    }

    .think-block {
        background: rgba(0, 0, 0, 0.3);
        border: 0.0625rem dashed rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 1rem;
        font-size: 0.85rem;

        .think-label {
            font-size: 0.65rem;
            font-weight: 900;
            color: var(--signature-cyan, #38bdf8);
            letter-spacing: 0.1em;
            margin-bottom: 0.4rem;
        }

        .think-content {
            color: rgba(255, 255, 255, 0.6);
            font-family: var(--font-mono);
            font-style: italic;
            white-space: pre-wrap;
        }
    }

    .message-content {
        white-space: pre-wrap;
        line-height: 1.6;
        font-size: 1rem; /* 16px */
        font-family: var(--font-body);
        /* High contrast text shadow for readability on light backgrounds */
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    }

    .message-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end; /* Align to right */
        gap: 0.5rem;
        margin-top: 0.5rem;
        min-height: 24px; /* Prevent jump when actions appear */
    }

    .message-timestamp {
        font-size: 0.75rem;
        color: var(--app-color, #fff);
        font-weight: 500;
        opacity: 0.4; /* "A little bit transparent" */
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6); /* Same shadow as main text */
        transition: opacity 0.2s;
    }

    .message-actions {
        display: flex;
        gap: 0.25rem;
        opacity: 0; /* Hidden by default */
        pointer-events: none;
        transition: opacity 0.2s;

        /* No absolute positioning anymore */
    }

    /* Hover States for Actions */
    .message-bubble:hover {
        .message-timestamp {
            opacity: 1; /* Solid on hover */
        }

        .message-actions {
            opacity: 1;
            pointer-events: auto;
        }
    }

    .action-btn {
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.7);
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition:
            background 0.2s,
            color 0.1s,
            border-color 0.2s;
        position: relative; /* For tooltips */

        /* Force crisp rendering and zero shadows */
        &,
        svg,
        path,
        rect,
        polygon,
        polyline {
            text-shadow: none;
            filter: none;
            box-shadow: none;
            shape-rendering: geometricPrecision;
        }

        svg {
            stroke-width: 1.5;
            pointer-events: none;
        }

        &:hover {
            background: var(--app-color, #fff); /* Solid opaque white */
            box-shadow: 0 0 0 1px var(--app-color, #fff); /* White border */
            color: var(--signature-color, #000); /* Icons get signature color */
            transform: none;

            svg {
                stroke-width: 2; /* Slightly thicker on hover for clarity */
                stroke: currentColor;
            }
        }

        /* --- TOOLTIP --- */
        &::after {
            content: attr(title);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            background: var(--bg-component, #000);
            color: var(--app-color, #fff);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity 0.2s,
                transform 0.2s;
            z-index: 100;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
        }

        &:hover::after {
            opacity: 1;
            transform: translateX(-50%) translateY(-4px);
        }

        &.delete:hover {
            background: var(--app-del, #ef4444); /* Solid Red */
            box-shadow: 0 0 0 1px var(--app-color, #fff); /* White border */
            color: var(--app-color, #fff); /* White icon */

            svg {
                stroke: var(--app-color, #fff);
            }
        }
    }
</style>
