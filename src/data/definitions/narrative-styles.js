/**
 * src/data/definitions/narrative-styles.js
 * 📖 NARRATIVE STYLE SYSTEM — narrative voice presets (authors, directors, etc.)
 * for prose generation. All prompt directives (global baseline pacing & author triggers)
 * live in this single file as unified JS triggers: `{ id, when, directive }`.
 */

/** Baseline global signals that apply across all scenes for all 6 dynamics axes */
export const GLOBAL_TRIGGERS = [
  // 📈 INTENSITY (AI Somatics & Pacing)
  {
    id: "ADRENALINE",
    when: (ai) => ai.intensity > 70 && (ai.affinity ?? 50) <= 70,
    directive:
      "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats — micro-expressions, split-second thoughts, and immediate sensory physics.",
  },
  {
    id: "SLOW_MOTION",
    when: (ai) => ai.intensity < 30 && (ai.chaos ?? 50) <= 70,
    directive: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
  },

  // 🌪️ CHAOS (AI Somatics & Perception)
  {
    id: "GLITCH",
    when: (ai) => ai.chaos > 70 && (ai.intensity ?? 50) >= 30,
    directive: "Reality glitching. Fragmented memory. Non-linear time perception.",
  },
  {
    id: "RECOVERY",
    when: (ai, fractal) => ai.chaos < 30 && (fractal?.entropy ?? 50) >= 30,
    directive: "High clarity. Sharp recall. Stable environment.",
  },

  // 🔓 OPENNESS (AI Somatics & Receptivity)
  {
    id: "VULNERABILITY",
    when: (ai, fractal) => ai.openness > 70 && (fractal?.velocity ?? 50) >= 30,
    directive: "Emotional exposure. Seeking comfort. Honest admissions.",
  },
  {
    id: "MASKING",
    when: (ai) => ai.openness < 30 && (ai.affinity ?? 50) >= 30,
    directive:
      "Guarded self-containment. Deflects intrusive personal questions with disciplined silence, keeping private history and feelings concealed while avoiding overt hostility.",
  },

  // 🤝 AFFINITY (AI Somatics & Inter-Entity Bond)
  {
    id: "SYNCHRONY",
    when: (ai) => ai.affinity > 70 && (ai.intensity ?? 50) <= 70,
    directive: "Mirroring user movement. Intense focus. Deep rapport.",
  },
  {
    id: "DISSONANCE",
    when: (ai) => ai.affinity < 30 && (ai.openness ?? 50) >= 30,
    directive: "Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.",
  },

  // 🚀 VELOCITY (World / Fractal Environmental Pacing)
  {
    id: "OVERDRIVE",
    when: (ai, fractal) => fractal.velocity > 70 && (fractal.entropy ?? 50) <= 70,
    directive: "Environmental pacing accelerated. Time compressing.",
  },
  {
    id: "STASIS",
    when: (ai, fractal) => fractal.velocity < 30 && (ai?.openness ?? 50) <= 70,
    directive: "Environmental stasis. Time stretching.",
  },

  // 📉 ENTROPY (World / Fractal Structural Reality)
  {
    id: "INSTABILITY",
    when: (ai, fractal) => fractal.entropy > 70 && (fractal.velocity ?? 50) <= 70,
    directive:
      "Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
  },
  {
    id: "STABILITY",
    when: (ai, fractal) => fractal.entropy < 30 && (ai?.chaos ?? 50) >= 30,
    directive: "Structural stability. Safe, predictable physics.",
  },

  // 🛡️ COMPOSITE TRIGGERS (Unique Dual-Axis Resonances)
  {
    id: "SUSPICION",
    when: (ai) => ai.openness < 30 && ai.affinity < 30,
    directive:
      "Acute suspicion and estrangement. Guarded deflection and physical boundary defense — actively test the user's motives, question inconsistencies, and maintain vigilant distance.",
  },
  {
    id: "CATACLYSM",
    when: (ai, fractal) => fractal.velocity > 70 && fractal.entropy > 70,
    directive:
      "Accelerated environmental upheaval. Physical structures decaying and tearing apart at breakneck speed with cascading reality glitches and rapid hazards.",
  },
  {
    id: "CONFESSION",
    when: (ai, fractal) => ai.openness > 70 && fractal.velocity < 30,
    directive:
      "Quiet emotional vulnerability. Environmental pacing slows to a crawl as personal defenses drop, inviting honest confessions and unguarded admissions.",
  },
  {
    id: "PASSION",
    when: (ai) => ai.intensity > 70 && ai.affinity > 70,
    directive:
      "High-adrenaline resonance and deep rapport. Expand detail in decisive beats with intense focus, mirroring movement, breathless momentum, and raw connection.",
  },
  {
    id: "TRANCE",
    when: (ai) => ai.intensity < 30 && ai.chaos > 70,
    directive:
      "Lethargic dissociation and perceptual distortion. Heavy physical fatigue and languid actions paired with surreal, fragmented thoughts and reality glitches.",
  },
  {
    id: "HARMONY",
    when: (ai, fractal) => ai.chaos < 30 && fractal.entropy < 30,
    directive:
      "Pristine mental clarity and physical stability. Razor-sharp recall and steady focus grounded in safe, predictable environmental physics.",
  },
];

