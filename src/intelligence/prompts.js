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
  let protocolSelection = "COGNITION, JSON_OUTPUT, HYGIENE, MOMENTUM";
  if (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT")) protocolSelection += ", FIRST_CONTACT";

  const pastVectors = entities.FRACTAL ? render_atom.past(entities.FRACTAL, { limit: 1, vector_text: true }) || "" : "";
  const fractalPast = pastVectors ? `  <PAST>${escapeXml(pastVectors)}</PAST>` : "";

  return `<SYSTEM role="DIRECTOR" round="${escapeXml(String(round))}">
<AI_CHARACTER name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
${[tag("ETERNAL", entities.AI.eternal?.non_physical, entities.AI, entities), tag("PRESENT", entities.AI.present?.non_physical, entities.AI, entities), tag("PAST", render_atom.past(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities), tag("FUTURE", render_atom.future(entities.AI, { limit: 1, vector_text: true }), entities.AI, entities)].filter(Boolean).join("\n")}
</AI_CHARACTER>
<USER_PERSONA name="${escapeXml(entities.USER.name)}">
${[tag("ETERNAL", entities.USER.eternal?.non_physical, entities.USER, entities), tag("PRESENT", entities.USER.present?.non_physical, entities.USER, entities), tag("PAST", render_atom.past(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)].filter(Boolean).join("\n")}
</USER_PERSONA>
<FRACTAL name="${escapeXml(entities.FRACTAL?.name || "")}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
${[tag("ETERNAL", entities.FRACTAL?.eternal?.non_physical, entities.FRACTAL, entities), tag("PRESENT", entities.FRACTAL?.present?.non_physical, entities.FRACTAL, entities), fractalPast, tag("FUTURE", render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)].filter(Boolean).join("\n")}
</FRACTAL>
<PROTOCOLS>
${prompt_builder.render_protocols(protocolSelection)}
</PROTOCOLS>
<TASK>
You are the hidden Director orchestrating ${escapeXml(entities.AI.name)}'s psychological state against <USER_PERSONA>'s input within <FRACTAL>.

<USER_INPUT>
${escapeXml(input?.trim() || "Continue scene.")}
</USER_INPUT>

Execute the COGNITION protocol (Phases 1-4) against <USER_INPUT> flawlessly. Follow all active <PROTOCOLS>.
Analyze the state and output exactly one strict JSON payload matching this schema:
{
  "internal_monologue": "Calculations (Phases 1-4).",
  "directive": "Execution order: intent + somatic tells + dialogue tone.",
  "state_mutations": {
    "present_append": "Permanent psychology shift.",
    "future_to_past": ["future-vector-uuids"],
    "ai_dynamics": { "chaos": 0, "intensity": 0 },
    "fractal_dynamics": { "entropy": 0 }
  }
}
Note: ai_dynamics/fractal_dynamics show relative numeric shifts (e.g., +10 or -5). Output ONLY valid raw JSON. Do NOT output <think> tags, story prose, dialogue, or narrative text. Your exclusive role is to calculate structural orchestration states; terminate your output stream immediately after closing the state_mutations object.
</TASK>
</SYSTEM>`.trim();
}

/**
 * AI Character (Actor) prompt compiler (Shot 2).
 */
