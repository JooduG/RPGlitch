import { state } from "@core/engine/bus.js"
import { Engine } from "@core/narrative/engine.js"
import { app } from "@state/app.svelte.js"
import { runtime } from "@state/runtime.svelte.js"

export class ContextBroker {
    /**
     * Assembles a context payload for the LLM based on the current phase.
     * @param {string} action - The user's input or triggered action.
     * @param {string} type - 'prose' | 'physics' | 'visual'
     * @returns {Promise<Object>} The payload { system, messages, ... }
     */
    static async assemble(action, type = "prose") {
        // 1. Identify Requirements
        const requirements = this.getRequiredContext(type)

        // 2. Fetch Modular Data from Runtime (Single Source of Truth)
        const stateData = {
            kernel: requirements.includes("kernel") ? this.pullKernel() : null,
            chrono: requirements.includes("chrono") ? this.pullChrono() : null,
            snapshot: requirements.includes("snapshot")
                ? this.assembleSnapshot()
                : null,
            fractal: requirements.includes("fractal")
                ? this.pullFractal()
                : null,
            entity: requirements.includes("entity")
                ? this.pullEntity(type)
                : null,
        }

        // 3. Delegate to Narrative Engine
        // TODO: Get active Tone ID from State/Config
        const toneKey = "DEFAULT"

        const result = await Engine.compose({
            input: action,
            toneKey: toneKey,
            state: stateData,
        })

        // 4. Format Messages (Tiered L1 history)
        const messages = this.pullHistory()

        return {
            system: result.system,
            messages,
            meta: result.meta,
            params: {
                temperature: type === "physics" ? 0.3 : 0.8,
            },
        }
    }

    /**
     * [L1 HISTORY]
     * Pulls the most recent unconsolidated messages for dialogue flow.
     */
    static pullHistory() {
        const activeId = state.story?.activeId
        if (!activeId) return []

        const messages = state.messages?.byStoryId[activeId] || []
        // Only show last 10 unconsolidated messages to keep the context slim
        return messages
            .filter((m) => !m.meta?.consolidated)
            .slice(-10)
            .map((m) => ({
                role: m.role === "user" ? "user" : "model",
                content: m.text,
                characterName: m.characterName,
            }))
    }

    /**
     * Determines what data fragments are needed for a specific phase.
     */
    static getRequiredContext(phase) {
        switch (phase) {
            case "physics":
                return ["kernel", "fractal"]
            case "visual":
                return ["fractal", "entity"]
            case "prose":
            default:
                return ["kernel", "chrono", "snapshot", "fractal", "entity"]
        }
    }

    // --- LAYER FETCHERS ---

    static pullKernel() {
        return {
            rules: "Release Control. The simulation is live. Output prose directly.",
        }
    }

    static pullChrono() {
        /** @type {any} */
        const chrono = app.simulation.chrono || {
            activeObjective: null,
            currentConflict: null,
        }
        return {
            turn: app.simulation.turn,
            objective: runtime.vanguard || "Continue the journey.",
            conflict: chrono.currentConflict || "The outcome is uncertain.",
        }
    }

    /**
     * [L1 CACHE] Narrative Snapshot
     * Captures the last 2-3 significant action beats.
     */
    static assembleSnapshot() {
        const activeId = state.story?.activeId
        if (!activeId) return null

        const messages = state.messages?.byStoryId[activeId] || []
        if (messages.length === 0) return null

        // Capture last 3 messages as raw beats for continuity
        const beats = messages
            .slice(-3)
            .map((m) => {
                const label =
                    m.characterName || (m.role === "user" ? "User" : "AI")
                return `[${label}]: ${this.PunchyTransformer(m.text || "", 120)}`
            })
            .join("\n")

        return beats
    }

    static pullFractal() {
        const fractal = runtime.storyFractal || {}
        return {
            title: fractal.name || "Unknown Fractal",
            lore: fractal.description || "",
            state: fractal.present || {},
        }
    }

