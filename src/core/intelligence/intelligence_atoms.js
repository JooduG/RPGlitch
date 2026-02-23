/**
 * @file src/core/intelligence/atoms.js
 * @description XML Layer Builders.
 * Stateless functions that render state fragments into valid XML blocks for the LLM.
 */

/**
 * 🌍 Render World Layer (Chrono)
 * @param {Object} state - Application state snippet containing chrono data.
 */
export const render_world = (state) => {
    const chrono = state?.chrono
    if (!chrono) return ""
    return `
<WORLD_LAYER turn="${chrono.turn || 0}">
    <OBJECTIVE>${chrono.objective || "Unknown"}</OBJECTIVE>
    <TENSION>${chrono.conflict || "Stabilized"}</TENSION>
</WORLD_LAYER>`.trim()
}

/**
 * 📍 Render Location Layer (Fractal)
 * @param {Object} state - Application state snippet containing fractal data.
 */
export const render_location = (state) => {
    const fractal = state?.fractal
    if (!fractal) return ""
    return `
<LOCATION_LAYER id="${fractal.title || "UNKNOWN"}">
    ${JSON.stringify(fractal.state || {})}
</LOCATION_LAYER>`.trim()
}

/**
 * 👤 Render Entity Layer
 * Renders AI and User character fragments.
 * @param {Object} state - Application state snippet containing entity data.
 */
export const render_entity = (state) => {
    const entity = state?.entity
    if (!entity) return ""

    const renderFragments = (fragments) => fragments.map((f) => `<FRAGMENT category="${f.category || "General"}">${f.text}</FRAGMENT>`).join("\n    ")

    return `
<ENTITY_LAYER>
    <AI_CHARACTER name="${entity.ai?.name || "AI"}">
        ${renderFragments(entity.ai?.fragments || [])}
    </AI_CHARACTER>
    <USER_CHARACTER name="${entity.user?.name || "User"}">
        ${renderFragments(entity.user?.fragments || [])}
    </USER_CHARACTER>
</ENTITY_LAYER>`.trim()
}

/**
 * ⚙️ Render System Layer (Simulation Controls)
 * @param {Object} tone - The active tone object.
 * @param {boolean} visualsAuthorized - Whether the LLM is allowed to generate visual tags.
 */
export const render_system = (tone, visualsAuthorized) =>
    `
<SYSTEM_LAYER>
    <COGNITIVE_CORE>
        Render logic in <think> blocks. Mode: ${tone?.style || "Standard"}.
    </COGNITIVE_CORE>
    <VISUALS status="${visualsAuthorized ? "AUTHORIZED" : "RESTRICTED"}">
        ${visualsAuthorized ? "Include [VISUAL: prompt] tags for atmosphere." : "Prose only."}
    </VISUALS>
</SYSTEM_LAYER>`.trim()

/**
 * 📩 Render Input Layer
 * @param {string} input - The user's input command.
 */
export const render_input = (input) =>
    `
<INPUT_COMMAND>
    ${input || "Awaiting signal..."}
</INPUT_COMMAND>`.trim()
