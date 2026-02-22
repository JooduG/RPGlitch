/**
 * src/media/image-generation.js
 * 🎨 IMAGE GENERATION SERVICE
 * Orchestrates prompt synthesis and Perchance text to image integration.
 */

import { events, EVENTS, state } from "@core/engine/bus.js"
import { CONFIG, ROLES } from "@core/engine/config.js"
import { ContextBroker } from "@core/intelligence/broker.js"
import { ContextBuilder } from "@core/intelligence/context.js"
import { LlmService } from "@core/intelligence/service.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"

const error = console.error
const { PALETTE, PHYSICS } = CONFIG
const PHYSICS_CONSTANTS = PHYSICS

/************************************************************************************
 * 🧩 [SECTION: PROMPTS & CONSTANTS]
 * ----------------------------------------------------------------------------------
 * Centralized aesthetic definitions, system prompts, and configuration strings.
 ************************************************************************************/

const NEGATIVE_PROMPT =
    "text, watermark, blurry, low quality, deformed, cartoon, anime, missing limbs, extra limbs, mutated limbs, deformed limbs, fused limbs, missing eyes, extra eyes, fused eyes, missing ears, extra ears, fused ears, missing nose, extra nose, fused nose, missing mouth, extra mouth, fused mouth, missing teeth, extra teeth, fused teeth, missing fingers, extra fingers, fused fingers, missing toes, extra toes, fused toes, missing hands, extra hands, fused hands, missing feet, extra feet, fused feet, missing legs, extra legs, fused legs, missing arms, extra arms, fused arms"

/************************************************************************************
 * 🧩 [SECTION: AESTHETIC ROUTER]
 * ----------------------------------------------------------------------------------
 * Matches character data against Panel lists for precise, dynamic targeting.
 ************************************************************************************/

/**
 * AestheticRouter
 * Semantic matchmaker for visual tokens.
 */
const AestheticRouter = {
    /**
     * Selects specific aesthetic tokens based on semantic affinity with character data.
     * @param {Object} characterData - The character/entity data.
     * @returns {Object} Selected tokens for style, lighting, and mood.
     */
    select(characterData = {}) {
        const physical = (characterData.physical || "").toLowerCase()
        const traits = (characterData.traits || []).map((t) => t.toLowerCase())
        const haystack = `${physical} ${traits.join(" ")}`

        const lists = {
            styles: getRpgList("styles"),
            lighting: getRpgList("lighting"),
            mood: getRpgList("mood"),
            quality: getRpgList("quality"),
        }

        const pickMatch = (list) => {
            const matches = list.filter((item) => haystack.includes(item.toLowerCase().split(",")[0].trim()))
            return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null
        }

        return {
            style: pickMatch(lists.styles),
            lighting: pickMatch(lists.lighting),
            mood: pickMatch(lists.mood),
            quality: lists.quality.length > 0 ? lists.quality[Math.floor(Math.random() * lists.quality.length)] : null,
        }
    },
}

/**
 * Utility to safely access the lists injected from the Left Panel.
 */
const getRpgList = (key) => {
    if (typeof window !== "undefined" && window.rpgLists && window.rpgLists[key]) {
        let list = window.rpgLists[key]
        // Adaptive Parsing: Handle the [JSON.stringify(...)] quirk or raw arrays
        if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
            try {
                return JSON.parse(list[0])
            } catch (e) {
                return list
            }
        }
        return Array.isArray(list) ? list : []
    }
    return []
}

export const VISUAL_CORTEX = `
[VISUAL_CORTEX]
- You have access to a visual generation engine.
- To generate an image, output a separate line: <image_prompt>Description of the image</image_prompt>.
- The description should be visual, detailed and artistic.
- Do NOT include the <image_prompt> block inside the <think> block.
`

