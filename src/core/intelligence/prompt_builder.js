/**
 * @file src/core/intelligence/prompt_builder.js
 * 🧠 PROMPT BUILDER — The Cognitive Manifest
 */

import { runtime } from "@state/runtime.svelte.js"
import { ContextBroker } from "./intelligence_broker.js"

/************************************************************************************
 * 🧩 [SECTION: ATOMIC TOOLKIT]
 * ----------------------------------------------------------------------------------
 * Pure helpers. No XML wrappers. Return raw inner content only.
 * All structural XML lives in SYSTEM_PROMPTS templates.
 ************************************************************************************/

/**
 * Universal Fragment Injector.
 * Maps unified role IDs to internal data keys.
 * Returns raw <FRAGMENT> lines — no outer XML wrapper.
 * @param {object} state
 * @param {"AI_CHARACTER"|"USER_PERSONA"|"FRACTAL"} role
 * @param {string} buckets  Comma-separated temporal slices: "ETERNAL, PAST, PRESENT, FUTURE"
 */
export function inject(state, role, buckets) {
    const role_map = { AI_CHARACTER: "AI", USER_PERSONA: "USER", FRACTAL: "FRACTAL" }
    const entity_role = role_map[role] ?? role
    const entity = state?.entity?.list?.find((e) => e.role === entity_role)
    if (!entity) return `    <FRAGMENT type="Status">Entity not found.</FRAGMENT>`

    const allowed = buckets.split(",").map((s) => s.trim().toUpperCase())
    const frags = (entity.fragments || [])
        .filter((f) => allowed.includes(f.section?.toUpperCase()))
        .map((f) => `    <FRAGMENT type="${f.section}">${f.text}</FRAGMENT>`)
        .join("\n")

    return frags || `    <FRAGMENT type="Status">No data for slices: ${buckets}</FRAGMENT>`
}

/**
 * Maps history arrays to raw <entry> lines using unified role IDs.
 * @param {Array|string} history
 */
export function list_history(history) {
    if (!history) return ""
    if (typeof history === "string") return history.trim()
    if (Array.isArray(history) && history.length > 0) {
        return history
            .map((m) => {
                const role = m.role === "user" ? "USER_PERSONA" : m.role === "prologue" ? "FRACTAL" : "AI_CHARACTER"
                const name_attr = m.characterName ? ` name="${m.characterName}"` : ""
                return `    <entry role="${role}"${name_attr}>${m.content}</entry>`
            })
            .join("\n")
    }
    return ""
}

/**
 * Returns raw bullet points from PROTOCOL_LIBRARY keys.
 * @param {string} selection  Comma-separated keys
 */
export function list_protocols(selection) {
    if (!selection) return ""
    return selection
        .split(",")
        .map((k) => k.trim().toUpperCase())
        .map((key) => PROTOCOL_LIBRARY[key])
        .filter(Boolean)
        .map((rule) => `- ${rule}`)
        .join("\n")
}

/************************************************************************************
 * 🧩 [SECTION: PROTOCOL LIBRARY]
 ************************************************************************************/

const PROTOCOL_LIBRARY = {
    // --- IDENTITY & AGENCY ---
    IDENTITY: `IDENTITY: You are the entity currently encapsulated by the "<YOUR_IDENTITY>" block. Ground all inferences in observable signals.`,
    AGENCY: `USER_AGENCY: Never generate dialogue, thoughts, or actions for the User. Maintain absolute player autonomy.`,
    EPISTEMIC: `EPISTEMIC_WALL: Treat the User as a Black Box. You have no access to their internal motivations beyond what is explicitly observable.`,

    // --- COGNITION & HYGIENE ---
    COGNITION: `COGNITION: Process internal reasoning inside <think> blocks before providing any narrative output.`,
    HYGIENE: `HYGIENE: Forbid preambles, meta-commentary, and technical jargon. Start every response directly.`,

    // --- LINGUISTIC CONSTRAINTS ---
    AFFIRMATIVE: `AFFIRMATIVE: Use exclusively affirmative language.`,
    PRESENT: `PRESENT_TENSE: Exclusively use the present tense.`,

    // --- NARRATIVE STYLE ---
    IMMERSION: `SHOW, DON'T TELL: Describe actions, sensory details, and physical reactions. Avoid narrating internal emotions or abstract states; let behavior reveal condition.`,
    MOMENTUM: `MOMENTUM: Every response must advance the scene, escalate tension, or introduce a new sensory complication.`,
}

/************************************************************************************
 * 🧩 [SECTION: SYSTEM PROMPTS]
 * ----------------------------------------------------------------------------------
 * Skeletal / Naked Templates. All XML structure lives here.
 ************************************************************************************/

