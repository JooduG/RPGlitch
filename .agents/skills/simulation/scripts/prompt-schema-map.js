/**
 * .agents/skills/simulation/scripts/prompt-schema-map.js
 * ============================================================================
 * 🗺️ COMPREHENSIVE PROMPT XML SCHEMA DIRECTORY & AUTOMATED TAG GENERATOR
 * ============================================================================
 *
 * Programmatic, automated compiler and hierarchical directory of every XML tag
 * utilized across all nine simulation and utility prompt modes in RPGlitch:
 * 1. Director (Quick Shot)
 * 2. Interaction (Narrative Character Shot)
 * 3. Narrator (Prologue, Continuation, Epilogue/Collapse)
 * 4. Ghostwrite (Player-Assistive Drafting)
 * 5. NPC (Encounter Companion)
 * 6. Continuum (Memory Consolidation / Forensic Forge)
 * 7. Enhancement (Attribute Deepener)
 * 8. Sorting (Profile Ingestion / Decomposition)
 * 9. Optics (Diffusion Visual Prompt Synthesizer)
 *
 * Architecture & Purity Invariant:
 * - Single Declarative Source of Truth: PROMPT_LAYER_TREE defines tag hierarchy,
 *   allowed modes, active triggers, and external file provenance.
 * - Unified Merged Map: Injects basic triggers, mode audiences, and module origins
 *   into leaf tags across all 9 modes without mocked internal fields.
 * - Mode Skeletons: Retains pure empty XML tag pairs (<TAG></TAG>) for individual modes.
 * - Pre-Beta Purity: 0 hardcoded strings in report assembly, 0 consecutive blank lines.
 * ============================================================================
 */

/**
 * Registry of all known prompt modes and their human-readable labels.
 */
export const PROMPT_MODES = Object.freeze([
  { id: "director", label: "Director Quick Shot (Shot 1)" },
  { id: "interaction", label: "Character Interaction (Shot 2)" },
  { id: "narrator", label: "Narrator Scene Beats (Prologue, Epilogue, Collapse)" },
  { id: "ghostwrite", label: "Ghostwrite Prose Draft" },
  { id: "npc", label: "NPC Encounter Companion" },
  { id: "continuum", label: "Continuum Memory Consolidation" },
  { id: "enhancement", label: "Profile Enhancement" },
  { id: "sorting", label: "Profile Ingestion & Sorting" },
  { id: "optics", label: "Optics Diffusion Synthesizer" },
]);

// -----------------------------------------------------------------------------
// [SECTION 1: DECLARATIVE PROMPT SCHEMA TREE]
// -----------------------------------------------------------------------------

/**
 * Universal declarative hierarchy of all XML layers, slots, and tags across RPGlitch.
 */
