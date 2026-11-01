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

import { format_clean_brackets } from "./parser.js";

/**
 * Co-located Purpose Core Definitions.
 * Each core bundles its identity, Epistemic Wall visibility, startWith token, opening line, and task block.
 */
export const PURPOSE_CORES = Object.freeze({
  director: {
    identity: "director",
    see_hidden: "all",
    start_with: '{"_thought_process": "',
    resolve_identity_text: () => "You are the Director orchestrating simulation mechanics and staging.",
    task_block: `  <TASK>
    ### Directives
    - **Analysis (\`_thought_process\`)**: Evaluate recent events, physical causality, and emotional friction.
    - **Next Action (\`next_action\`)**: Determine who or what reacts next (\`MAIN_CHARACTER\`, \`SCENARIO\`, or \`OTHER_CHARACTERS\`). On fatal trauma, emit \`"EPILOGUE_COLLAPSED"\`.
    - **Staging Directive (\`directors_note\`)**: Acting guidance delivered exclusively to the \`next_action\` entity (never script actions for the protagonist).
    - **Cinematography (\`camera_note\`)**: Frame physical posture, lighting, and camera angle for visual synthesis.

    <DYNAMICS_DELTAS scale="0-100" standard="±1-4" dramatic="±8-12" clamp="5-95">
      Character Dynamics:
      - **chaos**: (+) Volatility / Unpredictability vs (-) Order / Stability
      - **intensity**: (+) Surge / High Stakes vs (-) Stillness / Calm
      - **openness**: (+) Permeability / Vulnerability vs (-) Insulation / Guarded
      - **affinity**: (+) Connection / Coalescence vs (-) Isolation / Friction

      Scenario Dynamics:
      - **velocity**: (+) Acceleration / Rapid Pacing vs (-) Suspension / Slowness
      - **entropy**: (+) Glitching / Decay / Fragmentation vs (-) Coherence / Purity

      Calibrate integer deltas to turn friction. Avoid extreme swings near boundaries.
    </DYNAMICS_DELTAS>

    ---

    <OUTPUT_FORMAT mode="json">
      {
        "_thought_process": "...",
        "next_action": "MAIN_CHARACTER | SCENARIO | OTHER_CHARACTERS | EPILOGUE_COLLAPSED | EPILOGUE_CONCLUDED",
        "directors_note": "...",
        "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0, "velocity": 0, "entropy": 0 },
        "camera_note": "..."
      }
    </OUTPUT_FORMAT>

    > [!IMPORTANT]
    > No conversational preamble, no markdown code fence backticks, no trailing comments.
    > Output MUST start with { and end with }.
  </TASK>`,
  },

  caretaker: {
    identity: "caretaker",
    see_hidden: "all",
    start_with: '{"_thought_process": "',
    resolve_identity_text: (context) =>
      `You are the Continuum Caretaker for target entity "${context.target_name}". Organize temporal state into canonical profile brackets.`,
    task_block: `  <TASK>
    ### Directives
    - **Analysis (\`_thought_process\`)**: Review input notes or recent events and identify what shifts, updates, or polishes for the target.
    - **Eternal Baseline (\`eternal_physical\`, \`eternal_non_physical\`)**:
      - Physical: Permanent visual biometrics (appearance, build, face) or spatial geography (terrain, architecture, landmarks).
      - Non-Physical: Core beliefs, personality drivers, or governing metaphysical laws/axioms.
      - Leave empty \`""\` unless establishing baseline lore or an irreversible transformation occurred.
    - **Present State (\`present_physical\`, \`present_non_physical\`)**:
      - Physical: Immediate attire, held items, wounds, posture, or momentary weather/lighting.
      - Non-Physical: Current psychological pressure, active focus, behavioral drivers, or momentary anomaly/tension.
    - **Future Agenda (\`future\`)**: Active trajectory, next step, impending choice, or converging tension.
    - **Past Memories (\`past\`)**: Durable facts, revelations, historical precedents, or lore to preserve in memory.
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
        "_thought_process": "...",
        "eternal_physical": "[KEY: value]",
        "eternal_non_physical": "[KEY: value]",
        "present_physical": "[KEY: value]",
        "present_non_physical": "[KEY: value]",
        "future": "[KEY: value]",
        "past": "[KEY: value]"
      }
    </OUTPUT_FORMAT>

    > [!IMPORTANT]
    > No conversational preamble, no markdown code fence backticks, no trailing comments.
    > Output MUST start with { and end with }.
  </TASK>`,
  },

  character: {
    identity: "character",
    see_hidden: "own",
    start_with: (context) => (context?.directors_note ? `<think>${context.directors_note}\n` : "<think>"),
    resolve_identity_text: (context) =>
      `You are ${context.speaker_name} within FRACTAL ${context.fractal_name}, interacting with ${context.listener_name}.`,
    task_block: (context) => {
      const tempo = context?.turn_tempo || 2;
      const is_first_person = context?.is_character && context?.pov === "1st_person";
      const perspective_rule = is_first_person
        ? "Maintain first-person limited perspective ('I', 'me', 'my') anchored strictly to your own sensory experience. Never speak, script, or dictate actions for the counterpart."
        : "Maintain third-person limited perspective anchored strictly to your own identity. Never speak, script, or dictate actions for the counterpart.";

      return `  <TASK>
    ### Think Format
    1. **Intent & Atmosphere**: Immediate sensory and physical demand.
    2. **Friction**: Ambivalence, tension, and internal resistance.
    3. **Subtext**: What remains unspoken beneath the dialogue.
    4. **Physical Vector**: Concrete physical action, weight, or posture.

    *Conclude internal cognition with a closing \\</think\\> tag before narrative prose.*

    ### Pacing & Posture
    - **Tense & Rhythm**: Write in present tense.
    - **Pacing Budget**: ${tempo} beat(s). Deliver crisp, grounded interaction calibrated to this tempo.
    - ${perspective_rule}

    > [!IMPORTANT]
    > Emit in-character narrative prose.
  </TASK>`;
    },
  },

  visualizer: {
    identity: "visualizer",
    see_hidden: "none",
    start_with: (context) => (context?.camera_note ? `{"_thought_process": "${context.camera_note}. ` : '{"_thought_process": "'),
    resolve_identity_text: () => "You are the Sensory Cortex synthesizing visual staging and descriptive optics.",
    task_block: `  <TASK>
    ### Think Format
    1. **Focal Subject & Pose**: Primary subject, active physical posture, and concrete expression.
    2. **Spatial Depth & Geometry**: Foreground, midground, and background layers, perspective, and camera angle.
    3. **Lighting & Luminary Sources**: Concrete light sources, shadow falloff, ambient bounce, and color palette.
    4. **Attire, Textures & Exposure**: Physical garment materials, surface textures, and visible skin mechanics.

    ### Prompt Synthesis
    Synthesize an evocative, photographic or artistic description in natural prose:
    - **First Sentence Mandate**: Immediately establish the focal subject and primary setting.
    - **Sensory Optics & Textures**: Focus on physical surfaces, fabric drape, skin texture, and concrete light sources. Avoid empty buzzwords ('photorealistic', 'hyperrealistic', 'trending on artstation').
    - **Weight Discipline**: Never emit numeric weight math ('(word:1.3)', '[word:0.5]'). Emphasize through descriptive vocabulary and attenuation ('subtle', 'intense', 'faint').
    - **Affirmative Description**: Describe what IS visible in frame ('softly moonlit room' instead of 'no daylight').
    - **Signature Anchor Fidelity**: Preserve declared hair color, eye color, scars, and signature accents from the character sheet. Never allow environmental lighting to recolor established traits.
    - **Filter Discipline**: Focus strictly on visible exterior details. Omit internal thoughts, psychological traits, and inventory items.

    ### Negative Prompt
    Confine negative constraints strictly to global artifacts in \`negative_prompt\`. Start with standard quality anchors ("blurry, low quality, distorted, bad anatomy, bad hands, missing fingers, text, watermark") and append scene-specific opposites (e.g., "modern, cars" for a fantasy setting).

    ### Resolution
    Select the optimal resolution based on subject framing:
    - **"512x768"** (Portrait): Single character portrait, vertical figure, or standing pose.
    - **"768x512"** (Landscape): Wide environmental landscape, multi-character scene, or panoramic scenery.
    - **"768x768"** (Square): Tight macro shots, symmetrical compositions, close-up details, or compact vignettes.

    ---

    <OUTPUT_FORMAT mode="json">
      {
        "_thought_process": "",
        "prompt": "",
        "negative_prompt": "",
        "resolution": "512x768 | 768x512 | 768x768"
      }
    </OUTPUT_FORMAT>

    > [!IMPORTANT]
    > Emit strictly clean JSON without markdown code fences or preambles. Output MUST start with { and end with }.
  </TASK>`,
  },
});

