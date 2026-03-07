<script>
    import { app } from "@state/app.svelte.js"
    import { runtime } from "@state/runtime.svelte.js"
    import { DEFAULT_COLORS, themeStore } from "@theme/palette.svelte.js"
    import DOMPurify from "dompurify"
    import SceneHeader from "../SceneHeader.svelte"

    let {
        text = "",
        sender = "system", // 'ai', 'user', 'fractal', 'system'
        character_name = "",
        timestamp = new Date(),
        attachments = [],
        on_delete = () => {},
        on_regenerate = () => {},
        on_continue = () => {},
        on_edit = () => {},
        is_last = false,
        is_thinking = false /* [R3] Renders as dot-dot-dot pill */,
    } = $props()

    let is_user = $derived(sender === "user")
    let is_ai = $derived(sender === "ai")
    let is_fractal = $derived(sender === "fractal")

    let entity = $derived.by(() => {
        // [R5] Resolution Order:
        // 1. Exact Name Match in Runtime (Active)
        // 2. Exact Name Match in App Lists (History)
        // 3. Fallback to Active Runtime Role (if name matches or is generic)

        if (!character_name) {
            // No name? Use active runtime by role
            if (is_user) return runtime.active_user
            if (is_ai) return runtime.active_ai
            if (is_fractal) return runtime.active_fractal
            return null
        }

        // 1. Is it the ACTIVE character? (Fastest & most correct for edits)
        if (is_user && runtime.active_user?.name === character_name) return runtime.active_user
        if (is_ai && runtime.active_ai?.name === character_name) return runtime.active_ai
        if (is_fractal && runtime.active_fractal?.name === character_name) return runtime.active_fractal

        // 2. Is it in the LOBBY/CACHE lists? (For history)
        if (is_user) return app.userList.find((e) => e.name === character_name)
        if (is_ai) return app.aiList.find((e) => e.name === character_name)
        if (is_fractal) return app.fractalList.find((e) => e.name === character_name)

        // 3. Fallback: If we can't find it, assume it refers to the active one (Legacy)
        if (is_user) return runtime.active_user
        if (is_ai) return runtime.active_ai
        return null
    })

    let signature_color = $derived.by(() => {
        // 1. Try Entity
        if (entity) {
            const color = themeStore.getSignatureColor(entity)
            return color
        }

        // 2. Try Character Name (Deterministic Fallback)
        if (character_name) {
            const color = themeStore.getDeterministicColor(character_name)
            return color
        }

        // 3. Fallback to App State (Lobby/Storyboard Mode)
        // When in lobby, runtime.* is null, so we must check app.selected*
        if (is_user && app.selectedUser?.visuals?.signature_color) return themeStore.getSignatureColor(app.selectedUser)
        if (is_ai && app.selectedAi?.visuals?.signature_color) return themeStore.getSignatureColor(app.selectedAi)
        if (is_fractal && app.selectedFractal?.visuals?.signature_color) return themeStore.getSignatureColor(app.selectedFractal)

        // 4. Robust Fallback by Role
        if (is_user) return DEFAULT_COLORS.USER
        if (is_fractal) return DEFAULT_COLORS.FRACTAL
        if (is_ai) return DEFAULT_COLORS.AI

        return DEFAULT_COLORS.SYSTEM
    })

    let text_color = $derived(themeStore.getContrastColor(signature_color))

    import { parse_message } from "@core/engine/text_parser.js"

    // --- PARSING (Refactored to Core) ---
    // Text parsing is now handled by the Engine layer, ensuring UI remains "dumb".
    let parsed = $derived(parse_message(text))

    let display_text = $derived(parsed.displayText)
    let think_block = $derived(parsed.think)
    let scene_data = $derived(parsed.sceneData)
</script>

