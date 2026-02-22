/**
 * src/core/intelligence/context.js
 * 📚 DATA: Context Architecture
 * Assembles simulation state into structured prompts.
 */

import { state } from "@core/engine/bus.js"
import { ROLES } from "@core/engine/config.js"
import { entities } from "@data/repository.js"
import { ImageGeneration } from "@media/image-generation.js"

// Local Prose Templates (Inlined from legacy prose.js)
const templateConsult = (field, content, context) => `
[SYSTEM: DATA]
Thinking about ${field}:
Current: ${content}
Context: ${JSON.stringify(context)}
Provide a better description.
`

const templateEcho = (entity, history, role = "character") => `
[SYSTEM: ECHO]
Role: ${role}
Summarize history for ${entity.name}:
${history}
`
const Screenplay = {
    standard: (ai, user, fractal, variance = "", visuals = false) => `
[SCENE START]
Fractal: ${fractal.name}
Characters: ${ai.name}, ${user.name}
Variance: ${variance}
Visuals: ${visuals ? "ON" : "OFF"}
Roleplay on.
`,
    prologue: (fractal, context) => `
[PROLOGUE]
Fractal: ${fractal.name}
Intro: ${context.title}
`,
    epilogue: (fractal, { history, ai, user }) => `
[EPILOGUE]
History: ${history}
Characters: ${ai?.name}, ${user?.name}
Wrap it up.
`,
}

export class ContextBuilder {
    constructor(storyId) {
        this.storyId = storyId
        this.story = storyId ? state.story.byId[storyId] : null
    }

    // =========================================================================
    // 1. GAMEPLAY (Roleplay Loop)
    // =========================================================================

    async build(instruction, options = {}) {
        if (!this.story) throw new Error("No active story for ContextBuilder")

        const [ai, user, fractal] = await Promise.all([entities.get("character", this.story.aiId), entities.get("character", this.story.userId), entities.get(ROLES.FRACTAL, this.story.fractalId)])

        const messages = state.messages.byStoryId[this.storyId] || []

        // Map to LLM format
        const llmMessages = messages.map((m) => ({
            role: m.role === ROLES.USER ? "user" : "model",
            content: m.text,
            characterName: m.characterName || (m.role === ROLES.AI ? ai.name : user.name),
        }))

        if (instruction) {
            llmMessages.push({
                role: "user",
                content: instruction,
            })
        }

        // Variance & Visuals Delegation
        // [STUB] Security.authorizeVisuals not yet implemented - default to true
        const visualsAuthorized = options.allowVisuals ?? true

        const system = Screenplay.standard(ai, user, fractal, options.varianceInstruction, visualsAuthorized)

        const userName = user?.name || "User"

        return {
            system,
            messages: llmMessages,
            stopSequences: [`\n${userName}:`, "\nUser:", "\nCharacter:"],
        }
    }

    async buildPrologue() {
        if (!this.story) throw new Error("No active story")

        const [ai, user, fractal] = await Promise.all([entities.get("character", this.story.aiId), entities.get("character", this.story.userId), entities.get(ROLES.FRACTAL, this.story.fractalId)])

        if (!fractal) return null

        // [SECURITY] Strip Description (Reviewer Eyes Only)
        const cleanEntity = (e) => {
            if (!e) return null
            const { description, ...clean } = e
            return clean
        }

        const context = {
            title: this.story.storyTitle || "A new journey begins.",
            ai: cleanEntity(ai),
            user: cleanEntity(user),
        }

        const system = Screenplay.prologue(fractal, context)
        return { system, messages: [] }
    }

    async buildEpilogue() {
        if (!this.story) throw new Error("No active story")
        const fractal = await entities.get(ROLES.FRACTAL, this.story.fractalId)
        const ai = await entities.get(ROLES.AI, this.story.aiId)
        const user = await entities.get(ROLES.USER, this.story.userId)

        const rawMessages = state.messages.byStoryId[this.storyId] || []
        const history = rawMessages
            .slice(-30)
            .map((m) => {
                const name = m.characterName || (m.role === ROLES.USER ? "User" : "AI")
                return `[${name}]: ${m.text}`
            })
            .join("\n")

        const system = Screenplay.epilogue(fractal, { ai, user, history })
        return { system, messages: [] }
    }

