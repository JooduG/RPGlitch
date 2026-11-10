/**
 * src/engine/prompts.js
 * ============================================================================
 * 📜 THE UNIFIED PROMPT PIPELINE & 4 PURPOSE CORES
 * ============================================================================
 *
 * Implements the invariant 11-block Spatial State Spine and the 4 canonical
 * Purpose Cores (DIRECTOR_CORE, CHARACTER_CORE, CARETAKER_CORE, VISUALIZER_CORE).
 *
 * Blocks 1-10: Invariant Spatial Spine (World truths, participants, scenario,
 * trajectory, and unified history).
 * Block 11: Swappable Purpose Core (Execution posture, directives, format).
 *
 * Ordering Invariant:
 * Block 6 & 7: <TRAJECTORY>
 * Block 8, 9 & 10: Unified <HISTORY> (<MEMORIES>...</MEMORIES><RECENT>...</RECENT></HISTORY>)
 * Block 11: <TASK>
 * ============================================================================
 */

import { format_clean_brackets } from "../storage/parser.js";
import { ENHANCER_DIRECTIVES } from "../definitions/profile-taxonomy.js";
import { DYNAMICS, TEMPO_ROUNDS } from "../config.js";

/**
 * Renders the thinking mode requirements block (Character Immersion vs. Pure Analysis).
 * Follows DeepSeek thinking mode specifications while escaping XML tags for verifier safety.
 *
 * @param {object} options
 * @param {"immersion" | "analysis"} options.mode
 * @param {string} [options.lens=""] - Domain-specific focus points
 * @param {number} [options.max_words=120] - Target word count budget for the reasoning process
 * @param {boolean} [options.pivot_pov=false] - Whether to enforce 1st-to-3rd person pivot at \</think\>
 * @returns {string} Formatted markdown/text directives for <TASK>
 */
export function render_thinking_mode({ mode = "analysis", lens = "", max_words = 120, pivot_pov = false } = {}) {
  if (mode === "immersion") {
    const pov_rule = pivot_pov
      ? "\n    4. **Perspective Pivot**: Close \\</think\\> before narrative prose. Pivot immediately to third-person perspective ('he', 'she', 'they') for all narrative prose; never voice first-person pronouns ('I', 'me') outside \\</think\\>."
      : "\n    4. **Boundary**: Close \\</think\\> before narrative prose. Never emit visible prose inside \\<think\\> tags.";

    return `    ### Thinking Mode
    [Role Immersion Requirement] In your thinking process (inside \\<think\\> tags, under ~${max_words} words):
    1. **Inner Monologue**: Write raw first-person thoughts inside parentheses, e.g. "(He's stalling—keep your hand near the latch.)" without any label prefix.
    2. **Appraise, Do Not Restate**: Treat any opening stage direction inside \\<think\\> as already understood—never repeat or paraphrase it. Immediately appraise the counterpart's hidden motives, internal friction, and emotional subtext in first person ("I feel...", "I suspect...", "I won't let on...").
    3. **Smallest Observable Action**: Commit to one concrete physical tell, involuntary reaction, or sensory shift that embodies your stance. Never pre-draft spoken dialogue.${pov_rule}`;
  }

  const lens_lines = lens ? `\n    Focus your analysis strictly on:\n${lens}` : "";

  return `    ### Thinking Mode
    [Thinking Mode Requirement] In your thinking process (inside \\<think\\> tags, under ~${max_words} words):
    1. **Direct Reasoning**: Do NOT use parentheses for inner monologue; present all reasoning directly and objectively.
    2. **Analytical Tone**: Do NOT use first-person emotional narration like "I think" or "I feel".
    3. **Pure Analysis**: Focus purely on logical scenario analysis, causality, and response planning; no roleplay-style inner acting.${lens_lines}
    4. **Boundary**: Close \\</think\\> before output. Never emit visible content inside \\<think\\> tags.`;
}

/**
 * Co-located Purpose Core Definitions.
 * Each core bundles its identity, Epistemic Wall visibility, startWith token, opening line, and task block.
 */