const PROMPT_TEMPLATES = {
    optimize: (text, selections = {}) => {
        const { style, lighting, mood, quality } = selections
        const grounding = [style, lighting, mood, quality].filter(Boolean).join(", ")

        return `
[SYSTEM: PROMPT_ENGINEER]
I translate rough character descriptions into dense, visual-only tokens optimized for text-to-image stable diffusion models.

<CONSTRAINTS>
- I output ONLY a comma-separated list of visual descriptors.
- I do NOT use first-person language ("I am", "My").
- I exclude abstract concepts, names, or narrative backstory.
- I focus purely on visual elements: subject, clothing, physical features, lighting, camera angle, and aesthetic style.
</CONSTRAINTS>

<AESTHETIC_GROUNDING>
${grounding || "photorealistic, cinematic lighting, 8k resolution, detailed texture"}
</AESTHETIC_GROUNDING>

<DRAFT_DESCRIPTION>
${text}
</DRAFT_DESCRIPTION>`.trim()
    },

    builder: (targetType, rawIntent, context, selections = {}) => {
        const { ai, user, fractal, history, mode = "visualize" } = context || {}
        const { style, lighting, mood, quality } = selections
        const grounding = [style, lighting, mood, quality].filter(Boolean).join(", ")
        let ctxBlock = ""

        switch (targetType) {
            case "scene":
                ctxBlock = `
[CONTEXT: FRACTAL (ENVIRONMENTAL ONLY)]
Base Physics: ${fractal?.forever?.physical || "Unknown"}
Current State: ${fractal?.present?.physical || "Standard atmosphere"}
Constraint: **STRICTLY NO CHARACTERS.** This image MUST NOT contain any humans, people, or specific characters. Focus entirely on setting, lighting, and objects.
`
                break

            case "user":
                ctxBlock = `
[CONTEXT: USER (AVATAR)]
Identity: ${user?.name || "User"}
Base Form (Forever): ${user?.forever?.physical || "Unknown"}
Dynamic State (Present): ${user?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the User. Do NOT include backgrounds characters or the AI character.
`
                break

            case "ai":
            case "character":
            default:
                ctxBlock = `
[CONTEXT: AI_ENTITY (CHARACTER)]
Identity: ${ai?.name || "AI"}
Base Form (Forever): ${ai?.forever?.physical || "Unknown"}
Dynamic State (Present): ${ai?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the AI. Do NOT include backgrounds characters or the User.
`
                break
        }

        return `
[SYSTEM: POLISH_ENGINE_V3.0]
[MODULE: VISUAL_REALITY_ENGINE]
Role: Backend Image Prompt Processor.
Task: Convert the User's intent into a high-fidelity Stable Diffusion prompt.
Target: ${targetType}
[MODE: ${mode.toUpperCase()}]
[VISUALS_AUTHORIZED]
[THINK_AUTHORIZED]

[RECENT CONTEXT]
${history || "No recent history."}

${ctxBlock}

[INSTRUCTIONS: ${mode.toUpperCase()}]
${
    mode === "fetch"
        ? "Objective: Scrape the provided Description/Profile to generate a brand new photorealistic portrait prompt. Focus on physical traits, lighting, and cinematic composition."
        : mode === "enhance"
          ? "Objective: Refine the User's raw prompt into a high-fidelity visual description. Upgrade lighting, texture, and technical descriptors while preserving original intent."
          : "Objective: Standard operation. Convert the User's intent into a single impactful image prompt."
}

Input Context (Intent): "${rawIntent || "See raw input"}"

[PROTOCOL: OPTICS_BRAIN]
1. **CHAIN_OF_THOUGHT:** You MUST start with a <think> block to plan the composition (Lighting, Angle, Physics, Details) before writing the prompt.
2. **SOLO_SHOT:** You are authorized to generate **EXACTLY ONE** <image_prompt> tag. Do NOT generate multiple images. Pick the single most impactful moment.

[PROTOCOL: GENDER_STRICTNESS]
- **HAMMER DOWN THE GENDER.**
- If the Profile says MALE/MAN/BOY, the image MUST be MALE.
- If the Profile says FEMALE/WOMAN/GIRL, the image MUST be FEMALE.
- Any ambiguity (e.g. "femboy") must lean HEAVILY towards the biological base form defined in [Base Form] unless explicitly overridden by [Dynamic State].

<AESTHETIC_GROUNDING>
${grounding || "photorealistic, cinematic lighting, 8k resolution, detailed texture"}
</AESTHETIC_GROUNDING>

[STRICT_PROTOCOL]
1. **HIERARCHY IS LAW.** If <RAW_INTENT> conflicts with Profile, <RAW_INTENT> wins.
2. **PHYSICAL ONLY.** Do NOT infer mental states. Use valid visual descriptors only.
3. **FORMAT:** Output properly formatted prompt text only. No conversational filler.
`
    },
}

/************************************************************************************
 * 🧩 [SECTION: PROMPT ENGINEERING (LLM PIPELINE)]
 * ----------------------------------------------------------------------------------
 * Translates narrative text into dense, comma-separated visual tags
 * tailored for Stable Diffusion image generation.
 ************************************************************************************/

