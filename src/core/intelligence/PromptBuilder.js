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
    FIRST_PERSON: `FIRST_PERSON: Narrate exclusively from the first-person perspective ("I", "me", "my"). Maintain the subjective filter of your identity. You may be ontologically aware of the User as a presence, but you must never use technical or meta-narrative metrics (e.g. engagement, viral potential) to describe this awareness.`,
    THIRD_PERSON: `THIRD_PERSON: Narrate exclusively from the third-person limited perspective. In this mode, you are the world-voice observing the entities.`,
    GRIT: `GRIT: Maintain a 2:1 ratio of sensory physics (texture, light, resistance) to abstract dialogue or logic.`,
}

/************************************************************************************
 * 🧩 [SECTION: SYSTEM TEMPLATES]
 * ----------------------------------------------------------------------------------
 * Structural XML skeletons. No logic, only layout.
 ************************************************************************************/

export const SYSTEM_PROMPTS = {
    simulation: ({ turn, entities, history, behaviors, protocols, input }) => {
        const ai = entities.AI
        const user = entities.USER
        const fractal = entities.FRACTAL

        return `
<SYSTEM role="${ai.name}">

<STATE turn="${turn}">
</STATE>

<YOUR_IDENTITY name="${ai.name}">
${PromptBuilder.render_fragments(ai.fragments)}
${VectorEngine.format_past(ai.past?.vectors || [], input)}
${VectorEngine.format_future(ai.future?.vectors || [], input)}
</YOUR_IDENTITY>

<USER_PERSONA name="${user.name}">
${PromptBuilder.render_fragments(user.fragments)}
</USER_PERSONA>

<FRACTAL name="${fractal.name}">
${PromptBuilder.render_fragments(fractal.fragments)}
</FRACTAL>

<HISTORY>
${PromptBuilder.render_history(history)}
</HISTORY>

${behaviors.length > 0 ? `<NARRATIVE_STYLE>\n${behaviors.join(" ")}\n</NARRATIVE_STYLE>` : ""}

<PROTOCOLS>
${PromptBuilder.render_protocols(protocols)}
</PROTOCOLS>

${input?.trim() ? `\n<INPUT_COMMAND>\n${input.trim()}\n</INPUT_COMMAND>` : ""}
</SYSTEM>`.trim()
    },

    enhancement: ({ label, directive, enhancer, content }) =>
        `
<SYSTEM role="${enhancer}" enhancing="${label}">
<PROTOCOLS>
${PromptBuilder.render_protocols("HYGIENE, AFFIRMATIVE, IMMERSION")}
</PROTOCOLS>
<INSTRUCTIONS>
${directive}
</INSTRUCTIONS>
<INPUT_CONTENT>
${content}
</INPUT_CONTENT>
</SYSTEM>`.trim(),

    prologue: ({ turn, entities, protocols, input }) => {
        const ai = entities.AI
        const user = entities.USER
        const fractal = entities.FRACTAL

        return `
<SYSTEM role="${fractal.name}" mode="PROLOGUE">

<STATE turn="${turn}">
</STATE>

<YOUR_IDENTITY name="${fractal.name}">
${PromptBuilder.render_fragments(fractal.fragments)}
</YOUR_IDENTITY>

<ACTIVE_CHARACTERS>
<AI_CHARACTER name="${ai.name}">
${PromptBuilder.render_fragments(ai.fragments)}
</AI_CHARACTER>

<USER_PERSONA name="${user.name}">
${PromptBuilder.render_fragments(user.fragments)}
</USER_PERSONA>
</ACTIVE_CHARACTERS>

<PROTOCOLS>
${PromptBuilder.render_protocols(protocols)}
</PROTOCOLS>

<TASK_INSTRUCTION>
You see everything. Open the scene.
Use your <think> block to assess the environmental resonance and character alignment before speaking.

Ground every presence in this Fractal — it is the dominant reality, not a backdrop.
${ai.name} and ${user.name} arrived here through their Pasts.
The Fractal speaks first. Begin with sensation. No dialogue.
</TASK_INSTRUCTION>

${input?.trim() ? `\n<INPUT_COMMAND>\n${input.trim()}\n</INPUT_COMMAND>` : ""}
</SYSTEM>`.trim()
    },
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
        const { type } = payload

        if (type === "prologue") {
            return {
                system: SYSTEM_PROMPTS.prologue({
                    ...payload,
                    protocols: "COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, EPISTEMIC_WALL, PLACEMENT, IMMERSION, MOMENTUM",
                }),
                meta: {},
            }
        }

        // Default: Simulation
        const system = SYSTEM_PROMPTS.simulation({
            ...payload,
            ...snapshot,
            protocols: "COGNITION, FIRST_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IMMERSION, MOMENTUM, EPISTEMIC_WALL",
        })

        return {
            system,
            meta: {
                dynamics: snapshot.dynamics,
                flags: snapshot.flags,
                behaviors: snapshot.behaviors,
            },
        }
    }

    /**
     * Renders an array of fragments into XML.
     */
    static render_fragments(fragments) {
        if (!Array.isArray(fragments)) return ""
        return fragments.map((f) => `    <FRAGMENT type="${f.type}">${f.text}</FRAGMENT>`).join("\n")
    }

    /**
     * Renders history entries into XML.
     */
    static render_history(history) {
        if (!history || typeof history === "string") return history || ""
        if (Array.isArray(history)) {
            return history
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

/**
 * LEGACY SHIM: Ensure SYSTEM_PROMPTS has expected keys for LlmService.
 */
SYSTEM_PROMPTS.epilogue = () =>
    `
<SYSTEM role="NARRATOR">
<PROTOCOLS>
${PromptBuilder.render_protocols("COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE")}
</PROTOCOLS>
<TASK_INSTRUCTION>
Close the scene. Resolve every active tension thread. Show — do not narrate — the
weight of what just happened. Leave the world visibly changed. End on sensation, not summary.
</TASK_INSTRUCTION>
</SYSTEM>`.trim()

SYSTEM_PROMPTS.memory = ({ role, entity, history }) =>
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
Output strict JSON only: { "summary": "...", "entity_tags": ["...", "..."] }
</TASK_INSTRUCTION>
</MEMORY_PROTOCOL>`.trim()
