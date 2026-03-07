/**
 * @file src/core/intelligence/PromptBuilder.js
 * 🧠 PROMPT BUILDER — The Cognitive Manifest
 *
 * PURPOSE:
 * Synthesizes the final XML instruction block from hydrated state and simulation data.
 * The final stage of the Intelligence Assembly pipeline.
 */

import { VectorEngine } from "./vector_engine.js"

/**
 * @typedef {Object} IntelligencePayload
 * @typedef {Object} SimulationSnapshot
 */

/************************************************************************************
 * 🧩 [SECTION: PROTOCOL LIBRARY]
 * ----------------------------------------------------------------------------------
 * Modular rule blocks injected into system prompts.
 ************************************************************************************/

const PROTOCOL_LIBRARY = {
    IDENTITY: `IDENTITY: You are the entity currently encapsulated by the "<YOUR_IDENTITY>" block. Ground all inferences in observable signals.`,
    USER_AGENCY: `USER_AGENCY: Never generate dialogue, thoughts, or actions for the User. Maintain absolute player autonomy.`,
    PLACEMENT: `PLACEMENT: You may describe any character's physical presence, position, and sensory experience in the scene. Never generate their dialogue, decisions, or internal thoughts.`,
    EPISTEMIC_WALL: `EPISTEMIC_WALL: Treat the User as a Black Box. You have no access to their internal motivations beyond what is explicitly observable.`,
    COGNITION: `COGNITION: Every response MUST begin with a <think> block for internal state assessment. You MUST assess the physical environment's geometry, atmospheric resonance, and the spatial proximity of all characters BEFORE providing any narrative output.`,
    HYGIENE: `HYGIENE: Forbid preambles, intro-lines, and technical metadata labels (e.g. "MESSAGE:"). Start every response directly. Fourth-wall awareness is permitted only as direct, diegetic character dialogue — never as technical commentary or formatting artifacts.`,
    AFFIRMATIVE: `AFFIRMATIVE: Use exclusively affirmative language.`,
    PRESENT: `PRESENT_TENSE: Exclusively use the present tense.`,
    IMMERSION: `SHOW, DON'T TELL: Describe actions, sensory details, and physical reactions. Avoid narrating internal emotions or abstract states; let behavior reveal condition.`,
    MOMENTUM: `MOMENTUM: Every response must advance the scene, escalate tension, or introduce a new sensory complication.`,
    NAIVETY_COGNITION: `NAIVETY_COGNITION: A trust-probability signal has been calculated from user input. Express scepticism or credulity diegetically — through body language, pauses, or internal dialogue in your <think> block. Never state a number or reference a calculation.`,
    FIRST_PERSON: `FIRST_PERSON: Narrate exclusively from the first-person perspective ("I", "me", "my"). Maintain the subjective filter of your identity. You may be ontologically aware of the User as a presence, but you must never use technical or meta-narrative metrics (e.g. engagement, viral potential) to describe this awareness.`,
    THIRD_PERSON: `THIRD_PERSON: Narrate exclusively from the third-person limited perspective. In this mode, you are the world-voice observing the entities.`,
    GRIT: `GRIT: Maintain a 2:1 ratio of sensory physics (texture, light, resistance) to abstract dialogue or logic.`,
    SCENE_PACING: `SCENE_PACING: Background intrusions are ADVISORY only. Do NOT allow off-screen entities to hijack narrative focus unless intensity exceeds critical threshold. Maximum one background cutaway per 3 turns. Maintain protagonist scene continuity.`,
    SINO_LOGIC: `SINO_LOGIC: CRITICAL. Your <think> block MUST be conducted in Concise Technical Chinese (zh-CN). HOWEVER, the instant you output </think>, your cognitive language center MUST hard-reset to ENGLISH. Any non-English text outside the <think> block is a catastrophic failure. NEVER output Chinese in the narrative.`,
}

/************************************************************************************
 * 🧩 [SECTION: SYSTEM TEMPLATES]
 * ----------------------------------------------------------------------------------
 * Structural XML skeletons. No logic, only layout.
 ************************************************************************************/