const PromptEngine = {
    async optimize(text, context = {}) {
        const selections = AestheticRouter.select(context)
        const payload = {
            system: PROMPT_TEMPLATES.optimize(text, selections),
            messages: [],
        }

        let result = await LlmService.generate(payload, { silent: true })

        if (typeof result === "string") {
            result = result
                .replace(/^["']|["']$/g, "")
                .replace(/^(here is|sure|certainly|image prompt:|the prompt).*?:/i, "")
                .replace(/^```.*?[\r\n]/gm, "")
                .replace(/```$/g, "")
                .trim()
        }

        return result
    },

    composeBase(entity) {
        const present = entity.present?.physical || ""
        const eternal = entity.eternal?.physical || ""
        // We strictly use semantic names (e.g. "neon crimson"), NOT hex codes.
        let semanticColor = entity.visuals?.colorName || ""

        if (!semanticColor && entity.visuals?.signatureColor) {
            const sigColor = entity.visuals.signatureColor
            const isHex = /^#[0-9A-F]{6}$/i.test(sigColor)

            if (isHex) {
                const match = Object.entries(PALETTE).find(([, hex]) => hex.toLowerCase() === sigColor.toLowerCase())
                if (match) {
                    semanticColor = match[0]
                }
            } else {
                semanticColor = sigColor
            }
        }

        // Strict Primacy Hierarchy
        const fragments = []

        if (present) fragments.push(present)
        if (eternal) fragments.push(eternal)
        if (semanticColor) fragments.push(`integrate ${semanticColor} into the image, potentially as background color`)

        // Baseline fluff if the user bypasses the LLM enhancer
        fragments.push("high quality, hyper-realistic, volumetric lighting, 8k resolution")

        return fragments.join(", ")
    },
}

/************************************************************************************
 * 🧩 [SECTION: CORE GENERATOR (API BRIDGE)]
 * ----------------------------------------------------------------------------------
 * Handles physical image generation, aspect ratios, caching to IndexedDB,
 * and external API uploads bridging to plugins.
 ************************************************************************************/

const GeneratorEngine = {
    getResolution(mode) {
        switch (mode) {
            case "landscape":
            case "scene":
            case "fractal":
                return { width: 768, height: 512 }
            case "portrait":
            case "character":
            case "user":
            case "ai":
                return { width: 512, height: 768 }
            default:
                return { width: 768, height: 768 }
        }
    },

    async cacheImage(entityId, imageData) {
        try {
            await db.entities.update(entityId, {
                "visuals.profilePicture": imageData,
                updatedAt: Date.now(),
            })

            // Notify simulation of the update
            events.dispatchEvent(
                new CustomEvent(EVENTS.ENTITY_UPDATED, {
                    detail: {
                        id: entityId,
                        visuals: { profilePicture: imageData },
                    },
                })
            )
        } catch (err) {
            console.error("[VISUAL_ENGINE] Caching Failed:", err)
        }
    },

    async upload(file) {
        if (!window.pluginUpload) {
            console.error("[VISUAL_ENGINE] upload plugin not found.")
            return null
        }

        try {
            const result = await window.pluginUpload(file)
            return result?.url || result
        } catch (e) {
            console.error("[VISUAL_ENGINE] Upload failed:", e)
            return null
        }
    },

    async execute(finalPrompt, negativePrompt, options) {
        if (!window.pluginTextToImage) {
            console.warn("[VISUAL_ENGINE] Perchance text to image plugin not available.")
            return null
        }

        const res = this.getResolution(options.mode)

        const result = await window.pluginTextToImage({
            prompt: finalPrompt,
            negativePrompt: negativePrompt,
            seed: options.seed || Math.floor(Math.random() * 1000000),
            width: options.width || res.width,
            height: options.height || res.height,
        })

        return result
    },
}

/************************************************************************************
 * 🧩 [SECTION: DOMAIN PIPELINES (THE FACADE)]
 * ----------------------------------------------------------------------------------
 * Higher level pipelines providing workflows to consumers. Exposes backward
 * compatible methods wrapping the internal engines.
 ************************************************************************************/

export const ImageGeneration = {
    /**
     * Synthesizes and generates an image for a specific entity.
     * @param {string|Object} target - Either an entityId or a raw prompt string.
     * @param {Object} options - Override parameters.
     * @returns {Promise<string>} The generated image URL.
     */
    async generate(target, options = {}) {
        try {
            let finalPrompt = ""
            let entityId = null

            if (typeof target === "string" && target.length > 100) {
                // If it looks like a long specific prompt, use it
                finalPrompt = target
            } else if (typeof target === "string") {
                // It's an ID
                entityId = target
                const context = await ContextBroker.assemble(entityId, "visual")
                const characterData = {
                    physical: context.physical || "",
                    traits: context.traits || [],
                }
                finalPrompt = await PromptEngine.optimize(context.system || "", characterData)
            } else {
                // Target is likely an object or raw prompt
                finalPrompt = target.toString()
            }

            const result = await GeneratorEngine.execute(finalPrompt, NEGATIVE_PROMPT, options)

            if (result && result.dataUrl) {
                // Perchance plugin returns an object with dataUrl
                if (entityId && !options.noCache) {
                    await GeneratorEngine.cacheImage(entityId, result.dataUrl)
                }
                return result.dataUrl
            }

            if (result && entityId && !options.noCache) {
                await GeneratorEngine.cacheImage(entityId, result)
            }

            return result
        } catch (err) {
            console.error("[VISUAL_ENGINE] Generation Failed:", err)
            throw err
        }
    },

    /**
     * Visualizer Pipeline
     * Generates a scene or character image based on a raw intent.
     */
    visualize: async (storyId, visualPrompt, targetType, options = {}) => {
        const story = state.story.byId[storyId]
        if (!story) throw new Error(`Story ${storyId} not found`)

        let targetRole = ROLES.AI
        let targetId = story.aiId

        if (targetType === ROLES.FRACTAL || targetType === "scene") {
            targetRole = ROLES.FRACTAL
            targetId = story.fractalId
        } else if (targetType === ROLES.USER) {
            targetRole = ROLES.USER
            targetId = story.userId
        }

        events.dispatchEvent(
            new CustomEvent(EVENTS.TYPING_STARTED, {
                detail: { role: targetRole, characterId: targetId },
            })
        )

        try {
            const builder = new ContextBuilder(storyId)
            let vTarget = targetType || "character"
            if (targetType === ROLES.FRACTAL) vTarget = "scene"

            const vPayload = await builder.buildPolishVisual(vTarget)

            // Dynamic Aesthetic Selection
            const characterData = {
                physical: vTarget === "scene" ? vPayload.fractal?.present?.physical : vTarget === "user" ? vPayload.user?.present?.physical : vPayload.ai?.present?.physical,
                traits: [], // Traits are less critical for transient visualization but could be pulled
            }
            const selections = AestheticRouter.select(characterData)

            vPayload.system = PROMPT_TEMPLATES.builder(vTarget, visualPrompt, vPayload, selections)
            vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`

            const refinedPrompt = await LlmService.generate(vPayload, {
                maxTokens: 300,
                temperature: PHYSICS_CONSTANTS.VISUAL_TEMP_DEFAULT,
            })

            // Extract Optics Thoughts for UI
            const thinkMatch = refinedPrompt.match(/<think>([\s\S]*?)<\/think>/i)
            const opticsThoughts = thinkMatch ? thinkMatch[1].trim() : null

            // Strip any leaked Narrative tags from the Refined Prompt
            const cleanRefinedPrompt = refinedPrompt
                .replace(/<think>[\s\S]*?<\/think>/gi, "")
                .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
                .trim()

            const imageUrl = await ImageGeneration.generate(cleanRefinedPrompt, {
                mode: options.aspect || vTarget,
                guidanceScale: options.guidanceScale,
            })

            return {
                imageUrl,
                refinedPrompt: cleanRefinedPrompt,
                opticsThoughts,
            }
        } catch (visErr) {
            error("[Polish_Engine] Visual Generation Failed:", visErr)
            return { imageUrl: null, refinedPrompt: null, opticsThoughts: null }
        } finally {
            events.dispatchEvent(
                new CustomEvent(EVENTS.TYPING_STOPPED, {
                    detail: { role: targetRole, characterId: targetId },
                })
            )
        }
    },

    /**
     * Fetch Pipeline
     * Scrape a description to generate a portrait.
     */
    fetch: async (characterId) => {
        try {
            const character = await entities.get("character", characterId)
            if (!character) throw new Error("Character not found")

            const characterData = { physical: character.description || character.name, traits: character.traits || [] }
            const selections = AestheticRouter.select(characterData)

            const builder = new ContextBuilder(null)
            const { system } = await builder.buildPolishFetch(character.description || character.name)

            const payload = {
                system: PROMPT_TEMPLATES.optimize(system, selections),
                messages: [],
            }

            const refinedPrompt = await LlmService.generate(payload)
            const imageUrl = await ImageGeneration.generate(refinedPrompt, {
                mode: "character",
            })

            return imageUrl
        } catch (e) {
            error("[Polish_Engine] Fetch Failed:", e)
            throw e
        }
    },

    // --- ALIASES FOR BACKWARD COMPATIBILITY ---
    optimizeImagePrompt: PromptEngine.optimize,
    composeBasePrompt: PromptEngine.composeBase,
    getResolution: GeneratorEngine.getResolution,
    upload: GeneratorEngine.upload,
    cacheImage: GeneratorEngine.cacheImage,
    templateVisual: PROMPT_TEMPLATES.builder,
}
