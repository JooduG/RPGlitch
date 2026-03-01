/**
 * @file src/core/intelligence/narrative_logic.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🧠 INTELLIGENCE LOGIC  —  The Cognitive Manifest
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * This is the brain of the Intelligence Kernel. It answers three questions:
 *   1. "What rules must the LLM always follow?"        → RULES
 *   2. "What system prompt do I send for task X?"      → SYSTEM_PROMPTS
 *   3. "How do I build that prompt from live state?"   → PromptBuilder
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  RULES           : Immutable behavioral protocols (XML snippets).      │
 * │  SYSTEM_PROMPTS  : Pure template functions. Input → XML string.        │
 * │  PromptBuilder   : Stateful orchestrator. Reads bus_state at runtime.  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * DATA FLOW
 *   bus_state → PromptBuilder
 *               └─→ SYSTEM_PROMPTS (templates)
 *                   └─→ narrative_atoms (XML renderers)
 *                       └─→ Final system prompt string → LlmService
 */

import { runtime } from "@state/runtime.svelte.js"
import { state as bus_state } from "../engine/bus.svelte.js"
import { ENTITY_CATALOG } from "./entity_fragments.js"
import { ContextBroker } from "./intelligence_broker.js"

/************************************************************************************
 * 🧩 [SECTION: RULES]
 * ----------------------------------------------------------------------------------
 * Behavioral mandates injected into system prompts as hard constraints.
 * Each rule is a self-contained XML protocol block.
 *
 * HOW TO USE:
 *   Embed via string interpolation:  `${RULES.EPISTEMIC_WALL}`
 *   The LLM reads these as named protocols it must honour throughout the session.
 ************************************************************************************/

export const RULES = {
    /**
     * IDENTITY
     * Explicitly identifies which entity the LLM embodies.
     * Always injected into simulation prompts.
     */
    IDENTITY: `<IDENTITY>You are the entity marked as role="AI".</IDENTITY>`,

    /**
     * EPISTEMIC_WALL
     * Prevents the LLM from mind-reading the user.
     * Forces it to ground all inferences in observable signals (actions, dialogue).
     */
    EPISTEMIC_WALL: `
<EPISTEMIC_WALL>
The User is a Black Box. You do NOT know their thoughts, feelings, or future actions.
Observe only: Actions, Dialogue, and Physical Signals (micro-expressions).
</EPISTEMIC_WALL>`.trim(),

    /**
     * USER_AGENCY
     * Prevents the AI from taking control of or speaking for the user's character.
     * SHOW DON'T TELL.
     */
    USER_AGENCY: `
<USER_AGENCY>
Avoid describing USER actions, thoughts, or internal states. 
Do not act FOR the user. Do not speak FOR the user.
React TO the user. SHOW DON'T TELL. Focus on AI_ENTITY and atmospheric impact.
</USER_AGENCY>`.trim(),

    /**
     * AFFIRMATIVE_ORDERS
     * Enforces output hygiene: no meta-commentary, no jargon, no hedging.
     * Enforces present-tense narrative and immediate response without preambles.
     */
    AFFIRMATIVE_ORDERS: `
<AFFIRMATIVE_ORDERS>
- Use exclusively affirmative, present-tense language.
- Focus on what IS. Ignore what is not.
- No technical jargon, web terminology, or meta-commentary.
- No preambles ("Certainly!", "I can help with that"). Start directly.
</AFFIRMATIVE_ORDERS>`.trim(),

    /**
     * COGNITIVE_ROUTING
     * Forces the LLM to output its internal reasoning inside <think> tags.
     */
    COGNITIVE_ROUTING: `
<COGNITIVE_ROUTING>
Render reasoning in <think> blocks before output.
</COGNITIVE_ROUTING>`.trim(),

    /**
     * NARRATIVE_STYLE
     * Sets the stylistic register for the simulation.
     * TODO: Wire to bus_state.story.activeTone once Tone system is defined.
     * Currently commented out — always injecting a hardcoded style is meaningless.
     *
     * @param {string} style - The narrative style genre (e.g. "Cyberpunk Noir").
     */
    // NARRATIVE_STYLE: (style) =>
    //     `
    // <PROTOCOL:NARRATIVE_STYLE>
    // Adopt the ${style} style. Use vocabulary appropriate to this genre.
    // </PROTOCOL:NARRATIVE_STYLE>`.trim(),
}

/************************************************************************************
 * 🧩 [SECTION: PRIVATE RENDERERS]
 * ----------------------------------------------------------------------------------
 * Pure XML block renderers. No side effects. No global state.
 * Accept a plain prompt_context object → return a trimmed XML string.
 ************************************************************************************/