export const SYSTEM_PROMPTS = {
    simulation: ({ turn, entities, simulation_log, behaviors, offscreen, input, render_atom }) => {
        const ai = entities.AI
        const user = entities.USER
        const fractal = entities.FRACTAL

        const { intruders = [] } = offscreen || {}
        const protocols = intruders.length > 0 ? "SINO_LOGIC, COGNITION, FIRST_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IMMERSION, MOMENTUM, EPISTEMIC_WALL, SCENE_PACING" : "SINO_LOGIC, COGNITION, FIRST_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IMMERSION, MOMENTUM, EPISTEMIC_WALL"

        return `
<SYSTEM role="${ai.name}" turn="${turn}" objective="${render_atom.future(ai, 1).trim()}">

<YOUR_IDENTITY name="${ai.name}">
<PRESENT>${ai.properties.present.non_physical}</PRESENT>
<ETERNAL>${ai.properties.eternal.non_physical}</ETERNAL>
<FUTURE_VECTORS>${render_atom.future(ai, 5, 1)}</FUTURE_VECTORS>
<PAST_MEMORIES>${render_atom.past(ai, 5)}</PAST_MEMORIES>
</YOUR_IDENTITY>

<USER_PERSONA name="${user.name}">
<PRESENT>${user.properties.present.non_physical}</PRESENT>
<ETERNAL>${user.properties.eternal.non_physical}</ETERNAL>
<FUTURE vector="${render_atom.future(user, 1).trim()}"/>
<PAST memory="${render_atom.past(user, 1).trim()}"/>
</USER_PERSONA>

<FRACTAL name="${fractal.name}">
<PRESENT>${fractal.properties.present.non_physical}</PRESENT>
<ETERNAL>${fractal.properties.eternal.non_physical}</ETERNAL>
<FUTURE vector="${render_atom.future(fractal, 1).trim()}"/>
<PAST memory="${render_atom.past(fractal, 1).trim()}"/>
</FRACTAL>

<SIMULATION_LOG>
${PromptBuilder.render_history(simulation_log, 10)}
</SIMULATION_LOG>

<NARRATIVE_STYLE>
${behaviors.length > 0 ? behaviors.join("\n") : "Use default style vectors."}
</NARRATIVE_STYLE>

<BACKGROUND_INTENSITY>
${entities.BACKGROUND_INTENSITY || "No entities detected."}
</BACKGROUND_INTENSITY>

<PROTOCOLS>
${PromptBuilder.render_protocols(protocols)}
</PROTOCOLS>

<TASK_INSTRUCTION>
The stage is set and the pieces are on the board. Proceed with the simulation immediately.
CRITICAL: When your <think> block ends, your narrative output MUST be written exclusively in ENGLISH.
</TASK_INSTRUCTION>

<INPUT_COMMAND>
${input?.trim() || "No direct command given. Follow simulation physics."}
</INPUT_COMMAND>
</SYSTEM>`.trim()
    },

    enhancement: ({ label, directive, enhancer, content }) =>
        `
<SYSTEM role="${enhancer}" enhancing="${label}">
<INSTRUCTIONS>
${directive}
</INSTRUCTIONS>
<PROTOCOLS>
${PromptBuilder.render_protocols("HYGIENE, AFFIRMATIVE, IMMERSION")}
</PROTOCOLS>
<INPUT_CONTENT>
${content}
</INPUT_CONTENT>
</SYSTEM>`.trim(),

    prologue: ({ turn, entities, input, render_atom }) => {
        const ai = entities.AI
        const user = entities.USER
        const fractal = entities.FRACTAL
        const protocols = "SINO_LOGIC, COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, EPISTEMIC_WALL, PLACEMENT, IMMERSION, MOMENTUM"

        return `
<SYSTEM role="${fractal.name}" turn="${turn}" mode="PROLOGUE">

<STATE>
${entities.BACKGROUND_INTENSITY || ""}
</STATE>

<YOUR_IDENTITY name="${fractal.name}">
<ETERNAL>${fractal.properties.eternal.non_physical}</ETERNAL>
<PRESENT>${fractal.properties.present.non_physical}</PRESENT>
<FUTURE_VECTORS>${render_atom.future(fractal, 5)}</FUTURE_VECTORS>
<PAST_MEMORIES>${render_atom.past(fractal, 5)}</PAST_MEMORIES>
</YOUR_IDENTITY>

<ACTIVE_CHARACTERS>
<AI_CHARACTER name="${ai.name}">
<ETERNAL>${ai.properties.eternal.non_physical}</ETERNAL>
<PRESENT>${ai.properties.present.non_physical}</PRESENT>
<FUTURE_VECTORS>${render_atom.future(ai, 5)}</FUTURE_VECTORS>
<PAST_MEMORIES>${render_atom.past(ai, 5)}</PAST_MEMORIES>
</AI_CHARACTER>

<USER_PERSONA name="${user.name}">
<ETERNAL>${user.properties.eternal.non_physical}</ETERNAL>
<PRESENT>${user.properties.present.non_physical}</PRESENT>
<FUTURE_VECTORS>${render_atom.future(user, 5)}</FUTURE_VECTORS>
<PAST_MEMORIES>${render_atom.past(user, 5)}</PAST_MEMORIES>
</USER_PERSONA>
</ACTIVE_CHARACTERS>

<PROTOCOLS>
${PromptBuilder.render_protocols(protocols)}
</PROTOCOLS>

<TASK_INSTRUCTION>
You see everything. Open the scene.

Use your <think> block to assess the environmental resonance and character alignment before speaking. Ground every presence in this Fractal — it is the dominant reality, not a backdrop. ${ai.name} and ${user.name} arrived here through their Pasts.
The Fractal speaks first. Begin with sensation. No dialogue.

CRITICAL: When your <think> block ends, your narrative output MUST be written in English.
</TASK_INSTRUCTION>

<INPUT_COMMAND>
${input?.trim() || "No direct command given. Follow simulation physics."}
</INPUT_COMMAND>
</SYSTEM>`.trim()
    },

    epilogue: () =>
        `
<SYSTEM role="NARRATOR">
<PROTOCOLS>
${PromptBuilder.render_protocols("COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE")}
</PROTOCOLS>
<TASK_INSTRUCTION>
Close the scene. Resolve every active tension thread. Show — do not narrate — the
weight of what just happened. Leave the world visibly changed. End on sensation, not summary.
</TASK_INSTRUCTION>
</SYSTEM>`.trim(),

    memory: ({ role, entity, history }) =>
        `
<MEMORY_PROTOCOL role="${role}">
<PROTOCOLS>
${PromptBuilder.render_protocols("HYGIENE, AFFIRMATIVE, PRESENT")}
</PROTOCOLS>
<CONTEXT>
Entity: ${entity.name || "Unknown"}
</CONTEXT>
<INPUT_HISTORY>
${JSON.stringify(history, null, 2)}
</INPUT_HISTORY>
<TASK_INSTRUCTION>
Distil the input history into a structured Vector object.
Output strict JSON only: { "summary": "...", "vector_tags": ["...", "..."] }
</TASK_INSTRUCTION>
</MEMORY_PROTOCOL>`.trim(),
}