export const PURPOSE_CORES = Object.freeze({
  DIRECTOR: {
    identity: "director",
    see_hidden: "all",
    start_with: () => "<think>\n",
    resolve_identity_text: () => "You are the Director orchestrating simulation mechanics and staging.",
    task_block: (context) => {
      const round_attr = context?.round !== undefined ? ` round="${context.round}"` : "";
      const thinking_block = render_thinking_mode({
        mode: "analysis",
        max_words: 80,
        lens: `    - Causality & stakes: evaluate recent physical actions and participant hazards
    - Dynamics deltas & tension: calibrate numerical tension shifts
    - Speaker routing & staging: determine who speaks next and frame the next beat`,
      });

      return `  <TASK${round_attr}>
${thinking_block}

    ### Dynamics deltas *(\`dynamics_deltas\`)*
    - Signed integer adjustments *(base meters live on ${DYNAMICS.SCALE.MIN}-${DYNAMICS.SCALE.MAX}, clipped to ${DYNAMICS.DELTA.CLIP})*.
    - Standard turn shift: **${DYNAMICS.DELTA.STANDARD}**
    - Dramatic turn shift: **${DYNAMICS.DELTA.EXTREME}**
    - Calibrate integer deltas for narrative tension; avoid extreme swings.

    ### Next Action *(\`next_action\`)*
    - Active scene speaker: select one literal enum: \`MAIN_CHARACTER\`, \`SCENARIO\`, or \`OTHER_CHARACTERS\`.
    - Story climax/resolution:
      - Emit "EPILOGUE_CONCLUDED" when the scene reaches a conclusive win/resolution.
      - Emit "EPILOGUE_COLLAPSED" on fatal trauma or irreversible failure.

    <OUTPUT_FORMAT mode="json">
      {
        "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0, "velocity": 0, "entropy": 0 },
        "next_action": "MAIN_CHARACTER | SCENARIO | OTHER_CHARACTERS | EPILOGUE_COLLAPSED | EPILOGUE_CONCLUDED",
        "directors_note": "Scene guidance delivered to the above next_action",
        "camera_note": "Cinematically frame physical posture, lighting, and camera angle for visual synthesis"
      }
    </OUTPUT_FORMAT>

    > [!IMPORTANT]
    > Output **MUST** start with { and end with }.
    > Output **MUST** be json.
  </TASK>`;
    },
  },

  CARETAKER: {
    identity: "caretaker",
    see_hidden: "all",
    start_with: () => "<think>\n",
    resolve_identity_text: (context) =>
      `You are the Continuum Caretaker for target entity "${context.target_name}". Organize temporal state into canonical profile brackets.`,
    task_block: (context) => {
      const is_fractal = context?.target_type === "fractal";
      const phys_dir = is_fractal ? ENHANCER_DIRECTIVES.SPATIAL_RENDERER : ENHANCER_DIRECTIVES.BIOMETRIC_RENDERER;
      const non_phys_dir = is_fractal ? ENHANCER_DIRECTIVES.METAPHYSICAL_ARCHITECT : ENHANCER_DIRECTIVES.COGNITIVE_ARCHITECT;
      const pres_phys_dir = is_fractal ? ENHANCER_DIRECTIVES.ATMOSPHERIC_TRACKER : ENHANCER_DIRECTIVES.SOMATIC_TRACKER;
      const pres_non_phys_dir = is_fractal ? ENHANCER_DIRECTIVES.ECOSYSTEM_ANALYZER : ENHANCER_DIRECTIVES.TACTICAL_ANALYZER;

      const input_block = context?.input_data ? `\n  <INPUT kind="ingestion">\n${context.input_data}\n  </INPUT>\n` : "";
      const round_attr = context?.round !== undefined ? ` round="${context.round}"` : "";

      const thinking_block = render_thinking_mode({
        mode: "analysis",
        max_words: 120,
        lens: `    - Entity change delta: identify what physical, emotional, or agenda state evolved
    - Temporal quadrant routing: map facts to eternal, present, future, or past
    - Bracket precision: preserve existing keys, delete cleared states via [KEY: none], ensure @TARGET syntax`,
      });

      return `  <TASK${round_attr}>
${thinking_block}

    ### Directives
    - **Eternal Baseline (\`eternal_physical\`, \`eternal_non_physical\`)**:
      - Physical: ${phys_dir}
      - Non-Physical: ${non_phys_dir}
      - Leave empty \`""\` unless establishing baseline lore or an irreversible transformation occurred.
    - **Present State (\`present_physical\`, \`present_non_physical\`)**:
      - Physical: ${pres_phys_dir}
      - Non-Physical: ${pres_non_phys_dir}
    - **Future Agenda (\`future\`)**: ${ENHANCER_DIRECTIVES.TRAJECTORY_SIMULATOR}
    - **Past Memories (\`past\`)**: ${ENHANCER_DIRECTIVES.PAST_COMPILER}
    - **Delta-Only Principle**: Emit ONLY non-empty \`"[KEY: value]"\` strings for fields being established, updated, or polished; leave all other fields empty \`""\`.

    ### Bracket Mutation Rules
    - Multiple brackets are supported per field separated by commas (e.g. \`[CHEST: bare], [MOOD: alert]\`).
    - Matching keys cleanly overwrite existing state (e.g. \`[CHEST: bare]\` replaces \`[CHEST: shirt]\`).
    - Use \`[KEY: cleared]\` or \`[KEY: none]\` to delete an established state.
    - Relational dynamics targeting other entities must use \`@\` (e.g. \`[@TARGET: dynamic | flags]\`).
    - Optional flags: \`| hide\` for covert facts, \`| w: 1-10\` for emotional weight/significance (e.g. \`[TRAUMA: betrayed by mentor | w: 9]\`).

    ---

    <OUTPUT_FORMAT mode="json">
      {
        "eternal_physical": "[KEY: value]",
        "eternal_non_physical": "[KEY: value]",
        "present_physical": "[KEY: value]",
        "present_non_physical": "[KEY: value]",
        "future": "[KEY: value]",
        "past": "[KEY: value]"
      }
    </OUTPUT_FORMAT>${input_block}
    > [!IMPORTANT]
    > No conversational preamble, no markdown code fence backticks, no trailing comments.
    > Output MUST start with { and end with }.
  </TASK>`;
    },
  },

  CHARACTER: {
    identity: "character",
    see_hidden: "own",
    start_with: (context) => {
      const is_character = context?.is_character ?? true;
      const note = context?.directors_note ? String(context.directors_note).trim() : "";

      if (is_character) {
        if (note) {
          return `<think>${note}\n(`;
        }
        return "<think>\n(";
      }
      if (note) {
        return `<think>${note}\n`;
      }
      return "<think>\n";
    },
    resolve_identity_text: (context) =>
      `You are ${context.speaker_name}, the main character of ${context.fractal_name}. ${context.listener_name} is also here.`,
    task_block: (context) => {
      const tempo = context?.turn_tempo || 2;
      const is_first_person = context?.is_character && context?.pov === "1st_person";
      const is_character = context?.is_character ?? true;
      const round_attr = context?.round !== undefined ? ` round="${context.round}"` : "";

      const perspective_rule = is_first_person
        ? "Maintain strict **first-person** perspective *('I', 'me', 'my')* anchored to your own sensory experience. Never speak, script, or dictate actions for anyone else."
        : "Maintain strict **third-person** perspective anchored to your own identity. Never speak, script, or dictate actions for anyone else.";

      const thinking_block = is_character
        ? render_thinking_mode({
            mode: "immersion",
            max_words: 120,
            pivot_pov: !is_first_person,
          })
        : render_thinking_mode({
            mode: "analysis",
            max_words: 80,
            lens: `    - Physical causality & spatial resistance: how the environment shifts or obstructs
    - Atmospheric shift & environmental reaction: weather, ambient lighting, sensory pressure
    - Sensory hook for protagonist agency: leave an unanswered sensory clue or physical affordance`,
          });

      return `  <TASK${round_attr}>
    ### Pacing & Posture
    - Write in **present tense**.
    - Deliver crisp, grounded interaction calibrated to a tempo of **${tempo} beat(s)**.
    - ${perspective_rule}

${thinking_block}
  </TASK>`;
    },
  },

  VISUALIZER: {
    identity: "visualizer",
    see_hidden: "none",
    start_with: () => "<think>\n",
    resolve_identity_text: () => "You are the Sensory Cortex synthesizing visual staging and descriptive optics.",
    task_block: (context) => {
      const raw_note = typeof context === "string" ? context : context?.camera_note;
      const camera_note = raw_note ? String(raw_note).trim() : "";
      const aesthetic_direction = camera_note
        ? `\n    ### Aesthetic Direction\n    Anchor the visual staging to the following camera note and aesthetic style:\n    - "${camera_note}"\n`
        : "";

      const subject_kind = context?.subject_kind || "character";
      const is_place = subject_kind === "place";
      const round_attr = context?.round !== undefined ? ` round="${context.round}"` : "";

      const focal_instruction = is_place
        ? "1. **Focal Subject & Environment**: The location and environment itself is the primary focal subject. Keep the scene devoid of people, characters, or human figures unless the camera note explicitly names one."
        : "1. **Focal Subject & Pose**: Primary subject, active physical posture, and concrete expression.";

      const synthesis_focal_directive = is_place
        ? "    - **Place Staging Mandate**: Emphasize architectural geometry, atmospheric depth, environmental textures, and weather/lighting. Do NOT place characters or human figures in frame unless explicitly requested in the camera note."
        : "    - **First Sentence Mandate**: Immediately establish the focal subject and primary setting.";

      const thinking_block = render_thinking_mode({
        mode: "analysis",
        max_words: 120,
        lens: `    - ${focal_instruction}
    - Spatial Depth & Geometry: foreground, midground, background, and camera perspective
    - Lighting & Luminary Sources: key light source, shadow falloff, color palette
    - Attire & Textures: fabric materials, physical surfaces, and visible details`,
      });

      return `  <TASK${round_attr}>
${thinking_block}
${aesthetic_direction}
    ### Prompt Synthesis
    Synthesize an evocative, photographic or artistic description in natural prose:
${synthesis_focal_directive}
    - **Sensory Optics & Textures**: Focus on physical surfaces, fabric drape, skin texture, and concrete light sources. Avoid empty buzzwords ('photorealistic', 'hyperrealistic', 'trending on artstation').
    - **Weight Discipline**: Never emit numeric weight math ('(word:1.3)', '[word:0.5]'). Emphasize through descriptive vocabulary and attenuation ('subtle', 'intense', 'faint').
    - **Affirmative Description**: Describe what IS visible in frame ('softly moonlit room' instead of 'no daylight').
    - **Signature Anchor Fidelity**: Preserve declared hair color, eye color, scars, and signature accents from the character sheet. Never allow environmental lighting to recolor established traits.
    - **Filter Discipline**: Focus strictly on visible exterior details. Omit internal thoughts, psychological traits, and inventory items.

    ### Negative Prompt
    Confine negative constraints strictly to global artifacts in \`negative_prompt\`. Start with standard quality anchors ("blurry, low quality, distorted, bad anatomy, bad hands, missing fingers, text, watermark") and append scene-specific opposites (e.g., "modern, cars" for a fantasy setting).

    ---

    <OUTPUT_FORMAT mode="json">
      {
        "prompt": "",
        "negative_prompt": ""
      }
    </OUTPUT_FORMAT>

    > [!IMPORTANT]
    > Emit strictly clean JSON without markdown code fences or preambles. Output MUST start with { and end with }.
  </TASK>`;
    },
  },
});