/**
 * Renders Block 1: System, Identity Anchor, Axiomatic Constitution, and Protocols.
 */
function render_block_1_system({ round = 1, identity = "character", identity_text = "" }) {
  const identity_line = identity_text ? `  ${identity_text}\n` : "";
  return `<SYSTEM round="${round}" identity="${identity}">
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
  const target_name = task_options.target_entity_key
    ? entities[task_options.target_entity_key]?.name || task_options.target_entity_key
    : speaker_name;

  // Resolve active purpose core definition
  const purpose_core = PURPOSE_CORES[core] || PURPOSE_CORES.character;
  const see_hidden = purpose_core.see_hidden;
  const identity = purpose_core.identity;

  const core_context = {
    speaker_name,
    listener_name,
    fractal_name,
    target_name,
    pov: ai?.pov || "3rd_person",
    is_character: Boolean(ai && ai.type !== "fractal"),
    directors_note: task_options.directors_note || "",
    camera_note: task_options.camera_note || "",
    turn_tempo: task_options.turn_tempo || 2,
  };

  const identity_text = purpose_core.resolve_identity_text(core_context);

  // --- Block 1: System & Protocols ---
  const b1 = render_block_1_system({ round, identity, identity_text });

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

  if (ai) {
    const strip_inventory = see_hidden === "none";
    const ai_pres_phys = format_clean_brackets(ai.present?.physical || "", { see_hidden, is_counterpart: false, strip_inventory });
    const ai_eter_phys = format_clean_brackets(ai.eternal?.physical || "", { see_hidden, is_counterpart: false, strip_inventory });
    const ai_eter_non = ai.eternal?.non_physical?.trim() || "";
    const ai_pres_non = ai.present?.non_physical?.trim() || "";
    const ai_dyn = ai.dynamics || {};

    const ai_children = [];
    if (ai_eter_non) ai_children.push(`      ### Personality\n      ${ai_eter_non}`);
    if (ai_pres_non) ai_children.push(`      ### State of Mind\n      ${ai_pres_non}`);
    const appearance_content = [ai_pres_phys, ai_eter_phys].filter(Boolean).join("\n      ").trim();
    if (appearance_content) {
      ai_children.push(`      ### Appearance\n      ${appearance_content}`);
    }

    const dyn_attrs = [
      ai_dyn.chaos !== undefined ? `chaos="${ai_dyn.chaos}"` : "",
      ai_dyn.intensity !== undefined ? `intensity="${ai_dyn.intensity}"` : "",
      ai_dyn.openness !== undefined ? `openness="${ai_dyn.openness}"` : "",
      ai_dyn.affinity !== undefined ? `affinity="${ai_dyn.affinity}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const attr_str = dyn_attrs ? ` ${dyn_attrs}` : "";
    characters_list.push(
      `    <MAIN_CHARACTER id="${ai.id || "AI"}" name="${ai.name || "AI"}"${attr_str}>\n${ai_children.join("\n\n")}\n    </MAIN_CHARACTER>`,
    );
  }

  if (user) {
    const strip_inventory = see_hidden === "none";
    const user_eter_non = user.eternal?.non_physical?.trim() || "";
    const user_pres_non = user.present?.non_physical?.trim() || "";
    const user_eter_phys = format_clean_brackets(user.eternal?.physical || "", { see_hidden, is_counterpart: true, strip_inventory });
    const user_pres_phys = format_clean_brackets(user.present?.physical || "", { see_hidden, is_counterpart: true, strip_inventory });

    const user_children = [];
    if (user_eter_non) user_children.push(`      ### Personality\n      ${user_eter_non}`);
    if (user_pres_non) user_children.push(`      ### State of Mind\n      ${user_pres_non}`);
    const appearance_content = [user_eter_phys, user_pres_phys].filter(Boolean).join("\n      ").trim();
    if (appearance_content) {
      user_children.push(`      ### Appearance\n      ${appearance_content}`);
    }

    characters_list.push(
      `    <COUNTERPART id="${user.id || "USER"}" name="${user.name || "USER"}>\n${user_children.join("\n\n")}\n    </COUNTERPART>`,
    );
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
  const round_count = history.length;
  const rendered_recent = history
    .map((h, idx) => {
      let recency_attr = "";
      if (round_count > 1) {
        if (idx === 0) recency_attr = ' recency="oldest"';
        else if (idx === round_count - 1) recency_attr = ' recency="newest"';
      } else if (round_count === 1) {
        recency_attr = ' recency="newest"';
      }
      const origin = h.role === "user" ? user?.name || "USER" : ai?.name || "AI";
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