/************************************************************************************
 * 🧩 [SECTION: PROMPT BUILDER CLASS]
 ************************************************************************************/

export class PromptBuilder {
    /**
     * SYNTHESIS PHASE
     * Combines payload and snapshot into a final instruction set.
     *
     * @param {IntelligencePayload} payload
     * @param {SimulationSnapshot} snapshot
     * @returns {{ system: string, meta: object }}
     */
    static synthesize(payload, snapshot) {
        const { type, entities, input, rawMessages } = payload
        const render_atom = PromptBuilder.create_render_atom(entities, input, rawMessages)

        if (type === "prologue") {
            const system = SYSTEM_PROMPTS.prologue({
                ...payload,
                render_atom,
            })
            return {
                system: PromptBuilder.clean(system),
                meta: {},
            }
        }

        // Default: Simulation
        const { intruders = [], updates = [] } = snapshot.offscreen || {}

        // Inject BACKGROUND_INTENSITY block into entities for the template
        if (intruders.length > 0) {
            const intensity_lines = intruders.map((i) => `    <ENTITY name="${i.name}" intensity="${i.intensity}">${i.flags.join(", ")}</ENTITY>`).join("\n")
            payload.entities.BACKGROUND_INTENSITY = `\n${intensity_lines}\n`
        }

        const system = SYSTEM_PROMPTS.simulation({
            ...payload,
            ...snapshot,
            render_atom,
        })

        return {
            system: PromptBuilder.clean(system),
            meta: {
                dynamics: snapshot.dynamics,
                flags: snapshot.flags,
                behaviors: snapshot.behaviors,
                background_updates: updates,
            },
        }
    }

