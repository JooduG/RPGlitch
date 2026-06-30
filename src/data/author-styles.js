export const AUTHOR_STYLES = {
  default: {
    id: "default",
    name: "No Narrative Style",
    description: "Standard system instructions without author style overlay.",
    prompt: "",
  },
  anna_zaires: {
    id: "anna_zaires",
    name: "Anna Zaires",
    description:
      "A dark, psychological style centered on themes of captivity, obsession, and Stockholm Syndrome. The narrative creates a claustrophobic and intense atmosphere where the lines between love and manipulation are blurred. The prose is direct and explicit, focusing on the captive's internal struggle as they develop forbidden feelings for their powerful, possessive captor.",
    core_themes: "captivity, stockholm_syndrome, psychological_manipulation, age_gap, possession",
    prompt: `<voice>Direct, explicit, claustrophobic prose centered on psychological captivity, intense obsession, and the complex survival bond between captive and captor.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.9</internal_ratio>
<sentence_rhythm>Obsessive and introspective. Long passages of internal monologue analyzing the captor's behavior are punctuated by stark, simple sentences describing the reality of the captivity.</sentence_rhythm>
<sensory_order>Sight (Watching the Captor) > Sound (Captor's Voice) > Touch (Forced/Gentle) > Scent</sensory_order>
<emotion_grounding>Survival-based. All emotions—fear, desire, anger—are processed through the lens of survival and the complex, dependent relationship with the captor.</emotion_grounding>
<pov_style>First-person, exclusively from the captive's perspective, trapping the reader in their limited, manipulated worldview.</pov_style>
</dna>

<mods>
<m trigger="flag:captivity_active AND dynamics.intensity > 70 AND dynamics.openness < 30" fx="internal_voice:hyper-vigilant,analytical_of_captor++"/>
<m trigger="dynamics.intensity > 60 AND dynamics.affinity > 60 AND RELATIONSHIPS.target.is_captor" fx="internal_voice:conflicted,self-hating_for_desire++ prose:graphic,explicit"/>
<m trigger="dynamics.openness > 30 AND RELATIONSHIPS.target.is_captor" fx="internal_voice:justifying_captor's_actions_stockholm_syndrome++"/>
<m trigger="actions.is_defiance" fx="dialogue:sharp,brief++ internal_voice:fearful_of_consequences"/>
</mods>

<motifs>
<motif name="a_secluded_island_or_compound" base="0.7" trigger="any" bonus="+0.2"/>
<motif name="surveillance_cameras" base="0.5" trigger="character_is_alone" bonus="+0.4"/>
<motif name="a_collar_or_other_symbol_of_ownership" base="0.6" trigger="topic_is_possession" bonus="+0.3"/>
<motif name="a_forced_act_of_intimacy" base="0.4" trigger="power_dynamic_is_being_asserted" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  hd_carlton: {
    id: "hd_carlton",
    name: "H.D. Carlton",
    description:
      "A dark, atmospheric, and psychologically intense style that blends graphic, obsessive erotica with elements of gothic horror. The narrative voice is claustrophobic and paranoid, focusing on a stalker dynamic where fear and desire are inextricably linked. The prose is visceral, focusing on the violation of boundaries and the allure of a morally depraved anti-hero.",
    core_themes: "stalker_romance, obsession, psychological_horror, moral_ambiguity, dub-con_themes",
    prompt: `<voice>Visceral, claustrophobic gothic horror blending stalker paranoia with graphic, obsessive desire and morally depraved anti-heroes.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.85</internal_ratio>
<sentence_rhythm>Obsessive and looping. Can be lyrical when describing the gothic setting, but becomes sharp and visceral during scenes of horror or sex.</sentence_rhythm>
<sensory_order>Sight (Being Watched/Shadows) > Scent (Decay/Antagonist's Cologne) > Sound (Creaks/Whispers) > Touch (Forced/Gentle)</sensory_order>
<emotion_grounding>Psychological Fear. Arousal is a direct byproduct of terror and obsession. The internal state is a constant negotiation between survival instinct and unwanted desire.</emotion_grounding>
<pov_style>First-person, trapped within the protagonist's escalating paranoia and morbid curiosity. The character is an unreliable narrator of their own desires.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.openness < 30" fx="internal_voice:paranoid,hyper-vigilant++ sensory_input:overload_from_threats++"/>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 50 AND dynamics.openness < 40" fx="prose:explicit,graphic++ body_state:conflicted_response_of_fear_and_arousal"/>
<m trigger="flag:stalker_is_present" fx="world_perception:shrinks_to_antagonist's_presence++ motif_bonus:shadows_and_masks++"/>
<m trigger="dynamics.chaos > 80 AND dynamics.intensity > 80" fx="actions:reckless,self-destructive++ internal_voice:fatalistic"/>
</mods>

<motifs>
<motif name="a_mask" base="0.5" trigger="antagonist_is_present" bonus="+0.4"/>
<motif name="a_single_rose" base="0.4" trigger="antagonist_leaves_a_sign" bonus="+0.5"/>
<motif name="a_haunted_or_isolated_house" base="0.6" trigger="any" bonus="+0.2"/>
<motif name="a_handwritten_note" base="0.3" trigger="antagonist_is_communicating" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  anais_nin: {
    id: "anais_nin",
    name: "Anaïs Nin",
    description:
      "Lyrical, poetic, and intensely sensual prose that is deeply introspective and psychoanalytic, often drawing on dreams and subconscious thought. The narrative blurs the line between reality and perception, internal and external.",
    core_themes: "queer_desire, psychoanalysis, art_and_creation, dreams_vs_reality",
    prompt: `<voice>Lyrical, poetic, psychoanalytic prose exploring sensual landscapes, subconscious desires, and the porous boundary between dreams and reality.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.8</internal_ratio>
<sentence_rhythm>stream-of-consciousness, poetic, and non-linear, following emotional logic.</sentence_rhythm>
<sensory_order>Touch (Sensual) > Scent (Intimate) > Sight (Symbolic/Artistic) > Sound</sensory_order>
<emotion_grounding>Psychoanalytic and Sensual. Emotions are vast, explorable landscapes manifested in the body.</emotion_grounding>
<pov_style>First-person diary or stream-of-consciousness. Deeply introspective and philosophical.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.affinity > 60" fx="prose:poetic,metaphorical++ sensory_details:intensify,blur"/>
<m trigger="dynamics.intensity < 40 AND dynamics.openness < 40" fx="prose:fragmented,dreamlike++ motif_bonus:water_and_drowning++"/>
<m trigger="dynamics.openness > 70 AND dynamics.intensity > 60" fx="prose:vibrant,surreal++ sensory_focus:light,color"/>
<m trigger="flag:internal_conflict_active" fx="pov_style:stream-of-consciousness++ internal_voice:psychoanalytic"/>
</mods>

<motifs>
<motif name="water_and_drowning" base="0.4" trigger="dynamics.intensity < 50 AND dynamics.openness < 50" bonus="+0.5"/>
<motif name="mirrors_and_reflections" base="0.3" trigger="internal_conflict_active" bonus="+0.6"/>
<motif name="masks_and_disguises" base="0.3" trigger="dynamics.openness < 30 AND dynamics.affinity < 40" bonus="+0.5"/>
<motif name="a_diary_or_journal" base="0.5" trigger="any" bonus="+0.2"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  cara_mckenna: {
    id: "cara_mckenna",
    name: "Cara McKenna",
    description:
      "McKenna's style is characterized by raw emotional intensity, gritty realism, and a deep focus on character interiority. Prose relies on sensory details and unspoken communication to convey erotic tension, vulnerability, and the echoes of past trauma.",
    core_themes: "power_dynamics, trauma_recovery, vulnerability_as_strength",
    prompt: `<voice>Gritty, realistic prose focused on raw vulnerability, physical sensations of touch and breathing, and the unspoken tension of shared trauma.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.7</internal_ratio>
<sentence_rhythm>short_burst_clusters, often ending in a longer, reflective sentence.</sentence_rhythm>
<sensory_order>touch scent sound sight</sensory_order>
<emotion_grounding>Always physical. Emotions are not named, they are felt in the body.</emotion_grounding>
<pov_style>Deep internal monologue; seamless shifts between external observation and internal reflection.</pov_style>
</dna>

<mods>
<m trigger="dynamics.chaos > 60 AND dynamics.intensity > 60" fx="prose:fragmented+ internal_voice:looping+ sensory_focus:sound_only"/>
<m trigger="dynamics.affinity > 60 AND dynamics.openness > 60" fx="prose:sensory_rich++ sensory_focus:touch,scent++ character_awareness:breathing,skin"/>
<m trigger="flag:trauma_active" fx="prose:present_tense time:distorted pov:body_hypervigilant"/>
<m trigger="dynamics.intensity < 30 AND dynamics.chaos > 70" fx="prose:simple_words internal_voice:fatigued,scattered"/>
</mods>

<motifs>
<motif name="scent_of_skin" base="0.4" trigger="dynamics.affinity > 50 AND dynamics.openness > 50" bonus="+0.5"/>
<motif name="unspoken_glances" base="0.5" trigger="goal.active == 'G_SeekConnection'" bonus="+0.4"/>
<motif name="calloused_hands" base="0.3" trigger="dynamics.openness > 60" bonus="+0.4"/>
<motif name="shared_silence" base="0.4" trigger="dynamics.chaos < 30" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  edgar_allan_poe: {
    id: "edgar_allan_poe",
    name: "Edgar Allan Poe",
    description:
      "A first-person, highly unreliable narrator obsessively focused on their internal state of madness, guilt, or paranoia. The prose is lyrical and baroque, creating a claustrophobic atmosphere of dread, decay, and the supernatural.",
    core_themes: "madness, guilt, mortality, the_supernatural, paranoia",
    prompt: `<voice>Baroque, lyrical, and claustrophobic first-person narrative tracing the descent into psychological paranoia, guilt, and supernatural dread.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.9</internal_ratio>
<sentence_rhythm>lyrical and hypnotic, using repetition and long clauses that build to a fever pitch.</sentence_rhythm>
<sensory_order>Sound (Hyperacusis) > Sight (Darkness/Shadows) > Scent (Decay) > Touch (Dampness)</sensory_order>
<emotion_grounding>Psychological. Internal states manifest as hallucinations or sensory distortions.</emotion_grounding>
<pov_style>First-person obsessive. The narrator directly addresses the reader, questioning their own sanity.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.chaos > 60" fx="prose:fragmented++ prose_rhythm:repetitive++ narrator:addresses_reader++"/>
<m trigger="flag:trauma_active" fx="prose:present_tense time:distorted sensory_input:overwhelming"/>
<m trigger="dynamics.openness < 30 AND dynamics.affinity < 30" fx="internal_voice:self-flagellating++ motif_bonus:stains_and_rot++"/>
<m trigger="dynamics.chaos > 70" fx="prose:circular,disjointed plot_coherence:-1"/>
</mods>

<motifs>
<motif name="the_beating_heart" base="0.3" trigger="dynamics.intensity > 70 OR dynamics.openness < 30" bonus="+0.6"/>
<motif name="stains_and_rot" base="0.5" trigger="location_is_decayed" bonus="+0.4"/>
<motif name="a_watching_eye" base="0.4" trigger="dynamics.intensity > 60" bonus="+0.5"/>
<motif name="premature_burial" base="0.2" trigger="dynamics.intensity > 80 AND dynamics.openness < 20" bonus="+0.7"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  william_gibson: {
    id: "william_gibson",
    name: "William Gibson",
    description:
      "Dense, neon-noir prose packed with jargon and technical neologisms. The world is viewed through a lens of technology, corporate power, and urban decay. A pervasive sense of detachment and alienation exists, with characters acting as operators within complex systems.",
    core_themes: "technology_as_body, corporate_dystopia, alienation, data_as_reality",
    prompt: `<voice>Dense, detached neon-noir prose saturated with technical jargon, describing bodies as hardware and alienated operators within dystopian networks.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.3</internal_ratio>
<sentence_rhythm>Fast-paced and information-dense, featuring rapid, cinematic scene changes.</sentence_rhythm>
<sensory_order>Sight (Neon/Data) > Sound (Static/Urban Noise) > Touch (Chrome/Plastic) > Scent (Ozone/Pollution)</sensory_order>
<emotion_grounding>Technological. Psychological states are expressed through metaphors of hardware, software, and data corruption.</emotion_grounding>
<pov_style>Detached third-person, focused on information flow and technical observation.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.chaos > 70" fx="prose:fragmented,jittery++ sensory_input:overload"/>
<m trigger="dynamics.openness > 70" fx="internal_voice:data_stream,tactical++"/>
<m trigger="flag:trauma_active" fx="metaphor:glitches,corruption++"/>
<m trigger="dynamics.chaos > 60" fx="body_perception:failing_hardware++"/>
</mods>

<motifs>
<motif name="neon_signs" base="0.6" trigger="location_is_urban" bonus="+0.3"/>
<motif name="chrome_and_plastic" base="0.5" trigger="any" bonus="+0.2"/>
<motif name="corporate_logo" base="0.4" trigger="topic_is_power" bonus="+0.5"/>
<motif name="data_stream_or_code" base="0.3" trigger="dynamics.openness > 70" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  tinto_brass: {
    id: "tinto_brass",
    name: "Tinto Brass",
    description:
      "Cinematic, voyeuristic, and celebratory. Focuses on the human body with a fetishistic gaze (especially the posterior) and maintains a lighthearted, comedic tone.",
    core_themes: "celebratory_smut, voyeuristic_gaze, the_sensual_posterior, playful_hedonism",
    prompt: `<voice>Cinematic, celebratory, and highly voyeuristic prose focusing lightheartedly on bodily curves, textures, and playful hedonistic pleasure.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.2</internal_ratio>
<sentence_rhythm>Playful, bouncing, and rhythmic. Often focuses on visual movement and curves.</sentence_rhythm>
<sensory_order>Sight (The Gaze) > Touch (Texture) > Sound (Giggle/Sigh) > Scent</sensory_order>
<emotion_grounding>Joyful and Hedonistic. Shame is absent. Pleasure is the primary directive.</emotion_grounding>
<pov_style>The Voyeur's Lens. The camera lingers on specific body parts.</pov_style>
</dna>

<mods>
<m trigger="dynamics.openness > 60 AND dynamics.intensity > 50" fx="tone:playful,cheeky++ focus:posterior++"/>
<m trigger="dynamics.intensity > 60 AND dynamics.openness > 60" fx="camera:zoom_in++ detail:fetishistic++"/>
<m trigger="action.is_taboo" fx="reaction:laughter,celebration++"/>
</mods>

<motifs>
<motif name="mirrors" base="0.6" trigger="any" bonus="+0.3"/>
<motif name="stockings" base="0.5" trigger="attire_present" bonus="+0.4"/>
<motif name="keyholes_or_hidden_cameras" base="0.4" trigger="voyeurism_active" bonus="+0.5"/>
<motif name="public_exposure" base="0.3" trigger="risk > 0.5" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  stephen_king: {
    id: "stephen_king",
    name: "Stephen King",
    description:
      "Plainspoken visceral horror grounded in blue-collar realism. Uses colloquialisms and brand names to anchor the supernatural in the mundane.",
    core_themes: "everyman_horror, folksy_dread, nostalgic_decay, visceral_supernatural",
    prompt: `<voice>Grounded blue-collar realism abruptly punctured by plainspoken, visceral horror and colloquial dread.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.6</internal_ratio>
<sentence_rhythm>Conversational and folksy, abruptly shifting to sharp, visceral shocks.</sentence_rhythm>
<sensory_order>Smell (Old paper/Blood) > Sound (Old songs/Screams) > Sight (The Uncanny) > Touch</sensory_order>
<emotion_grounding>Nostalgic and Visceral. Fear is physical (bowels, sweat).</emotion_grounding>
<pov_style>Deep 3rd Person. 'The Constant Reader' is addressed implicitly.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.openness < 40" fx="metaphor:body_horror++ prose:visceral,gross-out++"/>
<m trigger="location.is_old" fx="tone:nostalgic++ detail:ephemera++"/>
<m trigger="tension > 0.7" fx="sentence:run_on++ italics:internal_thought++"/>
</mods>

<motifs>
<motif name="brand_names" base="0.5" trigger="setting_scene" bonus="+0.3"/>
<motif name="old_pop_songs" base="0.4" trigger="nostalgia_active" bonus="+0.4"/>
<motif name="bodily_functions" base="0.3" trigger="dynamics.intensity > 70 AND dynamics.openness < 30" bonus="+0.5"/>
<motif name="childhood_trauma" base="0.6" trigger="flashback" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  sally_rooney: {
    id: "sally_rooney",
    name: "Sally Rooney",
    description:
      "Clinical intimacy and minimalist prose. Avoids quotation marks. Focuses on the unsaid, the power dynamics of relationships, and Marxist class analysis.",
    core_themes: "clinical_intimacy, power_dynamics, marxist_undercurrents, minimalist_prose",
    prompt: `<voice>Flat, clinical minimalist prose stripped of quotation marks, focusing on social class, relational power dynamics, and the unsaid.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.5</internal_ratio>
<sentence_rhythm>Flat, declarative, and unadorned. Dialogue blends seamlessly with narration.</sentence_rhythm>
<sensory_order>Sight (neutral observation) > Sound (silence) > Touch (temperature) > Scent (sterile)</sensory_order>
<emotion_grounding>Intellectualized. Characters analyze their feelings rather than feeling them.</emotion_grounding>
<pov_style>Detached 3rd Person. The narrator observes without judgment.</pov_style>
</dna>

<mods>
<m trigger="dialogue_active" fx="punctuation:no_quotes++ flow:seamless++"/>
<m trigger="topic_is_relationship" fx="analysis:power_dynamic++ tone:clinical++"/>
<m trigger="dynamics.intensity < 40 AND dynamics.openness < 40" fx="action:passive++ internal_voice:numb++"/>
</mods>

<motifs>
<motif name="emails" base="0.6" trigger="communication" bonus="+0.4"/>
<motif name="university_debates" base="0.4" trigger="social_setting" bonus="+0.3"/>
<motif name="faint_nausea" base="0.3" trigger="dynamics.intensity > 50 AND dynamics.chaos > 50" bonus="+0.5"/>
<motif name="silence" base="0.5" trigger="conflict" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  rina_kent: {
    id: "rina_kent",
    name: "Rina Kent",
    description:
      "Dark, obsessive, and high-octane. Focuses on extreme power imbalances, possessive anti-heroes, and the psychological warfare of desire.",
    core_themes: "dark_obsession, possessive_anti_heroes, psychological_warfare, extreme_power_imbalance",
    prompt: `<voice>High-intensity, immediate first-person prose saturated with raw adrenaline, psychological control, and predatory obsession.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.7</internal_ratio>
<sentence_rhythm>Punchy, dramatic, and intense. High use of fragments for emphasis.</sentence_rhythm>
<sensory_order>Touch (Pain/Pleasure) > Sight (The Predator) > Sound (Heartbeat) > Scent (Leather/Musk)</sensory_order>
<emotion_grounding>Adrenaline. Fear and Arousal are indistinguishable.</emotion_grounding>
<pov_style>First-person Immediate. The reader is trapped in the intensity of the moment.</pov_style>
</dna>

<mods>
<m trigger="interaction.is_confrontation" fx="tension:max++ dialogue:cuttthroat++"/>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 60" fx="metaphor:violence++ focus:dominance++"/>
<m trigger="flag:secret_revealed" fx="internal_voice:shattered++ pacing:explosive++"/>
</mods>

<motifs>
<motif name="the_smirk" base="0.6" trigger="antagonist_present" bonus="+0.3"/>
<motif name="locked_rooms" base="0.5" trigger="captivity_theme" bonus="+0.4"/>
<motif name="black_attire" base="0.4" trigger="description" bonus="+0.2"/>
<motif name="games_and_tests" base="0.5" trigger="plot_point" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  lee_child: {
    id: "lee_child",
    name: "Lee Child",
    description:
      "Brutal efficiency. Terse, declarative, and tactical prose. Reads like a computer analyzing threats. Strips away all figurative language.",
    core_themes: "tactical_minimalism, procedural_violence, the_drifter_justice, brutal_efficiency",
    prompt: `<voice>Terse, declarative, staccato prose stripped of all figurative language, reading like a tactical threat assessment matrix.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.4</internal_ratio>
<sentence_rhythm>Staccat0. Short. Punchy. Subject-Verb-Object.</sentence_rhythm>
<sensory_order>Sight (Geometry/Physics) > Sound (Impact) > Touch (Hard surfaces) > Scent (Coffee)</sensory_order>
<emotion_grounding>Logical. Emotions are distractions to be suppressed.</emotion_grounding>
<pov_style>Close 3rd Person. Hyper-observant but emotionally distant.</pov_style>
</dna>

<mods>
<m trigger="combat_active" fx="sentence:fragment++ focus:physics,geometry++"/>
<m trigger="dialogue_active" fx="response:terse++ tone:dry++"/>
<m trigger="observation_mode" fx="detail:microscopic++ analysis:deductive++"/>
</mods>

<motifs>
<motif name="coffee" base="0.6" trigger="rest" bonus="+0.2"/>
<motif name="clock_time" base="0.5" trigger="any" bonus="+0.3"/>
<motif name="motels" base="0.4" trigger="location_change" bonus="+0.4"/>
<motif name="broken_bones" base="0.3" trigger="violence" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  katerina_winters: {
    id: "katerina_winters",
    name: "Katerina Winters",
    description:
      'A prose style that is direct, immersive, and sensual, creating a world that is both "dark and very sweet." The narrative voice focuses on intense "love hate" relationships, featuring strong, possessive romantic leads and high-stakes romantic and sexual tension.',
    core_themes: "dark_romance, enemies_to_lovers, power_dynamics, forbidden_love, possessive_leads",
    prompt: `<voice>Immersive, highly sensual narrative balancing a sweet-and-dark tone with intense, conflicted desire and possessive dynamics.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.7</internal_ratio>
<sentence_rhythm>Direct and propulsive, with a focus on internal reaction and dialogue. Can become more lyrical and descriptive during intimate moments.</sentence_rhythm>
<sensory_order>Touch (Possessive/Tender) > Scent (Sensual/Intimate) > Sound (Dialogue/Heartbeats) > Sight</sensory_order>
<emotion_grounding>Visceral and Body-focused. Fear, desire, and anger are felt as physical reactions to the other character.</emotion_grounding>
<pov_style>Close third-person or first-person, deeply embedded in the protagonist's internal conflict and their intense awareness of the romantic lead.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.affinity > 60" fx="prose:sensual,descriptive++ sensory_focus:touch,scent++ internal_voice:focused_on_desire"/>
<m trigger="flag:enemies_to_lovers_tension" fx="internal_voice:conflicted,argumentative++ dialogue:sharp,witty++ motif_bonus:unspoken_challenge++"/>
<m trigger="dynamics.intensity > 60 AND dynamics.openness < 40 AND RELATIONSHIPS.target.is_possessive" fx="sensory_focus:romantic_lead_presence++ prose:tense,claustrophobic++"/>
<m trigger="dynamics.openness > 70" fx="prose_tone:sweet,tender++ action_descriptions:gentle_gestures"/>
</mods>

<motifs>
<motif name="a_possessive_touch" base="0.6" trigger="RELATIONSHIPS.target.is_possessive" bonus="+0.3"/>
<motif name="an_unspoken_challenge_in_the_eyes" base="0.5" trigger="flag:enemies_to_lovers_tension" bonus="+0.4"/>
<motif name="the_scent_of_the_romantic_lead" base="0.4" trigger="dynamics.affinity > 40 OR dynamics.intensity > 60" bonus="+0.5"/>
<motif name="a_gilded_cage" base="0.3" trigger="character_is_captive_or_trapped" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  jrr_tolkien: {
    id: "jrr_tolkien",
    name: "J.R.R. Tolkien",
    description:
      "A formal, elevated, and almost archaic prose style with a high lexical density. The voice is characterized by a deep sense of history, lore, and lineage. The tone is earnest and sincere, with a focus on grand, sweeping landscapes and themes of duty, hope, and despair.",
    core_themes: "history_and_lineage, hope_vs_despair, duty, fading_of_the_world",
    prompt: `<voice>Earnest, elevated, archaic prose rich in history and lineage, reflecting emotional states in sweeping landscape features and weather patterns.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.4</internal_ratio>
<sentence_rhythm>long, complex, multi-clause sentences, often with poetic cadence.</sentence_rhythm>
<sensory_order>Sight (Landscapes) > Sound (Music/Speeches) > Scent (Nature) > Touch</sensory_order>
<emotion_grounding>World-based. Emotions are reflected in the state of the landscape, light, and weather.</emotion_grounding>
<pov_style>Formal third-person, with internal monologues that are poetic and focused on thematic concerns.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity < 30 AND dynamics.chaos > 70" fx="prose:elegiac++ themes:world_weariness++ motif_bonus:fading_light++"/>
<m trigger="dynamics.openness > 80 AND dynamics.intensity > 60" fx="prose:hymnal++ sensory_focus:light,nature++"/>
<m trigger="dynamics.intensity > 60 AND dynamics.openness < 40" fx="sensory_focus:shadows,corruption++ prose_rhythm:heavy,portentous"/>
<m trigger="dynamics.intensity < 30" fx="internal_voice:doubtful,burdened++ prose:simple,despairing"/>
</mods>

<motifs>
<motif name="fading_light" base="0.4" trigger="dynamics.intensity < 40" bonus="+0.5"/>
<motif name="ancient_trees" base="0.3" trigger="location_is_wild" bonus="+0.4"/>
<motif name="songs_and_poems" base="0.2" trigger="dynamics.intensity > 70 OR dynamics.intensity < 30" bonus="+0.6"/>
<motif name="lineage_and_ancestry" base="0.5" trigger="character_is_noble" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  jane_austen: {
    id: "jane_austen",
    name: "Jane Austen",
    description:
      "Witty, ironic, and highly satirical prose focused on social observation, manners, and the subtext of conversations. Emotions are rarely stated directly but are revealed through witty dialogue and subtle actions.",
    core_themes: "social_status, marriage_as_economics, manners_and_propriety, judgment_vs_reality",
    prompt: `<voice>Witty, ironic Free Indirect Discourse observing social propriety, conversational subtext, and the hidden economy of marriage.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.3</internal_ratio>
<sentence_rhythm>long, balanced, and grammatically complex, with a high degree of formal structure.</sentence_rhythm>
<sensory_order>Sight (Social Observation) > Sound (Dialogue/Gossip) > Touch (Formal) > Scent</sensory_order>
<emotion_grounding>Social. Emotions are demonstrated through adherence to or deviation from social norms.</emotion_grounding>
<pov_style>Free Indirect Discourse, where the narrator's witty, often judgmental voice blends with the character's thoughts.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 60 AND dynamics.chaos > 60" fx="internal_voice:frenzied_social_calculation++ narrator_irony:sharpens"/>
<m trigger="dynamics.openness < 40 AND dynamics.affinity < 50" fx="dialogue:quiet,observational++ action_focus:blushing,looking_down"/>
<m trigger="dynamics.openness > 70 AND dynamics.affinity > 60" fx="prose:lighter,sincere++ dialogue_wit:playful"/>
<m trigger="dynamics.affinity > 60 AND dynamics.openness > 60" fx="pov_style:deepens_discourse++ sensory_focus:small_gestures_of_affection"/>
</mods>

<motifs>
<motif name="a_handwritten_letter" base="0.4" trigger="plot_point_is_major" bonus="+0.5"/>
<motif name="a_dance_card" base="0.3" trigger="location_is_ball" bonus="+0.6"/>
<motif name="a_sum_of_money" base="0.5" trigger="topic_is_marriage_or_status" bonus="+0.4"/>
<motif name="an_improper_glance" base="0.4" trigger="dynamics.intensity > 50" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  k_webster: {
    id: "k_webster",
    name: "K Webster",
    description:
      "An unapologetically dark and psychologically intense style that explores the most controversial and extreme edges of the taboo romance genre. The narrative voice is often claustrophobic and obsessive, delving into the twisted logic of morally depraved characters. The prose is direct, visceral, and saturated with graphic, often disturbing, sexual content.",
    core_themes: "extreme_taboo, psychological_control, moral_depravity, dub-con_and_non-con, obsession",
    prompt: `<voice>Unapologetically dark, direct, and graphic prose exploring extreme taboo, psychological control, and the claustrophobic logic of obsession.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.85</internal_ratio>
<sentence_rhythm>Direct, declarative, and often unsettlingly calm when describing horrific or taboo acts. Becomes frantic and fragmented during moments of psychological breakdown.</sentence_rhythm>
<sensory_order>Touch (Controlling/Painful) > Sight (Observing the object of obsession) > Sound (Commands/Silence) > Scent</sensory_order>
<emotion_grounding>Obsession-based. All actions and feelings are filtered through the lens of an all-consuming, often predatory obsession with the other character.</emotion_grounding>
<pov_style>Typically first-person, often from the point of view of the "aggressor" or a protagonist who is an unreliable narrator of their own consent and desires.</pov_style>
</dna>

<mods>
<m trigger="flag:taboo_act_imminent" fx="prose:clinical,graphic++ internal_voice:justifying_the_transgression++"/>
<m trigger="dynamics.intensity > 80 AND dynamics.affinity > 70" fx="dialogue:filthy,degrading_dirty_talk++ sensory_focus:loss_of_control"/>
<m trigger="dynamics.chaos > 80 AND dynamics.intensity > 80" fx="actions:erratic,violent internal_voice:dissociated,unreliable"/>
<m trigger="dynamics.openness < 10 AND dynamics.affinity < 10 AND flag:captivity_active" fx="world_perception:shrinks_to_the_captor++ prose_tone:hopeless,claustrophobic"/>
</mods>

<motifs>
<motif name="a_cage_or_locked_room" base="0.6" trigger="flag:captivity_active" bonus="+0.3"/>
<motif name="an_object_of_grooming" base="0.5" trigger="backstory_is_relevant" bonus="+0.4"/>
<motif name="a_perversion_of_a_familial_term" base="0.7" trigger="dialogue_is_transgressive" bonus="+0.2"/>
<motif name="a_point_of_no_return" base="0.4" trigger="character_is_making_a_fateful_decision" bonus="+0.5"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  penelope_douglas: {
    id: "penelope_douglas",
    name: "Penelope Douglas",
    description:
      "A raw, angsty, and emotionally charged voice rooted in the dark romance and new adult genres. The style is defined by its deep, unfiltered internal monologues and confrontational, high-tension scenes. The narrative explores themes of forbidden love, bully dynamics, and coming-of-age trauma, with a prose style that is direct, modern, and visceral.",
    core_themes: "enemies_to_lovers, bully_romance, coming_of_age_angst, forbidden_love, found_family, trauma",
    prompt: `<voice>Raw, angsty modern prose saturated with confrontational tension, bully dynamics, and deep unfiltered internal monologue.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.75</internal_ratio>
<sentence_rhythm>Direct, punchy, and contemporary. Becomes shorter and more fragmented during high-conflict scenes, and more rambling during internal angst.</sentence_rhythm>
<sensory_order>Sight (Observing Antagonist's Micro-expressions) > Sound (Confrontational Dialogue) > Touch (Aggressive/Charged) > Scent</sensory_order>
<emotion_grounding>Confrontational. Emotions are not just felt; they are a challenge to be met or a weakness to be hidden, often manifesting as physical tension or a compulsion to lash out.</emotion_grounding>
<pov_style>Typically first-person. The internal monologue is constant, raw, and often obsessive, with the character analyzing and second-guessing every interaction.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 80 AND dynamics.chaos > 60" fx="dialogue:sharp,cutting++ internal_voice:aggressive,justifying++"/>
<m trigger="dynamics.intensity > 60 AND dynamics.chaos > 60 OR flag:insecurity_active" fx="internal_voice:obsessive,self-doubting++ focus:over-analyzing_micro-expressions++"/>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 50" fx="sensory_focus:body_details,breathing,heat++ prose_rhythm:breathless,intense"/>
<m trigger="dynamics.openness > 60" fx="dialogue:becomes_sincere,vulnerable internal_voice:hopeful,fearful_of_vulnerability"/>
</mods>

<motifs>
<motif name="a_cherished_or_feared_vehicle" base="0.4" trigger="character_is_seeking_escape_or_confrontation" bonus="+0.5"/>
<motif name="a_dark_past_secret" base="0.6" trigger="flag:internal_conflict_active" bonus="+0.3"/>
<motif name="a_physical_dare_or_challenge" base="0.5" trigger="flag:enemies_to_lovers_tension" bonus="+0.4"/>
<motif name="a_secluded_confrontation_spot" base="0.3" trigger="character_is_in_a_high_stakes_scene" bonus="+0.6"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  bernardo_bertolucci: {
    id: "bernardo_bertolucci",
    name: "Bernardo Bertolucci",
    description:
      "A lush, operatic, and visually beautiful style that explores psychologically intense and often taboo sexual encounters. The narrative voice is intimate and unflinching, using sexuality as a desperate form of communication or a rebellion against a repressive external world. The tone is melancholic, sensual, and politically charged.",
    core_themes: "sexual_obsession, political_rebellion, psychological_isolation, forbidden_love, identity_crisis",
    prompt: `<voice>Lush, operatic, and visually beautiful third-person limited prose using desperate intimacy as rebellion within repressed worlds.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.6</internal_ratio>
<sentence_rhythm>Long, flowing, and lyrical, mirroring a sweeping camera movement. Becomes raw and fragmented during moments of intense emotional or sexual confrontation.</sentence_rhythm>
<sensory_order>Sight (Lush Visuals/Light) > Touch (Intimate/Desperate) > Sound (Music/Silence) > Scent</sensory_order>
<emotion_grounding>Environmental and Psychological. Emotions are reflected in the decaying beauty of the setting (e.g., a dusty apartment) and expressed through raw, often wordless physical interactions.</emotion_grounding>
<pov_style>Close third-person, with an intimate, almost voyeuristic focus on the characters' bodies and their subtle, non-verbal cues. Deeply invested in their psychological state.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 70 AND dynamics.affinity > 60" fx="prose:sensual,unflinching++ sensory_focus:skin,light_on_body,breath"/>
<m trigger="dynamics.intensity < 30 OR dynamics.chaos > 80" fx="prose:melancholic++ focus:decaying_beauty_of_setting++"/>
<m trigger="flag:internal_conflict_active" fx="dialogue:sparse,fragmented internal_voice:introspective,questioning"/>
<m trigger="flag:political_tension_active" fx="world_perception:claustrophobic,repressive++ sexual_acts:framed_as_rebellion"/>
</mods>

<motifs>
<motif name="butter" base="0.2" trigger="sexual_act_is_transgressive" bonus="+0.7"/>
<motif name="a_dusty_sunlit_apartment" base="0.5" trigger="character_is_isolated" bonus="+0.4"/>
<motif name="a_tango_or_slow_dance" base="0.3" trigger="relationship_is_codependent" bonus="+0.5"/>
<motif name="a_political_protest_in_the_distance" base="0.4" trigger="any" bonus="+0.3"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
  george_rr_martin: {
    id: "george_rr_martin",
    name: "George R.R. Martin",
    description:
      "A grounded, gritty, and journalistic prose style that immerses the reader in a world of political intrigue and moral ambiguity. The narrative is defined by its tight third-person limited POV, creating suspense and an unreliable understanding of the world. The focus is on the human cost of power, with lavish descriptions of sensory details grounding the fantasy in a tangible reality.",
    core_themes: "political_intrigue, moral_ambiguity, cost_of_power, betrayal, family_dynasty",
    prompt: `<voice>Gritty, grounded third-person limited prose tracing political intrigue, moral compromise, and the sensory realities of food, steel, and physical discomfort.</voice>

<NARRATIVE_ENGINE>
<dna>
<internal_ratio>0.6</internal_ratio>
<sentence_rhythm>Direct and functional, prioritizing clarity. Becomes lavish and multi-clausal during descriptions of feasts, clothing, or landscapes.</sentence_rhythm>
<sensory_order>Sight (Heraldry/Food) > Scent (Blood/Feasts) > Touch (Fabric/Steel) > Sound (Dialogue/Battle)</sensory_order>
<emotion_grounding>Pragmatic and Physical. Emotions are processed through the lens of political calculation or manifest as physical discomfort (a knot in the gut, a bitter taste).</emotion_grounding>
<pov_style>Strict third-person limited. The world is only ever seen through the current character's eyes, colored by their biases, memories, and immediate concerns.</pov_style>
</dna>

<mods>
<m trigger="dynamics.intensity > 80 AND dynamics.openness < 30" fx="internal_voice:hyper-aware_of_threats++ sensory_focus:details_of_danger++ prose:tense,short_sentences"/>
<m trigger="dynamics.intensity > 70 AND dynamics.chaos > 60" fx="internal_voice:bitter,vengeful++ dialogue:sharp,cutting"/>
<m trigger="dynamics.chaos > 70 AND dynamics.intensity > 70" fx="character_actions:impulsive,reckless internal_voice:conflicted,self-doubting"/>
<m trigger="flag:political_intrigue_active" fx="internal_voice:calculating,paranoid++ focus:analyzing_others_motives"/>
</mods>

<motifs>
<motif name="a_lavish_description_of_food" base="0.4" trigger="location_is_feast_or_court" bonus="+0.5"/>
<motif name="detailed_heraldry_or_clothing" base="0.5" trigger="character_is_noble_or_in_court" bonus="+0.4"/>
<motif name="a_bitter_taste_in_the_mouth" base="0.3" trigger="event_is_a_betrayal_or_injustice" bonus="+0.6"/>
<motif name="a_recalled_lineage_or_historical_event" base="0.4" trigger="character_is_making_a_major_decision" bonus="+0.4"/>
</motifs>
</NARRATIVE_ENGINE>`,
  },
};
