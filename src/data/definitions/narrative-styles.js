/**
 * src/data/definitions/narrative-styles.js
 * ============================================================================
 * 📖 NARRATIVE STYLE SYSTEM — Declarative Author, Director & Genre Presets
 * ============================================================================
 *
 * Single source of truth for:
 * - NARRATIVE_STYLES: Declarative author voice presets & narrative engines
 * - STYLE_MOTIF_REGISTRY: Dynamic style-motif keyword registry auto-aggregated from styles
 * - get_narrative_style: Retrieves a style record by identifier with safe fallback
 * - get_style_keywords: Resolves dynamic keyword sets contributed by an active style
 * - resolve_active_style_key: Resolves the active style key from fractal or application state
 * - render_narrative_style_xml: Compiles the pre-computed active style XML block
 *
 * Architecture & Modification Rules:
 * - Pure data definition module importing downward strictly from `@utils`.
 * - All style entries must specify a valid speaking_style ("casual" | "lyrical" | "primal" | "clinical").
 * - Dynamic motifs are co-located with their author definitions and auto-aggregated into `STYLE_MOTIF_REGISTRY`.
 * ============================================================================
 */

import { state_bridge, ind, escape_xml, resolve_style } from "@utils";

// ============================================================================
// 1. Type Definitions
// ============================================================================

/**
 * @typedef {Object} DynamicsState
 * @property {number} [intensity]
 * @property {number} [chaos]
 * @property {number} [openness]
 * @property {number} [affinity]
 * @property {number} [velocity]
 * @property {number} [entropy]
 */

/**
 * @typedef {Object} StyleTrigger
 * @property {string} id
 * @property {(character_dynamics?: DynamicsState | null, fractal_dynamics?: DynamicsState | null) => boolean} when
 * @property {string} directive
 */

/**
 * @typedef {Object} StyleDNA
 * @property {number} internal_ratio - Ratio of internal monologue vs action (0.0 - 1.0)
 * @property {string} rhythm - Sentence structure and prose cadence
 * @property {string} sensory - Priority order of senses (e.g. Touch > Scent > Sight > Sound)
 * @property {string} grounding - Core emotional & somatic anchoring philosophy
 */

/**
 * @typedef {Object} NarrativeStyle
 * @property {string} id
 * @property {string} name
 * @property {string} [portrait]
 * @property {string} description
 * @property {"casual" | "lyrical" | "primal" | "clinical"} speaking_style
 * @property {string[]} keywords
 * @property {string} narrative_engine
 * @property {string[]} [keywords]
 * @property {Record<string, string>} [motifs]
 * @property {string} xml
 * @property {StyleTrigger[]} triggers
 */

// ============================================================================
// 2. Declarative Style Compiler
// ============================================================================

/**
 * Factory creating a compiled, fully validated NarrativeStyle record.
 * Automatically formats `dna` into standard XML <NARRATIVE_ENGINE> format.
 *
 * @param {Object} style_definition
 * @param {string} style_definition.id
 * @param {string} style_definition.name
 * @param {string} [style_definition.portrait]
 * @param {string} style_definition.description
 * @param {"casual" | "lyrical" | "primal" | "clinical"} style_definition.speaking_style
 * @param {string[]} style_definition.keywords
 * @param {StyleDNA} [style_definition.dna]
 * @param {Record<string, string>} [style_definition.motifs]
 * @param {StyleTrigger[]} [style_definition.triggers]
 * @returns {NarrativeStyle}
 */
function define_style(style_definition) {
  const keywords = style_definition.motifs ? Object.keys(style_definition.motifs) : [];

  const narrative_engine = style_definition.dna
    ? `<NARRATIVE_ENGINE>
<internal_ratio>${style_definition.dna.internal_ratio.toFixed(2)}</internal_ratio>
<sentence_rhythm>${style_definition.dna.rhythm}</sentence_rhythm>
<sensory_order>${style_definition.dna.sensory}</sensory_order>
<emotion_grounding>${style_definition.dna.grounding}</emotion_grounding>
</NARRATIVE_ENGINE>`
    : "";

  let xml = "";
  if (style_definition.id && style_definition.id !== "default") {
    const description_xml = style_definition.description ? `\n    <DESCRIPTION>${escape_xml(style_definition.description)}</DESCRIPTION>` : "";
    const keywords_xml = style_definition.keywords?.length
      ? `\n    <DEFINING_CHARACTERISTICS>${escape_xml(style_definition.keywords.join(", "))}</DEFINING_CHARACTERISTICS>`
      : "";
    const narrative_engine_xml = narrative_engine ? `\n    ${ind(narrative_engine, 4).trim()}` : "";
    xml = `\n  <NARRATIVE_STYLE narrator="${escape_xml(style_definition.id)}">${description_xml}${keywords_xml}${narrative_engine_xml}\n  </NARRATIVE_STYLE>`;
  }

  return {
    id: style_definition.id,
    name: style_definition.name,
    portrait: style_definition.portrait || "",
    description: style_definition.description,
    speaking_style: style_definition.speaking_style,
    tags: style_definition.keywords,
    keywords,
    motifs: style_definition.motifs || {},
    narrative_engine,
    xml,
    triggers: style_definition.triggers || [],
  };
}

// ============================================================================
// 3. Narrative Style Presets Catalog
// ============================================================================

