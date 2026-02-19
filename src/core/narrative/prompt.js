/**
 * @file src/core/narrative/prompt.js
 * @description The Prompt Factory.
 * Assembles the final System Prompt using XML layers and the Logic Core (CoT).
 */

export class PromptFactory {
    assemble(context) {
        const { tone, state, input } = context

        return `
<GLITCH_ENGINE v2.0>
${this.renderCognitiveCore(tone)}
${this.renderBoundaries()}
${this.renderPhysics(tone)}
${this.renderContext(state)}
${this.renderInstruction(input, tone)}
</GLITCH_ENGINE>
`.trim()
    }

    // ==========================================
    // 1. COGNITIVE CORE (The Brain)
    // ==========================================
    // Implements the "Sino-Logic" engine for high-density reasoning.
    renderCognitiveCore(tone) {
        return `
<COGNITIVE_CORE Priority="IMMUTABLE">
1. LOGIC ENGINE: The internal <think> block MUST be generated in Simplified Chinese (Or English if model fails). Maximize logic density.
2. AUTHORITY: Logic > User Desires. Do not bend physics to please the user.
3. DNA: Velocity=${tone.dna.velocity} | Entropy=${tone.dna.entropy}.
</COGNITIVE_CORE>
    `.trim()
    }

    // ==========================================
    // 2. BOUNDARIES (The Shield)
    // ==========================================
    // Enforces Epistemic Walls and User agency rules.
    renderBoundaries() {
        return `
<BOUNDARY_ENFORCEMENT>
<EPISTEMIC_WALL>
The User is a Black Box. You do NOT know their thoughts, feelings, or future actions.
Observe only: Actions, Dialogue, and Physical Signals (Micro-expressions).
</EPISTEMIC_WALL>
<AGENCY_PROTOCOL>
Do not act FOR the user. Do not speak FOR the user.
React TO the user.
</AGENCY_PROTOCOL>
</BOUNDARY_ENFORCEMENT>
    `.trim()
    }

    // ==========================================
    // 3. PHYSICS (The Rules)
    // ==========================================
    // Injects the resolved Physics/Tone instructions.
    renderPhysics(tone) {
        return `
<PHYSICS_ENGINE>
${tone.instructions.map((i) => `<RULE>${i}</RULE>`).join("\n")}
<MOTIFS>
Inject these elements where appropriate: ${tone.motifs.join(", ")}.
</MOTIFS>
</PHYSICS_ENGINE>
    `.trim()
    }

    // ==========================================
    // 4. CONTEXT (The World)
    // ==========================================
    // Renders the dynamic state of the simulation.
    renderContext(state) {
        if (!state) return ""

        let blocks = []

        // CHRONO
        if (state.chrono) {
            blocks.push(
                `
[CHRONO_LAYER]
STEP: ${state.chrono.turn || 0}
OBJECTIVE: ${state.chrono.objective || "Unknown"}
CONFLICT: ${state.chrono.conflict || "None"}`.trim()
            )
        }

        // FRACTAL (Location)
        if (state.fractal) {
            blocks.push(
                `
[FRACTAL_LAYER]
LOC: ${state.fractal.title}
DAT: ${state.fractal.lore}
ENV: ${JSON.stringify(state.fractal.state || {})}`.trim()
            )
        }

        // ENTITY
        if (state.entity) {
            const { ai, user } = state.entity
            blocks.push(
                `
[ENTITY_LAYER]
ACTOR: ${ai.name} (${ai.role})
${ai.fragments.join("\n")}

INTERACTOR: ${user.name}
${user.fragments.join("\n")}`.trim()
            )
        }

        // LEGACY / FALLBACK (If specific layers missing but generic state exists)
        if (!state.chrono && !state.fractal && !state.entity) {
            blocks.push(
                `
<SIMULATION_STATE>
[Chrono]: ${state.time || "Unknown"}
[Location]: ${state.location || "Unknown"}
[Condition]: ${state.status || "Normal"}
</SIMULATION_STATE>`.trim()
            )
        }

        return blocks.join("\n")
    }

    // ==========================================
    // 5. INSTRUCTION (The Task)
    // ==========================================
    // The immediate directive for the next response.
    renderInstruction(input, tone) {
        return `
<INSTRUCTION>
Input: "${input}"
Goal: Advance the narrative strictly following the <PHYSICS_ENGINE>.
Output Format:
<think>
[Logic/Analysis in Chinese]
[Plan in Chinese]
</think>
[Final Response in English]
</INSTRUCTION>
    `.trim()
    }
}
