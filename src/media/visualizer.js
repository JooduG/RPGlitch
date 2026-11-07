/**
 * @file src/media/visualizer.js
 * 👁️ SENSORY CORTEX — VISUALIZER PROMPT COMPILER
 *
 * Compiles the dedicated visualizer prompt for diffusion staging,
 * adhering to the 11-block Spatial State Spine without layer-crossing into engine.
 */

/**
 * Parses a single bracket token string like "[KEY: value | hide | w: 8]".
 * Pure implementation co-located to avoid upward layer imports to storage.
 */
function parse_bracket_token(bracket_string) {
  if (!bracket_string || typeof bracket_string !== "string") return null;

  const trimmed = bracket_string.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;

  const inner = trimmed.slice(1, -1).trim();
  const colon_index = inner.indexOf(":");
  if (colon_index === -1) return null;

  const raw_key = inner.slice(0, colon_index).trim();
  const key = raw_key.toUpperCase();
  const payload = inner.slice(colon_index + 1).trim();

  const segments = [];
  let current_segment = "";
  let brace_depth = 0;

  for (let i = 0; i < payload.length; i++) {
    const character = payload[i];
    if (character === "{") {
      brace_depth++;
      current_segment += character;
    } else if (character === "}") {
      if (brace_depth > 0) brace_depth--;
      current_segment += character;
    } else if (character === "|" && brace_depth === 0) {
      segments.push(current_segment.trim());
      current_segment = "";
    } else {
      current_segment += character;
    }
  }
  segments.push(current_segment.trim());

  const value = segments[0] || "";
  const flags = {
    hide: false,
    show: false,
    is_origin: false,
  };

  for (let j = 1; j < segments.length; j++) {
    const flag = segments[j].toLowerCase();
    if (flag === "hide") {
      flags.hide = true;
    } else if (flag === "show") {
      flags.show = true;
    } else if (flag === "is_origin" || flag === "origin") {
      flags.is_origin = true;
    } else if (flag.startsWith("w:") || flag.startsWith("weight:")) {
      const parts = flag.split(":");
      const parsed_number = parseInt(parts[1]?.trim(), 10);
      if (!isNaN(parsed_number)) {
        flags.weight = Math.min(10, Math.max(1, parsed_number));
      }
    }
  }

  return { key, value, flags, raw: trimmed };
}

function parse_brackets(text) {
  if (!text || typeof text !== "string") return [];

  const tokens = [];
  let bracket_depth = 0;
  let start_index = -1;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === "[") {
      if (bracket_depth === 0) start_index = i;
      bracket_depth++;
    } else if (character === "]") {
      if (bracket_depth > 0) {
        bracket_depth--;
        if (bracket_depth === 0 && start_index !== -1) {
          const raw = text.slice(start_index, i + 1);
          const parsed = parse_bracket_token(raw);
          if (parsed) tokens.push(parsed);
          start_index = -1;
        }
      }
    }
  }

  return tokens;
}

function format_clean_brackets(brackets_text, options = {}) {
  const { see_hidden = "own", is_counterpart = false, strip_inventory = false } = options;
  const parsed = parse_brackets(brackets_text);

  const kept = [];

  for (const token of parsed) {
    if (!token) continue;

    if (strip_inventory || see_hidden === "none") {
      const upper_key = token.key.toUpperCase();
      if (upper_key === "INVENTORY" || upper_key === "STASH") {
        continue;
      }
    }

    if (token.flags.hide) {
      if (see_hidden === "none") continue;
      if (see_hidden === "own" && is_counterpart) continue;
    }

    kept.push(`[${token.key}: ${token.value}]`);
  }

  return kept.join(", ");
}

export const VISUALIZER_START_WITH = '{"_thought_process": "';

export const PURPOSE_CORES = Object.freeze({
  visualizer: Object.freeze({
    identity: "visualizer",
    see_hidden: "none",
    start_with: () => VISUALIZER_START_WITH,
    resolve_identity_text: () => "You are the Sensory Cortex synthesizing visual staging and descriptive optics.",
    task_block: (context) => {
      const raw_note = typeof context === "string" ? context : context?.camera_note;
      const camera_note = raw_note ? String(raw_note).trim() : "";
      const aesthetic_direction = camera_note
        ? `\n    ### Aesthetic Direction\n    Anchor the visual staging to the following camera note and aesthetic style:\n    - "${camera_note}"\n`
        : "";

      return `  <TASK>
    ### Think Format
    1. **Focal Subject & Pose**: Primary subject, active physical posture, and concrete expression.
    2. **Spatial Depth & Geometry**: Foreground, midground, and background layers, perspective, and camera angle.
    3. **Lighting & Luminary Sources**: Concrete light sources, shadow falloff, ambient bounce, and color palette.
    4. **Attire, Textures & Exposure**: Physical garment materials, surface textures, and visible skin mechanics.${aesthetic_direction}
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

    ---

    <OUTPUT_FORMAT mode="json">
      {
        "_thought_process": "",
        "prompt": "",
        "negative_prompt": ""
      }
    </OUTPUT_FORMAT>

    > [!IMPORTANT]
    > Emit strictly clean JSON without markdown code fences or preambles. Output MUST start with { and end with }.
  </TASK>`;
    },
  }),
});

function render_block_1_system({ round = 1, identity = "visualizer", identity_text = "" }) {
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
 * Compiles the Visualizer prompt for diffusion scene enhancement.
 *
 * @param {object} params
 * @param {number} [params.round=1]
 * @param {object} [params.entities={}] - { AI?, USER?, FRACTAL? }
 * @param {object} [params.task_options={}] - { camera_note }
 * @returns {string} Fully compiled XML prompt string
 */
export function compile_visualizer_prompt({ round = 1, entities = {}, task_options = {} }) {
  const ai = entities.AI || null;
  const user = entities.USER || null;
  const fractal = entities.FRACTAL || null;

  const purpose_core = PURPOSE_CORES.visualizer;
  const see_hidden = purpose_core.see_hidden;
  const identity = purpose_core.identity;

  const core_context = {
    camera_note: task_options.camera_note || "",
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

  // --- Blocks 3 & 4: Characters ---
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
    characters_list.push(render_entity_character(user, "COUNTERPART", true));
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

  // --- Blocks 6 & 7: Trajectory ---
  let trajectory_block = "";
  const traj_items = [fractal?.future, ai?.future]
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(Boolean);
  if (traj_items.length > 0) {
    trajectory_block = `  <TRAJECTORY>\n    ${traj_items.join("\n    ")}\n  </TRAJECTORY>`;
  }

  // --- Block 11: Task ---
  const task_block = purpose_core.task_block(core_context);

  const spine_blocks = [b1, b2, characters_block, b5_scenario, trajectory_block, task_block].filter(Boolean);

  return `${spine_blocks.join("\n\n")}\n</SYSTEM>`;
}
