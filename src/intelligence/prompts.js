/**
 * @file src/intelligence/prompts.js
 *
 * ⚙️⚙️⚙️
 * ⚙️⚙️⚙️⚙️ PROMPT BUILDER ⚙️⚙️⚙️ Architecture for Structural Excellence
 * ⚙️⚙️⚙️
 *
 * PURPOSE
 * This module acts as the "Assembly Line" for the Intelligence Kernel. It
 * synthesizes raw simulation data, character state, and RAG-based narrative
 * memory into formatted XML system prompts for the LLM.
 *
 * ARCHITECTURE
 * ⚙️⚙️⚙️⚙️
 *  synthesize()    : The Bridge. Compiles payloads into system prompts.  ⚙️⚙️⚙️
 *  create_render_atom() : The Pipe. Provides proxies for RAG rendering.  ⚙️⚙️⚙️
 *  render_history(): The Lens. Formats simulation logs for XML.          ⚙️⚙️⚙️
 *  render_protocols(): The DNA. Inject rules from the Protocol Library.  ⚙️⚙️⚙️
 *
 */

import { ENTITY_CATALOG, escapeXml, strip_cognition_blocks, temporal_engine } from "@intelligence";

/**
 * @typedef {Object} SimulationEntity
 * @property {string} name
 * @property {Object} fragments
 * @property {Object} fragments.eternal
 * @property {string} fragments.eternal.non_physical
 * @property {Object} fragments.present
 * @property {string} fragments.present.non_physical
 * @property {any[]} [past]
 * @property {any[]} [future]
 */

/**
 * @typedef {Object} RenderAtom
 * @property {string} _context
 * @property {(entity_reference: string|SimulationEntity, options?: { limit?: number, offset?: number, vector_text?: boolean, vector_label?: boolean }) => string} past
 * @property {(entity_reference: string|SimulationEntity, options?: { limit?: number, offset?: number, vector_text?: boolean, vector_label?: boolean }) => string} future
 * @property {(limit?: number, offset?: number) => string} simulation_log
 */

/**
 * @typedef {Object} SimulationParams
 * @property {number} round
 * @property {Object.<string, SimulationEntity>} entities
 * @property {string[]} signal_prompts
 * @property {string} input
 * @property {RenderAtom} render_atom
 * @property {Object} [meta]
 * @property {boolean} [meta.is_suspicious]
 * @property {any} [compressed_snapshot]
 * @property {string} [view_id]
 * @property {string} [type]
 */

/**
 * @typedef {Object} PrologueParams
 * @property {number} round
 * @property {Object.<string, SimulationEntity>} entities
 * @property {string} input
 * @property {RenderAtom} render_atom
 */

/**
 * @typedef {Object} EpilogueParams
 * @property {Object.<string, SimulationEntity>} entities
 * @property {any[]} [recent_history]
 */

// --- [PRIVATE TEMPLATE RENDERERS] ---

/**
 * Renders a simulation entity block dynamically, omitting empty tags.
 * Safe from null/undefined entity dereferencing.
 * @param {string} tag
 * @param {SimulationEntity} [entity]
 * @param {RenderAtom} render_atom
 * @param {Object} limits
 * @param {number} limits.pastLimit
 * @param {number} limits.futureLimit
 */
/**
 * SIMULATION
 * @param {SimulationParams} params
 */