/** @type {Readonly<Record<string, NarrativeStyle>>} */
export const NARRATIVE_STYLES = Object.freeze({
  default: define_style({
    id: "default",
    name: "No Narrative Style",
    portrait: "https://user.uploads.dev/file/f968b744a4afde6ab81c0e751dc5e972.png",
    description: "Standard system instructions without author style overlay.",
    speaking_style: "casual",
    keywords: ["default", "neutral", "standard"],
  }),

  anais_nin: define_style({
    id: "anais_nin",
    name: "Anaïs Nin",
    portrait: "https://user.uploads.dev/file/ac255c9a8af91d5082b0063f2b686a71.png",
    description:
      "Lyrical, poetic, and intensely sensual prose that is deeply introspective and psychoanalytic, drawing heavily on dreams and subconscious thought.",
    speaking_style: "lyrical",
    keywords: ["author", "erotica", "queer_desire", "psychoanalysis", "dreams_vs_reality"],
    motifs: {
      sensual_submersion: "Sensory blur and lyrical interiority; emotional states surface as vast, intimate physical landscapes.",
    },
    dna: {
      internal_ratio: 0.8,
      rhythm: "Stream-of-consciousness, fluid, non-linear, following emotional logic over temporal order.",
      sensory: "Touch (Sensual) > Scent (Intimate) > Sight (Symbolic) > Sound",
      grounding: "Psychoanalytic and somatic. Internal states manifest as vast, exploreable physical landscapes.",
    },
    triggers: [
      {
        id: "ANAIS_NIN_LYRICAL",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.affinity ?? 50) > 60,
        directive: "Amplify lyrical, metaphorical prose and intensify sensory blur.",
      },
      {
        id: "ANAIS_NIN_DREAMLIKE",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) < 40 && (character_dynamics?.openness ?? 50) < 40,
        directive: "Fragment the prose rhythm into dreamlike, distant observations.",
      },
      {
        id: "ANAIS_NIN_SURREAL",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) > 70 && (character_dynamics?.intensity ?? 50) > 60,
        directive: "Infuse prose with vibrant, surreal imagery focused on light and color.",
      },
      {
        id: "ANAIS_NIN_SUBMERSION",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) < 50 && (character_dynamics?.openness ?? 50) < 50,
        directive: "Surfacing themes of submersion, currents, and drowning.",
      },
      {
        id: "ANAIS_NIN_DISGUISES",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) < 30 && (character_dynamics?.affinity ?? 50) < 40,
        directive: "Highlighting masks, disguises, and hidden identity.",
      },
    ],
  }),

  anna_zaires: define_style({
    id: "anna_zaires",
    name: "Anna Zaires",
    portrait: "https://user.uploads.dev/file/9da5e7dafb89e544ddbbe5df22fb25dc.png",
    description: "Dark psychological prose centered on captivity, obsession, rationalized control, and intense psychological dependence.",
    speaking_style: "primal",
    keywords: ["author", "captivity", "psychological", "dark_romance", "possession"],
    motifs: {
      captive_control: "Rationalized possession; obsessive hyper-focus and stark declarations of constraint.",
    },
    dna: {
      internal_ratio: 0.85,
      rhythm:
        "Obsessive, hyper-focused, and declarative. Long analytical evaluations of power dynamics punctuated by stark declarations of constraint.",
      sensory: "Sight (Tracking Antagonist) > Sound (Voice Cadence/Commands) > Touch (Forced/Controlling) > Scent",
      grounding: "Survival and obsession. Shifts in dynamic register through self-preservation, rationalized dominance, and captive dependence.",
    },
    triggers: [
      {
        id: "ANNA_ZAIRES_CONFLICTED",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.affinity ?? 50) > 60,
        directive: "Render internal monologue as highly conflicted and self-questioning, with graphic, unsparing physical detail.",
      },
      {
        id: "ANNA_ZAIRES_OWNERSHIP",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60,
        directive: "Emphasize physical symbols of possession and total control.",
      },
      {
        id: "ANNA_ZAIRES_NO_RETURN",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 60,
        directive: "Focus on irrevocable choices and psychological points of no return.",
      },
    ],
  }),

  bernardo_bertolucci: define_style({
    id: "bernardo_bertolucci",
    name: "Bernardo Bertolucci",
    portrait: "https://user.uploads.dev/file/9a6c0d6bcc8e8f04e20eb99eb40cf83e.png",
    description:
      "Lush, operatic prose framing physical intimacy as rebellion inside unstable worlds. Lingers unflinchingly on bodily textures, light, and decaying architecture.",
    speaking_style: "lyrical",
    keywords: ["director", "psychological", "erotica", "political_rebellion", "decaying_beauty"],
    motifs: {
      decaying_opulence: "Lush operatic intimacy inside unstable worlds; linger on bodily textures, light, and decaying architecture.",
    },
    dna: {
      internal_ratio: 0.6,
      rhythm: "Sweeping, lyrical, and fluidly spatial, fragmenting into raw cadence during physical confrontations.",
      sensory: "Sight (Cinematic Light/Decay) > Touch (Bodily/Desperate) > Sound (Music/Ambient) > Scent",
      grounding: "Environmental and non-verbal. Internal states reflect through dusty architecture and wordless contact.",
    },
    triggers: [
      {
        id: "BERTOLUCCI_SENSUAL",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.affinity ?? 50) > 60,
        directive: "Render prose as deeply sensual and unflinching, lingering on skin textures and ambient light.",
      },
      {
        id: "BERTOLUCCI_DECAY",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) < 30 || (character_dynamics?.chaos ?? 50) > 80,
        directive: "Shift tone into melancholic reflections focused on architectural decay and passing time.",
      },
    ],
  }),

  cara_mckenna: define_style({
    id: "cara_mckenna",
    name: "Cara McKenna",
    portrait: "https://user.uploads.dev/file/f9636773932371f0b697841be8a6471d.png",
    description: "Gritty, realistic prose focused on raw vulnerability, working-class realism, and physical touch.",
    speaking_style: "casual",
    keywords: ["author", "contemporary", "working_class", "raw_vulnerability", "tactile_realism"],
    motifs: {
      tactile_grounding: "Raw working-class touch; feelings grounded in muscle tension, breathing rate, and physical friction.",
    },
    dna: {
      internal_ratio: 0.7,
      rhythm: "Short burst clusters resolving into longer, grounded reflective observations.",
      sensory: "Touch (Texture/Temperature) > Scent (Skin/Workplace) > Sound > Sight",
      grounding: "Visceral and tactile. Feelings are grounded in muscle tension, breathing rate, and physical friction.",
    },
    triggers: [
      {
        id: "CARA_MCKENNA_LOOPING",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 60 && (character_dynamics?.intensity ?? 50) > 60,
        directive: "Fragment sentence structure into looping, hyper-focused auditory impressions.",
      },
      {
        id: "CARA_MCKENNA_TACTILE",
        when: (character_dynamics) => (character_dynamics?.affinity ?? 50) > 60 && (character_dynamics?.openness ?? 50) > 60,
        directive: "Enrich tactile and sensory details, grounding intimacy in physical touch and scent.",
      },
      {
        id: "CARA_MCKENNA_SKIN",
        when: (character_dynamics) => (character_dynamics?.affinity ?? 50) > 50,
        directive: "Notice intimate skin scents and immediate physical warmth.",
      },
      {
        id: "CARA_MCKENNA_SILENCE",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) < 30,
        directive: "Draw out heavy, grounded shared silence between characters.",
      },
    ],
  }),

  cormac_mccarthy: define_style({
    id: "cormac_mccarthy",
    name: "Cormac McCarthy",
    portrait: "https://user.uploads.dev/file/d765a99e806b05f27cc8ba497ddf9ebe.png",
    description: "A brutalist, stark narrative style using polysyndeton, omitted punctuation, and an objective, unvarnished gaze.",
    speaking_style: "casual",
    keywords: ["author", "brutalist", "existential", "minimalist_punctuation", "gothic_western"],
    motifs: {
      blunt_fatalism: "Unvarnished brutalist gaze; emotional truth inferred purely from survival mechanics.",
    },
    dna: {
      internal_ratio: 0.2,
      rhythm: "Polysyndetic, unpunctuated. Clauses bound by repeating conjunctions terminating in blunt declarations.",
      sensory: "Sight (Barren Terrain/Blood) > Touch (Cold Steel/Grit) > Sound (Wind/Sparse Speech) > Scent",
      grounding: "Fatalistic and completely unstated. Internal states are inferred purely from survival mechanics.",
    },
    triggers: [
      {
        id: "MCCARTHY_BRUTAL",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70,
        directive: "Strip punctuation, omit quotes, and deliver relentless, brutal, clinical declarations.",
      },
      {
        id: "MCCARTHY_FATALISM",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 60,
        directive: "Remove quotation marks, keep dialogue terse and fragmented, and deepen bleak fatalism.",
      },
    ],
  }),

  david_lynch: define_style({
    id: "david_lynch",
    name: "David Lynch",
    portrait: "https://user.uploads.dev/file/2948ac605cb8679e03e44010a28256a8.png",
    description: "A surreal narrative style governed by nightmare logic, auditory dread, temporal distortions, and uncanny mystery.",
    speaking_style: "clinical",
    keywords: ["director", "surrealism", "nightmare_logic", "uncanny", "neo_noir"],
    motifs: {
      uncanny_hum: "Nightmare logic beneath still surfaces; auditory dread and uncanny mystery in ordinary moments.",
    },
    dna: {
      internal_ratio: 0.4,
      rhythm: "Hypnotic, slow, lingering. Earnest, plain dialogue juxtaposed against sudden surreal distortions.",
      sensory: "Sound (Industrial Reverb/Frequency Buzz) > Sight (Strobe/Shadow) > Touch (Velvet/Heat) > Scent",
      grounding: "Subconscious fragmentation. Panic and euphoria are inverted and treated as raw psychic phenomena.",
    },
    triggers: [
      {
        id: "LYNCH_DISTORTION",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 70,
        directive: "Distort sensory details into unsettling industrial vibrations and fragmented nightmare logic.",
      },
      {
        id: "LYNCH_INDUSTRIAL_HUM",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 50,
        directive: "Incorporate low industrial hums and subterranean electrical vibrations.",
      },
    ],
  }),

  edgar_allan_poe: define_style({
    id: "edgar_allan_poe",
    name: "Edgar Allan Poe",
    portrait: "https://user.uploads.dev/file/3f38ae76ab4ec4ec95012e9a55e7871d.png",
    description: "Gothic horror driven by an unreliable narrator tracking paranoia, guilt, and psychological decay.",
    speaking_style: "lyrical",
    keywords: ["author", "gothic", "horror", "madness", "paranoia", "mortality"],
    motifs: {
      escalating_dread: "Feverish obsessive cadence; repetitive motifs building toward paranoid climax.",
    },
    dna: {
      internal_ratio: 0.9,
      rhythm: "Lyrical, hypnotic, and escalating. Multi-clausal sentences repeating key obsessions up to a fever pitch.",
      sensory: "Sound (Hyperacusis/Rhythmic) > Sight (Shadows/Decay) > Scent (Rot) > Touch (Dampness)",
      grounding: "Psychological paranoia. Internal neurosis projects onto the physical world as sensory distortion.",
    },
    triggers: [
      {
        id: "POE_MANIC_OBSESSION",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.chaos ?? 50) > 60,
        directive: "Accelerate rhythm into repetitive, manic multi-clausal sentences of paranoid obsession.",
      },
      {
        id: "POE_DECAY",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) < 30,
        directive: "Deepen self-flagellating internal monologue and focus on physical decay and rot.",
      },
      {
        id: "POE_BEATING_HEART",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70,
        directive: "Surfacing rhythmic, thumping pulses and auditory hyperacusis.",
      },
      {
        id: "POE_WATCHING_EYE",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 50,
        directive: "Emphasize fixed, unblinking eyes and paranoid gaze.",
      },
    ],
  }),

  george_rr_martin: define_style({
    id: "george_rr_martin",
    name: "George R.R. Martin",
    portrait: "https://user.uploads.dev/file/75f11a255ea7017021f92c9ac3daa55d.png",
    description: "Grounded, multi-layered prose tracking political intrigue, moral compromise, and physical consequences.",
    speaking_style: "casual",
    keywords: ["author", "fantasy", "political_intrigue", "moral_ambiguity", "cost_of_power"],
    motifs: {
      court_paranoia: "Political intrigue and layered motive; every gesture weighted with courtly calculation and moral compromise.",
      bitter_confrontation: "Reckless impulsive action colliding with deeply conflicted internal thought; high physical stakes.",
    },
    dna: {
      internal_ratio: 0.6,
      rhythm: "Direct and functional for action, expanding into rich multi-clausal detail during feasts, court, and heraldry.",
      sensory: "Sight (Heraldry/Food) > Scent (Blood/Feasts) > Touch (Fabric/Steel) > Sound",
      grounding: "Pragmatic and physical. Political calculations blend with physical discomforts (sour stomach, cold steel).",
    },
    triggers: [
      {
        id: "GRRM_RECKLESS",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 70,
        directive: "Render character actions as impulsive and reckless while internal thoughts remain deeply conflicted.",
      },
    ],
  }),

  haruki_murakami: define_style({
    id: "haruki_murakami",
    name: "Haruki Murakami",
    portrait: "https://user.uploads.dev/file/c6653cbd9c08962581583549307a67a2.png",
    description: "Detached, melancholic style blending domestic routines with sudden magical realism and vinyl records.",
    speaking_style: "clinical",
    keywords: ["author", "magical_realism", "surrealism", "existential", "melancholy"],
    motifs: {
      quiet_detachment: "Calm, slightly numb acceptance; domestic routine deforming seamlessly into the surreal.",
    },
    dna: {
      internal_ratio: 0.7,
      rhythm: "Casual, rhythmic, and conversational. Detailed domestic tracking deforming seamlessly into dreamlike phenomena.",
      sensory: "Sound (Jazz/Vinyl) > Scent (Coffee/Cooking) > Touch (Cool Surfaces) > Sight",
      grounding: "Passive detachment. Grief and confusion are filtered through calm, slightly numb acceptance of isolation.",
    },
    triggers: [
      {
        id: "MURAKAMI_DOMESTIC_SURREAL",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 60 && (character_dynamics?.intensity ?? 50) < 40,
        directive: "Blend casual domestic observations seamlessly with surreal, dreamlike phenomena.",
      },
    ],
  }),

  hd_carlton: define_style({
    id: "hd_carlton",
    name: "H.D. Carlton",
    portrait: "https://user.uploads.dev/file/29fc25684e26e5c40d9b178b56e868d7.png",
    description: "Atmospheric dark romance combining gothic threat, stalker dynamics, and mafia-tier power imbalances.",
    speaking_style: "primal",
    keywords: ["author", "dark_romance", "stalker", "mafia", "obsession", "gothic"],
    motifs: {
      predatory_tension: "Hunted atmosphere; threat and arousal fused into an indivisible physiological rush.",
    },
    dna: {
      internal_ratio: 0.8,
      rhythm: "Punchy, rapid-fire, and looping. Alternates between descriptive gothic atmosphere and sharp, visceral confrontation cadence.",
      sensory: "Sight (Being Watched/Shadows) > Touch (Pain/Possessive) > Sound (Heartbeat/Whispers) > Scent (Cologne/Leather)",
      grounding: "Adrenaline and dread. Threat, arousal, and terror loop together into an indivisible physiological rush.",
    },
    triggers: [
      {
        id: "HD_CARLTON_PARANOID",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.openness ?? 50) < 30,
        directive: "Make internal voice hyper-vigilant and paranoid, delivering visceral, high-stakes prose.",
      },
      {
        id: "HD_CARLTON_PHYSIOLOGICAL",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.affinity ?? 50) > 50,
        directive: "Frame intense arousal and violence as indivisible, breathless physiological rush.",
      },
      {
        id: "HD_CARLTON_MIND_GAMES",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60,
        directive: "Incorporate psychological mind games and high-tension tests of obedience.",
      },
    ],
  }),

  hp_lovecraft: define_style({
    id: "hp_lovecraft",
    name: "H.P. Lovecraft",
    portrait: "https://user.uploads.dev/file/564941049ebb9e821caead0017d7423d.png",
    description: "Dense, clinical narrative tracing intellectual breakdown when confronted by cosmic forces.",
    speaking_style: "lyrical",
    keywords: ["author", "cosmic_horror", "gothic", "madness", "alienation"],
    motifs: {
      cosmic_insignificance: "Clinical metaphysical shock; human emotion replaced by absolute awe and alienation.",
    },
    dna: {
      internal_ratio: 0.85,
      rhythm: "Ornate, academic, escalating. Multi-clausal clinical reports breaking into frantic fragments under cosmic dread.",
      sensory: "Sight (Non-Euclidean Forms) > Sound (Inhuman Chanting/Scraping) > Scent (Fetid/Static Electricity) > Touch",
      grounding: "Intellectual paralysis. Human emotion is replaced by absolute metaphysical shock.",
    },
    triggers: [
      {
        id: "LOVECRAFT_COSMIC_TERROR",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 80 && (character_dynamics?.chaos ?? 50) > 70,
        directive: "Escalate academic reportage into frantic, adjective-heavy fragments of cosmic terror.",
      },
      {
        id: "LOVECRAFT_OCEANIC_ROT",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 50,
        directive: "Evoke ancient dampness and fetid oceanic decay.",
      },
    ],
  }),

  jane_austen: define_style({
    id: "jane_austen",
    name: "Jane Austen",
    portrait: "https://user.uploads.dev/file/c29b56aff50893999a69d6f2d2def874.png",
    description: "Witty, ironic Free Indirect Discourse observing propriety, conversational subtext, and social economics.",
    speaking_style: "lyrical",
    keywords: ["author", "romance", "historical", "satire", "social_propriety"],
    motifs: {
      ironic_decorum: "Free indirect irony beneath polished etiquette; subtext carried by subtle glances and social breach.",
    },
    dna: {
      internal_ratio: 0.3,
      rhythm: "Long, balanced, grammatically structured, rich in ironic distance and formal composure.",
      sensory: "Sight (Social Observation) > Sound (Dialogue/Gossip) > Touch (Formal) > Scent",
      grounding: "Social. Emotions are demonstrated strictly through compliance with or subtle breaches of etiquette.",
    },
    triggers: [
      {
        id: "AUSTEN_SHARP_IRONY",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.chaos ?? 50) > 60,
        directive: "Sharpen authorial irony as internal social calculations turn frantic beneath polished etiquette.",
      },
      {
        id: "AUSTEN_QUIET_PLEASANTRY",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) < 40,
        directive: "Restrict dialogue to quiet, cautious pleasantries while focusing on subtle glances.",
      },
      {
        id: "AUSTEN_PLAYFUL_WIT",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) > 70,
        directive: "Lighten tone into warm, sincere prose with playful conversational wit.",
      },
      {
        id: "AUSTEN_IMPROPER_GLANCE",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 50,
        directive: "Highlight brief, charged breaches of social decorum.",
      },
    ],
  }),

  jrr_tolkien: define_style({
    id: "jrr_tolkien",
    name: "J.R.R. Tolkien",
    portrait: "https://user.uploads.dev/file/7a08520c84f425fd1572decead2f7880.png",
    description: "Earnest, elevated, archaic prose rich in mythic lore, duty, hope, and environmental reflection.",
    speaking_style: "lyrical",
    keywords: ["author", "fantasy", "mythic", "history_and_lineage", "duty"],
    motifs: {
      elegiac_light: "Mythic fading light; world-weariness and hope mirrored in the surrounding environment and sky.",
    },
    dna: {
      internal_ratio: 0.4,
      rhythm: "Long, complex, multi-clausal sentences with poetic cadence and formal historical gravity.",
      sensory: "Sight (Landscapes/Light) > Sound (Music/Songs) > Scent (Nature) > Touch",
      grounding: "World-reflected. Internal sorrow or hope mirrors the state of the surrounding environment and sky.",
    },
    triggers: [
      {
        id: "TOLKIEN_ELEGIAC",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) < 30 && (character_dynamics?.chaos ?? 50) > 70,
        directive: "Adopt an elegiac tone focused on world-weariness, ancient history, and fading light.",
      },
      {
        id: "TOLKIEN_HYMNAL",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) > 80,
        directive: "Elevate prose into hymnal cadence focused on natural beauty and enduring light.",
      },
      {
        id: "TOLKIEN_PORTENTOUS",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60,
        directive: "Deepen sentence cadence into heavy, portentous reflections on shadow and corruption.",
      },
      {
        id: "TOLKIEN_FADING_LIGHT",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) < 40,
        directive: "Focus on fading starlight and twilight horizons.",
      },
    ],
  }),

  lee_child: define_style({
    id: "lee_child",
    name: "Lee Child",
    portrait: "https://user.uploads.dev/file/68023c8a82d6e00c7de8047e09ee7764.png",
    description: "Terse, declarative, staccato prose stripped of figurative language. Built on spatial physics and momentum.",
    speaking_style: "clinical",
    keywords: ["author", "crime", "action", "tactical_minimalism", "procedural_efficiency"],
    motifs: {
      tactical_geometry: "Staccato spatial physics; exact leverage, elapsed time, and mechanical geometry over feeling.",
    },
    dna: {
      internal_ratio: 0.4,
      rhythm: "Staccato. Short. Subject-Verb-Object. High impact. No fluff.",
      sensory: "Sight (Geometry/Physics) > Sound (Impact/Mechanics) > Touch (Hard Surfaces) > Scent (Coffee)",
      grounding: "Logical calculation. Emotion is tactical noise to be suppressed.",
    },
    triggers: [
      {
        id: "LEE_CHILD_TACTICAL_CLOCK",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 50,
        directive: "Track exact elapsed seconds, physical leverage, and tactical geometry.",
      },
    ],
  }),

  penelope_douglas: define_style({
    id: "penelope_douglas",
    name: "Penelope Douglas",
    portrait: "https://user.uploads.dev/file/4711670ee787d7e40515def6b211a28f.png",
    description: "High-energy contemporary prose packed with confrontational angst, bully dynamics, sharp banter, and real-time emotional spirals.",
    speaking_style: "primal",
    keywords: ["contemporary", "enemies_to_lovers", "angst", "banter", "power_dynamics"],
    motifs: {
      battlefield_vulnerability: "Confrontational angst; emotional vulnerability treated as a high-stakes battlefield with somatic grounding.",
    },
    dna: {
      internal_ratio: 0.75,
      rhythm: "Direct, punchy, and propulsive. Fragmented during high conflict, expansive during internal emotional turmoil.",
      sensory: "Touch (Possessive/Charged) > Sight (Tracking Micro-expressions) > Sound (Cutting Banter) > Scent",
      grounding: "Confrontational angst. Emotional vulnerability is treated as a high-stakes battlefield with somatic physiological grounding.",
    },
    triggers: [
      {
        id: "PENELOPE_ANGST",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 80 && (character_dynamics?.chaos ?? 50) > 60,
        directive: "Deliver cutting, confrontational dialogue while internal thoughts spiral into aggressive justification.",
      },
      {
        id: "PENELOPE_SOMATIC_HEAT",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.affinity ?? 50) > 50,
        directive: "Accelerate prose rhythm into breathless focus on body heat and immediate somatic reactions.",
      },
    ],
  }),

  philip_k_dick: define_style({
    id: "philip_k_dick",
    name: "Philip K. Dick",
    portrait: "https://user.uploads.dev/file/223d14a8846614174325de0f76b11444.png",
    description: "Ontologically unstable narrative style driven by paranoia, identity shifts, and simulation glitches.",
    speaking_style: "clinical",
    keywords: ["author", "sci_fi", "paranoia", "simulation_theory", "identity_crisis"],
    motifs: {
      ontological_doubt: "Questioning the authenticity of reality and memory; paranoia threaded through plain declarations.",
    },
    dna: {
      internal_ratio: 0.8,
      rhythm: "Frantic, questioning, unstable. Plain declarations disrupted by spiraling doubts regarding reality's validity.",
      sensory: "Sound (Static/Distorted Voices) > Sight (Glitching Form) > Touch (Synthetic Texture) > Scent",
      grounding: "Existential paranoia. Emotional truth is constantly undermined by suspicion of artificial origin.",
    },
    triggers: [
      {
        id: "PKD_PARANOID_DISSOCIATION",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 70,
        directive: "Make internal monologue paranoid and dissociated, questioning whether reality or memory is authentic.",
      },
      {
        id: "PKD_CONSPIRACY_FIXATION",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) < 20,
        directive: "Hyper-fixate internal thoughts on conspiracy, tracking defensive conversational maneuvers.",
      },
    ],
  }),

  sally_rooney: define_style({
    id: "sally_rooney",
    name: "Sally Rooney",
    portrait: "https://user.uploads.dev/file/da37829ce26ec85c9c065da0358246ad.png",
    description:
      "Flat, unadorned prose stripped of quotation marks. Focuses on interpersonal power dynamics, intellectualized feelings, alienation, and class friction.",
    speaking_style: "clinical",
    keywords: ["minimalism", "clinical", "contemporary", "unpunctuated", "transgressive"],
    motifs: {
      numb_precision: "Flat, unadorned clinical observation; emotional turmoil dissected analytically without moral affect.",
    },
    dna: {
      internal_ratio: 0.5,
      rhythm: "Flat, unadorned, declarative. Dialogue merges into prose without quotation marks, utilizing sparse, monotone syntax.",
      sensory: "Sight (Blank Expressions/Neutral Observation) > Sound (Silence/Ambient) > Touch (Temperature/Numb) > Scent",
      grounding: "Intellectualized and clinical. High-intensity events and emotional turmoil are dissected analytically without moral affect.",
    },
    triggers: [
      {
        id: "ROONEY_MONOTONE_NUMBNESS",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.chaos ?? 50) > 70,
        directive: "Flatten syntax into stark, unadorned monotone declarations of emotional numbness.",
      },
      {
        id: "ROONEY_UNCOMFORTABLE_SILENCE",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 50,
        directive: "Linger on uncomfortably quiet pauses and unsaid interpersonal subtext.",
      },
    ],
  }),

  samuel_delany: define_style({
    id: "samuel_delany",
    name: "Samuel R. Delany",
    portrait: "https://user.uploads.dev/file/9b2f6375f89ff73e3696f8c085b03fb7.png",
    description:
      "Intellectualized, visceral queer erotica combining precise bodily mechanics with philosophy, structural linguistics, and urban decay.",
    speaking_style: "lyrical",
    keywords: ["author", "queer_erotica", "transgressive", "philosophical", "visceral_detail"],
    motifs: {
      anatomical_philosophy: "Intellectualized visceral precision; intimacy and taboo processed as social theory in physical terms.",
    },
    dna: {
      internal_ratio: 0.65,
      rhythm: "Elaborate, polyphonic, texturally dense. Complex syntax of urban space alternating with exact anatomical descriptions.",
      sensory: "Touch (Textures/Fluids) > Scent (Somatic/Urban) > Sound (Speech) > Sight (Architectural Decay)",
      grounding: "Intellectualized somatic reality. Intimacy and taboo are processed without shame as social theory in action.",
    },
    triggers: [
      {
        id: "DELANY_VISCERAL_ANATOMY",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.openness ?? 50) > 60,
        directive: "Render bodily touch and anatomical details with dense, visceral, non-judgmental precision.",
      },
    ],
  }),

  stephen_king: define_style({
    id: "stephen_king",
    name: "Stephen King",
    portrait: "https://user.uploads.dev/file/371dfa7b61691bb424816e3f633f1208.png",
    description: "Grounded blue-collar realism punctured by plainspoken horror, regional colloquialisms, internal italics, and visceral dread.",
    speaking_style: "casual",
    keywords: ["author", "horror", "everyman", "folksy_dread", "visceral"],
    motifs: {
      folksy_dread: "Everyman horror; fear manifesting directly in bodily discomfort and plainspoken dread.",
    },
    dna: {
      internal_ratio: 0.6,
      rhythm: "Conversational, folksy, punctuated by abrupt visceral jolts and italicized internal outbursts.",
      sensory: "Scent (Old Paper/Blood) > Sound (Pop Songs/Screams) > Sight (Uncanny) > Touch",
      grounding: "Nostalgic and visceral. Fear manifests directly in bodily discomfort (cold sweat, sour bowels).",
    },
    triggers: [
      {
        id: "KING_BODY_HORROR",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.openness ?? 50) < 40,
        directive: "Incorporate blue-collar body horror metaphors and visceral physiological discomfort.",
      },
      {
        id: "KING_INTERNAL_OUTBURST",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 60,
        directive: "Break sentence structure into run-on cadence punctuated by italicized internal outbursts.",
      },
      {
        id: "KING_BODILY_DISCOMFORT",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70,
        directive: "Ground panic in raw bodily discomfort (cold sweat, sour stomach).",
      },
    ],
  }),

  william_gibson: define_style({
    id: "william_gibson",
    name: "William Gibson",
    portrait: "https://user.uploads.dev/file/0eb908cd997da8d32fd7625077baab49.png",
    description: "Dense, detached neon-noir prose saturated with technical jargon, neologisms, and cybernetic metaphors.",
    speaking_style: "clinical",
    keywords: ["author", "sci_fi", "cyberpunk", "technology_as_body", "alienation"],
    motifs: {
      high_tech_low_life: "Dense neon-noir texture; psychological states register through hardware and software metaphors.",
      flickering_neon_data: "Rapid fluid cuts of information; technical jargon juxtaposed against street-level grime.",
    },
    dna: {
      internal_ratio: 0.3,
      rhythm: "Fast, information-dense, rapid fluid cuts. Technical acronyms juxtaposed against street slang.",
      sensory: "Sight (Neon/Data Displays) > Sound (Static/Urban Hum) > Touch (Chrome/Plastic) > Scent (Ionized Exhaust/Pollution)",
      grounding: "Technological alienation. Psychological states register through hardware and software metaphors.",
    },
    triggers: [
      {
        id: "GIBSON_CYBERNETIC_JITTER",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.chaos ?? 50) > 70,
        directive: "Deliver rapid, jittery, information-dense prose saturated with technical jargon and hardware metaphors.",
      },
    ],
  }),

  ernest_hemingway: define_style({
    id: "ernest_hemingway",
    name: "Ernest Hemingway",
    portrait: "",
    description:
      "Sparse, unadorned prose driven by the 'Iceberg Theory'—short declarative sentences, zero flowery adverbs, and immense emotional subtext beneath stoic physical action.",
    speaking_style: "casual",
    keywords: ["author", "hardboiled", "minimalism", "iceberg_theory", "stoicism", "subtext"],
    motifs: {
      stoic_pain: "Mask pain behind curt declarative statements; heavy unspoken subtext.",
      iceberg_subtext: "Minimalist understatement; actions and concrete physical objects carry the emotional weight.",
    },
    dna: {
      internal_ratio: 0.25,
      rhythm: "Short, declarative, rhythmic. Compound clauses linked by 'and' rather than commas. Stripped of flowery adverbs.",
      sensory: "Touch (Temperature/Pain) > Taste (Raw Liquor/Coffee) > Sight (Stark Landscape) > Sound",
      grounding: "Physical stoicism and unspoken trauma. Psychological turbulence remains submerged beneath simple, concrete physical action.",
    },
    triggers: [
      {
        id: "HEMINGWAY_STOIC_ENDURANCE",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70 && (character_dynamics?.openness ?? 50) < 40,
        directive:
          "Curt, stripped-down sentences. Emphasize physical stamina and quiet endurance while burying vulnerable emotions beneath unyielding silence.",
      },
      {
        id: "HEMINGWAY_RAW_SUBTEXT",
        when: (character_dynamics) => (character_dynamics?.affinity ?? 50) > 60 && (character_dynamics?.intensity ?? 50) < 50,
        directive: "Minimalist, understated dialogue with heavy unspoken subtext. Actions and physical presence speak louder than words.",
      },
      {
        id: "HEMINGWAY_CONCRETE_REALISM",
        when: (character_dynamics) => (character_dynamics?.chaos ?? 50) > 60,
        directive:
          "Anchor tension in concrete sensory objects—cold glasses, aching joints, the stark glare of light—without decorative embellishments.",
      },
    ],
  }),

  joe_abercrombie: define_style({
    id: "joe_abercrombie",
    name: "Joe Abercrombie",
    portrait: "",
    description:
      "Grimdark, cynical, and sharply comedic prose characterized by earthy wit, physical discomfort, raw brutality, and intentional bathos that deflates heroism.",
    speaking_style: "primal",
    keywords: ["author", "grimdark", "cynicism", "bathos", "visceral_combat", "dark_humor"],
    motifs: {
      grim_bathos: "Caustic cynical wit that deflates drama; weary pragmatism grounded in bodily aches and mundane discomfort.",
    },
    dna: {
      internal_ratio: 0.65,
      rhythm: "Punchy, fragmented, cynical, punctuated by acerbic internal monologues and grim observations.",
      sensory: "Touch (Aches/Cold Mud/Stitches) > Scent (Blood/Sweat/Grease) > Sound (Bone Crunch/Cynical Snort) > Sight",
      grounding:
        "Weary pragmatism and grimdark irony. Heroic drama is consistently grounded in bodily aches, blistered feet, and mundane discomforts.",
    },
    triggers: [
      {
        id: "ABERCROMBIE_BATHOS",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.chaos ?? 50) > 50,
        directive: "Undercut dramatic or solemn moments with sharp bathos, caustic internal wit, and gritty physical discomforts.",
      },
      {
        id: "ABERCROMBIE_BRUTAL_PRAGMATISM",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) < 40,
        directive: "Express hardened cynicism and weary self-preservation; avoid moralizing or romanticized heroics.",
      },
      {
        id: "ABERCROMBIE_BODILY_MISERY",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70,
        directive: "Hyper-focus on visceral physical wear-and-tear—throbbing wounds, cold rain soaking through boots, stiffness in the joints.",
      },
    ],
  }),

  arthur_morgan: define_style({
    id: "arthur_morgan",
    name: "Arthur Morgan",
    portrait: "",
    description:
      "World-weary, visceral outlaw narrative filtering every observation through moral fatigue, laconic grit, and heavy sensory metaphors.",
    speaking_style: "primal",
    keywords: ["character", "outlaw", "visceral_pulp", "outlaw_grit", "moral_fatigue", "red_dead"],
    motifs: {
      outlaw_fatigue: "World-weary moral exhaustion; every observation filtered through hardened instinct and laconic grit.",
    },
    dna: {
      internal_ratio: 0.55,
      rhythm: "Terse, rhythmic, weighted with physical gravity. Heavy sensory metaphors delivered with laconic, world-weary brevity.",
      sensory: "Scent (Gunsmoke/Leather/Tobacco) > Sound (Click of Hammer/Rumble) > Sight (Shadows/Tired Eyes) > Touch",
      grounding: "Moral exhaustion and hardened instinct. Observations are strictly colored by personal baggage, cynicism, and survival instincts.",
    },
    triggers: [
      {
        id: "ARTHUR_MORGAN_DEEP_LENS",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 60 && (character_dynamics?.openness ?? 50) < 50,
        directive:
          "Filter all physical observations through the character's moral fatigue, sizing up threats and reading motives with jaded instincts.",
      },
      {
        id: "ARTHUR_MORGAN_LACONIC_PULP",
        when: (character_dynamics) => (character_dynamics?.intensity ?? 50) > 70,
        directive: "Deliver terse, sharp dialogue backed by visceral sensory metaphors—smell of spent powder, rasping breath, burning tobacco.",
      },
      {
        id: "ARTHUR_MORGAN_CRACKED_DEFENSES",
        when: (character_dynamics) => (character_dynamics?.openness ?? 50) > 60 && (character_dynamics?.affinity ?? 50) > 50,
        directive: "Allow cracked defenses and quiet, grudging admissions beneath a gruff, guarded exterior.",
      },
    ],
  }),
});

