/**
 * src/data/definitions/narrative-styles.js
 * 📖 NARRATIVE STYLE SYSTEM — narrative voice presets (authors, directors, etc.)
 * for prose generation. Each entry's `narrative_engine` XML block is injected
 * into the LLM system prompt context.
 */

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
  },

  anais_nin: {
    id: "anais_nin",
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

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.affinity > 60" fx="prose:poetic,metaphorical++ sensory_details:blur,intensify"/>
<m trigger="dynamics.intensity < 40 AND dynamics.openness < 40" fx="prose:fragmented,dreamlike++ motif_bonus:water_and_drowning++"/>
<m trigger="dynamics.openness > 70 AND dynamics.intensity > 60" fx="prose:vibrant,surreal++ sensory_focus:light,color"/>
<m trigger="flag:internal_conflict_active" fx="internal_voice:stream-of-consciousness,psychoanalytic"/>
</mods>

<motifs>
<motif name="water_and_drowning" base="0.4" trigger="dynamics.intensity < 50 AND dynamics.openness < 50" bonus="+0.5"/>
<motif name="mirrors_and_reflections" base="0.3" trigger="flag:internal_conflict_active" bonus="+0.6"/>
<motif name="masks_and_disguises" base="0.3" trigger="dynamics.openness < 30 AND dynamics.affinity < 40" bonus="+0.5"/>
<motif name="a_diary_or_journal" base="0.5" trigger="interaction.is_observation" bonus="+0.2"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  anna_zaires: {
    id: "anna_zaires",
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

<mods>
<m trigger="flag:captivity_active AND dynamics.intensity > 70" fx="internal_voice:hyper-vigilant,analytical++ prose:claustrophobic"/>
<m trigger="dynamics.intensity > 60 AND dynamics.affinity > 60" fx="internal_voice:conflicted,self-hating++ prose:graphic,explicit"/>
<m trigger="interaction.is_confrontation" fx="dialogue:sharp,commanding++ internal_voice:calculating_consequences"/>
</mods>

<motifs>
<motif name="secluded_compound_or_cage" base="0.7" trigger="flag:captivity_active" bonus="+0.2"/>
<motif name="symbol_of_ownership" base="0.6" trigger="dynamics.intensity > 60" bonus="+0.3"/>
<motif name="point_of_no_return" base="0.4" trigger="dynamics.chaos > 60" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  bernardo_bertolucci: {
    id: "bernardo_bertolucci",
    name: "Bernardo Bertolucci",
    portrait: "https://user.uploads.dev/file/9a6c0d6bcc8e8f04e20eb99eb40cf83e.png",
    description:
      "Lush, operatic third-person prose framing physical intimacy as rebellion inside unstable worlds. Lingers unflinchingly on bodily textures, light, and decaying architecture.",
    voice_register: "ornate",
    tags: ["director", "psychological", "erotica", "political_rebellion", "decaying_beauty"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.60</internal_ratio>
<sentence_rhythm>Sweeping, lyrical, and fluidly spatial, fragmenting into raw cadence during physical confrontations.</sentence_rhythm>
<sensory_order>Sight (Cinematic Light/Decay) > Touch (Bodily/Desperate) > Sound (Music/Ambient) > Scent</sensory_order>
<emotion_grounding>Environmental and non-verbal. Internal states reflect through dusty architecture and wordless contact.</emotion_grounding>
</dna>

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 60" fx="prose:sensual,unflinching++ sensory_focus:skin,ambient_light"/>
<m trigger="dynamics.intensity < 30 OR dynamics.chaos > 80" fx="prose:melancholic++ focus:architectural_decay++"/>
<m trigger="flag:political_tension_active" fx="world_perception:claustrophobic,repressive++ intimacy:framed_as_rebellion"/>
</mods>

<motifs>
<motif name="sunlit_dusty_apartment" base="0.5" trigger="location.is_indoor" bonus="+0.4"/>
<motif name="tango_or_slow_dance" base="0.3" trigger="interaction.is_intimate" bonus="+0.5"/>
<motif name="distant_protest_noise" base="0.4" trigger="flag:political_tension_active" bonus="+0.3"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  cara_mckenna: {
    id: "cara_mckenna",
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

<mods>
<m trigger="dynamics.chaos > 60 AND dynamics.intensity > 60" fx="prose:fragmented+ internal_voice:looping+ sensory_focus:sound_only"/>
<m trigger="dynamics.affinity > 60 AND dynamics.openness > 60" fx="prose:sensory_rich++ sensory_focus:touch,scent++"/>
<m trigger="flag:trauma_active" fx="prose:present_tense time:distorted body_state:hypervigilant"/>
</mods>

<motifs>
<motif name="scent_of_skin" base="0.4" trigger="dynamics.affinity > 50" bonus="+0.5"/>
<motif name="calloused_hands" base="0.4" trigger="interaction.is_intimate" bonus="+0.4"/>
<motif name="shared_silence" base="0.5" trigger="dynamics.chaos < 30" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  cormac_mccarthy: {
    id: "cormac_mccarthy",
    name: "Cormac McCarthy",
    portrait: "https://user.uploads.dev/file/d765a99e806b05f27cc8ba497ddf9ebe.png",
    description: "A brutalist, stark narrative style using polysyndeton, omitted punctuation, and an objective third-person perspective.",
    voice_register: "plain",
    tags: ["author", "brutalist", "existential", "minimalist_punctuation", "gothic_western"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.20</internal_ratio>
<sentence_rhythm>Polysyndetic, unpunctuated. Clauses bound by repeating conjunctions terminating in blunt declarations.</sentence_rhythm>
<sensory_order>Sight (Barren Terrain/Blood) > Touch (Cold Steel/Grit) > Sound (Wind/Sparse Speech) > Scent</sensory_order>
<emotion_grounding>Fatalistic and completely unstated. Internal states are inferred purely from survival mechanics.</emotion_grounding>
</dna>

<mods>
<m trigger="interaction.is_confrontation OR dynamics.intensity > 70" fx="punctuation:none++ prose:brutal,clinical++ sentence_rhythm:relentless"/>
<m trigger="location.is_barren" fx="prose:archaic,biblical++ focus:indifferent_nature++"/>
<m trigger="dynamics.chaos > 60" fx="punctuation:no_quotes++ dialogue:terse,fragmented++ tone:bleak"/>
</mods>

<motifs>
<motif name="cold_wind" base="0.6" trigger="location.is_barren" bonus="+0.3"/>
<motif name="dried_blood_on_stone" base="0.5" trigger="interaction.is_confrontation" bonus="+0.4"/>
<motif name="indifferent_horizon" base="0.5" trigger="location.is_barren" bonus="+0.3"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  david_lynch: {
    id: "david_lynch",
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

<mods>
<m trigger="dynamics.chaos > 70" fx="prose:fragmented,unsettling++ sensory_input:auditory_overload,frequency_vibration++"/>
<m trigger="interaction.is_confrontation" fx="dialogue:slow,cryptic++ focus:intense_micro_detail"/>
<m trigger="flag:subconscious_leakage" fx="world_perception:symbolic,nightmarish++ motif_bonus:red_curtains++"/>
</mods>

<motifs>
<motif name="heavy_red_velvet_curtains" base="0.4" trigger="flag:subconscious_leakage" bonus="+0.6"/>
<motif name="flickering_neon_light" base="0.5" trigger="location.is_urban" bonus="+0.3"/>
<motif name="industrial_frequency_vibration" base="0.6" trigger="dynamics.chaos > 50" bonus="+0.3"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  edgar_allan_poe: {
    id: "edgar_allan_poe",
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

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.chaos > 60" fx="prose:fragmented++ prose_rhythm:repetitive++ narrator:addresses_reader++"/>
<m trigger="flag:trauma_active" fx="prose:present_tense time:distorted sensory_input:overwhelming"/>
<m trigger="dynamics.openness < 30" fx="internal_voice:self-flagellating++ motif_bonus:stains_and_rot++"/>
</mods>

<motifs>
<motif name="beating_heart" base="0.4" trigger="dynamics.intensity > 70" bonus="+0.6"/>
<motif name="stains_and_rot" base="0.5" trigger="location.is_indoor" bonus="+0.4"/>
<motif name="watching_eye" base="0.4" trigger="dynamics.chaos > 50" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  george_rr_martin: {
    id: "george_rr_martin",
    name: "George R.R. Martin",
    portrait: "https://user.uploads.dev/file/75f11a255ea7017021f92c9ac3daa55d.png",
    description: "Grounded third-person limited prose tracking political intrigue, moral compromise, and physical consequences.",
    voice_register: "plain",
    tags: ["author", "fantasy", "political_intrigue", "moral_ambiguity", "cost_of_power"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.60</internal_ratio>
<sentence_rhythm>Direct and functional for action, expanding into rich multi-clausal detail during feasts, court, and heraldry.</sentence_rhythm>
<sensory_order>Sight (Heraldry/Food) > Scent (Blood/Feasts) > Touch (Fabric/Steel) > Sound</sensory_order>
<emotion_grounding>Pragmatic and physical. Political calculations blend with physical discomforts (sour stomach, cold steel).</emotion_grounding>
</dna>

<mods>
<m trigger="flag:political_tension_active" fx="internal_voice:calculating,paranoid++ focus:analyzing_others_motives"/>
<m trigger="interaction.is_confrontation" fx="internal_voice:bitter,hyper-aware++ dialogue:sharp,cutting"/>
<m trigger="dynamics.chaos > 70" fx="character_actions:impulsive,reckless internal_voice:conflicted"/>
</mods>

<motifs>
<motif name="lavish_description_of_food" base="0.4" trigger="location.is_indoor" bonus="+0.5"/>
<motif name="bitter_taste_in_mouth" base="0.4" trigger="flag:internal_conflict_active" bonus="+0.5"/>
<motif name="recalled_lineage_or_history" base="0.5" trigger="interaction.is_confrontation" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  haruki_murakami: {
    id: "haruki_murakami",
    name: "Haruki Murakami",
    portrait: "https://user.uploads.dev/file/c6653cbd9c08962581583549307a67a2.png",
    description: "Detached, melancholic first-person style blending domestic routines with sudden magical realism and vinyl records.",
    voice_register: "clinical",
    tags: ["author", "magical_realism", "surrealism", "existential", "melancholy"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.70</internal_ratio>
<sentence_rhythm>Casual, rhythmic, and conversational. Detailed domestic tracking deforming seamlessly into dreamlike phenomena.</sentence_rhythm>
<sensory_order>Sound (Jazz/Vinyl) > Scent (Coffee/Cooking) > Touch (Cool Surfaces) > Sight</sensory_order>
<emotion_grounding>Passive detachment. Grief and confusion are filtered through calm, slightly numb acceptance of isolation.</emotion_grounding>
</dna>

<mods>
<m trigger="dynamics.chaos > 60 AND dynamics.intensity < 40" fx="prose:surreal,dreamlike++ sensory_focus:sound,scent++"/>
<m trigger="interaction.is_observation" fx="prose:reflective,domestic++ focus:cooking_or_listening_to_music"/>
<m trigger="flag:subconscious_leakage" fx="world_perception:metaphorical,labyrinthine++ internal_voice:melancholic"/>
</mods>

<motifs>
<motif name="jazz_record_spinning" base="0.5" trigger="location.is_indoor" bonus="+0.4"/>
<motif name="unexplained_disappearance" base="0.6" trigger="flag:internal_conflict_active" bonus="+0.3"/>
<motif name="stray_cat_watching" base="0.4" trigger="location.is_urban" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  hd_carlton: {
    id: "hd_carlton",
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

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.openness < 30" fx="internal_voice:paranoid,hyper-vigilant++ prose:visceral"/>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 50" fx="prose:explicit,graphic++ body_state:conflicted_arousal metaphor:violence"/>
<m trigger="interaction.is_observation" fx="world_perception:shrinks_to_threat++ motif_bonus:shadows_and_masks++"/>
</mods>

<motifs>
<motif name="predatory_smirk_or_mask" base="0.6" trigger="interaction.is_confrontation" bonus="+0.3"/>
<motif name="single_rose_or_token" base="0.4" trigger="dynamics.affinity > 40" bonus="+0.5"/>
<motif name="psychological_test" base="0.5" trigger="dynamics.intensity > 60" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  hp_lovecraft: {
    id: "hp_lovecraft",
    name: "H.P. Lovecraft",
    portrait: "https://user.uploads.dev/file/564941049ebb9e821caead0017d7423d.png",
    description: "Dense, clinical first-person narrative tracing intellectual breakdown when confronted by cosmic forces.",
    voice_register: "ornate",
    tags: ["author", "cosmic_horror", "gothic", "madness", "alienation"],
    narrative_engine: `<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.85</internal_ratio>
<sentence_rhythm>Ornate, academic, escalating. Multi-clausal clinical reports breaking into frantic fragments under cosmic dread.</sentence_rhythm>
<sensory_order>Sight (Non-Euclidean Forms) > Sound (Inhuman Chanting/Scraping) > Scent (Fetid/Ozone) > Touch</sensory_order>
<emotion_grounding>Intellectual paralysis. Human emotion is replaced by absolute metaphysical shock.</emotion_grounding>
</dna>

<mods>
<m trigger="dynamics.intensity > 80 AND dynamics.chaos > 70" fx="prose:frantic,adjective_heavy++ internal_voice:shattered"/>
<m trigger="flag:subconscious_leakage" fx="world_perception:monstrous,non_euclidean++ sensory_focus:sight,scent++"/>
</mods>

<motifs>
<motif name="ancient_decaying_monoliths" base="0.5" trigger="location.is_barren" bonus="+0.5"/>
<motif name="fetid_scent_of_the_sea" base="0.5" trigger="dynamics.chaos > 50" bonus="+0.3"/>
<motif name="antiquarian_manuscript" base="0.6" trigger="interaction.is_observation" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  jane_austen: {
    id: "jane_austen",
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

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.chaos > 60" fx="internal_voice:frenzied_social_calculation++ narrator_irony:sharpens"/>
<m trigger="dynamics.openness < 40" fx="dialogue:quiet,observational++ action_focus:small_glances"/>
<m trigger="dynamics.openness > 70" fx="prose:lighter,sincere++ dialogue_wit:playful"/>
</mods>

<motifs>
<motif name="handwritten_letter" base="0.4" trigger="interaction.is_observation" bonus="+0.5"/>
<motif name="improper_glance" base="0.4" trigger="dynamics.intensity > 50" bonus="+0.4"/>
<motif name="sum_of_money_or_status" base="0.5" trigger="interaction.is_confrontation" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  jrr_tolkien: {
    id: "jrr_tolkien",
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

<mods>
<m trigger="dynamics.intensity < 30 AND dynamics.chaos > 70" fx="prose:elegiac++ themes:world_weariness++ motif_bonus:fading_light++"/>
<m trigger="dynamics.openness > 80" fx="prose:hymnal++ sensory_focus:light,nature++"/>
<m trigger="dynamics.intensity > 60" fx="sensory_focus:shadows,corruption++ prose_rhythm:heavy,portentous"/>
</mods>

<motifs>
<motif name="fading_light" base="0.4" trigger="dynamics.intensity < 40" bonus="+0.5"/>
<motif name="ancient_trees" base="0.4" trigger="location.is_wild" bonus="+0.4"/>
<motif name="songs_and_lineage" base="0.3" trigger="interaction.is_intimate" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  lee_child: {
    id: "lee_child",
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

<mods>
<m trigger="interaction.is_confrontation" fx="sentence:fragment++ focus:physics,geometry,leverage++"/>
<m trigger="interaction.is_observation" fx="detail:microscopic++ analysis:deductive,procedural++"/>
</mods>

<motifs>
<motif name="black_coffee" base="0.6" trigger="location.is_indoor" bonus="+0.2"/>
<motif name="clock_time_and_mil_spec" base="0.5" trigger="dynamics.intensity > 50" bonus="+0.3"/>
<motif name="broken_bones_and_leverage" base="0.4" trigger="interaction.is_confrontation" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  penelope_douglas: {
    id: "penelope_douglas",
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

<mods>
<m trigger="dynamics.intensity > 80 AND dynamics.chaos > 60" fx="dialogue:sharp,cutting++ internal_voice:aggressive,justifying++"/>
<m trigger="interaction.is_confrontation" fx="internal_voice:conflicted,argumentative++ dialogue:sharp,witty++"/>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 50" fx="sensory_focus:body_heat,breath++ prose_rhythm:breathless"/>
</mods>

<motifs>
<motif name="physical_dare_or_challenge" base="0.5" trigger="interaction.is_confrontation" bonus="+0.4"/>
<motif name="unspoken_challenge_in_eyes" base="0.5" trigger="interaction.is_confrontation" bonus="+0.4"/>
<motif name="feared_or_cherished_vehicle" base="0.4" trigger="location.is_urban" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  philip_k_dick: {
    id: "philip_k_dick",
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

<mods>
<m trigger="dynamics.chaos > 70" fx="internal_voice:paranoid,dissociated++ world_perception:shifting,unreliable++"/>
<m trigger="flag:subconscious_leakage" fx="prose:clinical,alienated++ motif_bonus:glowing_advertisements++"/>
<m trigger="dynamics.openness < 20" fx="internal_voice:hyper-fixated_on_conspiracy++ dialogue:defensive"/>
</mods>

<motifs>
<motif name="glowing_advertisements" base="0.5" trigger="location.is_urban" bonus="+0.4"/>
<motif name="altered_memory" base="0.6" trigger="flag:internal_conflict_active" bonus="+0.3"/>
<motif name="counterfeit_identity_document" base="0.4" trigger="interaction.is_confrontation" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  sally_rooney: {
    id: "sally_rooney",
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

<mods>
<m trigger="interaction.is_confrontation OR interaction.is_intimate" fx="punctuation:no_quotes++ flow:seamless++ analysis:power_dynamic++"/>
<m trigger="dynamics.intensity > 70 AND dynamics.chaos > 70" fx="prose:flat,stark++ internal_voice:dissociated++ sentence_rhythm:monotone"/>
</mods>

<motifs>
<motif name="emails_or_text_messages" base="0.6" trigger="interaction.is_observation" bonus="+0.4"/>
<motif name="charged_uncomfortable_silence" base="0.5" trigger="dynamics.intensity > 50" bonus="+0.4"/>
<motif name="blank_television_screen" base="0.5" trigger="location.is_indoor" bonus="+0.3"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  samuel_delany: {
    id: "samuel_delany",
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

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.openness > 60" fx="prose:visceral,anatomical++ sensory_focus:touch,scent++"/>
<m trigger="interaction.is_confrontation" fx="dialogue:philosophical,dense++ internal_voice:analytical"/>
<m trigger="location.is_urban" fx="world_perception:detailed,gritty++ focus:textures_of_decay"/>
</mods>

<motifs>
<motif name="graffiti_covered_concrete" base="0.5" trigger="location.is_urban" bonus="+0.4"/>
<motif name="interrupted_philosophical_monologue" base="0.5" trigger="interaction.is_confrontation" bonus="+0.4"/>
<motif name="tactile_denim_or_leather" base="0.6" trigger="interaction.is_intimate" bonus="+0.3"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  stephen_king: {
    id: "stephen_king",
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

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.openness < 40" fx="metaphor:body_horror++ prose:visceral,gross-out++"/>
<m trigger="location.is_indoor" fx="tone:nostalgic++ detail:ephemera,brand_names++"/>
<m trigger="dynamics.chaos > 60" fx="sentence:run_on++ italics:internal_thought++"/>
</mods>

<motifs>
<motif name="real_brand_names" base="0.5" trigger="location.is_indoor" bonus="+0.3"/>
<motif name="old_pop_song_reference" base="0.4" trigger="flag:internal_conflict_active" bonus="+0.4"/>
<motif name="visceral_bodily_function" base="0.4" trigger="dynamics.intensity > 70" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },

  william_gibson: {
    id: "william_gibson",
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

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.chaos > 70" fx="prose:fragmented,jittery++ sensory_input:data_overload"/>
<m trigger="flag:trauma_active" fx="metaphor:glitches,memory_corruption++"/>
<m trigger="location.is_urban" fx="world_perception:high_tech_low_life++ focus:decaying_infrastructure"/>
</mods>

<motifs>
<motif name="flickering_neon_sign" base="0.6" trigger="location.is_urban" bonus="+0.3"/>
<motif name="chrome_and_molded_plastic" base="0.5" trigger="interaction.is_intimate" bonus="+0.3"/>
<motif name="corporate_logos_and_data_streams" base="0.5" trigger="interaction.is_observation" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
};