    async buildSecurityPrompt(targetEntity, others, historyMessages, activeThreads) {
        // SECURITY PROMPT COMPOSITION (Inlined from deprecated Security.compose)
        const system = `
[SYSTEM: PROMETHEUS_SECURITY]
You are the SECURITY layer.
Your goal is to analyze the narrative and ensure simulation integrity.

ENTITIES:
Target: ${targetEntity.name} (${targetEntity.role || targetEntity.type})
Others:
${others.map((e) => `- ${e.name} (${e.role || e.type})`).join("\n")}

ACTIVE THREADS:
${activeThreads.join("\n")}

HISTORY:
${Array.isArray(historyMessages) ? historyMessages.map((m) => `[${(m.role || "User").charAt(0).toUpperCase() + (m.role || "User").slice(1)}]: ${m.text}`).join("\n") : historyMessages}

Analyze the last message and output JSON:
[JSON SCHEMA]
{
  "dynamics": { "entropy": 0-100, "velocity": 0-100, "permeability": 0-100, "resonance": 0-100 },
  "reflexes": ["list", "of", "detected", "reflexes"],
  "reasoning": "Explanation of the analysis",
  "log_entry": "Short summary of events from AI's biased perspective."
}
`.trim()

        return { system, messages: [] }
    }

    // =========================================================================
    // 2. VISUALIZATION (Polish)
    // =========================================================================

    async buildPolishVisual(targetType) {
        const [ai, user, fractal] = await Promise.all([entities.get("character", this.story.aiId), entities.get("character", this.story.userId), entities.get(ROLES.FRACTAL, this.story.fractalId)])

        const rawMessages = state.messages.byStoryId[this.storyId] || []
        const history = rawMessages
            .slice(-5)
            .map((m) => {
                const name = m.characterName || (m.role === ROLES.USER ? "User" : "AI")
                return `[${name}]: ${m.text}`
            })
            .join("\n")

        const context = { ai, user, fractal, history }
        const mesmerInstructions = ImageGeneration.templateVisual(targetType, null, context)

        return {
            system: mesmerInstructions,
            messages: [],
            stopSequences: ["\n", "User:", "Character:"],
        }
    }

    buildPolishFetch(description) {
        const system = ImageGeneration.templateVisual("ai", description, {
            mode: "fetch",
        })
        return { system, messages: [] }
    }

    async buildPolishEnhance(prompt, entity) {
        const targetType = entity.type === "fractal" ? "scene" : "ai"
        const context = {
            mode: "enhance",
            ai: entity.type !== "fractal" ? entity : null,
            fractal: entity.type === "fractal" ? entity : null,
        }
        const system = ImageGeneration.templateVisual(targetType, prompt, context)
        return { system, messages: [] }
    }

    /**
     * [FIX] Maestro Enhance (Profile Editor Magic Wand)
     * Wraps Polish logic to support the UI's specific call signature.
     */

    async buildMaestroEnhance(prompt, entity, signatureColor) {
        // Reuse Polish's enhance logic
        return this.buildPolishEnhance(prompt, entity)
    }

    // =========================================================================
    // 3. KNOWLEDGE & MEMORY (Data)
    // =========================================================================

    buildDataPrompt(field, content, context) {
        // Replaces buildScholarPrompt
        const system = templateConsult(field, content, context)
        return { system, messages: [] }
    }

    async buildDataEchoPrompt(targetEntity, historyMessages, role) {
        const historyText = historyMessages
            .map((m) => {
                const label = m.characterName || (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `[${label}]: ${text}`
            })
            .join("\n")

        const system = templateEcho(targetEntity, historyText, role)
        return { system, messages: [] }
    }
}