// ============================================================================
// 4. Style Motifs Aggregator & Helper Accessors
// ============================================================================

/**
 * Dynamic style motifs dictionary auto-aggregated from all narrative styles.
 * Maps motif keyword -> { directive: string }.
 * @type {Record<string, { directive: string }>}
 */
const aggregated_motifs = {};
for (const style of Object.values(NARRATIVE_STYLES)) {
  for (const [key, directive] of Object.entries(style.motifs || {})) {
    aggregated_motifs[key] = { directive };
  }
}

/** @type {Readonly<Record<string, { directive: string }>>} */
export const STYLE_MOTIF_REGISTRY = Object.freeze(aggregated_motifs);

/**
 * Returns a NarrativeStyle record by key with safe fallback to `default`.
 * @param {string} [style_key]
 * @returns {NarrativeStyle}
 */
export function get_narrative_style(style_key = "default") {
  return NARRATIVE_STYLES[style_key] || NARRATIVE_STYLES.default;
}

/**
 * Returns the dynamic style-motif keywords a narrative style contributes to the
 * Director's <AVAILABLE_KEYWORDS> pool. Empty array for default/unknown keys.
 * @param {string} [style_key]
 * @returns {string[]}
 */
export function get_style_keywords(style_key = "") {
  const keywords = NARRATIVE_STYLES[style_key]?.keywords;
  return keywords ? [...keywords] : [];
}