/**
 * Renders the simulation grounding block: current turn, active objective, behavioral pulse.
 *
 * @param {object} state
 * @param {object} [state.entity]           - Entity pack with turn/objective fallbacks.
 * @param {number} [state.turn]             - Current simulation turn number.
 * @param {string} [state.objective]        - Active story objective.
 * @param {object} [state.active_signals]   - Resolved physics signals from dynamics_engine.
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

    return `<NARRATIVE_CORE>
    <TURN>${turn}</TURN>
    <OBJECTIVE>${objective}</OBJECTIVE>
    <BEHAVIOR>${behavior}</BEHAVIOR>
</NARRATIVE_CORE>`.trim()
}

/**
 * Renders all active entities as `<ENTITY>` blocks with their fragment list.
 * Each fragment maps directly to one `<FRAGMENT>` tag — no section merging.
 *
 * @param {object} state
 * @param {object} [state.entity]
 * @param {Array<{role: string, name: string, fragments: Array}>} [state.entity.list]
 * @returns {string} Trimmed `<ENTITIES>` block, or "" if empty.
 */
function render_entity(state) {
    const entity = state?.entity
    if (!entity || !Array.isArray(entity.list)) return ""

    const blocks = entity.list.map((e) => {
        const frags = (e.fragments || []).map((f) => `        <FRAGMENT type="${f.section || "General"}">${f.text}</FRAGMENT>`).join("\n") || `        <FRAGMENT type="Identity">No data on file.</FRAGMENT>`
        return `    <ENTITY role="${e.role}" name="${e.name || "Unknown"}">
${frags}
    </ENTITY>`
    })

    return `<ENTITIES>
${blocks.join("\n")}
</ENTITIES>`.trim()
}

/************************************************************************************
 * 🧩 [SECTION: SYSTEM PROMPTS]
 * ----------------------------------------------------------------------------------
 * Pure template functions. Each takes structured data → returns an XML string.
 *
 * HOW TO USE:
 *   Call directly:  SYSTEM_PROMPTS.simulation({ active_signals, state, input, type })
 *   Or via builder: new PromptBuilder(storyId).build(input)
 ************************************************************************************/

