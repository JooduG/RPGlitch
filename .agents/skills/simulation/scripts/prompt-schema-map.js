/**
 * .agents/skills/simulation/scripts/prompt-schema-map.js
 * ============================================================================
 * 🗺️ COMPREHENSIVE PROMPT XML SCHEMA DIRECTORY & TAG SPECIFICATION MAP
 * ============================================================================
 *
 * Exhaustive catalog and hierarchical directory of every XML tag utilized
 * across all nine simulation and utility prompt modes in RPGlitch:
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
 * - Documents where each tag CAN go, parent/child relationships, and conditional triggers.
 * - Conforms strictly to Option A Upper-Camel / Uppercase XML Tag conventions.
 * - Formats markdown cleanly with zero consecutive blank lines and no header brackets.
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

/**
 * Structural definition of every possible XML tag in RPGlitch prompt architectures.
 */
export const XML_TAG_SPECIFICATIONS = Object.freeze([
  // Root Envelopes
  {
    tag: "SYSTEM",
    parent: "ROOT",
    modes: ["all"],
    cardinality: "1",
    condition: "Static root envelope for all closed prompts",
    description: "Encapsulates the entire prompt context, instructions, sheets, history, and task.",
  },
  {
    tag: "TURN",
    parent: "SYSTEM",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Prose interaction envelopes carrying active speaker and listener slug attributes",
    description: "Root conversational envelope specifying runtime speaker and listener actors.",
  },

  // Layer 1: Axiomatic Constitution
  {
    tag: "AXIOMATIC_CONSTITUTION",
    parent: "SYSTEM",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "enhancement", "sorting", "optics"],
    cardinality: "1",
    condition: "Universal primary layer across all prompts",
    description: "Constitutional governing body defining immutable reality laws.",
  },
  {
    tag: "LAW",
    parent: "AXIOMATIC_CONSTITUTION",
    modes: ["all"],
    cardinality: "1..N",
    condition: "Rendered per active constitutional law (L1 Causality, L2 Continuity, L3 Sovereignty, L4 Fidelity)",
    description: "Individual immutable law with index and label attributes.",
  },

  // Layer 2: Core Protocols
  {
    tag: "CORE_PROTOCOLS",
    parent: "SYSTEM",
    modes: ["all"],
    cardinality: "1",
    condition: "Static primary layer governing operational, perspective, and stylistic constraints",
    description: "Core behavioral constraints and protocol rules for the active prompt mode.",
  },
  {
    tag: "CONSTRAINTS",
    parent: "CORE_PROTOCOLS",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Injected dynamically into CORE_PROTOCOLS across all simulation modes",
    description: "Encapsulates static narrative constraints and dynamic repetition guard ledger.",
  },
  {
    tag: "OVERARCHING_QUESTS",
    parent: "CONSTRAINTS",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Static discipline rule in prose constraints",
    description: "Forbids forcing artificial grand quests, epic destinies, or prophetic chosen-one arcs.",
  },
  {
    tag: "SYNTHETIC_FORMULAS",
    parent: "CONSTRAINTS",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Static discipline rule in prose constraints",
    description: "Forbids synthetic therapy-speak, generic emotional summaries, and clinical mood labeling.",
  },
  {
    tag: "CLICHES",
    parent: "CONSTRAINTS",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Static discipline rule in prose constraints",
    description: "Forbids overused literary tropes (shivers down spines, releasing breaths never held, eyes darkening).",
  },
  {
    tag: "EXHAUSTED_OPENINGS",
    parent: "CONSTRAINTS",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Injected when recent history contains repeated sentence starter stems (repetition guard)",
    description: "Explicitly forbids reusing exhausted opening stems from recent turns.",
  },
  {
    tag: "LETHALITY",
    parent: "CONSTRAINTS",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Director constraints block",
    description: "Mandates physical vulnerability, realistic injury risk, and prevents invulnerable plot armor.",
  },
  {
    tag: "AGENCY",
    parent: "CONSTRAINTS",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Director constraints block",
    description: "Prohibits hijacking user decisions, internal thoughts, or involuntary somatic reactions.",
  },
  {
    tag: "GENESIS",
    parent: "CONSTRAINTS",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Director constraints block",
    description: "Governs world-building genesis, preventing arbitrary reality rewrites.",
  },
  {
    tag: "PERSPECTIVE",
    parent: "CORE_PROTOCOLS",
    modes: ["interaction", "narrator", "ghostwrite", "npc", "enhancement", "sorting"],
    cardinality: "0..1",
    condition: "Rendered when POV and tense protocols are active",
    description: "Declares narrative point-of-view (1st/3rd person) and grammatical tense.",
  },
  {
    tag: "ALTERNATION_OPTIONS",
    parent: "CORE_PROTOCOLS",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered when active entities have defined alternations",
    description: "Directs handling of alternative entity manifestations and transformational states.",
  },
  {
    tag: "AUTHORIAL_VOICE",
    parent: "CORE_PROTOCOLS",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered when narrative style is active and not 'default'",
    description: "Injects authorial voice, stylistic description, internal ratio, and signature elements.",
  },
  {
    tag: "SIGNATURE_ELEMENTS",
    parent: "AUTHORIAL_VOICE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered when narrative style specifies distinctive elements",
    description: "Lists core stylistic markers and sensory signatures for the narrative style.",
  },
  {
    tag: "SOVEREIGNTY",
    parent: "AUTHORIAL_VOICE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered when biological user player name is provided",
    description: "Mandates absolute sovereignty protection for the player character.",
  },
  {
    tag: "VISUAL_STYLE",
    parent: "CORE_PROTOCOLS",
    modes: ["optics"],
    cardinality: "0..1",
    condition: "Rendered when visual style is selected and not 'none'",
    description: "Governs visual medium, lighting palette, and artistic textures for diffusion image synthesis.",
  },
  {
    tag: "MEDIUM",
    parent: "VISUAL_STYLE",
    modes: ["optics"],
    cardinality: "0..1",
    condition: "Rendered when visual style provides a medium token",
    description: "Specifies the physical or digital medium (oil on canvas, 35mm film, digital illustration).",
  },
  {
    tag: "PALETTE",
    parent: "VISUAL_STYLE",
    modes: ["optics"],
    cardinality: "0..1",
    condition: "Rendered when visual style provides a color palette token",
    description: "Specifies the lighting, tonal contrast, and color palette.",
  },
  {
    tag: "TEXTURES",
    parent: "VISUAL_STYLE",
    modes: ["optics"],
    cardinality: "0..1",
    condition: "Rendered when visual style provides surface texture tokens",
    description: "Specifies grain, brushwork, reflections, and material textures.",
  },
  {
    tag: "IMAGE_VOCABULARY",
    parent: "CORE_PROTOCOLS",
    modes: ["optics"],
    cardinality: "0..1",
    condition: "Static optics protocol",
    description: "Enforces FLUX/T5 natural language weighting; forbids numeric bracket syntax.",
  },
  {
    tag: "TEXT_RENDERING",
    parent: "CORE_PROTOCOLS",
    modes: ["optics"],
    cardinality: "0..1",
    condition: "Static optics protocol",
    description: "Restricts in-frame text rendering to explicit diegetic signage and graffiti.",
  },

  // Layer 3: Dynamic Axes (Director Specific)
  {
    tag: "DYNAMIC_AXES",
    parent: "SYSTEM",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered in Director Shot 1 when somatic or fractal dynamics are present",
    description: "Displays current dynamic calibrations and axes for companion and setting.",
  },
  {
    tag: "CALIBRATION",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Explains dynamic polarity reading rules",
    description: "Instructions for interpreting numerical dynamic axes across 0-100 scales.",
  },
  {
    tag: "CHAOS",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered for somatic entity with chaos dynamic",
    description: "Somatic axis measuring Order (low) vs Volatility (high).",
  },
  {
    tag: "INTENSITY",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered for somatic entity with intensity dynamic",
    description: "Somatic axis measuring Subtlety (low) vs Force (high).",
  },
  {
    tag: "OPENNESS",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered for somatic entity with openness dynamic",
    description: "Somatic axis measuring Guardedness (low) vs Vulnerability (high).",
  },
  {
    tag: "AFFINITY",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered for somatic entity with affinity dynamic",
    description: "Somatic axis measuring Detachment (low) vs Devotion (high).",
  },
  {
    tag: "VELOCITY",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered for fractal world entity with velocity dynamic",
    description: "Fractal axis measuring Suspension (low) vs Acceleration (high).",
  },
  {
    tag: "ENTROPY",
    parent: "DYNAMIC_AXES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered for fractal world entity with entropy dynamic",
    description: "Fractal axis measuring Coherence (low) vs Collapse (high).",
  },

  // Layer 4: Entities & Sheets
  {
    tag: "ENTITIES",
    parent: "SYSTEM",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
    cardinality: "0..1",
    condition: "Rendered when active character or fractal entities are present in context",
    description: "Encapsulates character and world sheets for all participants in the scene.",
  },
  {
    tag: "CHARACTER",
    parent: "ENTITIES",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
    cardinality: "1..N",
    condition: "Rendered per active character in scene (AI companion, User persona, NPCs)",
    description: "Complete character sheet containing identity, psychology, state, and relations.",
  },
  {
    tag: "FRACTAL",
    parent: "ENTITIES",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
    cardinality: "0..1",
    condition: "Rendered when a world fractal is active",
    description: "World and setting sheet containing geography, atmosphere, and environmental state.",
  },
  {
    tag: "PSYCHOLOGY",
    parent: "CHARACTER",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for somatic characters with non-physical eternal traits",
    description: "Core essence, deep psychological motivations, and eternal drives.",
  },
  {
    tag: "AGENDA",
    parent: "CHARACTER",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for characters with future trajectory or active plans",
    description: "Active standing trajectory, immediate intentions, and strategic agenda.",
  },
  {
    tag: "PERSONALITY",
    parent: "CHARACTER",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for characters with immediate emotional and behavioral conditions",
    description: "Immediate present emotional disposition and transient psychological state.",
  },
  {
    tag: "STATE",
    parent: "CHARACTER",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for characters with present physical conditions and inventory",
    description: "Current physical status, posture, clothing, inventory, and bodily conditions.",
  },
  {
    tag: "RELATION",
    parent: "CHARACTER",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..N",
    condition: "Rendered for directed relational attitudes between entities",
    description: "Relational stance with subject, predicate, and optional weight attributes.",
  },
  {
    tag: "APPEARANCE",
    parent: "CHARACTER",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc", "optics"],
    cardinality: "0..1",
    condition: "Rendered for physical appearance and somatic traits",
    description: "Baseline anatomical build, facial structure, and physical features.",
  },
  {
    tag: "GEOGRAPHY",
    parent: "FRACTAL",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for world fractals with baseline physical landmarks",
    description: "Permanent physical topography, architectural landmarks, and spatial geometry.",
  },
  {
    tag: "ATMOSPHERE",
    parent: "FRACTAL",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for world fractals with present atmospheric conditions",
    description: "Current meteorological weather, lighting conditions, and sensory pressure.",
  },
  {
    tag: "SETTING",
    parent: "FRACTAL",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered for world fractals with cultural, thematic, and historical essence",
    description: "Cultural lore, historical backdrop, and thematic world tone.",
  },
  {
    tag: "AVAILABLE_ENTITIES",
    parent: "ENTITIES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Rendered in Director Shot 1 when candidate cast entities are available for activation",
    description: "Roster of off-stage entities available for the Director to summon into the scene.",
  },
  {
    tag: "CANDIDATE",
    parent: "AVAILABLE_ENTITIES",
    modes: ["director"],
    cardinality: "0..N",
    condition: "Rendered per candidate entity with id and type attributes",
    description: "Candidate entity summary with short description and current state.",
  },

  // Layer 5: History
  {
    tag: "HISTORY",
    parent: "SYSTEM",
    modes: ["director", "interaction", "narrator", "ghostwrite", "npc", "continuum", "optics"],
    cardinality: "0..1",
    condition: "Rendered when simulation message log is non-empty",
    description: "Sequential transcript of recent conversational turns and scene actions.",
  },
  {
    tag: "ACTION",
    parent: "HISTORY",
    modes: ["all"],
    cardinality: "0..N",
    condition: "Rendered per historical turn with round, origin, and actor attributes",
    description: "Individual turn action containing dialogue, prose, and somatic events.",
  },

  // Layer 6: Utility Entity Slots
  {
    tag: "TARGET_ENTITY",
    parent: "SYSTEM",
    modes: ["continuum"],
    cardinality: "0..1",
    condition: "Continuum memory consolidation target entity block",
    description: "Target entity undergoing memory formation, semantic indexing, and ledger audit.",
  },
  {
    tag: "CAST",
    parent: "SYSTEM",
    modes: ["continuum"],
    cardinality: "0..1",
    condition: "Continuum nearby witness entities",
    description: "Nearby entities acting as witnesses or relational anchors during consolidation.",
  },
  {
    tag: "CHAPTER_HISTORY",
    parent: "SYSTEM",
    modes: ["continuum"],
    cardinality: "0..1",
    condition: "Rendered when chapter milestones are recorded for the target entity",
    description: "Completed chapter digests and milestone narrative summaries.",
  },
  {
    tag: "MEMORY_ADVISORY",
    parent: "SYSTEM",
    modes: ["continuum"],
    cardinality: "0..1",
    condition: "Rendered when target entity has existing settled facts and memories",
    description: "Advisory rules for evicting, consolidating, or merging memory vectors.",
  },
  {
    tag: "FIELD_CONTEXT",
    parent: "SYSTEM",
    modes: ["enhancement"],
    cardinality: "0..1",
    condition: "Enhancement target attribute field and surrounding profile context",
    description: "Current field value, field schema, and related entity traits undergoing enhancement.",
  },

  // Layer 7: Task & Directives
  {
    tag: "TASK",
    parent: "SYSTEM",
    modes: ["all"],
    cardinality: "1",
    condition: "Sealed inside SYSTEM envelope at prompt conclusion",
    description: "Immediate operational mandate, input stimulus, posture, and output expectations.",
  },
  {
    tag: "CURRENTS",
    parent: "TASK",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Rendered in character task to establish sensory and conversational currents",
    description: "Immediate dramatic beat context, active participant dynamics, and sensory anchor.",
  },
  {
    tag: "DELIVERY_POSTURE",
    parent: "TASK",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Dynamic prose reflex posture derived from input length and conversational rhythm",
    description: "Combines temperament, cadence, pacing, rhythm, drive, and conditional reflex permits.",
  },
  {
    tag: "TEMPERAMENT",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Reflex posture atom derived from speaker openness and intensity",
    description: "Internal emotional posture (restrained, guarded, open, assertive).",
  },
  {
    tag: "CADENCE",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Reflex posture atom derived from vocal rhythm",
    description: "Sentence length distribution, rhythmic pauses, and delivery flow.",
  },
  {
    tag: "PACING",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Reflex posture atom derived from input length (TERSE, ADAPTIVE, EXPANSIVE)",
    description: "Output length calibration matching conversational breath.",
  },
  {
    tag: "RHYTHM",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Standard narrative cadence atom",
    description: "Directs building situational friction rather than rushing easy resolution.",
  },
  {
    tag: "DRIVE",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Reflex posture atom (WITH_INPUT vs WITHOUT_INPUT)",
    description: "Directs independently advancing the scene and closing on an unresolved hook.",
  },
  {
    tag: "FIRST_CONTACT",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Injected on Round 1 when characters meet for the first time without prior relationship",
    description: "Mandates acknowledging visual first impressions and physical distance.",
  },
  {
    tag: "ROUND_ONE",
    parent: "DELIVERY_POSTURE",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Injected in Director quick shot on Round 1 following prologue",
    description: "Directs next_action to select AI_CHARACTER following Fractal opening.",
  },
  {
    tag: "MOMENTUM_SOFT_PERMIT",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Injected when stagnation_turns >= 8 and < 16",
    description: "Lifts anti-staging constraints and grants permission to break blocking or shift focus.",
  },
  {
    tag: "MOMENTUM_HARD_MANDATE",
    parent: "DELIVERY_POSTURE",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Injected when stagnation_turns >= 16",
    description: "Strictly forbids circular banter; forces irreversible transition or external arrival.",
  },
  {
    tag: "SUBTEXT",
    parent: "TASK",
    modes: ["interaction", "narrator", "npc"],
    cardinality: "0..1",
    condition: "Injected when keywords or extreme dynamics pressure are active",
    description: "Contains unspoken psychological tensions and somatic subcurrents.",
  },
  {
    tag: "THEMATIC_CURRENT",
    parent: "SUBTEXT",
    modes: ["interaction", "narrator", "npc"],
    cardinality: "0..1",
    condition: "Rendered when narrative keywords are supplied by the Director",
    description: "Thematic keywords to weave into sensory texture without overt naming.",
  },
  {
    tag: "DYNAMICS_PRESSURE",
    parent: "SUBTEXT",
    modes: ["interaction", "narrator", "npc"],
    cardinality: "0..1",
    condition: "Rendered when dynamics breach extreme thresholds",
    description: "Psychological and physical tension driven by extreme dynamics values.",
  },
  {
    tag: "STABILITY_LOCK",
    parent: "TASK",
    modes: ["interaction", "narrator", "ghostwrite", "npc"],
    cardinality: "0..1",
    condition: "Injected when stability lock is engaged in metadata",
    description: "Prevents radical personality shifts or sudden dramatic ungrounded reversals.",
  },
  {
    tag: "DIRECTIVES",
    parent: "TASK",
    modes: ["director", "continuum", "enhancement", "sorting", "optics"],
    cardinality: "0..1",
    condition: "Standard operational directives container for utility and director turns",
    description: "Numbered or itemized procedural execution steps.",
  },
  {
    tag: "DIRECTIVE",
    parent: "DIRECTIVES",
    modes: ["director", "continuum", "enhancement", "sorting", "optics"],
    cardinality: "0..N",
    condition: "Individual operational directive rule",
    description: "Action-specific instruction for the active prompt task.",
  },
  {
    tag: "MOMENTUM",
    parent: "DIRECTIVES",
    modes: ["director"],
    cardinality: "0..1",
    condition: "Injected into Director task when stagnation_turns >= 8 (soft) or >= 16 (critical)",
    description: "Directorial momentum warning with tier attribute ('soft' or 'critical').",
  },
  {
    tag: "SCENE_DIRECTIVE",
    parent: "TASK",
    modes: ["narrator"],
    cardinality: "0..1",
    condition: "Narrator scene template directive (Prologue, Epilogue, Collapse)",
    description: "Structural scene staging instructions for atmospheric narrative beats.",
  },
  {
    tag: "INPUT",
    parent: "TASK",
    modes: ["all"],
    cardinality: "0..1",
    condition: "Carries the incoming user message, turn stimulus, or candidate text",
    description: "Incoming stimulus with optional kind, round, origin, or channel attributes.",
  },
  {
    tag: "THINK",
    parent: "TASK",
    modes: ["interaction", "narrator", "ghostwrite", "npc", "enhancement"],
    cardinality: "0..1",
    condition: "Instructs model to generate private cognitive deliberation before output",
    description: "Requires internal reasoning within <think> tags before delivering output.",
  },
  {
    tag: "OUTPUT_FORMAT",
    parent: "TASK",
    modes: ["director", "continuum", "enhancement", "sorting", "optics"],
    cardinality: "0..1",
    condition: "Declares strict output schema requirements (JSON schema or formatting rules)",
    description: "Structural output specification, expected keys, or bracket schemas.",
  },
]);