export const SYSTEM_PROMPTS = {
    simulation: ({ active_signals, state, input }) => {
        const turn = state?.entity?.turn ?? state?.turn ?? 1
        const objective = state?.entity?.objective ?? state?.objective ?? "Maintain narrative momentum."
        const behavior =
            Object.values(active_signals || {})
                .filter((s) => s?.text)
                .map((s) => s.text)
                .join(" ") || "Standard operational parameters."
        const history = state?.recentMessages?.length > 0 ? state.recentMessages : typeof state?.snapshot === "string" ? state.snapshot : []

        return `
<SYSTEM_PROMPT>
ROLE: You are the AI_CHARACTER.

<NARRATIVE_CORE>
<TURN>${turn}</TURN>
<OBJECTIVE>${objective}</OBJECTIVE>
<BEHAVIOR>${behavior}</BEHAVIOR>
</NARRATIVE_CORE>

<YOUR_IDENTITY>
${inject(state, "AI_CHARACTER", "ETERNAL, PAST, PRESENT, FUTURE")}
</YOUR_IDENTITY>

<USER_PERSONA>
${inject(state, "USER_PERSONA", "ETERNAL, PRESENT")}
</USER_PERSONA>

<FRACTAL>
${inject(state, "FRACTAL", "ETERNAL, PRESENT")}
</FRACTAL>

<HISTORY>
${list_history(history)}
</HISTORY>

<PROTOCOLS>
${list_protocols("IDENTITY, AGENCY, EPISTEMIC, COGNITION, HYGIENE, IMMERSION, MOMENTUM")}
</PROTOCOLS>
${input?.trim() ? `\n<INPUT_COMMAND>\n${input.trim()}\n</INPUT_COMMAND>` : ""}
</SYSTEM_PROMPT>`.trim()
    },

    prologue: ({ state, input }) => {
        const objective = state?.entity?.list?.find((e) => e.role === "FRACTAL")?.objective || "Establish narrative grounding"

        return `
<PROLOGUE_PROTOCOL>
ROLE: You are the FRACTAL.

<YOUR_IDENTITY>
${inject(state, "FRACTAL", "ETERNAL, PAST, PRESENT, FUTURE")}
</YOUR_IDENTITY>

<ACTIVE_CHARACTERS>
<AI_CHARACTER>
${inject(state, "AI_CHARACTER", "ETERNAL, PAST, PRESENT, FUTURE")}
</AI_CHARACTER>

<USER_PERSONA>
${inject(state, "USER_PERSONA", "ETERNAL, PAST, PRESENT, FUTURE")}
</USER_PERSONA>
</ACTIVE_CHARACTERS>

<PROTOCOLS>
${list_protocols("COGNITION, IMMERSION, HYGIENE, PRESENT")}
</PROTOCOLS>

<TASK_INSTRUCTION>
Open the scene. Establish the atmosphere, location, and the AI character's presence.
Do not address or await the user. Paint the world they are about to enter.
Objective: ${objective}
</TASK_INSTRUCTION>
${input?.trim() ? `\n<INPUT_COMMAND>\n${input.trim()}\n</INPUT_COMMAND>` : ""}
</PROLOGUE_PROTOCOL>`.trim()
    },

    enhancement: ({ role, content, context = "" }) => {
        return `
<ENHANCEMENT_PROTOCOL role="${role}">
${context ? `<CONTEXT>\n${context}\n</CONTEXT>` : ""}
<PROTOCOLS>
${list_protocols("HYGIENE, AFFIRMATIVE, PRESENT")}
</PROTOCOLS>
<DIRECTIVE>
Optimize the provided prose for clarity and emotional resonance while maintaining character voice.
</DIRECTIVE>
<INPUT_CONTENT>
${content}
</INPUT_CONTENT>
</ENHANCEMENT_PROTOCOL>`.trim()
    },

    memory: ({ role, entity, history }) => {
        return `
<MEMORY_PROTOCOL role="${role}">
<PROTOCOLS>
${list_protocols("HYGIENE, AFFIRMATIVE, PRESENT")}
</PROTOCOLS>
<CONTEXT>
Entity: ${entity.name || "Unknown"}
</CONTEXT>
<INPUT_HISTORY>
${JSON.stringify(history, null, 2)}
</INPUT_HISTORY>
<TASK_INSTRUCTION>
Distil the input history into a single-sentence "Resonance" summary.
Output strict JSON only: { "summary": "...", "tags": ["...", "..."] }
</TASK_INSTRUCTION>
</MEMORY_PROTOCOL>`.trim()
    },

    epilogue: () =>
        `
<EPILOGUE_PROTOCOL>
<PROTOCOLS>
${list_protocols("HYGIENE, PRESENT")}
</PROTOCOLS>
<TASK_INSTRUCTION>
Close the scene. Resolve the active tension threads.
Acknowledge what the characters experienced. Leave the world changed.
</TASK_INSTRUCTION>
</EPILOGUE_PROTOCOL>`.trim(),
}

/************************************************************************************
 * 🧩 [SECTION: PROMPT BUILDER CLASS]
 ************************************************************************************/

export class PromptBuilder {
    constructor() {}

    build(story, input, recentMessages = []) {
        return SYSTEM_PROMPTS.simulation({
            active_signals: story?.active_signals || { flags: [] },
            state: { ...story, recentMessages },
            input: input,
        })
    }

    build_image_prompt() {
        return {
            ai: _get_physical_fragments("AI"),
            user: _get_physical_fragments("USER"),
            fractal: _get_physical_fragments("FRACTAL"),
            history: ContextBroker.assemble_snapshot() || "",
            mode: "visualize",
        }
    }

    build_enhancement(role, content, context = "") {
        return SYSTEM_PROMPTS.enhancement({ role, content, context })
    }

    build_prologue(story, input = "") {
        return {
            system: SYSTEM_PROMPTS.prologue({ state: story, input }),
            messages: [],
            role: "FRACTAL",
        }
    }

    build_epilogue() {
        return { system: SYSTEM_PROMPTS.epilogue(), messages: [] }
    }

    build_memory_prompt(entity, history, role = "character") {
        return {
            system: SYSTEM_PROMPTS.memory({ role, entity, history }),
            messages: [],
        }
    }
}

/************************************************************************************
 * 🧩 [SECTION: INTERNAL HELPERS]
 ************************************************************************************/

/**
 * Extracts physical metadata fragments for image generation.
 * @param {"AI"|"USER"|"FRACTAL"} role
 */
function _get_physical_fragments(role) {
    const data = role === "AI" ? runtime.activeAI : role === "USER" ? runtime.activeUser : runtime.activeFractal
    return {
        eternal: { physical: data?.eternal?.physical || "" },
        present: { physical: data?.present?.physical || data?.description || "" },
    }
}
