/**
 * @file src/core/intelligence/prompt_builder.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🧠 PROMPT BUILDER  —  The Cognitive Manifest
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * This is the orchestrator of the Intelligence Kernel's prompt engineering layer.
 * It transitions the system from static templates to a dynamic, stateless factory.
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  RULES           : Immutable behavioral protocols (XML snippets).      │
 * │  SYSTEM_PROMPTS  : Pure template functions. Data → XML string.         │
 * │  PromptBuilder   : Stateless factory. Orchestrates per-turn assembly.  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * DATA FLOW
 *   application_state → PromptBuilder
 *                       └─→ SYSTEM_PROMPTS (Compose)
 *                           └─→ Helper Renderers (XML structure)
 *                               └─→ Final System Prompt → LlmService
 */

import { runtime } from "@state/runtime.svelte.js"
import { ENTITY_CATALOG } from "./entity_fragments.js"
import { ContextBroker } from "./intelligence_broker.js"

/************************************************************************************
 * 🧩 [SECTION: RULES]
 * ----------------------------------------------------------------------------------
 * Behavioral mandates injected into system prompts as hard constraints.
 * Each rule is a self-contained XML protocol block.
 ************************************************************************************/

export const RULES = {
    /**
     * CORE_PROTOCOLS
     * Merged identity and agency rules. Protects entity integrity and user boundaries.
     */
    CORE_PROTOCOLS: `
<PROTOCOL:CORE>
- IDENTITY: You are the entity marked as role="AI".
- EPISTEMIC_WALL: The User is a Black Box. Ground all inferences in observable signals.
- USER_AGENCY: Do not act or speak for the User. SHOW DON'T TELL.
</PROTOCOL:CORE>`.trim(),

    /**
     * GOVERNANCE (Formerly AFFIRMATIVE_ORDERS)
     * Enforces output hygiene: no meta-commentary, no jargon, no hedging.
     */
    GOVERNANCE: `
<PROTOCOL:GOVERNANCE>
- Use exclusively affirmative, present-tense language.
- No technical jargon, web terminology, or meta-commentary.
- No preambles ("Certainly!", "I can help with that"). Start directly.
</PROTOCOL:GOVERNANCE>`.trim(),

    /**
     * COGNITION (Formerly COGNITIVE_ROUTING)
     * Forces the LLM to output its internal reasoning inside <think> tags.
     */
    COGNITION: `
<PROTOCOL:COGNITION>
Render reasoning in <think> blocks before output.
</PROTOCOL:COGNITION>`.trim(),

    /**
     * NARRATIVE_STYLE
     * Sets the stylistic register for the simulation.
     * // TODO: Wire to Tone system
     *
     * @param {string} style - The narrative style genre (e.g. "Cyberpunk Noir").
     */
    // NARRATIVE_STYLE: (style) => `
    // <NARRATIVE_STYLE>
    // Adopt the ${style} style. Use vocabulary appropriate to this genre.
    // </NARRATIVE_STYLE>`.trim(),
}

// — Private Renderers —

/**
 * Renders the simulation grounding block: current turn, active objective, and kinetic behavior.
 * Ensure XML blocks are flush-left for optimal tokenization.
 *
 * @param {object} state
 * @returns {string}
 */
function render_narrative_core(state) {
    const turn = state?.entity?.turn ?? state?.turn ?? 1
    const objective = state?.entity?.objective ?? state?.objective ?? "Maintain narrative momentum."
    const behavior =
        Object.values(state?.active_signals || {})
            .filter((s) => s?.text)
            .map((s) => s.text)
            .join(" ") || "Standard operational parameters."

    return `
<NARRATIVE_CORE>
<TURN>${turn}</TURN>
<OBJECTIVE>${objective}</OBJECTIVE>
<BEHAVIOR>${behavior}</BEHAVIOR>
</NARRATIVE_CORE>`.trim()
}

/**
 * Renders all active entities as `<ENTITY>` blocks.
 *
 * @param {object} state
 * @returns {string}
 */
function render_entity(state) {
    const entity = state?.entity
    if (!entity || !Array.isArray(entity.list)) return ""

    const blocks = entity.list.map((e) => {
        const frags = (e.fragments || []).map((f) => `    <FRAGMENT type="${f.section || "General"}">${f.text}</FRAGMENT>`).join("\n") || `    <FRAGMENT type="Identity">No data on file.</FRAGMENT>`

        return `
<ENTITY role="${e.role}" name="${e.name || "Unknown"}">
${frags}
</ENTITY>`.trim()
    })

    return `
<ENTITIES>
${blocks.join("\n")}
</ENTITIES>`.trim()
}

/************************************************************************************
 * 🧩 [SECTION: SYSTEM PROMPTS]
 * ----------------------------------------------------------------------------------
 * Pure template functions. Each takes structured data → returns an XML string.
 ************************************************************************************/