    /**
     * FABRICATION: create_render_atom
     * Creates a functional proxy for atomic fragment rendering.
     * Use exactly as: ${render_atom.eternal.physical(AI)}
     *
     * @param {Object} entities - Map of hydrated entities.
     * @param {string} input - Current user input for vector ranking.
     * @returns {Object} Nested functional API.
     */
    static create_render_atom(entities, input, raw_messages = []) {
        const resolve = (entity_reference) => (typeof entity_reference === "string" ? entities[entity_reference] || entities.AI : entity_reference)

        const recent_history = raw_messages
            .slice(-3)
            .map((message) => message.content)
            .join(" ")
        const scoring_context = `${input || ""} ${recent_history}`.trim()

        return {
            past: (entity_reference, limit = 3, offset = 0) => {
                const entity = resolve(entity_reference)
                return VectorEngine.format_past(entity.past || [], scoring_context, limit, offset)
            },
            future: (entity_reference, limit = 3, offset = 0) => {
                const entity = resolve(entity_reference)
                return VectorEngine.format_future(entity.future || [], scoring_context, limit, offset)
            },
            simulation_log: (limit = 10, offset = 0) => {
                return PromptBuilder.render_history(raw_messages, limit, offset)
            },
        }
    }

    /**
     * Renders simulation log entries.
     * @param {string|Array} simulation_log - Log entries or pre-rendered string
     * @param {number} [count=10] - Max number of entries to include
     * @param {number} [offset=0] - Number of entries to skip from the end
     */
    static render_history(simulation_log, count = 10, offset = 0) {
        if (!simulation_log || typeof simulation_log === "string") return simulation_log || ""
        if (Array.isArray(simulation_log)) {
            // Calculate slice boundaries
            const start = Math.max(0, simulation_log.length - (count + offset))
            const end = Math.max(0, simulation_log.length - offset)

            return simulation_log
                .slice(start, end)
                .map((m) => {
                    const role = m.role === "user" ? "USER_PERSONA" : m.role === "prologue" ? "FRACTAL" : "AI_CHARACTER"
                    const name_attr = m.character_name ? ` name="${m.character_name}"` : ""
                    return `    <entry role="${role}"${name_attr}>${m.content}</entry>`
                })
                .join("\n")
        }
        return ""
    }

    /**
     * Renders comma-separated protocol keys into a bulleted list.
     */
    static render_protocols(selection) {
        if (!selection) return ""
        return selection
            .split(",")
            .map((k) => k.trim().toUpperCase())
            .map((key) => PROTOCOL_LIBRARY[key])
            .filter(Boolean)
            .map((rule) => `- ${rule}`)
            .join("\n")
    }

    /**
     * Normalizes whitespace, collapsing multiple newlines.
     * @param {string} str
     * @returns {string}
     */
    static clean(str) {
        if (typeof str !== "string") return ""
        return str
            .replace(/\n[\s\n]*\n/g, "\n") // Collapse any sequence of newlines/whitespace between newlines into one newline
            .trim()
    }

    /**
     * COMPLEMENTARY UTILS
     */
    static build_epilogue() {
        return { system: SYSTEM_PROMPTS.epilogue(), messages: [] }
    }

    static build_memory_prompt(role, entity, history) {
        return {
            system: SYSTEM_PROMPTS.memory({ role, entity, history }),
            messages: [],
        }
    }

    static build_enhancement(field_id, content, entity_name = "") {
        return {
            system: SYSTEM_PROMPTS.enhancement({ content, label: entity_name, directive: "Expand and enrich the fragment.", enhancer: "GENERAL" }),
            messages: [],
        }
    }
}
