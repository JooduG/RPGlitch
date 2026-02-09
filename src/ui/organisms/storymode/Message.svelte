<script>
    import { app } from "@state/app.svelte.js"
    import { runtime } from "@state/runtime.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"
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
    let isFractal = $derived(sender === "fractal")

    let entity = $derived(
        isUser
            ? runtime.userCharacter
            : isAi
              ? runtime.aiCharacter
              : isFractal
                ? runtime.storyFractal
                : null
    )

    let signatureColor = $derived(
        entity ? themeStore.getSignatureColor(entity) : "#334155"
    )

    let textColor = $derived(themeStore.getContrastColor(signatureColor))

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

    $effect(() => {
        console.log("Message Debug:", {
            sender,
            isUser,
            isAi,
            isFractal,
            entityName: entity?.name,
            signatureColor,
        })
    })
</script>

<div
    class="message-row"
    class:user-row={isUser}
    class:ai-row={isAi}
    class:fractal-row={isFractal}
>
    <div
        class="message-bubble"
        class:user-bubble={isUser}
        class:ai-bubble={isAi}
        class:fractal-bubble={isFractal}
        style="--bubble-color: {signatureColor}; --bubble-text-color: {textColor};"
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

        &.fractal-row {
            justify-content: center;
        }
    }

    .message-bubble {
        width: max-content;
        max-width: 80%;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        background: var(--bubble-color, #18181b);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--bubble-text-color, #fff);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        position: relative;

        &.user-bubble {
            max-width: 75%;
            border-bottom-right-radius: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        &.ai-bubble {
            max-width: 75%;
            border-bottom-left-radius: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        &.fractal-bubble {
            width: 50%;
            max-width: 80%;
            text-align: center;
            color: #fff; /* Always white on dark gradient */
            background: linear-gradient(
                135deg,
                rgba(0, 0, 0, 0.8),
                var(--bubble-color)
            );
            border: 1px solid var(--bubble-color);
            box-shadow: 0 0 20px -5px var(--bubble-color);
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
