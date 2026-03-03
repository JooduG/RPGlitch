/**
 * @file src/core/intelligence/prompt_builder.js
 * 🧠 PROMPT BUILDER — The Cognitive Manifest
 */

import { runtime } from "@state/runtime.svelte.js"
import { ENTITY_CATALOG } from "./entity_fragments.js"
import { ContextBroker } from "./intelligence_broker.js"
import { VectorEngine } from "./vector_engine.js"

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
 * 🧩 [SECTION: SYSTEM PROMPTS]
 * ----------------------------------------------------------------------------------
 * Skeletal / Naked Templates. All XML structure lives here.
 ************************************************************************************/

export const SYSTEM_PROMPTS = {
    simulation: ({ active_signals, state, input }) => {
        const turn = state?.entity?.turn ?? state?.turn ?? 1
        const behavior =
            Object.values(active_signals || {})
                .filter((s) => s?.text)
                .map((s) => s.text)
                .join(" ") || null
        const ai_name = state?.entity?.list?.find((e) => e.role === "AI")?.name ?? "AI_CHARACTER"
        const user_name = state?.entity?.list?.find((e) => e.role === "USER")?.name ?? "USER_PERSONA"
        const fractal_name = state?.entity?.list?.find((e) => e.role === "FRACTAL")?.name ?? "FRACTAL"

        return `
<SYSTEM role="${ai_name}">

<STATE turn="${turn}">
</STATE>

<YOUR_IDENTITY name="${ai_name}">
${inject(state, "AI_CHARACTER", "ETERNAL, PRESENT")}
${inject_past(state, "AI", input)}
${inject_future(state, "AI", input)}
</YOUR_IDENTITY>

<USER_PERSONA name="${user_name}">
${inject(state, "USER_PERSONA", "ETERNAL, PRESENT")}
</USER_PERSONA>

<FRACTAL name="${fractal_name}">
${inject(state, "FRACTAL", "ETERNAL, PRESENT")}
</FRACTAL>
<HISTORY>
${list_history(state.recentMessages)}
</HISTORY>

${behavior ? `<NARRATIVE_STYLE>${behavior}</NARRATIVE_STYLE>` : ""}

<PROTOCOLS>
${list_protocols("COGNITION, FIRST_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IMMERSION, MOMENTUM, EPISTEMIC_WALL")}
</PROTOCOLS>
${input?.trim() ? `\n<INPUT_COMMAND>\n${input.trim()}\n</INPUT_COMMAND>` : ""}
</SYSTEM>`.trim()
    },

    prologue: ({ state, input }) => {
        const turn = state?.entity?.turn ?? state?.turn ?? 1
        const fractal = state?.entity?.list?.find((e) => e.role === "FRACTAL")
        const fractal_name = fractal?.name ?? "FRACTAL"
        const ai_name = state?.entity?.list?.find((e) => e.role === "AI")?.name ?? "AI_CHARACTER"
        const user_name = state?.entity?.list?.find((e) => e.role === "USER")?.name ?? "USER_PERSONA"

        return `
<SYSTEM role="${fractal_name}" mode="PROLOGUE">

<STATE turn="${turn}">
</STATE>

<YOUR_IDENTITY name="${fractal_name}">
${inject(state, "FRACTAL", "ETERNAL, PRESENT")}
${inject_past(state, "FRACTAL")}
${inject_future(state, "FRACTAL")}
</YOUR_IDENTITY>

<ACTIVE_CHARACTERS>
<AI_CHARACTER name="${ai_name}">
${inject(state, "AI_CHARACTER", "ETERNAL, PRESENT")}
${inject_past(state, "AI")}
${inject_future(state, "AI")}
</AI_CHARACTER>

<USER_PERSONA name="${user_name}">
${inject(state, "USER_PERSONA", "ETERNAL, PRESENT")}
${inject_past(state, "USER")}
${inject_future(state, "USER")}
</USER_PERSONA>
</ACTIVE_CHARACTERS>

<PROTOCOLS>
${list_protocols("COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, EPISTEMIC_WALL, PLACEMENT, IMMERSION, MOMENTUM")}
</PROTOCOLS>

<TASK_INSTRUCTION>
You see everything. Open the scene.
Use your <think> block to assess the environmental resonance and character alignment before speaking.

Ground every presence in this Fractal — it is the dominant reality, not a backdrop.
${ai_name} and ${user_name} arrived here through their Pasts: their paths converged
at this exact point. Make that convergence feel inevitable.
${user_name}'s Present state must resonate with the Fractal's present reality — not clash with it.
Let ${ai_name}'s and ${user_name}'s Futures haunt the periphery: unspoken, atmospheric, never named directly.

The Fractal speaks first. Begin with sensation. No dialogue.
</TASK_INSTRUCTION>
${input?.trim() ? `\n<INPUT_COMMAND>\n${input.trim()}\n</INPUT_COMMAND>` : ""}
</SYSTEM>`.trim()
    },

    // field_id:    dot-key from ENTITY_CATALOG, e.g. "eternal.physical"
    // content:     raw user input from the fragment field
    // entity_name: display name of the entity being edited
    enhancement: ({ field_id, content, entity_name = "Unknown" }) => {
        const field = ENTITY_CATALOG[field_id]
        const directive = field?.directive ?? "Expand and enrich the provided fragment."
        const enhancer = field?.enhancer ?? "GENERAL"

        return `
<SYSTEM role="${enhancer}" enhancing="${field.label || field_id}">
<PROTOCOLS>
${list_protocols("HYGIENE, AFFIRMATIVE, IMMERSION")}
</PROTOCOLS>
<INSTRUCTIONS>
${directive}
</INSTRUCTIONS>
<INPUT_CONTENT>
${content}
</INPUT_CONTENT>
</SYSTEM>`.trim()
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
Distil the input history into a structured Resonance object.

1. "summary": A single sentence capturing the most meaningful shift in state or relationship.
2. "entity_tags": An array of strings containing ONLY proper nouns, specific locations, or key objects mentioned. Do NOT include abstract moods or verbs.

Output strict JSON only: { "summary": "...", "entity_tags": ["...", "..."] }
</TASK_INSTRUCTION>
</MEMORY_PROTOCOL>`.trim()
    },

    epilogue: () =>
        `
<SYSTEM>
ROLE: You are the narrator.
<PROTOCOLS>
${list_protocols("COGNITION, THIRD_PERSON, GRIT, SENSORY, WORLD_BUILDING")}
</PROTOCOLS>
<TASK_INSTRUCTION>
Close the scene. Resolve every active tension thread. Show — do not narrate — the
weight of what just happened. Leave the world visibly changed. End on sensation, not summary.
</TASK_INSTRUCTION>
</SYSTEM>`.trim(),
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

    // field_id:    dot-key from ENTITY_CATALOG, e.g. "eternal.physical"
    // content:     raw user input from the fragment field
    // entity_name: display name of the entity being edited
    build_enhancement(field_id, content, entity_name = "") {
        return SYSTEM_PROMPTS.enhancement({ field_id, content, entity_name })
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
 * ----------------------------------------------------------------------------------
 * Supporting logic for fragment formatting, and memory injection.
 ************************************************************************************/

/**
 * Filter, score, and render the top 3 structured resonances.
 */
function inject_past(state, role, input = "") {
    const entity = state?.entity?.list?.find((e) => e.role === role)
    const past = entity?.past?.vectors
    if (!Array.isArray(past) || !past.length) return ""

    return VectorEngine.format_past(past, input)
}

/**
 * Renders structured future VECTORS with [STAKE] or [OBJECTIVE] labels.
 */
function inject_future(state, role, input = "") {
    const entity = state?.entity?.list?.find((e) => e.role === role)
    const vectors = entity?.future?.vectors
    if (!Array.isArray(vectors) || !vectors.length) return ""

    return VectorEngine.format_future(vectors, input || state.input || "")
}

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
