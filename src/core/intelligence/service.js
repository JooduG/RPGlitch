/**
 * src/core/llm/service.js
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 */

import { ERROR_MESSAGES } from "@core/engine/config.js"
import { app } from "@state/app.svelte.js"

const utilsError = console.error

const ENHANCEMENT_ROUTER = {
    "visuals.prompt": {
        role: "VISUAL_DIRECTOR_V3.0",
        injections: ["styles", "lighting", "tech", "composition", "mood"],
        directive:
            "Maintain the exact structure and order of the user's base prompt at the front of the string to preserve primacy bias. Append 1-2 matching tags from the injected AVAILABLE_TAGS to the end of the string based on the implicit vibe. Resolve any tag conflicts. Output ONLY the finalized comma-separated prompt string.",
    },
    "chat.user_input": {
        role: "GHOSTWRITER",
        injections: [],
        directive:
            "Rewrite the user's raw input into a highly stylized, diegetic roleplay action suitable for a cyberpunk/sci-fi simulation. Preserve the exact intent and dialogue, but elevate the prose to be punchy and visceral.",
    },
    "eternal.physical": {
        role: "NARRATIVE_ARCHITECT",
        injections: [],
        directive:
            "Focus exclusively on immutable visual anatomy, cybernetics, scars, and baseline aesthetics. Use highly descriptive, concrete nouns suitable for eventual image generation translation. Do not describe personality.",
    },
    "present.physical": {
        role: "NARRATIVE_ARCHITECT",
        injections: [],
        directive:
            "Focus on immediate clothing, active battle damage, current posture, temporary gear, and environmental wear-and-tear (e.g., wet hair, torn jacket).",
    },
    "eternal.mental": {
        role: "PSYCH-PROFILER",
        injections: [],
        directive:
            "Focus on deep-seated psychological traits, core motivations, traumas, and overarching personality archetypes. Use behavioral descriptors. Do NOT use visual metaphors.",
    },
    "present.mental": {
        role: "PSYCH-PROFILER",
        injections: [],
        directive:
            "Focus on the character's immediate emotional state, current stress levels, and short-term desires based on the active objective. Are they panicked, hyper-focused, or exhausted?",
    },
    past: {
        role: "LOREMASTER",
        injections: [],
        directive:
            "Expand this backstory fragment into a dense, encyclopedic lore entry. Focus on worldbuilding, past corporate affiliations, historical events, and origins. Write in a sterile, archival tone.",
    },
    future: {
        role: "FATE_WEAVER",
        injections: [],
        directive:
            "Enhance this goal or ambition. Describe it as a looming, high-stakes trajectory. What is the ultimate endgame this character is driving toward?",
    },
}

export const LlmService = {
    /**
     * Optimizes a text prompt specifically for Stable Diffusion style generation.
     * // [VISUALS HELPER] Prepares prompts for VisualsService
     */
    // The Universal Enhancement Engine
    async enhance(text, fieldKey) {
        const route = ENHANCEMENT_ROUTER[fieldKey] || {
            role: "EDITOR",
            injections: [],
            directive: "Preserve the core meaning but elevate the prose.",
        }

        let contextBlock = ""

        // Dynamically pull ONLY the lists the Router asked for
        if (
            route.injections &&
            route.injections.length > 0 &&
            typeof window !== "undefined" &&
            window.rpgLists
        ) {
            try {
                const injectedData = {}
                route.injections.forEach((listName) => {
                    if (window.rpgLists[listName]) {
                        // Parse the specific array injected by Perchance
                        injectedData[listName] = JSON.parse(
                            window.rpgLists[listName][0]
                        )
                    }
                })

                // Format it cleanly for the LLM
                contextBlock = `\n<AVAILABLE_TAGS>\n${JSON.stringify(injectedData)}\n</AVAILABLE_TAGS>`
            } catch (e) {
                console.warn("Failed to mount specific Perchance lists.", e)
            }
        }

        const systemPrompt = `
[SYSTEM: ${route.role}]
Your objective is to enhance a specific UI text field.

<CRITICAL_DIRECTIVE>
${route.directive}
</CRITICAL_DIRECTIVE>
${contextBlock}

<RULES>
Output ONLY the final enhanced text. No conversational filler, no quotes.
</RULES>`.trim()

        const payload = {
            system: systemPrompt,
            messages: [{ role: "user", content: text }],
        }

        // Ensure this calls the actual underlying generation method used by LlmService
        return await this.generate(payload, { silent: true })
    },

    /**
     * Generates text using the AI plugin.
     * Now supports DIRECT STREAMING to app state.
     */
    generate: async (payload, options = {}) => {
        if (!window.ai) {
            const msg = "Perchance AI plugin not available."
            if (!options.silent) utilsError(msg)
            throw new Error(msg)
        }

        // 1. Format History (Legacy Adapter)
        const chatHistory = LlmService._formatHistory(payload.messages || [])

        // 2. Construct Final Instruction
        const instruction = [
            payload.system,
            chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
            payload.startWith ? `\n${payload.startWith}` : "",
        ]
            .filter(Boolean)
            .join("\n")

        try {
            // 3. Prepare Plugin Options
            const genOptions = {
                temperature:
                    options.temperature ?? payload.params?.temperature ?? 0.8,
                top_p: options.top_p ?? payload.params?.top_p,
                repetition_penalty:
                    options.repetition_penalty ??
                    payload.params?.repetition_penalty,
                max_tokens: options.maxTokens ?? payload.params?.maxTokens,
                model: options.model ?? payload.params?.model,
                stop_sequences: payload.stopSequences || [],
                signal: options.signal,
                silent: options.silent,
            }

            // 4. STREAMING HANDLER
            const onToken = (chunk) => {
                if (!app.streaming.active) {
                    app.startStream(payload.nodeId || "temp")
                }
                app.updateStream(chunk)

                if (options.onToken) options.onToken(chunk)
            }

            // 5. Call Plugin
            const result = await window.ai(instruction, {
                ...genOptions,
                onToken,
            })

            app.endStream()

            return result
        } catch (err) {
            app.endStream()

            if (options.silent) {
                console.warn(
                    "[LlmService] Silent Generation Error (Suppressed):",
                    err
                )
                throw err
            }

            const errString = String(err)

            if (
                errString.includes("stream keep alive") ||
                errString.includes("timeout")
            ) {
                utilsError("[LlmService] Network Error:", err)
                throw new Error(`${ERROR_MESSAGES.CONNECTION_LOST}`)
            }

            throw err
        }
    },

    /**
     * Formats the message history for the LLM.
     */
    _formatHistory: (messages) =>
        messages
            .map((m) => {
                let label =
                    m.characterName ||
                    (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `${label}: ${text}`
            })
            .join("\n\n"),
}
