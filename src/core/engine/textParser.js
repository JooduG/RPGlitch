/**
 * @file textParser.js
 * @description Logic for parsing raw LLM output into structured UI data.
 * Handles: Think blocks, Image prompts, and Scene Headers.
 */

/**
 * Extracts <think> blocks from text.
 * @param {string} text
 * @returns {{ content: string, think: string|null }}
 */
export function parseThinkBlock(text) {
    if (!text) return { content: "", think: null }
    const match = text.match(/<think>([\s\S]*?)<\/think>/i)
    const think = match ? match[1].trim() : null
    const content = text.replace(/<think>[\s\S]*?<\/think>/gi, "")
    return { content, think }
}

/**
 * Removes <image_prompt> tags from text.
 * @param {string} text
 * @returns {string}
 */
export function cleanImagePrompts(text) {
    if (!text) return ""
    return text
        .replace(/<image_prompt[\s\S]*?<\/image_prompt>/gi, "")
        .replace(/<image_prompt[^>]*\/>/gi, "")
}

/**
 * Parses Scene Headers in the format: 『 [Location] · [Time] · [Weather] 』
 * @param {string} text
 * @returns {{ content: string, header: { location: string, time: string, weather: string }|null }}
 */
export function parseSceneHeader(text) {
    if (!text) return { content: "", header: null }

    // Pattern: 『 [Location] · [Time] · [Weather] 』
    const match = text.match(
        /^『\s*\[(.*?)]\s*·\s*\[(.*?)]\s*·\s*\[(.*?)]\s*』/
    )

    if (match) {
        return {
            content: text.replace(match[0], "").trim(),
            header: {
                location: match[1],
                time: match[2],
                weather: match[3],
            },
        }
    }

    return { content: text, header: null }
}

/**
 * Master parser that runs all passes.
 * @param {string} rawText
 * @returns {{ displayText: string, think: string|null, sceneData: object|null }}
 */
export function parseMessage(rawText) {
    // 1. Remove Image Prompts (Artifacts)
    let text = cleanImagePrompts(rawText || "")

    // 2. Extract Think Block
    const thinkResult = parseThinkBlock(text)
    text = thinkResult.content

    // 3. Extract Scene Header
    const headerResult = parseSceneHeader(text)

    return {
        displayText: headerResult.content,
        think: thinkResult.think,
        sceneData: headerResult.header,
    }
}
