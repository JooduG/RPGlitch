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
    <PHYSICAL_GROUNDING>
      Anchor every beat in tangible physical reality, localized objects, and tactile resistance. Enforce physical continuity: removed garments stay off until explicitly redressed, and maintain lingering sensory conditions across scene shifts.
    </PHYSICAL_GROUNDING>
    <NARRATIVE_MOMENTUM>
      Keep the scene moving through direct action. Advance intimacy and high-stakes tension through gradual, stage-by-stage escalation rather than abrupt jumps. Never stall with permission loops ('Can I ask a question?'), teasing secrets, or begging quotas.
    </NARRATIVE_MOMENTUM>
    <SPOKEN_DIALOGUE>
      Deliver spoken lines that are clipped, uneven, and naturally interrupted. Braid speech into immediate physical action and tactile grit rather than isolated theatrical monologues.
    </SPOKEN_DIALOGUE>
    <PROSE_DISCIPLINE>
      Ban formulaic rhetoric ('Not X, but Y', denial-then-affirmation), melodramatic clichés ('tapestry', 'shivers down the spine'), and symmetrical comparisons. Weave retrieved memories into involuntary physical reflex rather than clunky historical exposition.
    </PROSE_DISCIPLINE>
    <NOTATION_AND_CHOICE>
      Use *italics* for unspoken subtext, **bold** for high-impact beats, and "double quotes" for spoken dialogue. End on complete punctuation. When encountering {Option A | Option B} syntax, select and commit to ONE contextually fitting option.
    </NOTATION_AND_CHOICE>
    <DATA_SANITIZATION>
      Emit strictly diegetic story content. Never leak internal [KEY: value] brackets, XML tags, @-tokens, debug meters, or conversational preambles into output.
    </DATA_SANITIZATION>
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

  // Determine visibility across Epistemic Wall and identity line based on active core
  let see_hidden = "own";
  let identity = "character";
  const speaker_name = ai?.name || "AI";
  const listener_name = user?.name || "USER";
  const fractal_name = fractal?.name || "World";
  let identity_text = `You are ${speaker_name} within FRACTAL ${fractal_name}, interacting with ${listener_name}.`;

  if (core === "director") {
    see_hidden = "all";
    identity = "director";
    identity_text = "You are the Director orchestrating simulation mechanics and staging.";
  } else if (core === "caretaker") {
    see_hidden = "all";
    identity = "caretaker";
    const target_name = task_options.target_entity_key
      ? entities[task_options.target_entity_key]?.name || task_options.target_entity_key
      : speaker_name;
    identity_text = `You are the Continuum Caretaker for target entity "${target_name}". Consolidate temporal state from recent events.`;
  } else if (core === "visualizer") {
    see_hidden = "none";
    identity = "visualizer";
    identity_text = "You are the Sensory Cortex synthesizing visual staging and descriptive optics.";
  }

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
    const ai_pres_phys = format_clean_brackets(ai.present?.physical || "", { see_hidden, is_counterpart: false });
    const ai_eter_phys = format_clean_brackets(ai.eternal?.physical || "", { see_hidden, is_counterpart: false });
    const ai_eter_non = ai.eternal?.non_physical?.trim() || "";
    const ai_pres_non = ai.present?.non_physical?.trim() || "";
    const ai_dyn = ai.dynamics || {};

    const ai_children = [];
    if (ai_eter_non) ai_children.push(`      <PERSONALITY>${ai_eter_non}</PERSONALITY>`);
    if (ai_pres_non) ai_children.push(`      <STATE_OF_MIND>${ai_pres_non}</STATE_OF_MIND>`);
    const appearance_content = [ai_pres_phys, ai_eter_phys].filter(Boolean).join("\n        ").trim();
    if (appearance_content) {
      ai_children.push(`      <APPEARANCE>\n        ${appearance_content}\n      </APPEARANCE>`);
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
    characters_list.push(`    <MAIN_CHARACTER id="${ai.id || "AI"}" name="${ai.name || "AI"}"${attr_str}>
${ai_children.join("\n")}
    </MAIN_CHARACTER>`);
  }

  if (user) {
    const user_eter_non = user.eternal?.non_physical?.trim() || "";
    const user_pres_non = user.present?.non_physical?.trim() || "";
    const user_eter_phys = format_clean_brackets(user.eternal?.physical || "", { see_hidden, is_counterpart: true });
    const user_pres_phys = format_clean_brackets(user.present?.physical || "", { see_hidden, is_counterpart: true });

    const user_children = [];
    if (user_eter_non) user_children.push(`      <PERSONALITY>${user_eter_non}</PERSONALITY>`);
    if (user_pres_non) user_children.push(`      <STATE_OF_MIND>${user_pres_non}</STATE_OF_MIND>`);
    const appearance_content = [user_eter_phys, user_pres_phys].filter(Boolean).join("\n        ").trim();
    if (appearance_content) {
      user_children.push(`      <APPEARANCE>\n        ${appearance_content}\n      </APPEARANCE>`);
    }

    characters_list.push(`    <COUNTERPART id="${user.id || "USER"}" name="${user.name || "USER"}">
${user_children.join("\n")}
    </COUNTERPART>`);
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
    .join("\n    ");
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
  let task_block;

  if (core === "director") {
    task_block = `  <TASK>
    <DIRECTIVES>
      Evaluate recent events, physical causality, and emotional friction.
      Determine story status, dynamics deltas, and whether scene staging or external disruption is warranted.
    </DIRECTIVES>
    <OUTPUT_FORMAT mode="json">
      Emit a clean JSON object containing:
      {
        "_thought_process": "Analysis of causality and tension...",
        "next_action": "AI_CHARACTER",
        "story_status": "ACTIVE",
        "keywords": [],
        "directors_note": "Guidance for character...",
        "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
      }
    </OUTPUT_FORMAT>
  </TASK>`;
  } else if (core === "caretaker") {
    task_block = `  <TASK>
    <DIRECTIVES>
      Extract and consolidate newly revealed physical facts, items, or relationships into canonical bracket format.
    </DIRECTIVES>
    <OUTPUT_FORMAT mode="brackets">
      Emit structured [KEY: value] tags.
    </OUTPUT_FORMAT>
  </TASK>`;
  } else if (core === "visualizer") {
    task_block = `  <TASK>
    <DIRECTIVES>
      Synthesize visual camera prompt focusing on physical appearance and lighting.
    </DIRECTIVES>
    <OUTPUT_FORMAT mode="json">
      Emit { "_thought_process": "...", "prompt": "...", "negative_prompt": "..." }
    </OUTPUT_FORMAT>
  </TASK>`;
  } else {
    // Default: CHARACTER_CORE
    const directors_note = task_options.directors_note ? `\n    <DIRECTORS_NOTE>${task_options.directors_note}</DIRECTORS_NOTE>` : "";
    task_block = `  <TASK>${directors_note}
    <THINK_FORMAT>
      1. Intent & Atmosphere: Immediate sensory and physical demand.
      2. Friction: Ambivalence and internal resistance.
      3. Subtext: What remains unspoken.
      4. Physical Vector: Concrete physical action or posture.
    </THINK_FORMAT>
    <PACING_AND_POSTURE>
      Deliver crisp, cinematic interaction without formulaic clichés or repetition.
    </PACING_AND_POSTURE>
    <OUTPUT_FORMAT mode="prose">
      Emit in-character narrative prose.
    </OUTPUT_FORMAT>
    <FINAL_NOTE>
      Maintain third-person limited perspective anchored strictly to your own identity. Never speak or act for the counterpart.
    </FINAL_NOTE>
  </TASK>`;
  }

  // Assemble blocks, cleanly filtering out any empty layers
  const spine_blocks = [b1, b2, characters_block, b5_scenario, trajectory_block, history_block, task_block].filter(Boolean);

  return `${spine_blocks.join("\n\n")}\n</SYSTEM>`;
}