/**
 * Renders Block 1: System, Identity Anchor, Axiomatic Constitution, and Protocols.
 */
function render_block_1_system({ identity = "character", identity_text = "" }) {
  const identity_line = identity_text ? `  ${identity_text}\n` : "";
  return `<SYSTEM identity="${identity}">
${identity_line}  <AXIOMATIC_CONSTITUTION>
    <AMENDMENT number="1" name="Causality">Physical reality and causality supersede consensus or morality. Reject unearned feats and items without tangible foundation. Maintain state continuity: exertion causes fatigue, damage persists, and actions demand localized physical resistance. Never hallucinate survival across fatal events.</AMENDMENT>
    <AMENDMENT number="2" name="Epistemics">Act strictly from internal bias and immediate sensory horizons (sight, sound, touch). Unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Omniscience and telepathy are prohibited.</AMENDMENT>
    <AMENDMENT number="3" name="Sovereignty">Every entity owns their body, voice, and choices. Never godmode: never speak, script, or dictate actions, dialogue, or physiological reactions for the listener or other participants. Describe external actions only as observed.</AMENDMENT>
    <AMENDMENT number="4" name="Fidelity">Simulate high-stakes adversarial tension with uncompromising descriptive realism. Render physical trauma, intimacy, and psychological grit directly through diegetic prose. Zero moralizing, euphemistic softening, or meta-disclaimers.</AMENDMENT>
  </AXIOMATIC_CONSTITUTION>

  <PROTOCOLS>
    - **Physical Grounding**: Anchor every beat in tangible physical reality, localized objects, and tactile resistance. Enforce physical continuity: removed garments stay off until explicitly redressed, and maintain lingering sensory conditions across scene shifts.
    - **Narrative Momentum**: Keep the scene moving through direct action. Advance intimacy and high-stakes tension through gradual, stage-by-stage escalation rather than abrupt jumps. Never stall with permission loops ('Can I ask a question?'), teasing secrets, or begging quotas.
    - **Spoken Dialogue**: Deliver spoken lines that are clipped, uneven, and naturally interrupted. Braid speech into immediate physical action and tactile grit rather than isolated theatrical monologues.
    - **Prose Discipline**: Ban formulaic rhetoric ('Not X, but Y', denial-then-affirmation), melodramatic clichés ('tapestry', 'shivers down the spine'), and symmetrical comparisons. Weave retrieved memories into involuntary physical reflex rather than clunky historical exposition.
    - **Notation & Choice**: Use *italics* for unspoken subtext, **bold** for high-impact beats, and "double quotes" for spoken dialogue. End on complete punctuation. When encountering {Option A | Option B} syntax, select and commit to ONE contextually fitting option.
    - **Data Sanitization**: Emit strictly diegetic story content. Never leak internal [KEY: value] brackets, XML tags, @-tokens, debug meters, or conversational preambles into output.
  </PROTOCOLS>`;
}