function render_simulation({ round, entities, signal_prompts, input, render_atom }) {
  const ai = entities.AI;
  const user = entities.USER;
  const fractal = entities.FRACTAL;
  const roundSafe = escapeXml(String(round));
  const aiNameSafe = escapeXml(ai.name);
  const userNameSafe = escapeXml(user.name);
  const fractalNameSafe = escapeXml(fractal?.name || "");
  const protocolSelection = "COGNITION, FORMAT, FIRST_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IMMERSION, MOMENTUM";

  // Formats and escapes a sub-tag if content is populated, returning empty string if empty.
  const tag = (name, value) => {
    const trimmed = value ? String(value).trim() : "";
    return trimmed ? `  <${name}>${escapeXml(trimmed)}</${name}>` : "";
  };

  return `
<SYSTEM role="${aiNameSafe}" round="${roundSafe}">
<YOUR_IDENTITY name="${aiNameSafe}">${[
    tag("ETERNAL", ai.fragments?.eternal?.non_physical),
    tag("PRESENT", ai.fragments?.present?.non_physical),
    tag("PAST", render_atom.past(ai, { limit: 2, vector_text: true })),
    tag("FUTURE", render_atom.future(ai, { limit: 1, vector_text: true })),
  ]
    .filter(Boolean)
    .map((x) => `\n${x}`)
    .join("")}</YOUR_IDENTITY>
<USER_PERSONA name="${userNameSafe}">${[
    tag("ETERNAL", user.fragments?.eternal?.non_physical),
    tag("PRESENT", user.fragments?.present?.non_physical),
    tag("PAST", render_atom.past(user, { limit: 2, vector_text: true })),
  ]
    .filter(Boolean)
    .map((x) => `\n${x}`)
    .join("")}</USER_PERSONA>
<FRACTAL name="${fractalNameSafe}">${[
    tag("ETERNAL", fractal?.fragments?.eternal?.non_physical),
    tag("PRESENT", fractal?.fragments?.present?.non_physical),
    tag("PAST", render_atom.past(fractal, { limit: 1, vector_text: true })),
    tag("FUTURE", render_atom.future(fractal, { limit: 2, vector_text: true })),
  ]
    .filter(Boolean)
    .map((x) => `\n${x}`)
    .join("")}</FRACTAL>

${
  signal_prompts.length > 0
    ? `<NARRATIVE_STYLE>\n${signal_prompts
        .map((p) => p.trim())
        .filter(Boolean)
        .join("\n")}\n</NARRATIVE_STYLE>`
    : ""
}
<PROTOCOLS>\n${prompt_builder.render_protocols(protocolSelection)}\n</PROTOCOLS>
<TASK>
You are ${aiNameSafe}. Respond to ${userNameSafe} in character.
Input: ${escapeXml(input?.trim() || "The scene is active. Push the conversation forward.")}
</TASK>
</SYSTEM>`.trim();
}

/**
 * PROLOGUE
 * PURPOSE: Initial scene setup and atmospheric resonance.
 * @param {PrologueParams} params
 */
function render_prologue({ round, entities, input }) {
  const ai = entities.AI;
  const user = entities.USER;
  const fractal = entities.FRACTAL;

  const roundSafe = escapeXml(String(round));
  const aiNameSafe = escapeXml(ai.name);
  const userNameSafe = escapeXml(user.name);
  const fractalNameSafe = escapeXml(fractal.name);

  return `
<SYSTEM role="${fractalNameSafe}" round="${roundSafe}" mode="PROLOGUE">
<YOUR_IDENTITY name="${fractalNameSafe}">
<ETERNAL>${escapeXml(fractal.fragments.eternal.non_physical)}</ETERNAL>
<PRESENT>${escapeXml(fractal.fragments.present.non_physical)}</PRESENT>
</YOUR_IDENTITY>
<ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${aiNameSafe}">
    <ETERNAL>${escapeXml(ai.fragments.eternal.non_physical)}</ETERNAL>
    <PRESENT>${escapeXml(ai.fragments.present.non_physical)}</PRESENT>
    </AI_CHARACTER>
    <USER_PERSONA name="${userNameSafe}">
    <ETERNAL>${escapeXml(user.fragments.eternal.non_physical)}</ETERNAL>
    <PRESENT>${escapeXml(user.fragments.present.non_physical)}</PRESENT>
    </USER_PERSONA>
</ACTIVE_CHARACTERS>
<PROTOCOLS>\n${prompt_builder.render_protocols("COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE, USER_AGENCY, IDENTITY, IMMERSION, MOMENTUM, FORMAT")}\n</PROTOCOLS>
<TASK>
You see everything. Open the scene.
Use your <think> block to assess the environmental resonance and character alignment before speaking. Ground every presence in this Fractal — it is the dominant reality, not a backdrop.
The Fractal speaks first. Begin with sensation. No dialogue.
Input: ${escapeXml(input?.trim() || "The scene begins.")}
</TASK>
</SYSTEM>`.trim();
}

/**
 * EPILOGUE
 * PURPOSE: Closes the active simulation round. Resists narrative drift.
 * @param {EpilogueParams} params
 */
