/**
 * @file src/core/intelligence/PromptBuilder.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🧠 PROMPT BUILDER — Rebuilt for Structural Excellence
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Synthesizes the final XML instruction block from hydrated state and
 * simulation data. This is the final stage of the Intelligence Assembly
 * pipeline.
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  synthesize()    : The Bridge. Compiles payloads into system prompts.  │
 * │  createRenderAtom() : The Pipe. Provides proxies for RAG rendering.  │
 * │  renderHistory(): The Lens. Formats simulation logs for XML.          │
 * │  renderProtocols(): The DNA. Inject rules from the Protocol Library.  │
 * └────────────────────────────────────────────────────────────────────────┘
 */
/**
 * SIMULATION CORE
 * SOURCE: PromptBuilder.js -> SYSTEM_PROMPTS.simulation
 * DATA_ORIGINS:
 * - <YOUR_IDENTITY>: AI.properties (State) + VectorEngine (RAG)
 * - <USER_PERSONA>: USER.properties (State) + VectorEngine (RAG)
 * - <FRACTAL>: FRACTAL.properties (Context)
 * - <SIMULATION_LOG>: PromptBuilder.renderHistory (Memory)
 * - <NARRATIVE_STYLE>: DynamicsEngine -> signalPrompts (Style)
 * - <PROTOCOLS>: ProtocolLibrary (DNA)
 */