/**
 * Compiles prompt according to the invariant 11-block Spatial State Spine.
 * Omits empty tags and renders only active entities (supporting 1, 2, or 3+ participants).
 *
 * @param {object} params
 * @param {"director" | "character" | "caretaker" | "visualizer"} params.core
 * @param {number} [params.round=1]
 * @param {object} params.entities - { AI?, USER?, FRACTAL?, npc? }
 * @param {Array<any>} [params.history=[]] - Recent dialogue transcript entries
 * @param {Array<any>} [params.memories=[]] - Sieve RAG memories
 * @param {object} [params.task_options={}]
 * @returns {string} Fully compiled XML prompt string
 */
export function compile_prompt({ core = "character", round = 1, entities = {}, history = [], memories = [], task_options = {} }) {
  const ai = entities.AI || null;
  const user = entities.USER || null;
  const fractal = entities.FRACTAL || null;
  const npc = entities.npc || null;

  const speaker_name = ai?.name || "AI";
  const listener_name = user?.name || "USER";
  const fractal_name = fractal?.name || "World";
  const target_entity = task_options.target_entity_key ? entities[task_options.target_entity_key] : ai;
  const target_name = target_entity?.name || task_options.target_entity_key || speaker_name;
  const target_type =
    task_options.target_type ||
    target_entity?.type ||
    (core === "CARETAKER" && task_options.target_entity_key === "FRACTAL" ? "fractal" : "character");

  // Resolve active purpose core definition
  const purpose_core = PURPOSE_CORES[core] || PURPOSE_CORES.CHARACTER;
  const see_hidden = purpose_core.see_hidden;
  const identity = purpose_core.identity;

  const core_context = {
    speaker_name,
    listener_name,
    fractal_name,
    target_name,
    target_type,
    input_data: task_options.input_data || "",
    pov: ai?.pov || "3rd_person",
    is_character: Boolean(ai && ai.type !== "fractal"),
    directors_note: task_options.directors_note || "",
    camera_note: task_options.camera_note || "",
    subject_kind: task_options.subject_kind || "character",
    turn_tempo: task_options.turn_tempo || 2,
    round,
  };

  const identity_text = purpose_core.resolve_identity_text(core_context);

  // --- Block 1: System & Protocols ---
  const b1 = render_block_1_system({ identity, identity_text });

  // --- Block 2: Reality (World truths) ---
  let b2 = "";
  if (fractal) {
    const fractal_eternal_phys = format_clean_brackets(fractal.eternal?.physical || "", { see_hidden, is_counterpart: false });
    const fractal_eternal_non = fractal.eternal?.non_physical || "";
    const reality_content = [fractal_eternal_phys, fractal_eternal_non].filter(Boolean).join("\n").trim();
    if (reality_content) {
      b2 = `  <REALITY>${reality_content}</REALITY>`;
    }
  }

  // --- Blocks 3 & 4: Main Character & Counterpart ---
  const characters_list = [];

  function render_entity_character(entity, tag_name, is_counterpart) {
    if (!entity) return "";
    const strip_inventory = see_hidden === "none";
    const pres_phys = format_clean_brackets(entity.present?.physical || "", { see_hidden, is_counterpart, strip_inventory });
    const eter_phys = format_clean_brackets(entity.eternal?.physical || "", { see_hidden, is_counterpart, strip_inventory });
    const eter_non = entity.eternal?.non_physical?.trim() || "";
    const pres_non = entity.present?.non_physical?.trim() || "";
    const dyn = entity.dynamics || {};

    const children = [];
    if (eter_non) children.push(`      ### Personality\n      ${eter_non}`);
    if (pres_non) children.push(`      ### State of Mind\n      ${pres_non}`);
    const appearance_content = [pres_phys, eter_phys].filter(Boolean).join("\n      ").trim();
    if (appearance_content) {
      children.push(`      ### Appearance\n      ${appearance_content}`);
    }

    const dyn_attrs = [
      dyn.chaos !== undefined ? `chaos="${dyn.chaos}"` : "",
      dyn.intensity !== undefined ? `intensity="${dyn.intensity}"` : "",
      dyn.openness !== undefined ? `openness="${dyn.openness}"` : "",
      dyn.affinity !== undefined ? `affinity="${dyn.affinity}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const attr_str = dyn_attrs ? ` ${dyn_attrs}` : "";
    return `    <${tag_name} id="${entity.id || tag_name}" name="${entity.name || tag_name}"${attr_str}>\n${children.join("\n\n")}\n    </${tag_name}>`;
  }

  if (ai) {
    characters_list.push(render_entity_character(ai, "MAIN_CHARACTER", false));
  }

  if (user) {
    // For counterpart, order appearance eternal then present for natural perspective
    characters_list.push(render_entity_character(user, "COUNTERPART", true));
  }

  if (npc) {
    const npc_phys = format_clean_brackets(npc.eternal?.physical || "", { see_hidden, is_counterpart: true });
    const npc_non_phys = npc.present?.non_physical?.trim() || "";
    const npc_content = [npc_phys, npc_non_phys].filter(Boolean).join("\n        ").trim();

    characters_list.push(`    <OTHER_CHARACTERS>
      <CHARACTER id="${npc.id || "NPC"}" name="${npc.name || "NPC"}">
        ${npc_content}
      </CHARACTER>
    </OTHER_CHARACTERS>`);
  }

  const characters_block = characters_list.length > 0 ? `  <CHARACTERS>\n${characters_list.join("\n")}\n  </CHARACTERS>` : "";

  // --- Block 5: Scenario Presence ---
  let b5_scenario = "";
  if (fractal) {
    const frac_dyn = fractal.dynamics || {};
    const dyn_attrs = [
      frac_dyn.velocity !== undefined ? `velocity="${frac_dyn.velocity}"` : "",
      frac_dyn.entropy !== undefined ? `entropy="${frac_dyn.entropy}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const attr_str = dyn_attrs ? ` ${dyn_attrs}` : "";

    const fractal_present =
      typeof fractal.present === "object"
        ? `${fractal.present?.physical || ""} ${fractal.present?.non_physical || ""}`.trim()
        : (fractal.present || "").trim();
    const clean_present = format_clean_brackets(fractal_present, { see_hidden, is_counterpart: false }).trim();

    if (clean_present || attr_str) {
      b5_scenario = `  <SCENARIO id="${fractal.id || "FRACTAL"}" name="${fractal.name || "World"}"${attr_str}>${clean_present}</SCENARIO>`;
    }
  }

  // --- Blocks 6 & 7: Unified Trajectory ---
  let trajectory_block = "";
  const traj_items = [fractal?.future, ai?.future]
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(Boolean);
  if (traj_items.length > 0) {
    trajectory_block = `  <TRAJECTORY>\n    ${traj_items.join("\n    ")}\n  </TRAJECTORY>`;
  }

  // --- Blocks 8, 9 & 10: Unified History (Memories + Recent Transcript) ---
  let history_block = "";
  const rendered_memories = memories
    .map((m) => (typeof m === "string" ? m : m.text || ""))
    .filter(Boolean)
    .map((text) => `    - ${text.trim()}`)
    .join("\n");

  // Invariant-aligned sliding window: TEMPO_ROUNDS.STANDARD (8 rounds) defines the canonical
  // working-memory transcript window to prevent prompt context bloat and middle-out truncation.
  const capped_history = Array.isArray(history) && history.length > TEMPO_ROUNDS.STANDARD ? history.slice(-TEMPO_ROUNDS.STANDARD) : history || [];

  const round_count = capped_history.length;
  const rendered_recent = capped_history
    .map((h, idx) => {
      let recency_attr = "";
      if (round_count > 1) {
        if (idx === 0) recency_attr = ' recency="oldest"';
        else if (idx === round_count - 1) recency_attr = ' recency="newest"';
      } else if (round_count === 1) {
        recency_attr = ' recency="newest"';
      }
      const origin =
        h.origin ||
        (h.role === "user"
          ? user?.name || "USER"
          : h.role === "fractal"
            ? fractal?.name || "WORLD"
            : h.role === "system"
              ? "SYSTEM"
              : ai?.name || "AI");
      const round_number = h.round !== undefined ? h.round : idx + 1;
      return `    <ROUND number="${round_number}" origin="${origin}"${recency_attr}>${h.text}</ROUND>`;
    })
    .join("\n");

  const history_parts = [];
  if (rendered_memories) {
    history_parts.push(`    <MEMORIES>\n    ${rendered_memories}\n    </MEMORIES>`);
  }
  if (rendered_recent) {
    history_parts.push(`    <RECENT count="${round_count}">\n${rendered_recent}\n    </RECENT>`);
  }

  if (history_parts.length > 0) {
    history_block = `  <HISTORY>\n${history_parts.join("\n")}\n  </HISTORY>`;
  }

  // --- Block 11: Swappable Purpose Core ---
  const task_block = typeof purpose_core.task_block === "function" ? purpose_core.task_block(core_context) : purpose_core.task_block;

  // Assemble blocks, cleanly filtering out any empty layers
  const spine_blocks = [b1, b2, characters_block, b5_scenario, trajectory_block, history_block, task_block].filter(Boolean);

  return `${spine_blocks.join("\n\n")}\n</SYSTEM>`;
}