<div class="message-row" class:user-row={is_user} class:ai-row={is_ai} class:fractal-row={is_fractal} class:thinking-row={is_thinking}>
    {#if is_thinking}
        <!-- [R3] Thinking Pill: Pure signature color, white dots -->
        <div class="thinking-pill" style="background: var(--signature-color);">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    {:else}
        <div class="message-bubble" class:user-bubble={is_user} class:ai-bubble={is_ai} class:fractal-bubble={is_fractal} style="--bubble-color: {signature_color}; --signature-color: {signature_color}; --bubble-text-color: {text_color};">
            <!-- SCENE HEADER (If detected) -->
            {#if scene_data}
                <div class="scene-header-wrapper">
                    <SceneHeader {...scene_data} />
                </div>
            {/if}

            <!-- DEV MODE: THINK BLOCK -->
            {#if app.settings.dev_mode && think_block}
                <div class="think-block">
                    <div class="think-label">🎬 DevMode</div>
                    <div class="think-content">{think_block}</div>
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
                {@html DOMPurify.sanitize(display_text)}
            </div>
            <div class="message-footer">
                <!-- NEW: Actions (Left of Timestamp, same row) -->
                {#if is_ai}
                    <div class="message-actions">
                        <!-- AI-Specific Actions (Shown only on last message) -->
                        {#if is_last}
                            <button class="action-btn" type="button" title="Continue" onclick={(e) => on_continue(e)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            </button>
                            <button class="action-btn" type="button" title="Reroll" onclick={(e) => on_regenerate(e)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                            </button>
                        {/if}

                        <!-- Edit (Available on all AI messages) -->
                        <button class="action-btn" type="button" title="Edit" onclick={(e) => on_edit(e)}>
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
                        <button class="action-btn delete" type="button" title="Delete" onclick={(e) => on_delete(e)}>
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
    @use "@theme/abstracts/variables" as *;

    .attachments {
        margin-bottom: var(--spacing-s);

        .attachment-btn {
            background: none;
            border: none;
            padding: 0;
            margin: 0 0 var(--spacing-xs) 0;
            cursor: pointer;
            transition: transform var(--transition-speed);
            display: block;

            &:hover {
                transform: scale(1.02);
            }
        }

        .attachment-image {
            max-width: 100%;
            border-radius: var(--border-radius);
            display: block;
            box-shadow: var(--shadow-s);
        }
    }
    .message-row {
        display: flex;
        width: 100%;
        padding: var(--spacing-s) var(--spacing-m);

        &.user-row {
            justify-content: flex-end;
        }

        &.ai-row {
            justify-content: flex-start;
        }

        &.fractal-row {
            justify-content: center;
        }
    }

    /* Thinking Pill */
    .thinking-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xxs);
        padding: var(--spacing-xs) var(--spacing-m);
        border-radius: var(--border-radius-full);
        height: var(--spacing-xl);

        .dot {
            width: var(--spacing-xs);
            height: var(--spacing-xs);
            background: white;
            border-radius: var(--border-radius-full);
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
        padding: var(--spacing-m);
        border-radius: var(--border-radius-l);
        background: var(--bubble-color);
        box-shadow: var(--shadow-s);
        color: var(--app-color);
        position: relative;
        overflow: hidden;

        &.user-bubble {
            max-width: 75%;
            border-bottom-right-radius: 0;
            text-align: left;
        }

        &.ai-bubble {
            max-width: 75%;
            border-bottom-left-radius: 0;
            text-align: left;
        }

        &.fractal-bubble {
            width: 50%;
            max-width: 80%;
            text-align: center;
            color: var(--app-color);
            background: var(--bubble-color);
            box-shadow: var(--shadow-s);

            .message-content {
                text-align: center;
            }
        }
    }

    .think-block {
        background: var(--glass-m);
        box-shadow: var(--glass-border) inset;
        border-radius: var(--border-radius);
        padding: var(--spacing-s);
        margin-bottom: var(--spacing-m);
        font-size: var(--font-size-s);

        .think-label {
            font-size: var(--font-size-xs);
            font-weight: 900;
            color: var(--signature-cyan);
            letter-spacing: 0.1em;
            margin-bottom: var(--spacing-xxs);
        }

        .think-content {
            color: var(--app-muted);
            font-family: var(--font-mono);
            font-style: italic;
            white-space: pre-wrap;
        }
    }

    .message-content {
        white-space: pre-wrap;
        line-height: var(--line-height-relaxed);
        font-size: var(--font-size-m);
        font-family: var(--font-family-sans);
        text-shadow: var(--shadow-s);
    }

    .message-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-xs);
        min-height: var(--spacing-xl);
    }

    .message-timestamp {
        font-size: var(--font-size-xs);
        color: var(--app-color);
        font-weight: 500;
        opacity: var(--opacity-s);
        text-shadow: var(--shadow-s);
        transition: opacity var(--transition-speed);
    }

    .message-actions {
        display: flex;
        gap: var(--spacing-xxs);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--transition-speed);
    }

    .message-bubble:hover {
        .message-timestamp {
            opacity: 1;
        }

        .message-actions {
            opacity: 1;
            pointer-events: auto;
        }
    }

    .action-btn {
        background: var(--glass-m);
        box-shadow: var(--glass-border);
        color: var(--app-muted);
        border-radius: var(--border-radius);
        width: var(--spacing-xl);
        height: var(--spacing-xl);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all var(--transition-speed);
        position: relative;

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
            background: var(--app-color);
            box-shadow: 0 0 0 var(--spacing-px) var(--app-color);
            color: var(--signature-color);

            svg {
                stroke-width: 2;
                stroke: currentColor;
            }
        }

        &::after {
            content: attr(title);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(calc(var(--spacing-xs) * -2));
            background: var(--bg-component);
            color: var(--app-color);
            padding: var(--spacing-xxs) var(--spacing-xs);
            border-radius: var(--border-radius-s);
            font-size: var(--font-size-xs);
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s;
            z-index: 100;
            box-shadow: var(--glass-border);
        }

        &:hover::after {
            opacity: 1;
            transform: translateX(-50%) translateY(calc(var(--spacing-xs) * -1));
        }

        &.delete:hover {
            background: var(--color-danger);
            box-shadow: 0 0 0 var(--spacing-px) var(--app-color);
            color: var(--app-color);

            svg {
                stroke: var(--app-color);
            }
        }
    }
</style>