/**
 * Builds the canonical side-by-side XML Tag Map comparing Director Shot 1 and Character Shot 2.
 * @returns {string} Markdown formatted comparison table.
 */
export function generate_simulation_tag_comparison() {
  const lines = [
    "### Simulation Core: Director (Shot 1) vs. Character (Shot 2) XML Hierarchy",
    "",
    "| Canonical Layer | Director Prompt (Shot 1) | Character Interaction Prompt (Shot 2) | Placement & Trigger |",
    "| :--- | :--- | :--- | :--- |",
    '| **Root Envelope** | `<SYSTEM mode="director">` | `<SYSTEM mode="interaction"><TURN speaker="..." listener="...">` | Always root; TURN holds slugs |',
    '| **Constitution** | `<AXIOMATIC_CONSTITUTION>`<br>└ `<LAW index="L1-L4">` | `<AXIOMATIC_CONSTITUTION>`<br>└ `<LAW index="L1-L4">` | Static Layer 1 in both |',
    "| **Core Protocols** | `<CORE_PROTOCOLS>`<br>└ `<CONSTRAINTS>`<br>&nbsp;&nbsp;├ `<LETHALITY>`<br>&nbsp;&nbsp;├ `<AGENCY>`<br>&nbsp;&nbsp;└ `<GENESIS>` | `<CORE_PROTOCOLS>`<br>└ `<CONSTRAINTS>`<br>&nbsp;&nbsp;├ `<OVERARCHING_QUESTS>`<br>&nbsp;&nbsp;├ `<SYNTHETIC_FORMULAS>`<br>&nbsp;&nbsp;├ `<CLICHES>`<br>&nbsp;&nbsp;└ `<EXHAUSTED_OPENINGS>`<br>└ `<PERSPECTIVE>`<br>└ `<AUTHORIAL_VOICE>`<br>&nbsp;&nbsp;├ `<SIGNATURE_ELEMENTS>`<br>&nbsp;&nbsp;└ `<SOVEREIGNTY>` | Static Layer 2; Director has systemic laws; Character has prose disciplines & voice |",
    "| **Dynamic Axes** | `<DYNAMIC_AXES>`<br>├ `<CALIBRATION>`<br>├ `<CHAOS>`<br>├ `<INTENSITY>`<br>├ `<OPENNESS>`<br>├ `<AFFINITY>`<br>├ `<VELOCITY>`<br>└ `<ENTROPY>` | *(Omitted — cached)* | Director only; 0-100 numerical physics snapshot |",
    '| **Entities & Sheets** | `<ENTITIES>`<br>├ `<CHARACTER id="...">` (AI, USER, NPC)<br>├ `<FRACTAL id="...">`<br>└ `<AVAILABLE_ENTITIES>`<br>&nbsp;&nbsp;└ `<CANDIDATE id="...">` | `<ENTITIES>`<br>├ `<CHARACTER id="...">` (AI, USER, NPC)<br>&nbsp;&nbsp;├ `<PSYCHOLOGY>`<br>&nbsp;&nbsp;├ `<AGENDA>`<br>&nbsp;&nbsp;├ `<PERSONALITY>`<br>&nbsp;&nbsp;├ `<STATE>`<br>&nbsp;&nbsp;├ `<RELATION subject="..." predicate="...">`<br>&nbsp;&nbsp;└ `<APPEARANCE>`<br>└ `<FRACTAL id="...">`<br>&nbsp;&nbsp;├ `<GEOGRAPHY>`<br>&nbsp;&nbsp;├ `<ATMOSPHERE>`<br>&nbsp;&nbsp;└ `<SETTING>` | Layer 4; Director carries available candidates; Character carries deep quad-state sheets |',
    '| **History** | `<HISTORY>`<br>└ `<ACTION round="..." origin="...">` | `<HISTORY>`<br>└ `<ACTION round="..." origin="...">` | Layer 5; message log transcript |',
    '| **Task: Action Stimulus** | `<TASK>`<br>└ `<INPUT kind="turn">` | `<TASK>`<br>└ `<ACTION round="..." origin="..." speaker="..." listener="...">` | Layer 7; active turn trigger |',
    "| **Task: Prose Posture** | *(Omitted — director is analytical)* | `<DELIVERY_POSTURE>`<br>├ `<TEMPERAMENT>`<br>├ `<CADENCE>`<br>├ `<PACING>`<br>├ `<RHYTHM>`<br>├ `<DRIVE>`<br>├ `<FIRST_CONTACT>` *(conditional)*<br>├ `<MOMENTUM_SOFT_PERMIT>` *(conditional: turns >= 8)*<br>└ `<MOMENTUM_HARD_MANDATE>` *(conditional: turns >= 16)* | Character task; dynamic behavioral reflex |",
    "| **Task: Subtext** | *(Omitted)* | `<SUBTEXT>`<br>├ `<THEMATIC_CURRENT>` *(director keywords)*<br>└ `<DYNAMICS_PRESSURE>` *(physics breach)* | Character task; conditional psychological currents |",
    '| **Task: Directives** | `<DIRECTIVES>`<br>├ `<DIRECTIVE>` *(action rules)*<br>└ `<MOMENTUM tier="soft|critical">` *(conditional)* | *(Omitted — absorbed into Delivery Posture)* | Directives stripped from character task; pure turn action in Director |',
    "| **Task: Output / Cognition** | Strict JSON Schema:<br>`_thought_process`<br>`next_action`<br>`keywords`<br>`dynamics_deltas`<br>`visual_staging`<br>`spotlight` | `<THINK>` *(Private internal reflection)*<br>followed by unadorned in-character prose | Director emits parsed JSON; Character emits `<think>` + pure prose |",
  ];
  return lines.join("\n");
}