    static pullEntity(mode = "prose") {
        const ai = runtime.aiCharacter || {}
        const user = runtime.userCharacter || {}
        const objective = runtime.vanguard || ""

        // Process AI Fragments with Lexical Filtering
        const aiFragments = [
            ai.timeline?.past,
            ai.past,
            ai.present?.physical,
            ai.present?.mental,
            ai.eternal?.physical,
            ai.eternal?.mental,
        ]
            .filter(Boolean)
            .map((f) => this.PunchyTransformer(f))
            .map((f) => this.DiegeticFilter(f, mode)) // [NEXUS] Diegetic Tag Filtering
            .filter((f) => f.length > 0)

        const filteredAi = this.LexicalFilter(aiFragments, objective)

        // Process User Fragments
        const userFragments = [
            user.description,
            user.present?.physical,
            user.present?.mental,
        ]
            .filter(Boolean)
            .map((f) => this.PunchyTransformer(f))
            .map((f) => this.DiegeticFilter(f, mode)) // [NEXUS] Diegetic Tag Filtering
            .filter((f) => f.length > 0)

        return {
            ai: {
                name: ai.name || "AI",
                role: ai.role || "Assistant",
                fragments: filteredAi,
            },
            user: {
                name: user.name || "User",
                fragments: userFragments,
            },
        }
    }

    // --- JS UTILS (Non-AI) ---

    /**
     * [JS] Lexical Filter
     * Prioritizes fragments that match current objective keywords.
     */
    static LexicalFilter(fragments, objective) {
        if (!objective) return fragments

        const keywords = objective
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 3)

        return fragments.sort((a, b) => {
            const aMatch = keywords.some((k) => a.toLowerCase().includes(k))
            const bMatch = keywords.some((k) => b.toLowerCase().includes(k))
            if (aMatch && !bMatch) return -1
            if (!aMatch && bMatch) return 1
            return 0
        })
    }

    /**
     * [JS] Punchy Transformer
     * Cleans and condenses verbose text into dense prompts.
     */
    static PunchyTransformer(text, limit = 500) {
        if (!text) return ""
        // Strip markdown, extra whitespace, and truncate
        let clean = text
            .replace(/[*_#>`-]/g, "")
            .replace(/\s+/g, " ")
            .trim()
        if (clean.length > limit) clean = clean.substring(0, limit) + "..."
        return clean
    }

    /**
     * [JS] Diegetic Filter
     * Filters content based on [TACTILE] vs [VISUAL] tags.
     * mode = 'prose' -> Keep [TACTILE], remove [VISUAL]
     * mode = 'visual' -> Keep [VISUAL], remove [TACTILE]
     */
    static DiegeticFilter(text, mode = "prose") {
        if (!text) return ""

        // Regex for tags: \[TAG\] content... or \[TAG\]
        // Simple approach: Remove lines or sentences containing the unwanted tag?
        // Or remove the specific marked blocks?
        // Implementation: We assume tags are inline markers like "[VISUAL] Glowing eyes."

        if (mode === "prose") {
            // Remove [VISUAL] segments
            return text.replace(/\[VISUAL\].*?(\.|$)/g, "").trim()
        } else if (mode === "visual") {
            // Remove [TACTILE] segments
            return text.replace(/\[TACTILE\].*?(\.|$)/g, "").trim()
        }

        return text
    }

    // --- INJECTION ENGINE ---

    static injectLayers(context) {
        const layers = []

        // 1. KERNEL
        if (context.kernel) {
            layers.push(`[SYSTEM_KERNEL]\n${context.kernel.rules}`)
        }

        // 2. CHRONO (Temporal Anchor)
        if (context.chrono) {
            const background =
                runtime.echoes.length > 0
                    ? `\nBG_THREADS: ${runtime.echoes.map((e) => e.text).join(" | ")}`
                    : ""

            layers.push(
                `[CHRONO_LAYER]\nSTEP: ${context.chrono.turn}\nOBJECTIVE: ${context.chrono.objective}\nTENSION: ${context.chrono.conflict}${background}`
            )
        }

        // 3. SNAPSHOT (Continuity)
        if (context.snapshot) {
            layers.push(`[NARRATIVE_SNAPSHOT]\n${context.snapshot}`)
        }

        // 4. FRACTAL
        if (context.fractal) {
            layers.push(
                `[FRACTAL_LAYER]\nLOC: ${context.fractal.title}\nDAT: ${context.fractal.lore}`
            )
            if (
                context.fractal.state &&
                Object.keys(context.fractal.state).length > 0
            ) {
                layers.push(`ENV: ${JSON.stringify(context.fractal.state)}`)
            }
        }

        // 5. ENTITY
        if (context.entity) {
            const { ai, user } = context.entity

            let entityBlock = `[ENTITY_LAYER]\n`
            entityBlock += `ACTOR: ${ai.name} (${ai.role})\n`
            entityBlock += `CONTEXT:\n${ai.fragments.join("\n")}\n`

            entityBlock += `\nINTERACTOR: ${user.name}\n`
            entityBlock += `CONTEXT:\n${user.fragments.join("\n")}`

            layers.push(entityBlock)
        }

        return layers.join("\n\n")
    }
}