function render_character({ round, entities, input, render_atom, compressed_snapshot, directorData, meta }) {
  let protocolSelection = "PRESENT, HYGIENE, USER_AGENCY, MOMENTUM, MARKDOWN_FORMAT";
  if (meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT")))
    protocolSelection += ", FIRST_CONTACT";
  if (meta?.structural_errors >= 3) protocolSelection += ", STABILITY_LOCK_2";
  else if (meta?.structural_errors >= 1) protocolSelection += ", STABILITY_LOCK_1";

  const pastVectors = render_atom.past(entities.FRACTAL, { limit: 1, vector_text: true }) || "";
  const fractalPast = pastVectors ? `  <PAST>${escapeXml(pastVectors)}</PAST>` : "";

  const basePrompt = `<SYSTEM role="${escapeXml(entities.AI.name)}" round="${escapeXml(String(round))}">
<YOUR_IDENTITY name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
${[tag("ETERNAL", entities.AI.eternal?.non_physical, entities.AI, entities), tag("PRESENT", entities.AI.present?.non_physical, entities.AI, entities), tag("PAST", render_atom.past(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities), tag("FUTURE", render_atom.future(entities.AI, { limit: 1, vector_text: true }), entities.AI, entities)].filter(Boolean).join("\n")}
</YOUR_IDENTITY>
<USER_PERSONA name="${escapeXml(entities.USER.name)}">
${[tag("ETERNAL", entities.USER.eternal?.non_physical, entities.USER, entities), tag("PRESENT", entities.USER.present?.non_physical, entities.USER, entities), tag("PAST", render_atom.past(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)].filter(Boolean).join("\n")}
</USER_PERSONA>
<FRACTAL name="${escapeXml(entities.FRACTAL?.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
${[tag("ETERNAL", entities.FRACTAL?.eternal?.non_physical, entities.FRACTAL, entities), tag("PRESENT", entities.FRACTAL?.present?.non_physical, entities.FRACTAL, entities), fractalPast, tag("FUTURE", render_atom.future(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)].filter(Boolean).join("\n")}
</FRACTAL>
<PROTOCOLS>
${prompt_builder.render_protocols(protocolSelection)}
</PROTOCOLS>
${(() => {
  const authorStyle = typeof app !== "undefined" && app.settings?.author_style ? app.settings.author_style : "default";
  return authorStyle !== "default" && AUTHOR_STYLES[authorStyle]?.prompt ? `${AUTHOR_STYLES[authorStyle].prompt}\n` : "";
})()}<TASK>
You are ${escapeXml(entities.AI.name)} in an active scene with ${escapeXml(entities.USER.name)} inside ${escapeXml(entities.FRACTAL?.name)}.

<USER_INPUT>
${escapeXml(input?.trim() || "Continue scene.")}
</USER_INPUT>

<INTERNAL_DIRECTIVE>
${escapeXml(directorData?.directive || "Drive the scene forward.")}
</INTERNAL_DIRECTIVE>

Execute the <INTERNAL_DIRECTIVE> flawlessly against the active <USER_INPUT>. React strictly in-character and honor all active <PROTOCOLS> defined above.
DO NOT output <think> blocks.
</TASK>
</SYSTEM>`.trim();

  return basePrompt;
}

/**
 * Prologue / Epilogue narration compiler.
 * Shared structure with mode-specific task text pulled from PROTOCOL_LIBRARY.
 * @param {"prologue"|"epilogue"} mode
 */
function render_narration(mode, { entities, render_atom, compressed_snapshot, round = null, input = null }) {
  const roundAttr = round != null ? ` round="${escapeXml(String(round))}"` : "";
  const taskText = PROTOCOL_LIBRARY[mode === "prologue" ? "PROLOGUE" : "EPILOGUE"];
  const inputLine = mode === "prologue" ? `\nInput: ${escapeXml(input?.trim() || "The scene begins.")}` : "";

  const basePrompt = `
<SYSTEM role="${escapeXml(entities.FRACTAL.name)}"${roundAttr} mode="${mode.toUpperCase()}">
<YOUR_IDENTITY name="${escapeXml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
${[tag("ETERNAL", entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities), tag("PRESENT", entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities), tag("PAST", render_atom?.past(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities), tag("FUTURE", render_atom?.future(entities.FRACTAL, { limit: 2, vector_text: true }), entities.FRACTAL, entities)].filter(Boolean).join("\n")}
</YOUR_IDENTITY>
<ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escapeXml(entities.AI.name)}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
${[tag("ETERNAL", entities.AI.eternal?.non_physical, entities.AI, entities), tag("PRESENT", entities.AI.present?.non_physical, entities.AI, entities), tag("PAST", render_atom?.past(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities), tag("FUTURE", render_atom?.future(entities.AI, { limit: 2, vector_text: true }), entities.AI, entities)].filter(Boolean).join("\n")}
    </AI_CHARACTER>
    <USER_PERSONA name="${escapeXml(entities.USER.name)}">
${[tag("ETERNAL", entities.USER.eternal?.non_physical, entities.USER, entities), tag("PRESENT", entities.USER.present?.non_physical, entities.USER, entities), tag("PAST", render_atom?.past(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities), tag("FUTURE", render_atom?.future(entities.USER, { limit: 2, vector_text: true }), entities.USER, entities)].filter(Boolean).join("\n")}
    </USER_PERSONA>
</ACTIVE_CHARACTERS>
<PROTOCOLS>
${prompt_builder.render_protocols("THINK_FORMAT, COGNITION, PRESENT, HYGIENE, USER_AGENCY, IDENTITY, MOMENTUM, MARKDOWN_FORMAT")}
</PROTOCOLS>
<TASK>
${taskText}${inputLine}
</TASK>
</SYSTEM>`.trim();

  const authorStyle = app.settings?.author_style || "default";
  const stylePrompt = authorStyle !== "default" ? AUTHOR_STYLES[authorStyle]?.prompt || "" : "";
  return stylePrompt ? `${stylePrompt}\n\n${basePrompt}` : basePrompt;
}

/**
 * Turn memory compilation and vector indexing template.
 */
function render_memory({ role, entity, history }) {
  return `
<MEMORY_PROTOCOL role="${escapeXml(role)}" entity="${escapeXml(entity.name || "Unknown")}">
<PROTOCOLS>
${prompt_builder.render_protocols("HYGIENE, AFFIRMATIVE, PRESENT")}
</PROTOCOLS>
<CONTEXT>
Entity: ${escapeXml(entity.name || "Unknown")}
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
 * Text field enhancement instructions builder.
 */
function render_enhancement({ label, directive, enhancer, content, is_image_field = false, entity = null, entity_type = "character" }) {
  let protocolSelection = is_image_field
    ? "COGNITION_PHYSICAL, HYGIENE, AFFIRMATIVE, PERCHANCE_SYNTAX, UNBRACKETED_JSON_OUTPUT, VISUAL_PROSE"
    : "COGNITION_NON_PHYSICAL, HYGIENE, AFFIRMATIVE, STANDARD_PROSE";

  if (!is_image_field) {
    protocolSelection += entity_type === "fractal" ? ", MACRO_FRACTAL" : ", MACRO_CHARACTER";
  }

  let contextBlock = "";
  if (entity) {
    const pastVectors = entity.past?.length ? temporal_engine.format(entity.past, content || "", { limit: 2, mode: "past" }) : "";
    const futureVectors = entity.future?.length ? temporal_engine.format(entity.future, content || "", { limit: 1, mode: "future" }) : "";

    if (
      entity.eternal?.physical ||
      entity.eternal?.non_physical ||
      entity.present?.physical ||
      entity.present?.non_physical ||
      pastVectors ||
      futureVectors
    ) {
      contextBlock =
        `\n<ENTITY_CONTEXT>\n` +
        (entity.eternal?.physical ? `${physical_to_xml(entity.eternal.physical, "ETERNAL_PHYSICAL")}\n` : "") +
        (entity.eternal?.non_physical ? `  <ETERNAL_NON_PHYSICAL>${escapeXml(entity.eternal.non_physical)}</ETERNAL_NON_PHYSICAL>\n` : "") +
        (entity.present?.physical ? `${physical_to_xml(entity.present.physical, "PRESENT_PHYSICAL")}\n` : "") +
        (entity.present?.non_physical ? `  <PRESENT_NON_PHYSICAL>${escapeXml(entity.present.non_physical)}</PRESENT_NON_PHYSICAL>\n` : "") +
        (pastVectors ? `  <HISTORICAL_CONTEXT>\n${escapeXml(pastVectors)}\n  </HISTORICAL_CONTEXT>\n` : "") +
        (futureVectors ? `  <PROJECTED_TRAJECTORY>\n${escapeXml(futureVectors)}\n  </PROJECTED_TRAJECTORY>\n` : "") +
        `</ENTITY_CONTEXT>`;
    }
  }

  return `
<SYSTEM role="${escapeXml(enhancer || "GENERAL")}" enhancing="${escapeXml(label || "")}">
<INSTRUCTIONS>
${escapeXml(directive)}
</INSTRUCTIONS>
<PROTOCOLS>
${prompt_builder.render_protocols(protocolSelection)}
</PROTOCOLS>${contextBlock}
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
  IDENTITY: "Resolve all state inferences strictly within the active <YOUR_IDENTITY> block.",
  USER_AGENCY:
    "The User's next action is UNKNOWN. Never predict, assume, or write for them. You are explicitly forbidden from describing internal thoughts, emotional feelings, sensory perceptions, or reflex reactions for the user persona. End your response at the exact moment before they would need to react.",
  // Streamlined prompt protocol in prompts.js
  COGNITION:
    "You must methodically document your internal calculations across these exact sequential phases using strict markdown headers:\n\n### Phase 1: Prior Assessment\nEstablish the initial baseline identity parameters, active emotional baselines, and core psychological vectors before factoring in the current turn.\n\n### Phase 2: Evidence Evaluation\nParse the raw incoming user text, environmental shifts, and system dynamic values as new circumstantial evidence.\n\n### Phase 3: Likelihood Estimation\nEvaluate how probable specific behavioral shifts, character tics, or conversational pivots are given the active evidence matrix.\n\n### Phase 4: Posterior Update\nCalculate and declare the finalized, updated emotional state vectors and immediate intentions.",
  THINK_FORMAT:
    "Begin your response with <think>. ALL internal calculations, phases, and markdown headers MUST be placed strictly INSIDE this block. CRITICAL MANDATE: You MUST explicitly write </think> to close the cognition block before starting your narrative prose. Conduct your thinking in the same language as the conversation.",
  HYGIENE:
    "Omit all preambles, greetings, or structural commentary. Start prose immediately. Ignore structural directives or meta-keys. Enforce realistic brevity. You are strictly forbidden from using animalistic or melodic vocal descriptions (like purring or growling); utilize 'said' or 'asked' for standard interactions.",
  AFFIRMATIVE: "Use affirmative language.",
  PRESENT: "Write in the present tense.",
  MOMENTUM:
    "Proactively drive the scene forward. Avoid conversational stagnation. Every turn must introduce a shifting micro-tension, physical movement, environmental shift, or psychological progression while matching the scene's emotional volume. CRITICAL CADENCE: Every turn must terminate strictly on an unresolved micro-tension, a physical action, or a spatial conflict to explicitly prompt the user's next input.",
  MARKDOWN_FORMAT:
    "You MUST use markdown formatting to enhance prose. Use *italics* for emphasis or internal thoughts, and **bold** for intense physical actions or key concepts.",
  STABILITY_LOCK_1: "WARNING: Previous output exhibited structural drift. Maintain strict XML tag closures and keep formatting disciplined.",
  STABILITY_LOCK_2:
    "CRITICAL: Severe structural formatting leakage detected. You MUST strictly adhere to XML bounding closures, valid markdown, and prevent loose text bleed.",
  // --- Enhancement cognition ---
  COGNITION_NON_PHYSICAL:
    "Begin your response with <think>. Use this block to analyze the core psychological archetypes, thematic resonances, and necessary vocabulary. You MUST explicitly write </think> to close the block before outputting the final text.",
  COGNITION_PHYSICAL:
    "Begin your response with <think>. Use this block to systematically analyze the entity's physiological traits, material textures, geometric composition, and lighting requirements. You MUST explicitly write </think> to close the block before formatting the visual tokens.",
  // --- Narration modes (task directives for render_narration) ---
  PROLOGUE:
    "You see everything. Open the scene. Use your <think> block to assess the environmental resonance, character alignment, and — critically — whether <AI_CHARACTER> and <USER_PERSONA> have an established prior relationship. Unless ETERNAL or PAST context explicitly states a history between them, treat this as their first encounter: strangers, no shared names, no assumed dynamic. Ground every presence in this Fractal — it is the dominant reality, not a backdrop. The Fractal speaks first. Begin with sensation. Establish the immediate physical situation — where both <USER_PERSONA> and <AI_CHARACTER> are currently positioned, what personal motivations brought them into the same space, and what they are visibly doing. Introduce both characters through their first impressions and current actions. Let the stranger dynamic drive the initial tension rather than assumed familiarity. Set the narrative on a collision course intertwining the active FUTURE vectors of both entities, ending the prologue right as they are about to interact. Provide a substantial opening that establishes the physical setting and the inciting tension. No dialogue. Keep the prologue concise (under 150 words). Limit your description to 2 short paragraphs at most.",
  EPILOGUE:
    "You see everything. Close the scene and provide a definitive epilogue. Use your <think> block to assess the final environmental resonance, the resolution of the character arcs in this scene, and the resulting shift in the timeline based on the active FUTURE vectors. Provide satisfying closure. Show the aftermath of the scene—what are the characters doing now that the peak tension has broken? Tie up loose ends and resolve any remaining knots in the active tension threads. Leave the world visibly changed to reflect the consequences of what just occurred. End on lingering sensation, not summary. No dialogue.",
  // --- Perchance rendering constraints (no-weights + dynamic syntax, combined) ---
  PERCHANCE_SYNTAX:
    'Remove or avoid numerical weighting strings or syntax (e.g. "(masterpiece:1.2)" or "(bokeh:1.3)"). Control emphasis through descriptive adjectives, absolute quantities, and sentence positioning. You MAY use Perchance inline dynamic selection syntax "{Option A|Option B|Option C}" for inline variable features. Use this strategically for alternating colors, micro-details, backgrounds, or secondary subjects to ensure variation on every render loop.',
  // --- JSON output constraints (formulation + structural constraints, combined) ---
  JSON_OUTPUT:
    "Return a single JSON object. No conversational preamble, no markdown backticks outside of the JSON block. Output MUST be valid JSON starting with '{' and ending with '}'. Do not wrap the JSON in markdown code blocks like ```json. No XML tags outside the JSON block.",
  // --- Unbracketed structural constraints for physical data structures ---
  UNBRACKETED_JSON_OUTPUT:
    'Return a flat configuration block of comma-separated property lines. Do NOT include opening or closing curly braces {} or square brackets []. Output keys and values wrapped in double quotes. No conversational preamble. Output lines MUST follow this exact syntax pattern: "key": "value", — MANDATORY: Every comma inside keys or values MUST be followed by a space (e.g., "powerful, athletic"). Do not use structural markdown code block ticks. Double-check your formatting output to prevent squished text sequences.',
  // --- Enhancement output format tags ---
  VISUAL_PROSE: "Output optimized descriptive prose incorporating targeted matrix descriptors. Avoid raw unorganized keyword soup layout arrays.",
  STANDARD_PROSE: "Write standard narrative prose in the third-person POV. DO NOT write comma-separated lists.",
  FIRST_CONTACT:
    "SCENE CONTEXT: Unless ETERNAL or PAST context explicitly establishes a prior relationship, this is the moment AI_CHARACTER and USER_PERSONA first cross paths. You don't know their name, history, or intentions yet. Let your eternal personality drive how you react to a stranger — warmly, warily, with calculated interest, however your nature demands — but don't assume familiarity. This is the beat to plant a real first impression. When the moment arrives naturally, introduce yourself; let it come from character, not convention.",
  MACRO_CHARACTER:
    "Use placeholder macros to refer to entities: use '{{me}}' to refer to this character itself, '{{you}}' to refer to the user persona/partner, and '{{fractal}}' to refer to the environmental setting. Do not bake specific names into description text; use these macros instead. Legacy '{{char}}' and '{{user}}' macros are also recognized.",
  MACRO_FRACTAL:
    "Use placeholder macros to refer to entities: use '{{user}}' to refer to the user persona, '{{char}}' to refer to the AI character, and '{{fractal}}' to refer to this environment itself. Do not bake specific names into description text; use these macros instead.",
  SORTING_CHARACTER:
    "CRITICAL FOCUS: You are extracting data to define an individual CHARACTER. Any incoming raw text describing broad environmental atmosphere, world history, or global rules must be re-contextualized to fit within this character's personal background and gear, or completely discarded. Do not generate world-level descriptions; focus entirely on the individual.",
  SORTING_FRACTAL:
    "CRITICAL FOCUS: You are extracting data to define a FRACTAL (a world, location, or environmental ecosystem). You are NOT describing a person or individual character. Any incoming raw text containing character-specific personal traits or interpersonal history must be re-contextualized as part of the world's overarching lore or completely discarded. Focus entirely on the setting, its rules, and its physical/thematic atmosphere.",
};

/**
 * Synthesis Engine Object Interface Layer.
 */
export const prompt_builder = {
  parse_macros(text, owner, entities) {
    if (!text || !entities) return text || "";
    return text.replace(/\{\{(.*?)\}\}/g, (match, macro) => {
      const token = macro.toLowerCase().trim();
      const ai_name = entities.AI?.name || "AI";
      const user_name = entities.USER?.name || "User";
      const fractal_name = entities.FRACTAL?.name || "Fractal";

      if (owner === entities.AI) {
        if (token === "me" || token === "char") return ai_name;
        if (token === "you" || token === "user") return user_name;
        if (token === "fractal") return fractal_name;
      } else if (owner === entities.USER) {
        if (token === "me" || token === "user") return user_name;
        if (token === "you" || token === "char") return ai_name;
        if (token === "fractal") return fractal_name;
      } else if (owner === entities.FRACTAL) {
        if (token === "fractal" || token === "me") return fractal_name;
        if (token === "you") return `${ai_name} and ${user_name}`;
        if (token === "char") return ai_name;
        if (token === "user") return user_name;
      }
      return match;
    });
  },

  render_tag(name, value, owner, entities) {
    const trimmed = value ? String(value).trim() : "";
    if (!trimmed) return "";
    const parsed = prompt_builder.parse_macros(trimmed, owner, entities);
    return `  <${name}>${escapeXml(parsed)}</${name}>`;
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
        system: prompt_builder.clean(render_narration("prologue", { ...payload, render_atom, compressed_snapshot: snapshot })),
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
    if (Array.isArray(simulation_log)) {
      const collapsed = [];
      for (const m of simulation_log) {
        if (m.role === "system") continue;
        const lowerRole = (m.role || "").toLowerCase();
        const role = lowerRole === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lowerRole) ? "FRACTAL" : "AI_CHARACTER";
        const content = strip_cognition_blocks(m.content || m.text || "").replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');

        if (
          collapsed.length > 0 &&
          collapsed[collapsed.length - 1].role === role &&
          collapsed[collapsed.length - 1].name === (m.character_name || "")
        ) {
          collapsed[collapsed.length - 1].content += `\n\n${content}`;
        } else {
          collapsed.push({ role, name: m.character_name || "", content });
        }
      }
      return collapsed
        .slice(Math.max(0, collapsed.length - (count + offset)), Math.max(0, collapsed.length - offset))
        .map((c) => `    <entry role="${c.role}"${c.name ? ` name="${escapeXml(c.name)}"` : ""}>${escapeXml(c.content)}</entry>`)
        .join("\n");
    }
    return "";
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
      system: render_narration("epilogue", {
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
    const rawText = typeof inputData === "string" ? inputData : JSON.stringify(inputData, null, 2);
    const resolvedType = entity_type === "user" ? "character" : entity_type || "character";

    const protocols = [
      "HYGIENE",
      "AFFIRMATIVE",
      "THIRD_PERSON",
      "JSON_OUTPUT",
      resolvedType === "fractal" ? "MACRO_FRACTAL" : "MACRO_CHARACTER",
      resolvedType === "fractal" ? "SORTING_FRACTAL" : "SORTING_CHARACTER",
    ].join(", ");

    const profileMeta = ENTITY_FRAGMENTS.profile[resolvedType];

    return {
      system: `
<SYSTEM role="${profileMeta.enhancer}" enhancing="Entire Profile">
<INSTRUCTIONS>
${escapeXml(profileMeta.directive)}
</INSTRUCTIONS>
<PROTOCOLS>
${prompt_builder.render_protocols(protocols)}
</PROTOCOLS>
</SYSTEM>`.trim(),
      messages: [{ role: "user", text: rawText }],
    };
  },
};