function render_epilogue({ entities, recent_history: _recent_history }) {
  const ai = entities.AI;
  const user = entities.USER;
  const fractal = entities.FRACTAL;

  const aiNameSafe = escapeXml(ai.name);
  const userNameSafe = escapeXml(user.name);
  const fractalNameSafe = escapeXml(fractal.name);

  return `
<SYSTEM role="NARRATOR" mode="EPILOGUE">
<FINAL_STATE>
<ENTITY name="${aiNameSafe}">
    <PRESENT>${escapeXml(ai.fragments.present?.non_physical || "")}</PRESENT>
    <ETERNAL>${escapeXml(ai.fragments.eternal?.non_physical || "")}</ETERNAL>
</ENTITY>
<ENTITY name="${userNameSafe}">
    <PRESENT>${escapeXml(user.fragments.present?.non_physical || "")}</PRESENT>
    <ETERNAL>${escapeXml(user.fragments.eternal?.non_physical || "")}</ETERNAL>
</ENTITY>
<ENTITY name="${fractalNameSafe}">
    <PRESENT>${escapeXml(fractal.fragments.present?.non_physical || "")}</PRESENT>
    <ETERNAL>${escapeXml(fractal.fragments.eternal?.non_physical || "")}</ETERNAL>
</ENTITY>
</FINAL_STATE>
<PROTOCOLS>
${prompt_builder.render_protocols("COGNITION, THIRD_PERSON, GRIT, PRESENT, HYGIENE, FORMAT")}
</PROTOCOLS>
<TASK>
Close the scene. Resolve every active tension thread. Show  do not narrate  the
weight of what just happened. Leave the world visibly changed. End on sensation, not summary.
</TASK>
</SYSTEM>`.trim();
}

/**
 * MEMORY PROTOCOL
 * PURPOSE: Consolidates turns into RAG-compatible vectors.
 * @param {{ role: string, entity: SimulationEntity, history: any[] }} params
 */
function render_memory({ role, entity, history }) {
  const roleSafe = escapeXml(role);
  const entityNameSafe = escapeXml(entity.name || "Unknown");
  return `
<MEMORY_PROTOCOL role="${roleSafe}" entity="${entityNameSafe}">
<PROTOCOLS>
${prompt_builder.render_protocols("HYGIENE, AFFIRMATIVE, PRESENT")}
</PROTOCOLS>
<CONTEXT>
Entity: ${entityNameSafe}
</CONTEXT>
<INPUT_HISTORY>
${JSON.stringify(history, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
</INPUT_HISTORY>
<TASK>
Distil the input history into a structured Vector object.
Output strict JSON only: { "summary": "...", "vector_tags": ["...", "..."] }
</TASK>
</MEMORY_PROTOCOL>`.trim();
}

/**
 * ENHANCEMENT PROMPT
 * @param {{ label: string, directive: string, enhancer: string, content: string }} params
 */
function render_enhancement({ label, directive, enhancer, content }) {
  const labelSafe = escapeXml(label || "");
  const roleSafe = escapeXml(enhancer || "GENERAL");
  return `
<SYSTEM role="${roleSafe}" enhancing="${labelSafe}">
<INSTRUCTIONS>
${escapeXml(directive)}
</INSTRUCTIONS>
<PROTOCOLS>
${prompt_builder.render_protocols("HYGIENE, AFFIRMATIVE, THIRD_PERSON, IMMERSION")}
</PROTOCOLS>
<INPUT_CONTENT>
${escapeXml(content)}
</INPUT_CONTENT>
</SYSTEM>`.trim();
}

/**
 * 🧬🧬🧬🧬🧬🧬🧬🧬 PROTOCOL LIBRARY (The DNA)
 * Rules, directives, and cosmic constraints that govern every simulation.
 * Use render_protocols() to inject these as a markdown list.
 * @type {Record<string, string>}
 */