/**
 * Builds the complete markdown tag directory for all nine prompt modes.
 * @returns {string} Markdown formatted comprehensive XML schema map.
 */
export function generate_prompt_schema_map() {
  const sections = [];

  sections.push("## PHASE 5: COMPREHENSIVE XML TAG SPECIFICATION MAP");
  sections.push("");
  sections.push("This authoritative directory maps every XML tag utilized in RPGlitch prompt construction.");
  sections.push("It specifies canonical slot ordering, parent/child relationships, allowed modes, and conditional trigger rules.");
  sections.push("");
  sections.push(generate_simulation_tag_comparison());
  sections.push("");
  sections.push("### Exhaustive XML Tag Directory (All 9 Modes)");
  sections.push("");
  sections.push("| XML Tag | Parent Tag | Supported Modes | Cardinality | Condition / Trigger Rule | Description |");
  sections.push("| :--- | :--- | :--- | :--- | :--- | :--- |");

  for (const item of XML_TAG_SPECIFICATIONS) {
    const modes_string = item.modes.includes("all") ? "All 9 Modes" : item.modes.join(", ");
    sections.push(
      `| \`<${item.tag}>\` | \`<${item.parent}>\` | ${modes_string} | \`${item.cardinality}\` | ${item.condition} | ${item.description} |`,
    );
  }

  sections.push("");
  sections.push("### Utility & Secondary Prompt Mode Structures");
  sections.push("");
  sections.push("1. **Narrator Mode (`narrator`)**");
  sections.push(
    "   - `SYSTEM` → `TURN` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` (`CONSTRAINTS`, `PERSPECTIVE`, `AUTHORIAL_VOICE`) → `ENTITIES` → `HISTORY` → `TASK` (`ACTION`, `CURRENTS`, `DELIVERY_POSTURE`, `SCENE_DIRECTIVE`, `SUBTEXT`, `THINK`)",
  );
  sections.push("   - *Scene Templates*: Prologue (`PROLOGUE`), Continuation (`CONTINUATION`), Epilogue (`EPILOGUE`), Collapse (`COLLAPSE`).");
  sections.push("");
  sections.push("2. **Ghostwrite Mode (`ghostwrite`)**");
  sections.push(
    "   - `SYSTEM` → `TURN` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` (`CONSTRAINTS`, `PERSPECTIVE`) → `ENTITIES` (AI↔USER visibility swapped) → `HISTORY` → `TASK` (`ACTION`, `DELIVERY_POSTURE`, `THINK`)",
  );
  sections.push("   - *Purity Rule*: Subtext omitted (user dynamics are static profile baselines).");
  sections.push("");
  sections.push("3. **NPC Mode (`npc`)**");
  sections.push(
    "   - `SYSTEM` → `TURN` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` → `ENTITIES` (includes active NPC persona sheet) → `HISTORY` → `TASK` (`ACTION`, `DELIVERY_POSTURE`, `SUBTEXT`, `THINK`)",
  );
  sections.push("");
  sections.push("4. **Continuum Mode (`continuum`)**");
  sections.push(
    "   - `SYSTEM` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` → `TARGET_ENTITY` → `CAST` (witnesses) → `CHAPTER_HISTORY` → `MEMORY_ADVISORY` (settled facts) → `HISTORY` (budgeted window) → `TASK` (`DIRECTIVES`, `OUTPUT_FORMAT`)",
  );
  sections.push("");
  sections.push("5. **Enhancement Mode (`enhancement`)**");
  sections.push(
    '   - `SYSTEM` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` (with dynamic Layer Tense) → `FIELD_CONTEXT` → `TASK` (`DIRECTIVES`, `INPUT kind="content"`, `OUTPUT_FORMAT`, `THINK`)',
  );
  sections.push("");
  sections.push("6. **Sorting Mode (`sorting`)**");
  sections.push(
    '   - `SYSTEM` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` (3rd person) → `TASK` (`DIRECTIVES` [Ingestion vs Redistribution], `INPUT kind="bio"`, `OUTPUT_FORMAT`)',
  );
  sections.push("");
  sections.push("7. **Optics Mode (`optics`)**");
  sections.push(
    '   - `SYSTEM` → `AXIOMATIC_CONSTITUTION` → `CORE_PROTOCOLS` (`IMAGE_VOCABULARY`, `TEXT_RENDERING`, `VISUAL_STYLE` [`MEDIUM`, `PALETTE`, `TEXTURES`]) → `ENTITIES` (`CHARACTER`, `FRACTAL`) → `HISTORY` → `TASK` (`DIRECTIVES`, `INPUT kind="scene"`, `OUTPUT_FORMAT`)',
  );

  return sections.join("\n");
}

/* ============================================================================
 * CHANGELOG
 * ============================================================================
 * - 2026-10-14: Comprehensive XML Tag Specification Map — Created programmatic generator mapping all XML tags, hierarchies, parent/child relationships, and conditional triggers across all 9 RPGlitch prompt modes.
 * ============================================================================ */
