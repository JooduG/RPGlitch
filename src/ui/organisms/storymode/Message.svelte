<script>
    import { app } from "@state/app.svelte.js"
    import DOMPurify from "dompurify"
    import SceneHeader from "../SceneHeader.svelte"

    let {
        text = "",
        sender = "system", // 'ai', 'user', 'system'
        timestamp = new Date(),
        attachments = [],
    } = $props()

    let isUser = $derived(sender === "user")
    let isAi = $derived(sender === "ai")

    // Format text to hide raw XML tags but keep content if needed.
    let rawText = $derived(
        text
            .replace(/<image_prompt[\s\S]*?<\/image_prompt>/gi, "")
            .replace(/<image_prompt[^>]*\/>/gi, "")
    )

    let thinkBlock = $derived.by(() => {
        const match = text.match(/<think>([\s\S]*?)<\/think>/i)
        return match ? match[1].trim() : null
    })

    let cleanText = $derived(rawText.replace(/<think>[\s\S]*?<\/think>/gi, ""))

    // 🕵️ SCENE HEADER PARSING (The Warden's Eye)
    // Pattern: 『 [Location] · [Time] · [Weather] 』
    let headerMatch = $derived(
        cleanText.match(/^『\s*\[(.*?)]\s*·\s*\[(.*?)]\s*·\s*\[(.*?)]\s*』/)
    )

    let sceneData = $derived(
        headerMatch
            ? {
                  location: headerMatch[1],
                  time: headerMatch[2],
                  weather: headerMatch[3],
              }
            : null
    )

    // Remove the header from the body text if found
    let displayText = $derived(
        headerMatch ? cleanText.replace(headerMatch[0], "").trim() : cleanText
    )
</script>

<div class="message-row" class:user-row={isUser} class:ai-row={isAi}>
    <div
        class="message-bubble"
        class:user-bubble={isUser}
        class:ai-bubble={isAi}
    >
        <!-- SCENE HEADER (If detected) -->
        {#if sceneData}
            <div class="scene-header-wrapper">
                <SceneHeader {...sceneData} />
            </div>
        {/if}

        <!-- DIRECTOR MODE: THINK BLOCK -->
        {#if app.settings.debugMode && thinkBlock}
            <div class="think-block">
                <div class="think-label">🎬 DIRECTOR THOUGHTS</div>
                <div class="think-content">{thinkBlock}</div>
            </div>
        {/if}

        {#if attachments.length > 0}
            <div class="attachments">
                {#each attachments as src (src)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <img
                        {src}
                        alt="Attachment"
                        class="attachment-image clickable"
                        onclick={() => app.openLightbox(src)}
                        onerror={(e) => {
                            // @ts-ignore - style exists on HTMLImageElement target
                            e.target.style.display = "none"
                            console.warn("Failed to load attachment:", src)
                        }}
                    />
                {/each}
            </div>
        {/if}
        <div class="message-content">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html DOMPurify.sanitize(displayText)}
            <!-- Use @html to render if we had HTML, but basic text is safer.
           Actually, let's stick to {displayText} to avoid XSS unless we sanitize.
           Wait, existing code was {text}.
           Let's use {displayText}.
      -->
        </div>
        <div class="message-meta">
            {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}
        </div>
    </div>
</div>

<style lang="scss">
    .attachments {
        margin-bottom: 0.75rem;

        .attachment-image {
            max-width: 100%;
            border-radius: 8px;
            display: block;
            margin-bottom: 0.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);

            &.clickable {
                cursor: pointer;
                transition: transform 0.2s;
                &:hover {
                    transform: scale(1.02);
                }
            }
        }
    }
    .message-row {
        display: flex;
        width: 100%;
        padding: 0.75rem 1.5rem; /* More horizontal padding */

        &.user-row {
            justify-content: flex-end;
        }

        &.ai-row {
            justify-content: flex-start;
        }
    }

    .message-bubble {
        max-width: 80%;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        background: #18181b;
        border: 1px solid #27272a;
        color: #e4e4e7;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        position: relative;

        &.user-bubble {
            background: #1e3a8a; /* Blue 900 */
            border-color: #1d4ed8;
            color: #fff;
            border-bottom-right-radius: 2px;
            box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2);
        }

        &.ai-bubble {
            background: #064e3b; /* Emerald 900 */
            border-color: #059669;
            color: #ecfdf5;
            border-bottom-left-radius: 2px;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
        }
    }

    .think-block {
        background: rgba(0, 0, 0, 0.3);
        border: 1px dashed rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 1rem;
        font-size: 0.85rem;

        .think-label {
            font-size: 0.65rem;
            font-weight: 900;
            color: #38bdf8;
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
    }

    .message-meta {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 0.5rem;
        text-align: right;
        font-weight: 500;
    }
</style>