export const SYSTEM_PROMPTS = {
    /**
     * SIMULATION
     * The primary per-turn prompt orchestrator.
     * Uses dynamic rule composition (the "buffet") based on active signals.
     *
     * @param {Object} params
     * @param {Object} params.active_signals - Physics signals from dynamics_engine.
     * @param {Object} params.state          - Resolved story state.
     * @param {string} params.input          - User action string.
     */
    simulation: ({ active_signals, state, input }) => {
        const prompt_context = {
            entity: state?.entity,
            turn: state?.turn,
            objective: state?.objective,
            active_signals,
            // TODO: Wire up history for memory condensation in Phase 2
            history: state?.snapshot,
        }

        const dynamics = render_narrative_core(prompt_context)
        const entity = render_entity(prompt_context)

        // Dynamic Rule Composition
        const rules = []
        rules.push(RULES.CORE_PROTOCOLS)
        rules.push(RULES.COGNITION)
        rules.push(RULES.GOVERNANCE)

        // TODO: Initialise optional rules here (e.g. Tone)
        // if (active_signals.tone) rules.push(RULES.NARRATIVE_STYLE(active_signals.tone))

        return `
<SYSTEM_PROMPT>
${dynamics}

${entity}

<PROTOCOL>
${rules.join("\n\n")}
</PROTOCOL>

<INPUT_COMMAND>
${input?.trim() || "Awaiting signal..."}
</INPUT_COMMAND>
</SYSTEM_PROMPT>`.trim()
    },

    /**
     * ENHANCEMENT
     * Field-level prose optimization enhancer.
     */
    enhancement: ({ role, content, context = "" }) => {
        const entry = ENTITY_CATALOG[role] || {}
        return `
<ENHANCEMENT_PROTOCOL role="${role}">
${context ? `<CONTEXT>\n${context}\n</CONTEXT>` : ""}
${RULES.GOVERNANCE}
<DIRECTIVE>
${entry.directive || "Enhance this text for clarity and emotional resonance."}
</DIRECTIVE>
<ENHANCER>
${entry.enhancer || "STANDARD_LINGUISTIC_PROCESSOR"}
</ENHANCER>
<INPUT_CONTENT>
${content}
</INPUT_CONTENT>
</ENHANCEMENT_PROTOCOL>`.trim()
    },

    /**
     * MEMORY
     * Resonance condensation prompt for memory consolidation.
     */
    memory: ({ role, entity, history }) => {
        const entry = ENTITY_CATALOG[role] || {}
        return `
<MEMORY_PROTOCOL role="${role}">
${RULES.GOVERNANCE}
<CONTEXT>
Entity: ${entity.name || "Unknown"}
Conditioning: ${entry.directive || "Standard condensation — capture meaningful change."}
</CONTEXT>
<INPUT_HISTORY>
${JSON.stringify(history, null, 2)}
</INPUT_HISTORY>
<INSTRUCTION>
Distil the input history into a single-sentence "Resonance" summary.
Focus on: character development, significant shifts, or critical realizations.
Output strict JSON only: { "summary": "...", "tags": ["...", "..."] }
</INSTRUCTION>
</MEMORY_PROTOCOL>`.trim()
    },

    /**
     * PROLOGUE
     * Establishes setting and atmosphere before user interaction.
     */
    prologue: () =>
        `
<PROLOGUE_PROTOCOL>
${RULES.GOVERNANCE}
${RULES.CORE_PROTOCOLS}
<INSTRUCTION>
Open the scene. Establish the atmosphere, location, and the AI character's presence.
Do not address or await the user. Paint the world they are about to enter.
</INSTRUCTION>
</PROLOGUE_PROTOCOL>`.trim(),

    /**
     * EPILOGUE
     * Narrative resolution prompt.
     */
    epilogue: () =>
        `
<EPILOGUE_PROTOCOL>
${RULES.GOVERNANCE}
<INSTRUCTION>
Close the scene. Resolve the active tension threads.
Acknowledge what the characters experienced. Leave the world changed.
</INSTRUCTION>
</EPILOGUE_PROTOCOL>`.trim(),
}

/************************************************************************************
 * 🧩 [SECTION: PROMPT BUILDER]
 * ----------------------------------------------------------------------------------
 * A stateless orchestrator that binds SYSTEM_PROMPTS to live application state.
 ************************************************************************************/

/**
 * Internal helper for physical metadata extraction.
 */
function _get_physical_fragments(role) {
    const data = role === "AI" ? runtime.activeAI : role === "USER" ? runtime.activeUser : runtime.activeFractal
    return {
        eternal: { physical: data?.eternal?.physical || "" },
        present: { physical: data?.present?.physical || data?.description || "" },
    }
}

export class PromptBuilder {
    /**
     * The builder is now stateless.
     * Constructor persists no state to ensure testability and hygiene.
     */
    constructor() {}

    /**
     * Build the primary simulation prompt.
     *
     * @param {Object} story - The active story state object.
     * @param {string} input - User action.
     * @returns {string} XML Payload.
     */
    build(story, input) {
        const active_signals = story?.active_signals || { style: "Atmospheric" }
        return SYSTEM_PROMPTS.simulation({
            active_signals,
            state: story,
            input,
        })
    }

    /**
     * Build a payload for visual generation.
     */
    build_image_prompt() {
        return {
            ai: _get_physical_fragments("AI"),
            user: _get_physical_fragments("USER"),
            fractal: _get_physical_fragments("FRACTAL"),
            history: ContextBroker.assemble_snapshot() || "",
            mode: "visualize",
        }
    }

    /**
     * Helper for field enhancement.
     */
    build_enhancement(role, content, context = "") {
        return SYSTEM_PROMPTS.enhancement({ role, content, context })
    }

    /**
     * Helper for scene openings.
     */
    build_prologue() {
        return { system: SYSTEM_PROMPTS.prologue(), messages: [] }
    }

    /**
     * Helper for scene closures.
     */
    build_epilogue() {
        return { system: SYSTEM_PROMPTS.epilogue(), messages: [] }
    }

    /**
     * Helper for memory condensation.
     */
    build_memory_prompt(entity, history, role = "character") {
        return {
            system: SYSTEM_PROMPTS.memory({ role, entity, history }),
            messages: [],
        }
    }
}