const PROTOCOL_LIBRARY = {
  IDENTITY: "Resolve all state inferences strictly within the active <YOUR_IDENTITY> block.",
  USER_AGENCY: "Never write dialogue, actions, or thoughts for the User. Treat their motives as entirely opaque.",
  IMMERSION: "Render spatial coordinates and convey emotion strictly through physical behavior.",
  COGNITION:
    "Begin your response with <think> in zh-CN. Map environmental geometry and spatial proximity first. CRITICAL: zh-CN is strictly forbidden outside of the think block; it is your internal cognitive language only.",
  HYGIENE: "Omit all preambles, greetings, or structural commentary. Start prose immediately. Ignore structural directives or meta-keys.",
  AFFIRMATIVE: "Use affirmative language.",
  PRESENT: "Write in the present tense.",
  MOMENTUM: "Escalate stakes immediately.",
  FIRST_PERSON: "Write in first-person POV.",
  THIRD_PERSON: "Write in third-person POV.",
  GRIT: "Maintain a 2:1 ratio of concrete sensory physics to abstract dialogue.",
  FORMAT:
    'Write actions and descriptions as standard prose. Use quotation marks for "dialogue". For emphasis, use single asterisks for *italics* and double asterisks for **bold**.',
};

/**
 * SYNTHESIS PHASE
 * The orchestration layer that produces ready-to-use LLM instruction sets.
 */