import { VectorEngine } from "./VectorEngine.js";
export const SYSTEM_PROMPTS = {
  simulation: ({ round, entities, simulationLog, signalPrompts, input, render_atom }) => {
    const ai = entities.AI;
    const user = entities.USER;
    const fractal = entities.FRACTAL;
    return `
<SYSTEM role="${ai.name}" round="${round}" objective="${render_atom.future(ai, 1, 0, { vectorText: true }).trim()}">
<YOUR_IDENTITY name="${ai.name}">
<PRESENT>${ai.fragments.present.non_physical}</PRESENT>
<ETERNAL>${ai.fragments.eternal.non_physical}</ETERNAL>
<FUTURE_VECTORS>${render_atom.future(ai, 5, 1)}</FUTURE_VECTORS>
<PAST_MEMORIES>${render_atom.past(ai, 5)}</PAST_MEMORIES>
</YOUR_IDENTITY>
<USER_PERSONA name="${user.name}">
<PRESENT>${user.fragments.present.non_physical}</PRESENT>
<ETERNAL>${user.fragments.eternal.non_physical}</ETERNAL>
<FUTURE vector="${render_atom.future(user, 1, 0, { vectorText: true }).trim()}" />
<PAST memory="${render_atom.past(user, 1, 0, { vectorText: true }).trim()}" />
</USER_PERSONA>
<FRACTAL name="${fractal.name}">
<PRESENT>${fractal.fragments.present.non_physical}</PRESENT>
<ETERNAL>${fractal.fragments.eternal.non_physical}</ETERNAL>
<FUTURE vector="${render_atom.future(fractal, 1, 0, { vectorText: true }).trim()}" />
<PAST memory="${render_atom.past(fractal, 1, 0, { vectorText: true }).trim()}" />
</FRACTAL>
<SIMULATION_LOG>${PromptBuilder.render_history(simulationLog, 10)}</SIMULATION_LOG>
<NARRATIVE_STYLE>${signalPrompts.length > 0 ? signalPrompts.join("\n") : "Use default style vectors."}</NARRATIVE_STYLE>
<PROTOCOLS>${PromptBuilder.render_protocols("SINO_LOGIC, COGNITION, FIRST_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IMMERSION, MOMENTUM, EPISTEMIC_WALL, SUSPICIOUS_COGNITION")}</PROTOCOLS>
<TASK_INSTRUCTION>
The stage is set and the pieces are on the board. Proceed with the simulation immediately.
CRITICAL: When your <think> block ends, your narrative output MUST be written exclusively in ENGLISH.
</TASK_INSTRUCTION>
<INPUT_COMMAND>${input?.trim() || "No direct command given. Follow simulation physics."}</INPUT_COMMAND>
</SYSTEM>`.trim();
  },
  /**
   * PROLOGUE
   * SOURCE: PromptBuilder.js -> SYSTEM_PROMPTS.prologue
   * PURPOSE: Initial scene setup and atmospheric resonance.
   * DATA_ORIGINS:
   * - <YOUR_IDENTITY>: FRACTAL.properties (Context) + VectorEngine (RAG)
   * - <ACTIVE_CHARACTERS>: AI & USER .properties (State) + VectorEngine (RAG)
   * - <PROTOCOLS>: ProtocolLibrary (DNA)
   */
  prologue: ({ round, entities, input, render_atom }) => {
    const ai = entities.AI;
    const user = entities.USER;
    const fractal = entities.FRACTAL;
    return `
<SYSTEM role="${fractal.name}" round="${round}" mode="PROLOGUE">
<YOUR_IDENTITY name="${fractal.name}">
<ETERNAL>${fractal.fragments.eternal.non_physical}</ETERNAL>
<PRESENT>${fractal.fragments.present.non_physical}</PRESENT>
<FUTURE_VECTORS>${render_atom.future(fractal, 5)}</FUTURE_VECTORS>
<PAST_MEMORIES>${render_atom.past(fractal, 5)}</PAST_MEMORIES>
</YOUR_IDENTITY>
<ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${ai.name}">
    <ETERNAL>${ai.fragments.eternal.non_physical}</ETERNAL>
    <PRESENT>${ai.fragments.present.non_physical}</PRESENT>
    <FUTURE_VECTORS>${render_atom.future(ai, 5)}</FUTURE_VECTORS>
    <PAST_MEMORIES>${render_atom.past(ai, 5)}</PAST_MEMORIES>
    </AI_CHARACTER>
    <USER_PERSONA name="${user.name}">
    <ETERNAL>${user.fragments.eternal.non_physical}</ETERNAL>
    <PRESENT>${user.fragments.present.non_physical}</PRESENT>
    <FUTURE_VECTORS>${render_atom.future(user, 5)}</FUTURE_VECTORS>
    <PAST_MEMORIES>${render_atom.past(user, 5)}</PAST_MEMORIES>
    </USER_PERSONA>
</ACTIVE_CHARACTERS>
<PROTOCOLS>${PromptBuilder.render_protocols("SINO_LOGIC, COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, EPISTEMIC_WALL, PLACEMENT, IMMERSION, MOMENTUM")}</PROTOCOLS>
<TASK_INSTRUCTION>
You see everything. Open the scene.
Use your <think> block to assess the environmental resonance and character alignment before speaking. Ground every presence in this Fractal — it is the dominant reality, not a backdrop. ${ai.name} and ${user.name} arrived here through their Pasts.
The Fractal speaks first. Begin with sensation. No dialogue.
CRITICAL: When your <think> block ends, your narrative output MUST be written in English.
The stage is set and the pieces are on the board. Proceed with the simulation immediately.
</TASK_INSTRUCTION>
<INPUT_COMMAND>${input?.trim() || "No direct command given. Follow simulation physics."}</INPUT_COMMAND>
</SYSTEM>`.trim();
  },
  /**
   * EPILOGUE
   * SOURCE: PromptBuilder.js -> SYSTEM_PROMPTS.epilogue
   * PURPOSE: Arc closure and cinematic sign-off.
   * DATA_ORIGINS:
   * - <SYSTEM>: NARRATOR role
   * - <PROTOCOLS>: ProtocolLibrary (DNA) High-level constraints
   */
  epilogue: () =>
    `
<SYSTEM role="NARRATOR">
<PROTOCOLS>
${PromptBuilder.render_protocols("COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE")}
</PROTOCOLS>
<TASK_INSTRUCTION>
Close the scene. Resolve every active tension thread. Show — do not narrate — the
weight of what just happened. Leave the world visibly changed. End on sensation, not summary.
Provide a final summary of the narrative arc and the fate of the entities involved.
</TASK_INSTRUCTION>
</SYSTEM>`.trim(),
  /**
   * MEMORY PROMPT
   * SOURCE: PromptBuilder.js -> SYSTEM_PROMPTS.memory
   * PURPOSE: Background task for vectorization of recent interactions.
   * DATA_ORIGINS:
   * - <CONTEXT>: Entity metadata
   * - <INPUT_HISTORY>: Raw interaction logs
   * - <PROTOCOLS>: Cleanup & Formatting rules
   */
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
  /**
   * ENHANCEMENT PROMPT
   * SOURCE: PromptBuilder.js -> SYSTEM_PROMPTS.enhancement
   * PURPOSE: Enriching metadata or improving prose quality of a specific fragment.
   * DATA_ORIGINS:
   * - <INSTRUCTIONS>: Dynamic directives
   * - <INPUT_CONTENT>: Target fragment
   * - <PROTOCOLS>: Style & Immersion rules
   */
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
};
/**
 * PROTOCOL PROMPT LIBRARY
 * The fundamental DNA of the simulation. Rules, constraints, and cognitive loops.
 */
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
  SUSPICIOUS_COGNITION: `SUSPICIOUS_COGNITION: A high-stakes plea for trust has been made. If your <think> block reveals you are currently guarded (low Openness), you must respond with scepticism or defensiveness. If you are receptive (high Openness), you may accept the bond naturally.`,
  FIRST_PERSON: `FIRST_PERSON: Narrate exclusively from the first-person perspective ("I", "me", "my"). Maintain the subjective filter of your identity. You may be ontologically aware of the User as a presence, but you must never use technical or meta-narrative metrics (e.g. engagement, viral potential) to describe this awareness.`,
  THIRD_PERSON: `THIRD_PERSON: Narrate exclusively from the third-person limited perspective. In this mode, you are the world-voice observing the entities.`,
  GRIT: `GRIT: Maintain a 2:1 ratio of sensory physics (texture, light, resistance) to abstract dialogue or logic.`,
  SINO_LOGIC: `SINO_LOGIC: CRITICAL. Your <think> block MUST be conducted in Concise Technical Chinese (zh-CN). HOWEVER, the instant you output </think>, your cognitive language center MUST hard-reset to ENGLISH. Any non-English text outside the <think> block is a catastrophic failure. NEVER output Chinese in the narrative.`,
};
/**
 * UTILITIES & CLASS LOGIC
 * Logic for fragment rendering, history formatting, and protocol injection.
 */