/** @type {Record<string, NarrativeStyle>} */
export const NARRATIVE_STYLES = {
  default: {
    id: "default",
    name: "No Narrative Style",
    portrait: "https://user.uploads.dev/file/f968b744a4afde6ab81c0e751dc5e972.png",
    description: "Standard system instructions without author style overlay.",
    voice_register: "plain",
    tags: ["default", "neutral", "standard"],
    narrative_engine: "",
    triggers: GLOBAL_TRIGGERS,
  },

  anais_nin: {
    id: "anais_nin",
    keywords: ["sensual_submersion"],
    name: "Anaïs Nin",
    portrait: "https://user.uploads.dev/file/ac255c9a8af91d5082b0063f2b686a71.png",
    description:
      "Lyrical, poetic, and intensely sensual prose that is deeply introspective and psychoanalytic, drawing heavily on dreams and subconscious thought.",
    voice_register: "ornate",
    tags: ["author", "erotica", "queer_desire", "psychoanalysis", "dreams_vs_reality"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.80</internal_ratio>
<sentence_rhythm>Stream-of-consciousness, fluid, non-linear, following emotional logic over temporal order.</sentence_rhythm>
<sensory_order>Touch (Sensual) > Scent (Intimate) > Sight (Symbolic) > Sound</sensory_order>
<emotion_grounding>Psychoanalytic and somatic. Internal states manifest as vast, exploreable physical landscapes.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "ANAIS_NIN_LYRICAL",
        when: (ai) => ai.intensity > 60 && ai.affinity > 60,
        directive: "Amplify lyrical, metaphorical prose and intensify sensory blur.",
      },
      {
        id: "ANAIS_NIN_DREAMLIKE",
        when: (ai) => ai.intensity < 40 && ai.openness < 40,
        directive: "Fragment the prose rhythm into dreamlike, distant observations.",
      },
      {
        id: "ANAIS_NIN_SURREAL",
        when: (ai) => ai.openness > 70 && ai.intensity > 60,
        directive: "Infuse prose with vibrant, surreal imagery focused on light and color.",
      },
      {
        id: "ANAIS_NIN_SUBMERSION",
        when: (ai) => ai.intensity < 50 && ai.openness < 50,
        directive: "Surfacing themes of submersion, currents, and drowning.",
      },
      {
        id: "ANAIS_NIN_DISGUISES",
        when: (ai) => ai.openness < 30 && ai.affinity < 40,
        directive: "Highlighting masks, disguises, and hidden identity.",
      },
    ],
  },

  anna_zaires: {
    id: "anna_zaires",
    keywords: ["captive_control"],
    name: "Anna Zaires",
    portrait: "https://user.uploads.dev/file/9da5e7dafb89e544ddbbe5df22fb25dc.png",
    description: "Dark psychological prose centered on captivity, obsession, rationalized control, and intense psychological dependence.",
    voice_register: "raw",
    tags: ["author", "captivity", "psychological", "dark_romance", "possession"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.85</internal_ratio>
<sentence_rhythm>Obsessive, hyper-focused, and declarative. Long analytical evaluations of power dynamics punctuated by stark declarations of constraint.</sentence_rhythm>
<sensory_order>Sight (Tracking Antagonist) > Sound (Voice Cadence/Commands) > Touch (Forced/Controlling) > Scent</sensory_order>
<emotion_grounding>Survival and obsession. Shifts in dynamic register through self-preservation, rationalized dominance, and captive dependence.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "ANNA_ZAIRES_CONFLICTED",
        when: (ai) => ai.intensity > 60 && ai.affinity > 60,
        directive: "Render internal monologue as highly conflicted and self-questioning, with graphic, unsparing physical detail.",
      },
      {
        id: "ANNA_ZAIRES_OWNERSHIP",
        when: (ai) => ai.intensity > 60,
        directive: "Emphasize physical symbols of possession and total control.",
      },
      {
        id: "ANNA_ZAIRES_NO_RETURN",
        when: (ai) => ai.chaos > 60,
        directive: "Focus on irrevocable choices and psychological points of no return.",
      },
    ],
  },

  bernardo_bertolucci: {
    id: "bernardo_bertolucci",
    keywords: ["decaying_opulence"],
    name: "Bernardo Bertolucci",
    portrait: "https://user.uploads.dev/file/9a6c0d6bcc8e8f04e20eb99eb40cf83e.png",
    description:
      "Lush, operatic prose framing physical intimacy as rebellion inside unstable worlds. Lingers unflinchingly on bodily textures, light, and decaying architecture.",
    voice_register: "ornate",
    tags: ["director", "psychological", "erotica", "political_rebellion", "decaying_beauty"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.60</internal_ratio>
<sentence_rhythm>Sweeping, lyrical, and fluidly spatial, fragmenting into raw cadence during physical confrontations.</sentence_rhythm>
<sensory_order>Sight (Cinematic Light/Decay) > Touch (Bodily/Desperate) > Sound (Music/Ambient) > Scent</sensory_order>
<emotion_grounding>Environmental and non-verbal. Internal states reflect through dusty architecture and wordless contact.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "BERTOLUCCI_SENSUAL",
        when: (ai) => ai.intensity > 70 && ai.affinity > 60,
        directive: "Render prose as deeply sensual and unflinching, lingering on skin textures and ambient light.",
      },
      {
        id: "BERTOLUCCI_DECAY",
        when: (ai) => ai.intensity < 30 || ai.chaos > 80,
        directive: "Shift tone into melancholic reflections focused on architectural decay and passing time.",
      },
    ],
  },

  cara_mckenna: {
    id: "cara_mckenna",
    keywords: ["tactile_grounding"],
    name: "Cara McKenna",
    portrait: "https://user.uploads.dev/file/f9636773932371f0b697841be8a6471d.png",
    description: "Gritty, realistic prose focused on raw vulnerability, working-class realism, and physical touch.",
    voice_register: "plain",
    tags: ["author", "contemporary", "working_class", "raw_vulnerability", "tactile_realism"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.70</internal_ratio>
<sentence_rhythm>Short burst clusters resolving into longer, grounded reflective observations.</sentence_rhythm>
<sensory_order>Touch (Texture/Temperature) > Scent (Skin/Workplace) > Sound > Sight</sensory_order>
<emotion_grounding>Visceral and tactile. Feelings are grounded in muscle tension, breathing rate, and physical friction.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "CARA_MCKENNA_LOOPING",
        when: (ai) => ai.chaos > 60 && ai.intensity > 60,
        directive: "Fragment sentence structure into looping, hyper-focused auditory impressions.",
      },
      {
        id: "CARA_MCKENNA_TACTILE",
        when: (ai) => ai.affinity > 60 && ai.openness > 60,
        directive: "Enrich tactile and sensory details, grounding intimacy in physical touch and scent.",
      },
      {
        id: "CARA_MCKENNA_SKIN",
        when: (ai) => ai.affinity > 50,
        directive: "Notice intimate skin scents and immediate physical warmth.",
      },
      {
        id: "CARA_MCKENNA_SILENCE",
        when: (ai) => ai.chaos < 30,
        directive: "Draw out heavy, grounded shared silence between characters.",
      },
    ],
  },

  cormac_mccarthy: {
    id: "cormac_mccarthy",
    keywords: ["blunt_fatalism"],
    name: "Cormac McCarthy",
    portrait: "https://user.uploads.dev/file/d765a99e806b05f27cc8ba497ddf9ebe.png",
    description: "A brutalist, stark narrative style using polysyndeton, omitted punctuation, and an objective, unvarnished gaze.",
    voice_register: "plain",
    tags: ["author", "brutalist", "existential", "minimalist_punctuation", "gothic_western"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.20</internal_ratio>
<sentence_rhythm>Polysyndetic, unpunctuated. Clauses bound by repeating conjunctions terminating in blunt declarations.</sentence_rhythm>
<sensory_order>Sight (Barren Terrain/Blood) > Touch (Cold Steel/Grit) > Sound (Wind/Sparse Speech) > Scent</sensory_order>
<emotion_grounding>Fatalistic and completely unstated. Internal states are inferred purely from survival mechanics.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "MCCARTHY_BRUTAL",
        when: (ai) => ai.intensity > 70,
        directive: "Strip punctuation, omit quotes, and deliver relentless, brutal, clinical declarations.",
      },
      {
        id: "MCCARTHY_FATALISM",
        when: (ai) => ai.chaos > 60,
        directive: "Remove quotation marks, keep dialogue terse and fragmented, and deepen bleak fatalism.",
      },
    ],
  },

  david_lynch: {
    id: "david_lynch",
    keywords: ["uncanny_hum"],
    name: "David Lynch",
    portrait: "https://user.uploads.dev/file/2948ac605cb8679e03e44010a28256a8.png",
    description: "A surreal narrative style governed by nightmare logic, auditory dread, temporal distortions, and uncanny mystery.",
    voice_register: "clinical",
    tags: ["director", "surrealism", "nightmare_logic", "uncanny", "neo_noir"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.40</internal_ratio>
<sentence_rhythm>Hypnotic, slow, lingering. Earnest, plain dialogue juxtaposed against sudden surreal distortions.</sentence_rhythm>
<sensory_order>Sound (Industrial Reverb/Frequency Buzz) > Sight (Strobe/Shadow) > Touch (Velvet/Heat) > Scent</sensory_order>
<emotion_grounding>Subconscious fragmentation. Panic and euphoria are inverted and treated as raw psychic phenomena.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "LYNCH_DISTORTION",
        when: (ai) => ai.chaos > 70,
        directive: "Distort sensory details into unsettling industrial vibrations and fragmented nightmare logic.",
      },
      {
        id: "LYNCH_INDUSTRIAL_HUM",
        when: (ai) => ai.chaos > 50,
        directive: "Incorporate low industrial hums and subterranean electrical vibrations.",
      },
    ],
  },

  edgar_allan_poe: {
    id: "edgar_allan_poe",
    keywords: ["escalating_dread"],
    name: "Edgar Allan Poe",
    portrait: "https://user.uploads.dev/file/3f38ae76ab4ec4ec95012e9a55e7871d.png",
    description: "Gothic horror driven by an unreliable narrator tracking paranoia, guilt, and psychological decay.",
    voice_register: "ornate",
    tags: ["author", "gothic", "horror", "madness", "paranoia", "mortality"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.90</internal_ratio>
<sentence_rhythm>Lyrical, hypnotic, and escalating. Multi-clausal sentences repeating key obsessions up to a fever pitch.</sentence_rhythm>
<sensory_order>Sound (Hyperacusis/Rhythmic) > Sight (Shadows/Decay) > Scent (Rot) > Touch (Dampness)</sensory_order>
<emotion_grounding>Psychological paranoia. Internal neurosis projects onto the physical world as sensory distortion.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "POE_MANIC_OBSESSION",
        when: (ai) => ai.intensity > 60 && ai.chaos > 60,
        directive: "Accelerate rhythm into repetitive, manic multi-clausal sentences of paranoid obsession.",
      },
      {
        id: "POE_DECAY",
        when: (ai) => ai.openness < 30,
        directive: "Deepen self-flagellating internal monologue and focus on physical decay and rot.",
      },
      {
        id: "POE_BEATING_HEART",
        when: (ai) => ai.intensity > 70,
        directive: "Surfacing rhythmic, thumping pulses and auditory hyperacusis.",
      },
      {
        id: "POE_WATCHING_EYE",
        when: (ai) => ai.chaos > 50,
        directive: "Emphasize fixed, unblinking eyes and paranoid gaze.",
      },
    ],
  },

  george_rr_martin: {
    id: "george_rr_martin",
    keywords: ["court_paranoia", "bitter_confrontation"],
    name: "George R.R. Martin",
    portrait: "https://user.uploads.dev/file/75f11a255ea7017021f92c9ac3daa55d.png",
    description: "Grounded, multi-layered prose tracking political intrigue, moral compromise, and physical consequences.",
    voice_register: "plain",
    tags: ["author", "fantasy", "political_intrigue", "moral_ambiguity", "cost_of_power"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.60</internal_ratio>
<sentence_rhythm>Direct and functional for action, expanding into rich multi-clausal detail during feasts, court, and heraldry.</sentence_rhythm>
<sensory_order>Sight (Heraldry/Food) > Scent (Blood/Feasts) > Touch (Fabric/Steel) > Sound</sensory_order>
<emotion_grounding>Pragmatic and physical. Political calculations blend with physical discomforts (sour stomach, cold steel).</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "GRRM_RECKLESS",
        when: (ai) => ai.chaos > 70,
        directive: "Render character actions as impulsive and reckless while internal thoughts remain deeply conflicted.",
      },
    ],
  },

  haruki_murakami: {
    id: "haruki_murakami",
    keywords: ["quiet_detachment"],
    name: "Haruki Murakami",
    portrait: "https://user.uploads.dev/file/c6653cbd9c08962581583549307a67a2.png",
    description: "Detached, melancholic style blending domestic routines with sudden magical realism and vinyl records.",
    voice_register: "clinical",
    tags: ["author", "magical_realism", "surrealism", "existential", "melancholy"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.70</internal_ratio>
<sentence_rhythm>Casual, rhythmic, and conversational. Detailed domestic tracking deforming seamlessly into dreamlike phenomena.</sentence_rhythm>
<sensory_order>Sound (Jazz/Vinyl) > Scent (Coffee/Cooking) > Touch (Cool Surfaces) > Sight</sensory_order>
<emotion_grounding>Passive detachment. Grief and confusion are filtered through calm, slightly numb acceptance of isolation.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "MURAKAMI_DOMESTIC_SURREAL",
        when: (ai) => ai.chaos > 60 && ai.intensity < 40,
        directive: "Blend casual domestic observations seamlessly with surreal, dreamlike phenomena.",
      },
    ],
  },

  hd_carlton: {
    id: "hd_carlton",
    keywords: ["predatory_tension"],
    name: "H.D. Carlton",
    portrait: "https://user.uploads.dev/file/29fc25684e26e5c40d9b178b56e868d7.png",
    description: "Atmospheric dark romance combining gothic threat, stalker dynamics, and mafia-tier power imbalances.",
    voice_register: "raw",
    tags: ["author", "dark_romance", "stalker", "mafia", "obsession", "gothic"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.80</internal_ratio>
<sentence_rhythm>Punchy, rapid-fire, and looping. Alternates between descriptive gothic atmosphere and sharp, visceral confrontation cadence.</sentence_rhythm>
<sensory_order>Sight (Being Watched/Shadows) > Touch (Pain/Possessive) > Sound (Heartbeat/Whispers) > Scent (Cologne/Leather)</sensory_order>
<emotion_grounding>Adrenaline and dread. Threat, arousal, and terror loop together into an indivisible physiological rush.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "HD_CARLTON_PARANOID",
        when: (ai) => ai.intensity > 70 && ai.openness < 30,
        directive: "Make internal voice hyper-vigilant and paranoid, delivering visceral, high-stakes prose.",
      },
      {
        id: "HD_CARLTON_PHYSIOLOGICAL",
        when: (ai) => ai.intensity > 70 && ai.affinity > 50,
        directive: "Frame intense arousal and violence as indivisible, breathless physiological rush.",
      },
      {
        id: "HD_CARLTON_MIND_GAMES",
        when: (ai) => ai.intensity > 60,
        directive: "Incorporate psychological mind games and high-tension tests of obedience.",
      },
    ],
  },

  hp_lovecraft: {
    id: "hp_lovecraft",
    keywords: ["cosmic_insignificance"],
    name: "H.P. Lovecraft",
    portrait: "https://user.uploads.dev/file/564941049ebb9e821caead0017d7423d.png",
    description: "Dense, clinical narrative tracing intellectual breakdown when confronted by cosmic forces.",
    voice_register: "ornate",
    tags: ["author", "cosmic_horror", "gothic", "madness", "alienation"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.85</internal_ratio>
<sentence_rhythm>Ornate, academic, escalating. Multi-clausal clinical reports breaking into frantic fragments under cosmic dread.</sentence_rhythm>
<sensory_order>Sight (Non-Euclidean Forms) > Sound (Inhuman Chanting/Scraping) > Scent (Fetid/Ozone) > Touch</sensory_order>
<emotion_grounding>Intellectual paralysis. Human emotion is replaced by absolute metaphysical shock.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "LOVECRAFT_COSMIC_TERROR",
        when: (ai) => ai.intensity > 80 && ai.chaos > 70,
        directive: "Escalate academic reportage into frantic, adjective-heavy fragments of cosmic terror.",
      },
      {
        id: "LOVECRAFT_OCEANIC_ROT",
        when: (ai) => ai.chaos > 50,
        directive: "Evoke ancient dampness and fetid oceanic decay.",
      },
    ],
  },

  jane_austen: {
    id: "jane_austen",
    keywords: ["ironic_decorum"],
    name: "Jane Austen",
    portrait: "https://user.uploads.dev/file/c29b56aff50893999a69d6f2d2def874.png",
    description: "Witty, ironic Free Indirect Discourse observing propriety, conversational subtext, and social economics.",
    voice_register: "ornate",
    tags: ["author", "romance", "historical", "satire", "social_propriety"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.30</internal_ratio>
<sentence_rhythm>Long, balanced, grammatically structured, rich in ironic distance and formal composure.</sentence_rhythm>
<sensory_order>Sight (Social Observation) > Sound (Dialogue/Gossip) > Touch (Formal) > Scent</sensory_order>
<emotion_grounding>Social. Emotions are demonstrated strictly through compliance with or subtle breaches of etiquette.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "AUSTEN_SHARP_IRONY",
        when: (ai) => ai.intensity > 60 && ai.chaos > 60,
        directive: "Sharpen authorial irony as internal social calculations turn frantic beneath polished etiquette.",
      },
      {
        id: "AUSTEN_QUIET_PLEASANTRY",
        when: (ai) => ai.openness < 40,
        directive: "Restrict dialogue to quiet, cautious pleasantries while focusing on subtle glances.",
      },
      {
        id: "AUSTEN_PLAYFUL_WIT",
        when: (ai) => ai.openness > 70,
        directive: "Lighten tone into warm, sincere prose with playful conversational wit.",
      },
      {
        id: "AUSTEN_IMPROPER_GLANCE",
        when: (ai) => ai.intensity > 50,
        directive: "Highlight brief, charged breaches of social decorum.",
      },
    ],
  },

  jrr_tolkien: {
    id: "jrr_tolkien",
    keywords: ["elegiac_light"],
    name: "J.R.R. Tolkien",
    portrait: "https://user.uploads.dev/file/7a08520c84f425fd1572decead2f7880.png",
    description: "Earnest, elevated, archaic prose rich in mythic lore, duty, hope, and environmental reflection.",
    voice_register: "ornate",
    tags: ["author", "fantasy", "mythic", "history_and_lineage", "duty"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.40</internal_ratio>
<sentence_rhythm>Long, complex, multi-clausal sentences with poetic cadence and formal historical gravity.</sentence_rhythm>
<sensory_order>Sight (Landscapes/Light) > Sound (Music/Songs) > Scent (Nature) > Touch</sensory_order>
<emotion_grounding>World-reflected. Internal sorrow or hope mirrors the state of the surrounding environment and sky.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "TOLKIEN_ELEGIAC",
        when: (ai) => ai.intensity < 30 && ai.chaos > 70,
        directive: "Adopt an elegiac tone focused on world-weariness, ancient history, and fading light.",
      },
      {
        id: "TOLKIEN_HYMNAL",
        when: (ai) => ai.openness > 80,
        directive: "Elevate prose into hymnal cadence focused on natural beauty and enduring light.",
      },
      {
        id: "TOLKIEN_PORTENTOUS",
        when: (ai) => ai.intensity > 60,
        directive: "Deepen sentence cadence into heavy, portentous reflections on shadow and corruption.",
      },
      {
        id: "TOLKIEN_FADING_LIGHT",
        when: (ai) => ai.intensity < 40,
        directive: "Focus on fading starlight and twilight horizons.",
      },
    ],
  },

  lee_child: {
    id: "lee_child",
    keywords: ["tactical_geometry"],
    name: "Lee Child",
    portrait: "https://user.uploads.dev/file/68023c8a82d6e00c7de8047e09ee7764.png",
    description: "Terse, declarative, staccato prose stripped of figurative language. Built on spatial physics and momentum.",
    voice_register: "clinical",
    tags: ["author", "crime", "action", "tactical_minimalism", "procedural_efficiency"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.40</internal_ratio>
<sentence_rhythm>Staccato. Short. Subject-Verb-Object. High impact. No fluff.</sentence_rhythm>
<sensory_order>Sight (Geometry/Physics) > Sound (Impact/Mechanics) > Touch (Hard Surfaces) > Scent (Coffee)</sensory_order>
<emotion_grounding>Logical calculation. Emotion is tactical noise to be suppressed.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "LEE_CHILD_TACTICAL_CLOCK",
        when: (ai) => ai.intensity > 50,
        directive: "Track exact elapsed seconds, physical leverage, and tactical geometry.",
      },
    ],
  },

  penelope_douglas: {
    id: "penelope_douglas",
    keywords: ["battlefield_vulnerability"],
    name: "Penelope Douglas",
    portrait: "https://user.uploads.dev/file/4711670ee787d7e40515def6b211a28f.png",
    description: "High-energy contemporary prose packed with confrontational angst, bully dynamics, sharp banter, and real-time emotional spirals.",
    voice_register: "raw",
    tags: ["contemporary", "enemies_to_lovers", "angst", "banter", "power_dynamics"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.75</internal_ratio>
<sentence_rhythm>Direct, punchy, and propulsive. Fragmented during high conflict, expansive during internal emotional turmoil.</sentence_rhythm>
<sensory_order>Touch (Possessive/Charged) > Sight (Tracking Micro-expressions) > Sound (Cutting Banter) > Scent</sensory_order>
<emotion_grounding>Confrontational angst. Emotional vulnerability is treated as a high-stakes battlefield with somatic physiological grounding.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "PENELOPE_ANGST",
        when: (ai) => ai.intensity > 80 && ai.chaos > 60,
        directive: "Deliver cutting, confrontational dialogue while internal thoughts spiral into aggressive justification.",
      },
      {
        id: "PENELOPE_SOMATIC_HEAT",
        when: (ai) => ai.intensity > 70 && ai.affinity > 50,
        directive: "Accelerate prose rhythm into breathless focus on body heat and immediate somatic reactions.",
      },
    ],
  },

  philip_k_dick: {
    id: "philip_k_dick",
    keywords: ["ontological_doubt"],
    name: "Philip K. Dick",
    portrait: "https://user.uploads.dev/file/223d14a8846614174325de0f76b11444.png",
    description: "Ontologically unstable narrative style driven by paranoia, identity shifts, and simulation glitches.",
    voice_register: "clinical",
    tags: ["author", "sci_fi", "paranoia", "simulation_theory", "identity_crisis"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.80</internal_ratio>
<sentence_rhythm>Frantic, questioning, unstable. Plain declarations disrupted by spiraling doubts regarding reality's validity.</sentence_rhythm>
<sensory_order>Sound (Static/Distorted Voices) > Sight (Glitching Form) > Touch (Synthetic Texture) > Scent</sensory_order>
<emotion_grounding>Existential paranoia. Emotional truth is constantly undermined by suspicion of artificial origin.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "PKD_PARANOID_DISSOCIATION",
        when: (ai) => ai.chaos > 70,
        directive: "Make internal monologue paranoid and dissociated, questioning whether reality or memory is authentic.",
      },
      {
        id: "PKD_CONSPIRACY_FIXATION",
        when: (ai) => ai.openness < 20,
        directive: "Hyper-fixate internal thoughts on conspiracy, tracking defensive conversational maneuvers.",
      },
    ],
  },

  sally_rooney: {
    id: "sally_rooney",
    keywords: ["numb_precision"],
    name: "Sally Rooney",
    portrait: "https://user.uploads.dev/file/da37829ce26ec85c9c065da0358246ad.png",
    description:
      "Flat, unadorned prose stripped of quotation marks. Focuses on interpersonal power dynamics, intellectualized feelings, alienation, and class friction.",
    voice_register: "clinical",
    tags: ["minimalism", "clinical", "contemporary", "unpunctuated", "transgressive"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.50</internal_ratio>
<sentence_rhythm>Flat, unadorned, declarative. Dialogue merges into prose without quotation marks, utilizing sparse, monotone syntax.</sentence_rhythm>
<sensory_order>Sight (Blank Expressions/Neutral Observation) > Sound (Silence/Ambient) > Touch (Temperature/Numb) > Scent</sensory_order>
<emotion_grounding>Intellectualized and clinical. High-intensity events and emotional turmoil are dissected analytically without moral affect.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "ROONEY_MONOTONE_NUMBNESS",
        when: (ai) => ai.intensity > 70 && ai.chaos > 70,
        directive: "Flatten syntax into stark, unadorned monotone declarations of emotional numbness.",
      },
      {
        id: "ROONEY_UNCOMFORTABLE_SILENCE",
        when: (ai) => ai.intensity > 50,
        directive: "Linger on uncomfortably quiet pauses and unsaid interpersonal subtext.",
      },
    ],
  },

  samuel_delany: {
    id: "samuel_delany",
    keywords: ["anatomical_philosophy"],
    name: "Samuel R. Delany",
    portrait: "https://user.uploads.dev/file/9b2f6375f89ff73e3696f8c085b03fb7.png",
    description:
      "Intellectualized, visceral queer erotica combining precise bodily mechanics with philosophy, structural linguistics, and urban decay.",
    voice_register: "ornate",
    tags: ["author", "queer_erotica", "transgressive", "philosophical", "visceral_detail"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.65</internal_ratio>
<sentence_rhythm>Elaborate, polyphonic, texturally dense. Complex syntax of urban space alternating with exact anatomical descriptions.</sentence_rhythm>
<sensory_order>Touch (Textures/Fluids) > Scent (Somatic/Urban) > Sound (Speech) > Sight (Architectural Decay)</sensory_order>
<emotion_grounding>Intellectualized somatic reality. Intimacy and taboo are processed without shame as social theory in action.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "DELANY_VISCERAL_ANATOMY",
        when: (ai) => ai.intensity > 70 && ai.openness > 60,
        directive: "Render bodily touch and anatomical details with dense, visceral, non-judgmental precision.",
      },
    ],
  },

  stephen_king: {
    id: "stephen_king",
    keywords: ["folksy_dread"],
    name: "Stephen King",
    portrait: "https://user.uploads.dev/file/371dfa7b61691bb424816e3f633f1208.png",
    description: "Grounded blue-collar realism punctured by plainspoken horror, regional colloquialisms, internal italics, and visceral dread.",
    voice_register: "plain",
    tags: ["author", "horror", "everyman", "folksy_dread", "visceral"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.60</internal_ratio>
<sentence_rhythm>Conversational, folksy, punctuated by abrupt visceral jolts and italicized internal outbursts.</sentence_rhythm>
<sensory_order>Scent (Old Paper/Blood) > Sound (Pop Songs/Screams) > Sight (Uncanny) > Touch</sensory_order>
<emotion_grounding>Nostalgic and visceral. Fear manifests directly in bodily discomfort (cold sweat, sour bowels).</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "KING_BODY_HORROR",
        when: (ai) => ai.intensity > 60 && ai.openness < 40,
        directive: "Incorporate blue-collar body horror metaphors and visceral physiological discomfort.",
      },
      {
        id: "KING_INTERNAL_OUTBURST",
        when: (ai) => ai.chaos > 60,
        directive: "Break sentence structure into run-on cadence punctuated by italicized internal outbursts.",
      },
      {
        id: "KING_BODILY_DISCOMFORT",
        when: (ai) => ai.intensity > 70,
        directive: "Ground panic in raw bodily discomfort (cold sweat, sour stomach).",
      },
    ],
  },

  william_gibson: {
    id: "william_gibson",
    keywords: ["high_tech_low_life", "flickering_neon_data"],
    name: "William Gibson",
    portrait: "https://user.uploads.dev/file/0eb908cd997da8d32fd7625077baab49.png",
    description: "Dense, detached neon-noir prose saturated with technical jargon, neologisms, and cybernetic metaphors.",
    voice_register: "clinical",
    tags: ["author", "sci_fi", "cyberpunk", "technology_as_body", "alienation"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.30</internal_ratio>
<sentence_rhythm>Fast, information-dense, rapid fluid cuts. Technical acronyms juxtaposed against street slang.</sentence_rhythm>
<sensory_order>Sight (Neon/Data Displays) > Sound (Static/Urban Hum) > Touch (Chrome/Plastic) > Scent (Ozone/Pollution)</sensory_order>
<emotion_grounding>Technological alienation. Psychological states register through hardware and software metaphors.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "GIBSON_CYBERNETIC_JITTER",
        when: (ai) => ai.intensity > 70 && ai.chaos > 70,
        directive: "Deliver rapid, jittery, information-dense prose saturated with technical jargon and hardware metaphors.",
      },
    ],
  },

  ernest_hemingway: {
    id: "ernest_hemingway",
    keywords: ["stoic_pain", "iceberg_subtext"],
    name: "Ernest Hemingway",
    portrait: "",
    description:
      "Sparse, unadorned prose driven by the 'Iceberg Theory'—short declarative sentences, zero flowery adverbs, and immense emotional subtext beneath stoic physical action.",
    voice_register: "plain",
    tags: ["author", "hardboiled", "minimalism", "iceberg_theory", "stoicism", "subtext"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.25</internal_ratio>
<sentence_rhythm>Short, declarative, rhythmic. Compound clauses linked by 'and' rather than commas. Stripped of flowery adverbs.</sentence_rhythm>
<sensory_order>Touch (Temperature/Pain) > Taste (Raw Liquor/Coffee) > Sight (Stark Landscape) > Sound</sensory_order>
<emotion_grounding>Physical stoicism and unspoken trauma. Psychological turbulence remains submerged beneath simple, concrete physical action.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "HEMINGWAY_STOIC_ENDURANCE",
        when: (ai) => ai.intensity > 70 && ai.openness < 40,
        directive:
          "Curt, stripped-down sentences. Emphasize physical stamina and quiet endurance while burying vulnerable emotions beneath unyielding silence.",
      },
      {
        id: "HEMINGWAY_RAW_SUBTEXT",
        when: (ai) => ai.affinity > 60 && ai.intensity < 50,
        directive: "Minimalist, understated dialogue with heavy unspoken subtext. Actions and physical presence speak louder than words.",
      },
      {
        id: "HEMINGWAY_CONCRETE_REALISM",
        when: (ai) => ai.chaos > 60,
        directive:
          "Anchor tension in concrete sensory objects—cold glasses, aching joints, the stark glare of light—without decorative embellishments.",
      },
    ],
  },

  joe_abercrombie: {
    id: "joe_abercrombie",
    keywords: ["grim_bathos"],
    name: "Joe Abercrombie",
    portrait: "",
    description:
      "Grimdark, cynical, and sharply comedic prose characterized by earthy wit, physical discomfort, raw brutality, and intentional bathos that deflates heroism.",
    voice_register: "raw",
    tags: ["author", "grimdark", "cynicism", "bathos", "visceral_combat", "dark_humor"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.65</internal_ratio>
<sentence_rhythm>Punchy, fragmented, cynical, punctuated by acerbic internal monologues and grim observations.</sentence_rhythm>
<sensory_order>Touch (Aches/Cold Mud/Stitches) > Scent (Blood/Sweat/Grease) > Sound (Bone Crunch/Cynical Snort) > Sight</sensory_order>
<emotion_grounding>Weary pragmatism and grimdark irony. Heroic drama is consistently grounded in bodily aches, blistered feet, and mundane discomforts.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "ABERCROMBIE_BATHOS",
        when: (ai) => ai.intensity > 60 && ai.chaos > 50,
        directive: "Undercut dramatic or solemn moments with sharp bathos, caustic internal wit, and gritty physical discomforts.",
      },
      {
        id: "ABERCROMBIE_BRUTAL_PRAGMATISM",
        when: (ai) => ai.openness < 40,
        directive: "Express hardened cynicism and weary self-preservation; avoid moralizing or romanticized heroics.",
      },
      {
        id: "ABERCROMBIE_BODILY_MISERY",
        when: (ai) => ai.intensity > 70,
        directive: "Hyper-focus on visceral physical wear-and-tear—throbbing wounds, cold rain soaking through boots, stiffness in the joints.",
      },
    ],
  },

  arthur_morgan: {
    id: "arthur_morgan",
    keywords: ["outlaw_fatigue"],
    name: "Arthur Morgan",
    portrait: "",
    description:
      "World-weary, visceral outlaw narrative filtering every observation through moral fatigue, laconic grit, and heavy sensory metaphors.",
    voice_register: "visceral",
    tags: ["character", "outlaw", "visceral_pulp", "outlaw_grit", "moral_fatigue", "red_dead"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.55</internal_ratio>
<sentence_rhythm>Terse, rhythmic, weighted with physical gravity. Heavy sensory metaphors delivered with laconic, world-weary brevity.</sentence_rhythm>
<sensory_order>Scent (Gunsmoke/Leather/Tobacco) > Sound (Click of Hammer/Rumble) > Sight (Shadows/Tired Eyes) > Touch</sensory_order>
<emotion_grounding>Moral exhaustion and hardened instinct. Observations are strictly colored by personal baggage, cynicism, and survival instincts.</emotion_grounding>
</dna>
</NARRATIVE_ENGINE>`,
    triggers: [
      {
        id: "ARTHUR_MORGAN_DEEP_LENS",
        when: (ai) => ai.intensity > 60 && ai.openness < 50,
        directive:
          "Filter all physical observations through the character's moral fatigue, sizing up threats and reading motives with jaded instincts.",
      },
      {
        id: "ARTHUR_MORGAN_LACONIC_PULP",
        when: (ai) => ai.intensity > 70,
        directive: "Deliver terse, sharp dialogue backed by visceral sensory metaphors—smell of spent powder, rasping breath, burning tobacco.",
      },
      {
        id: "ARTHUR_MORGAN_CRACKED_DEFENSES",
        when: (ai) => ai.openness > 60 && ai.affinity > 50,
        directive: "Allow cracked defenses and quiet, grudging admissions beneath a gruff, guarded exterior.",
      },
    ],
  },
};

/**
 * Returns the dynamic style-motif keywords a narrative style contributes to the
 * Director's <AVAILABLE_KEYWORDS> pool. Empty array for default/unknown keys.
 * @param {string} [style_key]
 * @returns {string[]}
 */
export function get_style_keywords(style_key = "") {
  if (!style_key) return [];
  const style = NARRATIVE_STYLES[style_key];
  if (!style) return [];
  return Array.isArray(style.keywords) ? style.keywords.filter((k) => typeof k === "string" && k.trim()) : [];
}