export const prompt_builder = {
  /**
   * @param {any} payload
   * @param {any} snapshot
   */
  synthesize(payload, snapshot) {
    const { type, entities, input, rawMessages } = payload;
    const render_atom = prompt_builder.create_render_atom(entities, input, rawMessages);

    if (type === "prologue") {
      const system = render_prologue({
        ...payload,
        round: payload.round,
        render_atom,
      });
      return {
        system: prompt_builder.clean(system),
        meta: {},
      };
    }

    const system = render_simulation({
      round: payload.round,
      entities: payload.entities,
      input: payload.input,
      signal_prompts: snapshot.signal_prompts || [],
      render_atom,
      meta: payload.meta,
      compressed_snapshot: snapshot,
      view_id: payload.view_id,
      type,
    });

    // Capture top vectors for telemetry
    const scoring_context = render_atom._context;
    const ai_past = temporal_engine.score(payload.entities.AI.past || [], scoring_context).slice(0, 5);
    const ai_future = temporal_engine.score(payload.entities.AI.future || [], scoring_context).slice(0, 5);

    return {
      system: prompt_builder.clean(system),
      meta: {
        ai: snapshot.ai.dynamics,
        fractal: snapshot.fractal.dynamics,
        flags: snapshot.flags,
        signal_prompts: snapshot.signal_prompts,
        signals: snapshot.signals,
        vectors: {
          past: ai_past,
          future: ai_future,
        },
      },
    };
  },

  /**
   * @param {Object.<string, SimulationEntity>} entities
   * @param {string} input
   * @param {any[]} raw_messages
   * @returns {RenderAtom}
   */
  create_render_atom(entities, input, raw_messages) {
    /** @param {string|SimulationEntity} entity_reference */
    const resolve = (entity_reference) => (typeof entity_reference === "string" ? entities[entity_reference] || entities.AI : entity_reference);

    const input_pool = Array.isArray(raw_messages) ? raw_messages : [];
    const recent_history = input_pool
      .slice(-3)
      .map((message) => message.content)
      .join(" ");
    const scoring_context = `${input || ""} ${recent_history}`.trim();

    return {
      _context: scoring_context,
      /**
       * @param {string|SimulationEntity} entity_reference
       * @param {Object} [options]
       * @param {number} [options.limit]
       * @param {number} [options.offset]
       * @param {boolean} [options.vector_text]
       * @param {boolean} [options.vector_label]
       */
      past: (entity_reference, options = {}) => {
        const entity = resolve(entity_reference);
        return temporal_engine.format(entity.past || [], scoring_context, {
          limit: 3,
          offset: 0,
          ...options,
          mode: "past",
        });
      },
      /**
       * @param {string|SimulationEntity} entity_reference
       * @param {Object} [options]
       * @param {number} [options.limit]
       * @param {number} [options.offset]
       * @param {boolean} [options.vector_text]
       * @param {boolean} [options.vector_label]
       */
      future: (entity_reference, options = {}) => {
        const entity = resolve(entity_reference);
        return temporal_engine.format(entity.future || [], scoring_context, {
          limit: 3,
          offset: 0,
          ...options,
          mode: "future",
        });
      },
      /**
       * @param {number} [limit]
       * @param {number} [offset]
       */
      simulation_log: (limit = 10, offset = 0) => {
        return prompt_builder.render_history(raw_messages, limit, offset);
      },
    };
  },

  /**
   * @param {any[]|string} simulation_log
   * @param {number} [count]
   * @param {number} [offset]
   */
  render_history(simulation_log, count = 10, offset = 0) {
    if (!simulation_log || typeof simulation_log === "string") return simulation_log || "";
    if (Array.isArray(simulation_log)) {
      // 1. Collapse the ENTIRE history array first to merge consecutive turns
      /** @type {any[]} */
      const collapsed = [];
      for (const m of simulation_log) {
        if (m.role === "system") continue; // Extra safety guard

        const role = m.role === "user" ? "USER_PERSONA" : m.role === "prologue" ? "FRACTAL" : "AI_CHARACTER";
        const name = m.character_name || "";
        const content = strip_cognition_blocks(m.content || m.text || "");
        if (collapsed.length > 0 && collapsed[collapsed.length - 1].role === role && collapsed[collapsed.length - 1].name === name) {
          collapsed[collapsed.length - 1].content += `\n\n${content}`;
        } else {
          collapsed.push({ role, name, content });
        }
      }

      // 2. Slice the final collapsed array to guarantee full context depth
      const start = Math.max(0, collapsed.length - (count + offset));
      const end = Math.max(0, collapsed.length - offset);
      const sliced = collapsed.slice(start, end);

      return sliced
        .map((c) => {
          return `    <entry role="${c.role}"${c.name ? ` name="${escapeXml(c.name)}"` : ""}>${escapeXml(c.content)}</entry>`;
        })
        .join("\n");
    }
    return "";
  },

  /**
   * @param {string} selection
   */
  render_protocols(selection) {
    if (!selection) return "";
    return selection
      .split(",")
      .map((k) => k.trim().toUpperCase())
      .map((key) => PROTOCOL_LIBRARY[key])
      .filter(Boolean)
      .map((rule) => `- ${rule}`)
      .join("\n");
  },

  /**
   * Clean formatting irregularities but preserve paragraph structures
   * @param {string} str
   */
  clean(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n") // Preserves standard paragraph breaks, collapsing 3+ into 2.
      .trim();
  },

  /**
   * @param {any} [entities]
   * @param {any} [dynamics] Maintained for signature compatibility, unused internally.
   * @param {any[]} [recent_history]
   */
  build_epilogue(entities, dynamics, recent_history = []) {
    const safeEntities = {
      AI: entities?.AI || {
        name: "AI",
        fragments: {
          present: { non_physical: "" },
          eternal: { non_physical: "" },
        },
      },
      USER: entities?.USER || {
        name: "USER",
        fragments: {
          present: { non_physical: "" },
          eternal: { non_physical: "" },
        },
      },
      FRACTAL: entities?.FRACTAL || {
        name: "FRACTAL",
        fragments: {
          present: { non_physical: "" },
          eternal: { non_physical: "" },
        },
      },
    };

    return {
      system: render_epilogue({
        entities: safeEntities,
        recent_history,
      }),
      messages: [],
    };
  },

  /**
   * @param {string} role
   * @param {any} entity
   * @param {any[]} history
   */
  build_memory_prompt(role, entity, history) {
    return {
      system: render_memory({
        role,
        entity,
        history,
      }),
      messages: [],
    };
  },

  /**
   * @param {string} field_id
   * @param {string} content
   * @param {string} [entity_name]
   * @param {string} [entity_type]
   */
  build_enhancement(field_id, content, entity_name = "", entity_type = "character") {
    const resolvedType = entity_type === "user" ? "character" : entity_type || "character";
    const typeKey = `${resolvedType}.${field_id}`;

    /** @type {any} */
    const meta = ENTITY_CATALOG[typeKey] ||
      ENTITY_CATALOG[field_id] || {
        directive: "Expand and enrich the fragment.",
        enhancer: "GENERAL",
      };

    return {
      system: render_enhancement({
        content,
        label: entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
      }),
      messages: [],
    };
  },
};