export const PROMPT_LAYER_TREE = Object.freeze([
  // Layer 1: Axiomatic Constitution (Home: constitution.js)
  {
    tag: "AXIOMATIC_CONSTITUTION",
    modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
    children: [
      {
        tag: "LAW",
        attrs: 'index="L1" label="Causality"',
        info: "Active for all modes",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
      },
      {
        tag: "LAW",
        attrs: 'index="L2" label="Epistemics"',
        info: "Active for all modes",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
      },
      {
        tag: "LAW",
        attrs: 'index="L3" label="Sovereignty"',
        info: "Active for all modes",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
      },
      {
        tag: "LAW",
        attrs: 'index="L4" label="Fidelity"',
        info: "Active for all modes",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
      },
    ],
  },

  // Layer 2: Core Protocols (Home: protocols.js)
  {
    tag: "CORE_PROTOCOLS",
    modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
    children: [
      {
        tag: "PERSPECTIVE",
        attrs: (mode) => {
          if (mode === "all") return 'person="FIRST | THIRD" tense="PRESENT | PAST | LAYER"';
          if (mode === "narrator" || mode === "sorting") return 'person="THIRD" tense="PRESENT"';
          if (mode === "ghostwrite") return 'person="FIRST" tense="PRESENT"';
          if (mode === "continuum") return 'tense="PRESENT"';
          if (mode === "enhancement") return 'tense="LAYER"';
          return 'person="FIRST | THIRD" tense="PRESENT"';
        },
        info: "Active for character, fractal, ghost, npc, continuum, enhancement, sorting",
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting"],
      },
      {
        tag: "AUTHORIAL_VOICE",
        attrs: () => 'author="[STYLE]" internal_ratio="[0.0-1.0]"',
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
        children: [
          {
            tag: "SIGNATURE_ELEMENTS",
            info: "Active for character, fractal, ghost and npc when narrative style active from narrative-styles.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "SOVEREIGNTY",
            attrs: () => 'player="[name]"',
            info: "Active for character, fractal, ghost and npc to protect player persona",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
        ],
      },
      {
        tag: "PROSE_DISCIPLINE",
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
        children: [
          { tag: "TYPOGRAPHY", info: "Active for character, fractal, ghost and npc", modes: ["all", "interaction", "narrator", "ghostwrite", "npc"] },
          {
            tag: "SCENE_MOMENTUM",
            info: "Active for character, fractal, ghost and npc",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "NATURAL_DIALOGUE",
            info: "Active for character, ghost and npc",
            modes: ["all", "interaction", "ghostwrite", "npc"],
          },
        ],
      },
      {
        tag: "CONSTRAINTS",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
        children: [
          { tag: "LETHALITY", info: "Active for director", modes: ["all", "director"] },
          { tag: "AGENCY", info: "Active for director", modes: ["all", "director"] },
          { tag: "GENESIS", info: "Active for director", modes: ["all", "director"] },
          {
            tag: "OVERARCHING_QUESTS",
            info: "Active for character, fractal, ghost and npc",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "SYNTHETIC_FORMULAS",
            info: "Active for character, fractal, ghost and npc",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "CLICHES",
            info: "Active for character, fractal, ghost and npc from speaking-styles.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "EXHAUSTED_OPENINGS",
            info: "Active for character, fractal, ghost and npc from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
        ],
      },
      { tag: "IMAGE_VOCABULARY", info: "Active for optics from optics.js", modes: ["all", "optics"] },
      { tag: "TEXT_RENDERING", info: "Active for optics from optics.js", modes: ["all", "optics"] },
      {
        tag: "VISUAL_STYLE",
        modes: ["all", "optics"],
        children: [
          { tag: "MEDIUM", info: "Active for optics from visual-styles.js", modes: ["all", "optics"] },
          { tag: "PALETTE", info: "Active for optics from visual-styles.js", modes: ["all", "optics"] },
          { tag: "TEXTURES", info: "Active for optics from visual-styles.js", modes: ["all", "optics"] },
        ],
      },
      {
        tag: "ALTERNATION_OPTIONS",
        info: "Active for director, character, fractal, ghost, npc, optics from macros.js",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
      },
    ],
  },

  // Layer 3: Dynamic Axes (Home: dynamics.js)
  {
    tag: "DYNAMIC_AXES",
    attrs: () => 'scale="0-100" delta_standard="±1-4" delta_extreme="±8-12" boundary_clip="5-95"',
    modes: ["all", "director"],
    children: [
      { tag: "CALIBRATION", info: "Active for director", modes: ["all", "director"] },
      { tag: "CHAOS", attrs: () => 'value="[0-100]" low="Order" high="Volatility"', info: "Active for director", modes: ["all", "director"] },
      { tag: "INTENSITY", attrs: () => 'value="[0-100]" low="Stillness" high="Surge"', info: "Active for director", modes: ["all", "director"] },
      {
        tag: "OPENNESS",
        attrs: () => 'value="[0-100]" low="Insulation" high="Permeability"',
        info: "Active for director",
        modes: ["all", "director"],
      },
      { tag: "AFFINITY", attrs: () => 'value="[0-100]" low="Isolation" high="Coalescence"', info: "Active for director", modes: ["all", "director"] },
      {
        tag: "VELOCITY",
        attrs: () => 'value="[0-100]" low="Suspension" high="Acceleration"',
        info: "Active for director",
        modes: ["all", "director"],
      },
      { tag: "ENTROPY", attrs: () => 'value="[0-100]" low="Glitching" high="Coherence"', info: "Active for director", modes: ["all", "director"] },
    ],
  },

  // Layer 4: Entities & Character Sheets (Home: entities.js & sheets.js)
  {
    tag: "ENTITIES",
    modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
    children: [
      {
        tag: "CHARACTER",
        attrs: () => 'id="[slug]" name="[Title Case]"',
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
        children: [
          {
            tag: "PSYCHOLOGY",
            modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
            children: [
              {
                tag: "AGENDA",
                info: "Active for character, ghost and npc from sheets.js",
                modes: ["all", "director", "interaction", "ghostwrite", "npc"],
              },
              {
                tag: "PERSONALITY",
                info: "Active for character, ghost and npc from sheets.js",
                modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
              },
              {
                tag: "STATE",
                info: "Active for director, character, fractal, ghost and npc from sheets.js",
                modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
              },
              {
                tag: "DYNAMIC_AXES",
                attrs: () => 'scale="0-100"',
                modes: ["all", "interaction", "ghostwrite", "npc"],
                children: [
                  {
                    tag: "CHAOS",
                    attrs: () => 'value="[0-100]" low="Order" high="Volatility"',
                    info: "Active for character, ghost and npc from dynamics.js",
                    modes: ["all", "interaction", "ghostwrite", "npc"],
                  },
                  {
                    tag: "INTENSITY",
                    attrs: () => 'value="[0-100]" low="Stillness" high="Surge"',
                    info: "Active for character, ghost and npc from dynamics.js",
                    modes: ["all", "interaction", "ghostwrite", "npc"],
                  },
                  {
                    tag: "OPENNESS",
                    attrs: () => 'value="[0-100]" low="Insulation" high="Permeability"',
                    info: "Active for character, ghost and npc from dynamics.js",
                    modes: ["all", "interaction", "ghostwrite", "npc"],
                  },
                  {
                    tag: "AFFINITY",
                    attrs: () => 'value="[0-100]" low="Isolation" high="Coalescence"',
                    info: "Active for character, ghost and npc from dynamics.js",
                    modes: ["all", "interaction", "ghostwrite", "npc"],
                  },
                ],
              },
            ],
          },
          {
            tag: "APPEARANCE",
            info: "Active for character, fractal, ghost, npc and optics from sheets.js",
            modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
          },
          {
            tag: "MEMORIES",
            info: "Active for character and npc from sheets.js",
            modes: ["all", "director", "interaction", "npc"],
          },
          {
            tag: "BACKSTORY",
            info: "Active for character, ghost and npc from sheets.js",
            modes: ["all", "director", "interaction", "ghostwrite", "npc"],
          },
        ],
      },
      {
        tag: "FRACTAL",
        attrs: () => 'id="[slug]" name="[Title Case]"',
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
        children: [
          {
            tag: "PSYCHOLOGY",
            modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
            children: [
              {
                tag: "TRAJECTORY",
                info: "Active for character, fractal, ghost and npc from sheets.js",
                modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
              },
              {
                tag: "PERMANENT_TRUTHS",
                info: "Active for character, fractal, ghost and npc from sheets.js",
                modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
              },
              {
                tag: "STATE",
                info: "Active for director, character, fractal, ghost and npc from sheets.js",
                modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
              },
              {
                tag: "DYNAMIC_AXES",
                attrs: () => 'scale="0-100"',
                modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
                children: [
                  {
                    tag: "VELOCITY",
                    attrs: () => 'value="[0-100]" low="Suspension" high="Acceleration"',
                    info: "Active for character, fractal, ghost and npc from dynamics.js",
                    modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
                  },
                  {
                    tag: "ENTROPY",
                    attrs: () => 'value="[0-100]" low="Glitching" high="Coherence"',
                    info: "Active for character, fractal, ghost and npc from dynamics.js",
                    modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
                  },
                ],
              },
            ],
          },
          {
            tag: "APPEARANCE",
            info: "Active for character, fractal, npc and optics from sheets.js",
            modes: ["all", "director", "interaction", "narrator", "npc", "optics"],
          },
          {
            tag: "HISTORY",
            info: "Active for character, fractal, ghost and npc from sheets.js",
            modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc"],
          },
        ],
      },
      {
        tag: "AVAILABLE_ENTITIES",
        modes: ["all", "director"],
        children: [
          {
            tag: "CANDIDATE",
            attrs: () => 'id="[slug]" type="character | fractal"',
            info: "Active for director when candidate entities available",
            modes: ["all", "director"],
          },
        ],
      },
    ],
  },

  // Layer 4B: Utility Entity Slots (Home: entities.js & temporal.js)
  {
    tag: "TARGET_ENTITY",
    attrs: () => 'id="[slug]" name="[Title Case]"',
    info: "Active for continuum from temporal.js",
    modes: ["all", "continuum"],
  },
  {
    tag: "CAST",
    modes: ["all", "continuum"],
    children: [{ tag: "CHARACTER", attrs: () => 'id="[slug]" name="[Title Case]"', info: "Active for continuum", modes: ["all", "continuum"] }],
  },
  {
    tag: "CHAPTER_HISTORY",
    modes: ["all", "continuum"],
    children: [{ tag: "ACTION", attrs: () => 'round="[number]" origin="[slug]"', info: "Active for continuum", modes: ["all", "continuum"] }],
  },
  {
    tag: "MEMORY_ADVISORY",
    modes: ["all", "continuum"],
    children: [{ tag: "FACT", info: "Active for continuum", modes: ["all", "continuum"] }],
  },
  {
    tag: "FIELD_CONTEXT",
    attrs: () => 'target="[slug]" field="[field_name]" layer="eternal | present | past | future"',
    modes: ["all", "enhancement"],
    children: [{ tag: "ENTITY", attrs: () => 'id="[slug]" name="[Title Case]"', info: "Active for enhancement", modes: ["all", "enhancement"] }],
  },

  // Layer 5: Conversation History (Home: history.js)
  {
    tag: "HISTORY",
    modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "optics"],
    children: [
      {
        tag: "ACTION",
        attrs: () => 'round="[number]" origin="[slug]"',
        info: "Active for all modes when message log exists",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "optics"],
      },
    ],
  },

  // Layer 6: Operational Task (Home: task.js)
  {
    tag: "TASK",
    modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
    children: [
      {
        tag: "THINK_FORMAT",
        info: "Active for character, fractal, ghost, npc, enhancement and optics",
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc", "enhancement", "optics"],
      },
      {
        tag: "ACTION",
        attrs: () => 'round="[number]" origin="[slug]" speaker="[slug]" listener="[slug]"',
        info: "Active for character, fractal, ghost and npc",
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
      },
      {
        tag: "CURRENTS",
        modes: ["all", "interaction", "narrator", "npc"],
        children: [
          {
            tag: "SENSORY_EXPERIENCE",
            info: "Active for character, fractal and npc from narrative-styles.js",
            modes: ["all", "interaction", "narrator", "npc"],
          },
          {
            tag: "SUBTEXT",
            modes: ["all", "interaction", "narrator", "npc"],
            children: [
              { tag: "MASKING", info: "Active for character, fractal and npc from dynamics.js", modes: ["all", "interaction", "narrator", "npc"] },
              { tag: "SUSPICION", info: "Active for character, fractal and npc from dynamics.js", modes: ["all", "interaction", "narrator", "npc"] },
              {
                tag: "THEMATIC_CURRENT",
                info: "Active for character, fractal and npc from dynamics.js",
                modes: ["all", "interaction", "narrator", "npc"],
              },
              {
                tag: "DYNAMICS_PRESSURE",
                info: "Active for character, fractal and npc from dynamics.js",
                modes: ["all", "interaction", "narrator", "npc"],
              },
            ],
          },
        ],
      },
      { tag: "SCENE_DIRECTIVE", info: "Active for fractal (prologue, continuation, epilogue, collapse)", modes: ["all", "narrator"] },
      {
        tag: "DELIVERY_POSTURE",
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
        children: [
          {
            tag: "TEMPERAMENT",
            info: "Active for character, fractal, ghost and npc from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "CADENCE",
            info: "Active for character, fractal, ghost and npc from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "PACING",
            attrs: () => 'mode="TERSE | ADAPTIVE | EXPANSIVE"',
            info: "Active for character, fractal, ghost and npc from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "BEAT_BUDGET",
            attrs: () => 'size="TINY | SMALL | EXPANSIVE" beats="[range]"',
            info: "Active for character, fractal, ghost and npc from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "RHYTHM",
            info: "Active for character, fractal, ghost and npc from narrative-styles.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "DRIVE",
            info: "Active for character, fractal, ghost and npc from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "FIRST_CONTACT",
            info: "Active for character, fractal and npc on round 1 first meeting from reflex.js",
            modes: ["all", "interaction", "narrator", "npc"],
          },
          { tag: "ROUND_ONE", info: "Active for director on round 1 following prologue from reflex.js", modes: ["all"] },
          {
            tag: "MOMENTUM_SOFT_PERMIT",
            info: "Active for character, fractal, ghost and npc when stagnation >= 8 from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
          {
            tag: "MOMENTUM_HARD_MANDATE",
            info: "Active for character, fractal, ghost and npc when stagnation >= 16 from reflex.js",
            modes: ["all", "interaction", "narrator", "ghostwrite", "npc"],
          },
        ],
      },
      {
        tag: "STABILITY_LOCK",
        info: "Active for character, fractal, ghost and npc when stability lock is engaged from reflex.js",
        modes: ["all", "interaction", "ghostwrite", "npc"],
      },
      { tag: "TARGET", info: "Active for optics", modes: ["all", "optics"] },
      { tag: "SPATIAL_FRAMING", info: "Active for optics", modes: ["all", "optics"] },
      {
        tag: "INPUT",
        attrs: (mode) => {
          if (mode === "enhancement") return 'kind="content"';
          if (mode === "sorting") return 'kind="bio"';
          if (mode === "optics") return 'kind="scene"';
          return 'kind="turn" round="[number]" origin="[slug]"';
        },
        info: "Active for all modes",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "enhancement", "sorting", "optics"],
      },
      {
        tag: "DIRECTIVES",
        modes: ["all", "director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
        children: [
          {
            tag: "STAGING",
            info: "Active for director (state mutations, biological causality, turn allocation)",
            modes: ["all"],
          },
          {
            tag: "SCENE_ADVANCEMENT",
            info: "Active for character, fractal, ghost and npc (narrative momentum, natural beat)",
            modes: ["all"],
          },
          {
            tag: "TASK_INSTRUCTION",
            info: "Active for continuum, enhancement, sorting, optics",
            modes: ["all"],
          },
          { tag: "ROUND_ONE", info: "Active for director on round 1 following prologue from reflex.js", modes: ["director"] },
          {
            tag: "MOMENTUM",
            attrs: () => 'tier="soft | critical" turns="[number]"',
            info: "Active for director when stagnation >= 8 from reflex.js",
            modes: ["all", "director"],
          },
        ],
      },
      {
        tag: "OUTPUT_FORMAT",
        attrs: (mode) => {
          if (mode === "enhancement") return 'mode="temporal_field"';
          if (mode === "all") return 'mode="json | prose"';
          return 'mode="json"';
        },
        info: "Active for director, continuum, enhancement, sorting, optics from output.js",
        modes: ["all", "director", "continuum", "enhancement", "sorting", "optics"],
      },
      {
        tag: "THINK",
        info: "Active for character, fractal, ghost, npc, enhancement, optics",
        modes: ["all", "interaction", "narrator", "ghostwrite", "npc", "enhancement", "optics"],
      },
    ],
  },
]);

// -----------------------------------------------------------------------------
// [SECTION 2: AUTOMATED RECURSIVE TREE COMPILER]
// -----------------------------------------------------------------------------

/**
 * Checks if a schema node matches the requested prompt mode.
 * @param {{ modes?: string[] }} node
 * @param {string} mode_id
 * @returns {boolean}
 */
function node_matches_mode(node, mode_id) {
  if (mode_id === "all") {
    return !node.modes || node.modes.includes("all");
  }
  return Array.isArray(node.modes) && node.modes.includes(mode_id);
}

/**
 * Recursively renders an XML tag node and all its valid children for a given mode.
 * When mode_id is "all", outputs concise trigger/audience/provenance info inside leaf tags.
 * For individual mode skeletons, outputs pure empty XML tag pairs (<TAG></TAG>).
 * @param {any} node
 * @param {string} mode_id
 * @param {number} depth
 * @returns {string|null}
 */
function render_node_recursive(node, mode_id, depth = 0) {
  if (!node_matches_mode(node, mode_id)) return null;

  const indent = "  ".repeat(depth);
  const raw_attrs = typeof node.attrs === "function" ? node.attrs(mode_id) : node.attrs || "";
  const attrs_string = raw_attrs ? ` ${raw_attrs}` : "";

  const rendered_children = (node.children || []).map((child) => render_node_recursive(child, mode_id, depth + 1)).filter(Boolean);

  if (rendered_children.length === 0) {
    const text_content = mode_id === "all" && node.info ? node.info : "";
    return `${indent}<${node.tag}${attrs_string}>${text_content}</${node.tag}>`;
  }

  return `${indent}<${node.tag}${attrs_string}>\n${rendered_children.join("\n")}\n${indent}</${node.tag}>`;
}

/**
 * Constructs the root envelope node for a given mode.
 * @param {string} mode_id
 * @returns {any}
 */
function get_root_node_for_mode(mode_id) {
  const is_storyteller = ["interaction", "narrator", "ghostwrite", "npc"].includes(mode_id);

  if (mode_id === "all") {
    return {
      tag: "PROMPT",
      attrs: 'envelope="SYSTEM (all 9 modes)"',
      modes: ["all"],
      children: PROMPT_LAYER_TREE,
    };
  }

  if (is_storyteller) {
    return {
      tag: "SYSTEM",
      attrs: `mode="${mode_id}" round="[number]" speaker="[slug]" listener="[slug]"`,
      modes: [mode_id],
      children: PROMPT_LAYER_TREE,
    };
  }

  return {
    tag: "SYSTEM",
    attrs: mode_id === "director" ? 'mode="director" round="[number]"' : `mode="${mode_id}"`,
    modes: [mode_id],
    children: PROMPT_LAYER_TREE,
  };
}

/**
 * Programmatically compiles an entire prompt mode's XML tag skeleton.
 * @param {string} mode_id - Active mode ID or "all" for the Unified Core.
 * @returns {string} XML tag tree.
 */
export function render_tag_skeleton(mode_id) {
  const root = get_root_node_for_mode(mode_id);
  return render_node_recursive(root, mode_id, 0);
}

// -----------------------------------------------------------------------------
// [SECTION 3: MARKDOWN OUTPUT REPORT GENERATORS]
// -----------------------------------------------------------------------------

/**
 * Builds the canonical XML Tag Map showing the Unified Simulation Core hierarchy.
 * @returns {string} Markdown formatted XML block.
 */
export function generate_simulation_tag_comparison() {
  return ["### 1. Comprehensive Unified Simulation & Tool Architecture (All 9 Modes)", "", "```xml", render_tag_skeleton("all"), "```"].join("\n");
}

/**
 * Programmatically builds the complete markdown tag directory for all nine prompt modes.
 * @returns {string} Markdown formatted comprehensive XML schema map.
 */
export function generate_prompt_schema_map() {
  const sections = [
    "## PHASE 5: COMPREHENSIVE XML TAG SPECIFICATION MAP",
    "",
    "Authoritative hierarchical XML tag directory across all 9 RPGlitch prompt modes.",
    "The Unified Architecture outlines the merged hierarchy with concise trigger, audience, and module provenance rules.",
    "Individual prompt modes display canonical empty XML skeletons (<TAG></TAG>).",
    "",
    generate_simulation_tag_comparison(),
  ];

  for (let index = 0; index < PROMPT_MODES.length; index += 1) {
    const mode = PROMPT_MODES[index];
    sections.push("", `### ${index + 2}. ${mode.label} (\`${mode.id}\`)`, "", "```xml", render_tag_skeleton(mode.id), "```");
  }

  return sections.join("\n");
}

/* ============================================================================
 * CHANGELOG
 * ============================================================================
 * - 2026-10-15: Standardized root envelope to <SYSTEM> across all modes including Storyteller, purging TURN under P4 Pre-Beta Purity.
 * - 2026-10-15: Unified 9-Mode Architecture & Trigger Provenance — Integrated all 9 prompt modes into the unified XML map, removed mock internal sheet fields, and annotated leaf tags with concise active triggers, audience modes, and external module origins.
 * - 2026-10-15: Pure Automated XML Schema Generator — Replaced 700+ lines of manual string pushes with a declarative PROMPT_LAYER_TREE and recursive render_tag_skeleton compiler.
 * - 2026-10-14: Pure XML Tag Schema Representation — Replaced markdown tables and arrow lists with genuine, hierarchical XML code blocks containing actual XML tags only and zero content between opening and closing tags.
 * - 2026-10-14: Comprehensive XML Tag Specification Map — Created programmatic generator mapping all XML tags, hierarchies, parent/child relationships, and conditional triggers across all 9 RPGlitch prompt modes.
 * ============================================================================ */
