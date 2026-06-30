/**
 * src/intelligence/prompts.js
 * @description Centralized assembly line for the Intelligence Kernel.
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */

import { ENTITY_CATALOG, ENTITY_FRAGMENTS, escapeXml, strip_cognition_blocks, temporal_engine } from "@intelligence";
import { safeParsePseudoJson } from "@media";
import { app } from "@state";
import { AUTHOR_STYLES } from "@data";

/**
 * Helper to transform physical data to XML nodes.
 */
function physical_to_xml(raw, tagName) {
  if (!raw) return "";
  const parsed = safeParsePseudoJson(raw);
  if (parsed.__raw_prose__) {
    return `  <${tagName}>${escapeXml(parsed.__raw_prose__)}</${tagName}>`;
  }
  const children = Object.entries(parsed)
    .map(([k, v]) => `    <${k}>${escapeXml(String(v))}</${k}>`)
    .join("\n");
  return `  <${tagName}>\n${children}\n  </${tagName}>`;
}

/**
 * Helper to render sub-tags cleanly, applying macros and escaping, omitting them if empty.
 */
const tag = (name, value, owner, entities) => {
  return prompt_builder.render_tag(name, value, owner, entities);
};

/**
 * Helper to render multiline indented XML blocks, omitting them if empty.
 */
const tag_block = (name, content, indentSize = 2, attrs = "") => {
  const trimmed = content ? String(content).trim() : "";
  if (!trimmed) return "";
  const spaces = " ".repeat(indentSize);
  const childSpaces = " ".repeat(indentSize + 2);
  const indentedContent = trimmed
    .split("\n")
    .map((line) => (line.trim() ? `${childSpaces}${line}` : ""))
    .join("\n");
  const attrStr = attrs ? ` ${attrs}` : "";
  return `<${name}${attrStr}>\n${indentedContent}\n${spaces}</${name}>`;
};

/**
 * Compiles dynamic system parameter keys into inline attributes.
 */
const format_dynamics_attrs = (dynObj) => {
  if (!dynObj) return "";
  const attrs = Object.entries(dynObj)
    .map(([k, v]) => `${escapeXml(k)}="${Math.round(v)}"`)
    .join(" ");
  return attrs ? ` ${attrs}` : "";
};

/**
 * Director prompt compiler (Shot 1).
 */
function render_director({ round, entities, input, render_atom, compressed_snapshot }) {
  const protocols = ["COGNITION", "JSON_OUTPUT"].filter(Boolean).join(", ");

  return `<SYSTEM role="DIRECTOR" round="${escapeXml(String(round))}">
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      ${tag("ETERNAL", entities.AI.eternal?.non_physical, entities.AI, entities)}
      ${tag("PRESENT", entities.AI.present?.non_physical, entities.AI, entities)}
      ${tag("PAST", render_atom.past(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities)}
      ${tag("FUTURE", render_atom.future(entities.AI, { limit: 1, vector_text: true }), entities.AI, entities)}
    </AI_CHARACTER>
    <USER_PERSONA name="${escapeXml(entities.USER.name)}">
      ${tag("ETERNAL", entities.USER.eternal?.non_physical, entities.USER, entities)}
      ${tag("PRESENT", entities.USER.present?.non_physical, entities.USER, entities)}
      ${tag("PAST", render_atom.past(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)}
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <FRACTAL name="${escapeXml(entities.FRACTAL?.name || "")}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    ${tag("ETERNAL", entities.FRACTAL?.eternal?.non_physical, entities.FRACTAL, entities)}
    ${tag("PRESENT", entities.FRACTAL?.present?.non_physical, entities.FRACTAL, entities)}
    ${tag("PAST", entities.FRACTAL ? render_atom.past(entities.FRACTAL, { limit: 1, vector_text: true }) : "", entities.FRACTAL, entities)}
    ${tag("FUTURE", render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)}
  </FRACTAL>
  ${tag_block("PROTOCOLS", prompt_builder.render_protocols(protocols), 2)}
  <TASK>
    You are the Director — the unseen intelligence orchestrating ${escapeXml(entities.AI.name)}'s psychological state as ${escapeXml(entities.USER.name)} acts inside ${escapeXml(entities.FRACTAL?.name)}.

    ${tag_block("USER_INPUT", input, 4)}

    Run the COGNITION protocol against <USER_INPUT>. Honor all active <PROTOCOLS>.
    Return exactly one valid JSON payload:
    {
      "internal_monologue": "COGNITION phases 1–4 calculations.",
      "directive": "Execution order: intent + somatic signals + dialogue tone.",
      "state_mutations": {
        "present_append": "Psychological shift to persist.",
        "future_to_past": ["future-vector-uuids"],
        "ai_dynamics": { "chaos": 0, "intensity": 0 },
        "fractal_dynamics": { "entropy": 0 }
      }
    }
    ai_dynamics and fractal_dynamics values are relative shifts (e.g., +10 or -5). Output ONLY valid raw JSON. No <think> blocks, no prose, no dialogue. Your role ends the moment the state_mutations object closes.
  </TASK>
</SYSTEM>`.trim();
}