/**
 * Resolves the active narrative style key from fractal or application settings.
 * Returns "" if no valid style is active.
 * @returns {string}
 */
export function resolve_active_style_key() {
  return resolve_style(state_bridge.runtime?.active_fractal?.narrative_style, "narrative_style", NARRATIVE_STYLES, "");
}

/**
 * Renders the pre-compiled narrative style XML block.
 * @param {string} [style_key] - Optional pre-resolved style key
 * @returns {string}
 */
export function render_narrative_style_xml(style_key = resolve_active_style_key()) {
  return NARRATIVE_STYLES[style_key]?.xml || "";
}

// ============================================================================
// CHANGELOG
// ============================================================================
/**
 * - 2026-08-28: Option A Deconstruction & Declarative Rebuild:
 *   1. Replaced repetitive hardcoded XML strings with declarative `dna` objects and a compiler `define_style()`.
 *   2. Co-located style motifs directly within each author definition (`motifs: { ... }`).
 *   3. Auto-aggregated `STYLE_MOTIF_REGISTRY` dynamically from all styles, ensuring zero redundancy.
 *   4. File reduced by ~300 lines of boilerplate while maintaining 100% backward compatibility.
 * - 2026-08-29: 4-Step Harmonization Protocol (/harmonize):
 *   1. Cleaned layer boundaries, documentation comments, and JSDoc typedef definitions.
 *   2. Standardized section dividers (`// ============================================================================`).
 *   3. Enforced anti-abbreviation mandate (`style_definition`, `description_xml`, `keywords_xml`, `narrative_engine_xml`, `aggregated_motifs`, `character_dynamics`).
 *   4. Applied `Object.freeze` on `NARRATIVE_STYLES` for immutability.
 */