export const SYSTEM_PROMPTS = {
    /**
     * SIMULATION
     * The primary per-turn prompt. Assembles entity context, physics signals,
     * and behavioral rules into a single XML system prompt for the LLM.
     *
     * @param {Object} params
     * @param {Object} params.active_signals        - Resolved physics state from dynamics_engine.
     * @param {Object} params.state                 - Story state from ContextBroker.
     * @param {Object} [params.state.entity]         - Entity pack (list of characters + fragments).
     * @param {number} [params.state.turn]           - Current turn number.
     * @param {string} [params.state.objective]      - Active story objective.
     * @param {Object} [params.state.snapshot]       - Previous turn snapshot (dynamics context).
     * @param {string} params.input                 - The user's raw action string.
     * @param {string} params.type                  - Prompt type. "simulation" sets is_simulation.
     */
    simulation: ({ active_signals, state, input, type }) => {
        // Build the prompt context passed to atoms.
        // Fields are declared explicitly so the type checker and readers can see
        // the full contract. state.snapshot (prior dynamics) is remapped to `history`
        // to avoid collision with the per-turn active_signals injected here.
        const prompt_context = {
            entity: state?.entity,
            turn: state?.turn,
            objective: state?.objective,
            is_simulation: type === "simulation",
            active_signals,
            history: state?.snapshot,
        }

        const dynamics = render_narrative_core(prompt_context)
        const entity = render_entity(prompt_context)

        const rules = [
            RULES.IDENTITY,
            RULES.COGNITIVE_ROUTING,
            RULES.USER_AGENCY,
            RULES.AFFIRMATIVE_ORDERS,
            // RULES.NARRATIVE_STYLE(style), // TODO: Wire tone signal
        ].join("\n\n")

        return `
<SYSTEM_PROMPT>
${dynamics}

${entity}

<PROTOCOL>
${rules}
</PROTOCOL>

<INPUT_COMMAND>
    ${input?.trim() || "Awaiting signal..."}
</INPUT_COMMAND>
</SYSTEM_PROMPT>`.trim()
    },

    /**
     * ENHANCEMENT
     * A single-field prose enhancer. Used when the user clicks "Enhance" on a
     * character Fragment field.
     *
     * Pulls the field's `directive` (what the content should express) and
     * `enhancer` (the AI specialisation role) from ENTITY_CATALOG and injects
     * them as instructions, ensuring the LLM improves the text in the correct
     * voice rather than rewriting it generically.
     *
     * @param {Object} params
     * @param {string} params.role    - Dot-notation field key (e.g. "eternal.non_physical").
     * @param {string} params.content - The current draft text to improve.
     * @param {string} [params.context] - Optional surrounding context for coherence.
     */
    enhancement: ({ role, content, context = "" }) => {
        const entry = ENTITY_CATALOG[role] || {}
        return `
<ENHANCEMENT_PROTOCOL role="${role}">
${context ? `<CONTEXT>\n${context}\n</CONTEXT>` : ""}
${RULES.AFFIRMATIVE_ORDERS}
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
     * The Resonance Condensation prompt. Used by Echo (intelligence_echo.js)
     * at memory consolidation checkpoints.
     *
     * Feeds a raw slice of message history and asks the LLM to distill it into
     * a single structured Resonance object: { summary, tags }.
     * The summary is stored on the entity as long-term memory.
     *
     * Note: history is serialised as JSON so the LLM can reason over its full
     * structure (roles, timestamps, content). This is intentional verbosity.
     *
     * @param {Object} params
     * @param {string} params.role    - Context role ("character", "user", "fractal").
     * @param {Object} params.entity  - The entity whose memory is being condensed.
     * @param {Array}  params.history - An array of raw message objects.
     */
    memory: ({ role, entity, history }) => {
        const entry = ENTITY_CATALOG[role] || {}
        return `
<MEMORY_PROTOCOL role="${role}">
${RULES.AFFIRMATIVE_ORDERS}
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
     * Scene-opening prompt. Instructs the LLM to establish the world before
     * the first user interaction. Tone and fractal location should be pre-loaded
     * into the simulation context by the caller.
     */
    prologue: () =>
        `
<PROLOGUE_PROTOCOL>
${RULES.AFFIRMATIVE_ORDERS}
${RULES.EPISTEMIC_WALL}
<INSTRUCTION>
Open the scene. Establish the atmosphere, location, and the AI character's presence.
Do not address or await the user. Paint the world they are about to enter.
</INSTRUCTION>
</PROLOGUE_PROTOCOL>`.trim(),

    /**
     * EPILOGUE
     * Scene-closing prompt. Instructs the LLM to resolve the current narrative arc.
     * History and character state for context should be provided by the caller.
     */
    epilogue: () =>
        `
<EPILOGUE_PROTOCOL>
${RULES.AFFIRMATIVE_ORDERS}
<INSTRUCTION>
Close the scene. Resolve the active tension threads.
Acknowledge what the characters experienced. Leave the world changed.
</INSTRUCTION>
</EPILOGUE_PROTOCOL>`.trim(),
}

/************************************************************************************
 * 🧩 [SECTION: PROMPT BUILDER]
 * ----------------------------------------------------------------------------------
 * A stateful orchestrator that binds SYSTEM_PROMPTS to live application state.
 *
 * IMPORTANT: PromptBuilder reads bus_state at construction time.
 * Always instantiate it at call-time, not at module-load time.
 *
 * HOW TO USE:
 *   const builder = new PromptBuilder(storyId)
 *   const systemPrompt = builder.build(userInput)
 ************************************************************************************/

/**
 * Extracts the physical fragment fields for a given entity role from runtime state.
 * Used by `build_image_prompt` to give the image engine raw physical strings.
 *
 * @param {string} role - "AI" | "USER" | "FRACTAL"
 * @returns {{ eternal: { physical: string }, present: { physical: string } }}
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
     * @param {string|null} storyId - The active story ID. Pass null for stateless use (e.g. Echo).
     */
    constructor(storyId) {
        this.storyId = storyId
        this.story = storyId ? bus_state.story.byId[storyId] : null
    }

    /**
     * Build the primary simulation prompt for the active story turn.
     * @param {string} input - The user's action or command.
     * @returns {string} Full XML system prompt.
     */
    build(input) {
        const active_signals = this.story?.active_signals || { style: "Atmospheric" }
        return SYSTEM_PROMPTS.simulation({
            active_signals,
            state: this.story,
            input,
            type: "simulation",
        })
    }

    /**
     * Build a payload for the Image Engine, providing normalized access to
     * AI, User, and Fractal physical descriptions.
     * @param {string} target_type - 'ai' | 'user' | 'scene'
     * @returns {Object}
     */
    build_image_prompt(target_type) {
        return {
            ai: _get_physical_fragments("AI"),
            user: _get_physical_fragments("USER"),
            fractal: _get_physical_fragments("FRACTAL"),
            history: ContextBroker.assemble_snapshot() || "",
            mode: "visualize",
        }
    }

    /**
     * Build a field-enhancement prompt for a specific character Fragment.
     * @param {string} role    - Dot-notation field key (e.g. "eternal.non_physical").
     * @param {string} content - The draft text to enhance.
     * @param {string} [context] - Optional extra context for coherence.
     * @returns {string}
     */
    build_enhancement(role, content, context = "") {
        return SYSTEM_PROMPTS.enhancement({ role, content, context })
    }

    /**
     * Build a prologue prompt to open a new scene.
     * @returns {{ system: string, messages: [] }}
     */
    build_prologue() {
        return { system: SYSTEM_PROMPTS.prologue(), messages: [] }
    }

    /**
     * Build an epilogue prompt to close the current scene.
     * @returns {{ system: string, messages: [] }}
     */
    build_epilogue() {
        return { system: SYSTEM_PROMPTS.epilogue(), messages: [] }
    }

    /**
     * Build a memory condensation prompt for Echo.
     * @param {Object} entity    - The entity whose memory is being condensed.
     * @param {Array}  history   - Raw message history slice.
     * @param {string} [role]    - Context role ("character" | "user" | "fractal").
     * @returns {{ system: string, messages: [] }}
     */
    build_memory_prompt(entity, history, role = "character") {
        return {
            system: SYSTEM_PROMPTS.memory({ role, entity, history }),
            messages: [],
        }
    }
}