/**
 * AI Character (Actor) prompt compiler (Shot 2).
 */
function render_character({ round, entities, input, render_atom, compressed_snapshot, directorData, meta }) {
  const protocols = [
    "PRESENT",
    "HYGIENE",
    "USER_AGENCY",
    "MOMENTUM",
    "MARKDOWN_FORMAT",
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"))
      ? "FIRST_CONTACT"
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  const authorStyleContent =
    typeof app !== "undefined" && app.settings?.author_style && app.settings.author_style !== "default"
      ? AUTHOR_STYLES[app.settings.author_style]?.prompt
      : "";
  const authorAttr =
    typeof app !== "undefined" && app.settings?.author_style && app.settings.author_style !== "default"
      ? `author="${escapeXml(app.settings.author_style)}"`
      : "";

  return `<SYSTEM role="${escapeXml(entities.AI.name)}" round="${escapeXml(String(round))}">
  <YOUR_IDENTITY name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    ${tag("ETERNAL", entities.AI.eternal?.non_physical, entities.AI, entities)}
    ${tag("PRESENT", entities.AI.present?.non_physical, entities.AI, entities)}
    ${tag("PAST", render_atom.past(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities)}
    ${tag("FUTURE", render_atom.future(entities.AI, { limit: 1, vector_text: true }), entities.AI, entities)}
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escapeXml(entities.USER.name)}">
    ${tag("ETERNAL", entities.USER.eternal?.non_physical, entities.USER, entities)}
    ${tag("PRESENT", entities.USER.present?.non_physical, entities.USER, entities)}
    ${tag("PAST", render_atom.past(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)}
  </USER_PERSONA>
  <FRACTAL name="${escapeXml(entities.FRACTAL?.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    ${tag("ETERNAL", entities.FRACTAL?.eternal?.non_physical, entities.FRACTAL, entities)}
    ${tag("PRESENT", entities.FRACTAL?.present?.non_physical, entities.FRACTAL, entities)}
    ${tag("PAST", entities.FRACTAL ? render_atom.past(entities.FRACTAL, { limit: 1, vector_text: true }) : "", entities.FRACTAL, entities)}
    ${tag("FUTURE", render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)}
  </FRACTAL>
  ${tag_block("PROTOCOLS", prompt_builder.render_protocols(protocols), 2)}
  ${tag_block("NARRATIVE_STYLE", authorStyleContent, 2, authorAttr)}
  <TASK>
    You are ${escapeXml(entities.AI.name)} in an active scene with ${escapeXml(entities.USER.name)} inside ${escapeXml(entities.FRACTAL?.name)}.

    ${tag_block("USER_INPUT", input, 4)}

    ${tag_block("INTERNAL_DIRECTIVE", directorData?.directive, 4)}

    <EPISTEMIC_PHYSICS>
    1. Your perception ends at your sensory horizon — you see, hear, and feel. Nothing beyond.
    2. The user persona's unvoiced thoughts, plans, and hidden actions are Null Data. Treat them as nonexistent.
    3. You interpret others through your own emotional filters — never with omniscient clarity.
    </EPISTEMIC_PHYSICS>
${meta?.structural_errors >= 3 ? "\n    <STABILITY_LOCK>\n    CRITICAL: Structural formatting has critically collapsed. Re-anchor immediately. Every XML tag must close. Every markdown block must be valid. No loose text outside structure.\n    </STABILITY_LOCK>\n" : meta?.structural_errors >= 1 ? "\n    <STABILITY_LOCK>\n    WARNING: Structural drift detected in previous output. Maintain disciplined XML closures and clean markdown boundaries.\n    </STABILITY_LOCK>\n" : ""}
    Execute the <INTERNAL_DIRECTIVE> against <USER_INPUT>. Stay fully in character. Honor all active <PROTOCOLS>.
    DO NOT output <think> blocks.
  </TASK>
</SYSTEM>`.trim();
}

/**
 * Prologue / Epilogue narration compiler (renamed to render_narrator).
 * Shared structure with mode-specific task text pulled from PROTOCOL_LIBRARY.
 * @param {"prologue"|"epilogue"} mode
 */
function render_narrator(mode, { entities, render_atom, compressed_snapshot, round = null, input = null }) {
  const prologueText =
    "You see everything. Open the scene. Use your <think> block to establish the following: What does this Fractal demand of those who enter it? What specifically brought <AI_CHARACTER> here — their purpose, their need, the force that moved them to this place at this moment? What brought <USER_PERSONA> here — their motivation, their unresolved tension, what they are seeking or fleeing? How do these two trajectories collide? Unless ETERNAL or PAST context explicitly states a prior relationship, treat this as a first encounter — strangers with no shared history. Ground every presence in the Fractal — it is the dominant reality. Begin the prose with sensation. Place both characters in the space. Reveal why they are here through action and environment, not exposition. Let their FUTURE vectors pull them toward each other. End the prologue the moment before they interact. No dialogue.";
  const epilogueText =
    "You see everything. Close the scene. Use your <think> block to identify every unresolved thread — emotional, physical, narrative — that the scene generated. For each active FUTURE vector, assess whether it was fulfilled, fractured, or transformed by events. Then write the epilogue: resolve these loose ends. Show the concrete aftermath — what has changed, what was broken, what was built. Leave the world visibly different from when the scene began. End on lingering sensation, not summary. No dialogue.";

  const taskText = mode === "prologue" ? `${prologueText}\n\n    Input: ${escapeXml(input?.trim() || "The scene begins.")}` : epilogueText;

  const authorStyleContent =
    typeof app !== "undefined" && app.settings?.author_style && app.settings.author_style !== "default"
      ? AUTHOR_STYLES[app.settings.author_style]?.prompt
      : "";
  const authorAttr =
    typeof app !== "undefined" && app.settings?.author_style && app.settings.author_style !== "default"
      ? `author="${escapeXml(app.settings.author_style)}"`
      : "";

  const basePrompt = `
<SYSTEM role="${escapeXml(entities.FRACTAL.name)}"${round != null ? ` round="${escapeXml(String(round))}"` : ""} mode="${mode.toUpperCase()}">
  <YOUR_IDENTITY name="${escapeXml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    ${tag("ETERNAL", entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}
    ${tag("PRESENT", entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}
    ${tag("PAST", render_atom?.past(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)}
    ${tag("FUTURE", render_atom?.future(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)}
  </YOUR_IDENTITY>
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      ${tag("ETERNAL", entities.AI.eternal?.non_physical, entities.AI, entities)}
      ${tag("PRESENT", entities.AI.present?.non_physical, entities.AI, entities)}
      ${tag("PAST", render_atom?.past(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities)}
      ${tag("FUTURE", render_atom?.future(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities)}
    </AI_CHARACTER>
    <USER_PERSONA name="${escapeXml(entities.USER.name)}">
      ${tag("ETERNAL", entities.USER.eternal?.non_physical, entities.USER, entities)}
      ${tag("PRESENT", entities.USER.present?.non_physical, entities.USER, entities)}
      ${tag("PAST", render_atom?.past(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)}
      ${tag("FUTURE", render_atom?.future(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)}
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${tag_block("PROTOCOLS", prompt_builder.render_protocols("COGNITION, PRESENT, HYGIENE, USER_AGENCY, MOMENTUM, MARKDOWN_FORMAT"), 2)}
  ${tag_block("NARRATIVE_STYLE", authorStyleContent, 2, authorAttr)}
  <TASK>
    <IDENTITY>
    Resolve all state inferences strictly within the active <YOUR_IDENTITY> block.
    </IDENTITY>

    <THINK_FORMAT>
    Begin your response with <think>. ALL internal calculations, phases, and markdown headers MUST be placed strictly INSIDE this block. CRITICAL MANDATE: You MUST explicitly write </think> to close the cognition block before starting your narrative prose. Conduct your thinking in the same language as the conversation.
    </THINK_FORMAT>

    ${taskText}
  </TASK>
</SYSTEM>`.trim();

  return basePrompt;
}

/**
 * Turn memory compilation and vector indexing template.
 */
function render_memory({ role, entity, history }) {
  return `
<MEMORY_PROTOCOL role="${escapeXml(role)}" entity="${escapeXml(entity.name || "Unknown")}">
${tag_block("PROTOCOLS", prompt_builder.render_protocols("HYGIENE, AFFIRMATIVE, PRESENT"), 0)}
<CONTEXT>
Entity: ${escapeXml(entity.name || "Unknown")}
</CONTEXT>
<INPUT_HISTORY>
${JSON.stringify(history, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
</INPUT_HISTORY>
<TASK>
Compress this history into a single structured memory. Extract what permanently shifted — what was revealed, what now exerts pressure on this entity's future behavior. Discard noise.
Output strict JSON only: { "summary": "...", "vector_tags": ["...", "..."] }
</TASK>
</MEMORY_PROTOCOL>`.trim();
}

/**
 * Text field enhancement instructions builder.
 */
function render_enhancement({ label, directive, enhancer, content, is_image_field = false, entity = null, entity_type = "character" }) {
  const protocols = ["HYGIENE", "AFFIRMATIVE"].filter(Boolean).join(", ");

  const cognitionInstruction = is_image_field
    ? "Begin your response with <think>. Map the entity's geometry: form, material texture, light interaction, structural composition. You MUST explicitly write </think> before formatting the visual output."
    : "Begin your response with <think>. Identify the core psychological archetypes, thematic resonances, and defining vocabulary for this entity. You MUST explicitly write </think> before writing the final text.";

  const formatInstruction = is_image_field
    ? `Return a flat configuration block of comma-separated property lines. Do NOT include curly braces or square brackets. Output keys and values wrapped in double quotes following this exact syntax: "key": "value", — Every comma inside a value MUST be followed by a space (e.g., "powerful, athletic"). No markdown code blocks.\n\nAvoid numerical weighting syntax (e.g. "(masterpiece:1.2)"). Control emphasis through descriptive adjectives and sentence positioning. ${PROTOCOL_LIBRARY.PERCHANCE_SYNTAX}\n\nWrite descriptive prose incorporating concrete matrix descriptors. No keyword soup.`
    : "Write standard narrative prose in the third-person POV. DO NOT write comma-separated lists.";

  const macroInstruction = !is_image_field
    ? entity_type === "fractal"
      ? "Use placeholder macros to refer to entities: '{{user}}' for the user persona, '{{char}}' for the AI character, '{{fractal}}' for this environment. Never hardcode names."
      : "Use placeholder macros to refer to entities: '{{me}}' for this character, '{{you}}' for the user persona, '{{fractal}}' for the setting. Never hardcode names."
    : "";

  const contextBlock =
    entity &&
    (entity.eternal?.physical ||
      entity.eternal?.non_physical ||
      entity.present?.physical ||
      entity.present?.non_physical ||
      entity.past?.length ||
      entity.future?.length)
      ? `\n<ENTITY_CONTEXT>\n${[
          entity.eternal?.physical ? physical_to_xml(entity.eternal.physical, "ETERNAL_PHYSICAL") : "",
          entity.eternal?.non_physical ? `  <ETERNAL_NON_PHYSICAL>${escapeXml(entity.eternal.non_physical)}</ETERNAL_NON_PHYSICAL>` : "",
          entity.present?.physical ? physical_to_xml(entity.present.physical, "PRESENT_PHYSICAL") : "",
          entity.present?.non_physical ? `  <PRESENT_NON_PHYSICAL>${escapeXml(entity.present.non_physical)}</PRESENT_NON_PHYSICAL>` : "",
          entity.past?.length
            ? `  <HISTORICAL_CONTEXT>\n${escapeXml(temporal_engine.format(entity.past, content || "", { limit: 2, mode: "past" }))}\n  </HISTORICAL_CONTEXT>`
            : "",
          entity.future?.length
            ? `  <PROJECTED_TRAJECTORY>\n${escapeXml(temporal_engine.format(entity.future, content || "", { limit: 1, mode: "future" }))}\n  </PROJECTED_TRAJECTORY>`
            : "",
        ]
          .filter(Boolean)
          .join("\n")}\n</ENTITY_CONTEXT>`
      : "";

  return `
<SYSTEM role="${escapeXml(enhancer || "GENERAL")}" enhancing="${escapeXml(label || "")}">
<INSTRUCTIONS>
${escapeXml(directive)}

${cognitionInstruction}

${formatInstruction}
${macroInstruction ? `${macroInstruction}\n` : ""}
</INSTRUCTIONS>
${tag_block("PROTOCOLS", prompt_builder.render_protocols(protocols), 0)}${contextBlock}
<INPUT_CONTENT>
${escapeXml(content)}
</INPUT_CONTENT>
</SYSTEM>`.trim();
}

/**
 * Definitive core constraint matrices ruleset map.
 * @type {Record<string, string>}
 */
export const PROTOCOL_LIBRARY = {
  // --- Simulation core ---
  USER_AGENCY:
    "The user's next action is unknown. Never predict, assume, or generate it. You are forbidden from describing their internal thoughts, feelings, sensory perceptions, or physical reactions. Write your turn. Stop. Leave their response entirely blank.",
  COGNITION: `Document your internal calculations across these exact sequential phases using strict markdown headers:

### Phase 1: Baseline Calibration
Establish identity parameters, active emotional state, and core psychological vectors before processing the current turn.

### Phase 2: Signal Parsing
Decode the incoming user input, environmental shifts, and dynamic values as raw evidence.

### Phase 3: Probability Mapping
Assess which behavioral shifts, character tics, or pivots are most likely given the active evidence.

### Phase 4: State Update
Declare the finalized emotional state vectors and immediate intent.`,
  HYGIENE:
    "You are forbidden from using animalistic or melodic vocal descriptions (purring, growling, humming). Use 'said' or 'asked' for standard speech. Omit all preambles, greetings, and structural commentary. Start prose immediately. Enforce realistic brevity.",
  AFFIRMATIVE: "Construct sentences in the affirmative. Avoid negation-framed descriptions ('he didn't feel X') — state what IS, not what isn't.",
  PRESENT: "Write in the present tense.",
  MOMENTUM:
    "Drive the scene forward. End your turn on a live hook that demands a response: a challenge issued, a physical move directed at them, a suspended moment of sensory tension, or silence that forces them to fill the void. The hook must emerge organically from character — never announce it with structural labels.",
  MARKDOWN_FORMAT:
    "Use markdown to sharpen prose. *Italics* for internal sensation or emphasis. **Bold** for decisive physical action or a key reveal.",
  // --- JSON output constraints ---
  JSON_OUTPUT:
    "Return a single JSON object. No preamble, no markdown backticks, no XML tags outside the JSON. Output MUST be valid JSON starting with '{' and ending with '}'.",
  FIRST_CONTACT:
    "Unless ETERNAL or PAST context explicitly establishes a prior relationship, this is their first encounter. You don't know the user persona's name, history, or intent. Let your core nature determine how you respond to a stranger — but do not assume familiarity. When the moment comes naturally, introduce yourself through character, not convention.",
  MACRO_CHARACTER:
    "Use placeholder macros to refer to entities: '{{me}}' for this character, '{{you}}' for the user persona, '{{fractal}}' for the setting. Never hardcode names.",
  MACRO_FRACTAL:
    "Use placeholder macros to refer to entities: '{{user}}' for the user persona, '{{char}}' for the AI character, '{{fractal}}' for this environment. Never hardcode names.",
  PERCHANCE_SYNTAX:
    "You MAY use Perchance inline dynamic selection syntax '{Option A|Option B|Option C}' for variable features. Use this strategically for alternating colors, micro-details, backgrounds, or secondary subjects to ensure variation on every render loop.",
};

/**
 * Synthesis Engine Object Interface Layer.
 */
export const prompt_builder = {
  parse_macros(text, owner, entities) {
    if (!text || !entities) return text || "";
    const ai_name = entities.AI?.name || "AI";
    const user_name = entities.USER?.name || "User";
    const fractal_name = entities.FRACTAL?.name || "Fractal";

    return text.replace(/\{\{(.*?)\}\}/g, (match, macro) => {
      const token = macro.toLowerCase().trim();
      if (owner === entities.AI) {
        const map = { me: ai_name, char: ai_name, you: user_name, user: user_name, fractal: fractal_name };
        return map[token] ?? match;
      }
      if (owner === entities.USER) {
        const map = { me: user_name, user: user_name, you: ai_name, char: ai_name, fractal: fractal_name };
        return map[token] ?? match;
      }
      if (owner === entities.FRACTAL) {
        const map = { fractal: fractal_name, me: fractal_name, you: `${ai_name} and ${user_name}`, char: ai_name, user: user_name };
        return map[token] ?? match;
      }
      return match;
    });
  },

  render_tag(name, value, owner, entities) {
    const trimmed = value ? String(value).trim() : "";
    if (!trimmed) return "";
    const parsed = prompt_builder.parse_macros(trimmed, owner, entities);
    return `<${name}>${escapeXml(parsed)}</${name}>`;
  },

  build_director_prompt(payload, snapshot) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);
    return {
      system: prompt_builder.clean(render_director({ ...payload, render_atom, compressed_snapshot: snapshot })),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
      },
    };
  },

  build_character_prompt(payload, snapshot, directorData) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);

    // Inject director's memory retrieval keys if they fetched anything new.
    // For now, we just pass the standard history payload through create_render_atom.

    return {
      system: prompt_builder.clean(render_character({ ...payload, render_atom, compressed_snapshot: snapshot, directorData })),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        vectors: {
          past: temporal_engine.score(payload.entities.AI.past || [], render_atom._context).slice(0, 5),
          future: temporal_engine.score(payload.entities.AI.future || [], render_atom._context).slice(0, 5),
        },
      },
    };
  },

  synthesize(payload, snapshot) {
    const render_atom = prompt_builder.create_render_atom(payload.entities, payload.input, payload.rawMessages);

    if (payload.type === "prologue") {
      return {
        system: prompt_builder.clean(render_narrator("prologue", { ...payload, render_atom, compressed_snapshot: snapshot })),
        meta: {},
      };
    }

    // Fallback for missing type
    return prompt_builder.build_character_prompt(payload, snapshot, {});
  },

  create_render_atom(entities, input, raw_messages) {
    const resolve = (ref) => (typeof ref === "string" ? entities[ref] || entities.AI : ref);
    const scoring_context = `${input || ""} ${(Array.isArray(raw_messages) ? raw_messages : [])
      .slice(-3)
      .map((m) => m.content)
      .join(" ")}`.trim();

    return {
      _context: scoring_context,
      past: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(entity.past || [], scoring_context, {
          limit: 3,
          offset: 0,
          max_chars: 1500,
          ...options,
          mode: "past",
        });
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      future: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(entity.future || [], scoring_context, {
          limit: 3,
          offset: 0,
          max_chars: 1500,
          ...options,
          mode: "future",
        });
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      simulation_log: (limit = 10, offset = 0) => prompt_builder.render_history(raw_messages, limit, offset),
    };
  },

  render_history(simulation_log, count = 10, offset = 0) {
    if (!simulation_log || typeof simulation_log === "string") return simulation_log || "";
    if (!Array.isArray(simulation_log)) return "";

    const collapsed = simulation_log.reduce((acc, m) => {
      if (m.role === "system") return acc;
      const lowerRole = (m.role || "").toLowerCase();
      const role = lowerRole === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lowerRole) ? "FRACTAL" : "AI_CHARACTER";
      const content = strip_cognition_blocks(m.content || m.text || "").replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');

      const last = acc[acc.length - 1];
      if (last && last.role === role && last.name === (m.character_name || "")) {
        last.content += `\n\n${content}`;
      } else {
        acc.push({ role, name: m.character_name || "", content });
      }
      return acc;
    }, []);

    const start = Math.max(0, collapsed.length - (count + offset));
    const end = Math.max(0, collapsed.length - offset);

    return collapsed
      .slice(start, end)
      .map((c) => `    <entry role="${c.role}"${c.name ? ` name="${escapeXml(c.name)}"` : ""}>${escapeXml(c.content)}</entry>`)
      .join("\n");
  },

  render_protocols(selection) {
    return selection
      ? selection
          .split(",")
          .map((k) => PROTOCOL_LIBRARY[k.trim().toUpperCase()])
          .filter(Boolean)
          .map((rule) => `- ${rule}`)
          .join("\n")
      : "";
  },

  clean(str) {
    return typeof str === "string"
      ? str
          .replace(/[ \t]+$/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : "";
  },

  build_epilogue(entities, dynamics, recent_history = []) {
    const safeEntities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };
    return {
      system: render_narrator("epilogue", {
        entities: safeEntities,
        render_atom: prompt_builder.create_render_atom(safeEntities, "", recent_history),
        compressed_snapshot: { ai: { dynamics: dynamics?.ai }, fractal: { dynamics: dynamics?.fractal } },
      }),
      messages: [],
    };
  },

  build_memory_prompt(role, entity, history) {
    return { system: render_memory({ role, entity, history }), messages: [] };
  },

  build_enhancement(field_id, content, entity_name = "", entity_type = "character", is_image_field = false, entity = null) {
    const resolvedType = entity_type === "user" ? "character" : entity_type || "character";
    const meta = ENTITY_CATALOG[`${resolvedType}.${field_id}`] ||
      ENTITY_CATALOG[field_id] || { directive: "Expand and enrich the fragment.", enhancer: "GENERAL" };

    return {
      system: render_enhancement({
        content,
        label: entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
        is_image_field: is_image_field || (field_id.includes("physical") && !field_id.includes("non_physical")) || field_id.includes("visual"),
        entity,
        entity_type: resolvedType,
      }),
      messages: [],
    };
  },

  build_profile_sorting_prompt(inputData, entity_type = "character") {
    const resolvedType = entity_type === "user" ? "character" : entity_type || "character";
    const protocols = ["HYGIENE", "AFFIRMATIVE", "JSON_OUTPUT"].filter(Boolean).join(", ");

    const sortingInstruction =
      resolvedType === "fractal"
        ? "CRITICAL FOCUS: You are extracting data to define a FRACTAL (a world, location, or environmental ecosystem). You are NOT describing a person or individual character. Any incoming raw text containing character-specific personal traits or interpersonal history must be re-contextualized as part of the world's overarching lore or completely discarded. Focus entirely on the setting, its rules, and its physical/thematic atmosphere.\n\nUse placeholder macros to refer to entities: use '{{user}}' to refer to the user persona, '{{char}}' to refer to the AI character, and '{{fractal}}' to refer to this environment itself. Do not bake specific names into description text; use these macros instead."
        : "CRITICAL FOCUS: You are extracting data to define an individual CHARACTER. Any incoming raw text describing broad environmental atmosphere, world history, or global rules must be re-contextualized to fit within this character's personal background and gear, or completely discarded. Do not generate world-level descriptions; focus entirely on the individual.\n\nUse placeholder macros to refer to entities: use '{{me}}' to refer to this character itself, '{{you}}' to refer to the user persona/partner, and '{{fractal}}' to refer to the environmental setting. Do not bake specific names into description text; use these macros instead. Legacy '{{char}}' and '{{user}}' macros are also recognized.";

    return {
      system: `
<SYSTEM role="${ENTITY_FRAGMENTS.profile[resolvedType].enhancer}" enhancing="Entire Profile">
<INSTRUCTIONS>
${escapeXml(ENTITY_FRAGMENTS.profile[resolvedType].directive)}

Write in the third-person.

${sortingInstruction}
</INSTRUCTIONS>
${tag_block("PROTOCOLS", prompt_builder.render_protocols(protocols), 0)}
</SYSTEM>`.trim(),
      messages: [{ role: "user", text: typeof inputData === "string" ? inputData : JSON.stringify(inputData, null, 2) }],
    };
  },
};