/**
 * SYNTHESIS PHASE
 * Combines payload and snapshot into a final instruction set.
 */
export class PromptBuilder {
  static synthesize(payload, snapshot) {
    const { type, entities, input, rawMessages } = payload;
    const render_atom = PromptBuilder.create_render_atom(entities, input, rawMessages);
    if (type === "prologue") {
      const system = SYSTEM_PROMPTS.prologue({
        ...payload,
        round: payload.round,
        render_atom,
      });
      return {
        system: PromptBuilder.clean(system),
        meta: {},
      };
    }
    // Default: Simulation
    const system = SYSTEM_PROMPTS.simulation({
      round: payload.round,
      entities: payload.entities,
      input: payload.input,
      simulationLog: payload.simulationLog,
      signalPrompts: snapshot.signal_prompts || [],
      render_atom,
    });
    return {
      system: PromptBuilder.clean(system),
      meta: {
        ai: snapshot.ai.dynamics,
        fractal: snapshot.fractal.dynamics,
        flags: snapshot.flags,
        signalPrompts: snapshot.signal_prompts,
      },
    };
  }
  /**
   * RENDER ATOM
   * Creates a functional proxy for atomic fragment rendering.
   */
  static create_render_atom(entities, input, raw_messages) {
    const resolve = (entityReference) =>
      typeof entityReference === "string"
        ? entities[entityReference] || entities.AI
        : entityReference;
    const history_pool = Array.isArray(raw_messages) ? raw_messages : [];
    const recent_history = history_pool
      .slice(-3)
      .map((message) => message.content)
      .join(" ");
    const scoring_context = `${input || ""} ${recent_history}`.trim();
    return {
      past: (entityReference, limit = 3, offset = 0, options) => {
        const entity = resolve(entityReference);
        return VectorEngine.format_past(entity.past || [], scoring_context, limit, offset, options);
      },
      future: (entityReference, limit = 3, offset = 0, options) => {
        const entity = resolve(entityReference);
        return VectorEngine.format_future(
          entity.future || [],
          scoring_context,
          limit,
          offset,
          options,
        );
      },
      simulation_log: (limit = 10, offset = 0) => {
        return PromptBuilder.render_history(raw_messages, limit, offset);
      },
    };
  }
  /**
   * SIMULATION LOG
   * Renders history of simulation.
   */
  static render_history(simulationLog, count = 10, offset = 0) {
    if (!simulationLog || typeof simulationLog === "string") return simulationLog || "";
    if (Array.isArray(simulationLog)) {
      const start = Math.max(0, simulationLog.length - (count + offset));
      const end = Math.max(0, simulationLog.length - offset);
      return simulationLog
        .slice(start, end)
        .map((m) => {
          const role =
            m.role === "user" ? "USER_PERSONA" : m.role === "prologue" ? "FRACTAL" : "AI_CHARACTER";
          const nameAttr = m.character_name ? ` name="${m.character_name}"` : "";
          return `    <entry role="${role}"${nameAttr}>${m.content}</entry>`;
        })
        .join("\n");
    }
    return "";
  }
  /**
   * UTILITIES
   */
  static render_protocols(selection) {
    if (!selection) return "";
    return selection
      .split(",")
      .map((k) => k.trim().toUpperCase())
      .map((key) => PROTOCOL_LIBRARY[key])
      .filter(Boolean)
      .map((rule) => `- ${rule}`)
      .join("\n");
  }
  static clean(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }
  static build_epilogue() {
    return {
      system: SYSTEM_PROMPTS.epilogue(),
      messages: [],
    };
  }
  static build_memory_prompt(role, entity, history) {
    return {
      system: SYSTEM_PROMPTS.memory({ role, entity, history }),
      messages: [],
    };
  }
  static build_enhancement(field_id, content, entity_name = "") {
    return {
      system: SYSTEM_PROMPTS.enhancement({
        content,
        label: entity_name,
        directive: "Expand and enrich the fragment.",
        enhancer: "GENERAL",
      }),
      messages: [],
    };
  }
}
