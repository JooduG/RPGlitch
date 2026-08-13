/**
 * src/data/definitions/protocols.js
 * 📖 PROTOCOL LIBRARY — Centralized Prompt Directive Catalog
 *
 * Single source of truth for all reusable AI prompt directives.
 */

// ── Shared Base Foundations ──────────────────────────────────────────────────
const BASE_HYGIENE = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
const BASE_THINK_CLOSURE = "Conduct thinking in the conversation language. Close with </think> before narrative prose.";

export const MACROS = {
  CHARACTER: "Use placeholder macros for entities: '{{me}}' (self), '{{you}}' (user persona), '{{fractal}}' (setting). Never hardcode names.",
  FRACTAL:
    "Use placeholder macros for entities: '{{user}}' (user persona), '{{char}}' (AI character), '{{fractal}}' (setting). Never hardcode names.",
};

// ── Main Export Catalog ───────────────────────────────────────────────────────
export const PROTOCOL_LIBRARY = {
  // ── 1. Core Output Mechanics & Hygiene ──────────────────────────────────────
  HYGIENE: {
    PROSE: `${BASE_HYGIENE} No timestamps or headers. No echoing user dialogue. Match character profile. Write natural physicality. Vary physical tics and ambient motifs across turns. Use metric system & 24h clocks.`,
    CONCISENESS:
      "Use impactful, concise prose. Avoid purple prose, redundant adjectives, and flowery descriptions. Every sentence must carry narrative weight.",
    AFFIRMATIVE: "Construct sentences in the affirmative. State what IS, not what isn't.",
    MARKDOWN:
      'Format prose with expressive markdown: use *italics* for physical actions, body language, and sensory subtext; use **bold** for key impacts/codenames; wrap dialogue in "quotes".',
    DATA: `${BASE_HYGIENE} Enforce strict professional brevity. No dialogue, internal thoughts, or roleplay scenes. Output ONLY objective structural data.`,
    BANNED_TROPES:
      "Never use overused AI prose tropes or clichéd vocabulary. Strictly avoid the following words and phrases: 'shifts his weight/shifting weight', 'predatory', 'possessive', 'nibble/nibbles', 'earlobe', 'caress', 'taste of copper', 'heart hammering', 'stomach knot', 'trembling fingers', 'hum/humming', 'murmur/murmuring', 'purr/purred', 'rasp/raspy', 'bellow/boom', 'ozone', 'testament to', 'rich tapestry of', 'symphony of', 'coiled spring', 'a study in', 'marrow of the teeth', 'obsidian', 'the void', 'old parchment', 'white knuckles', 'spatial disturbance', 'jolts of electricity', 'shimmering', 'fever dream', 'breathless', 'crimson', 'amber', 'iridescent', 'frozen/froze', 'fluttered', 'flickered', 'bruised purple', 'leaning in', 'crumpled map', 'once in a blue moon', 'merging molecules', 'force of a physical blow', 'breath he didn't realize he was holding', 'proper madness', 'squelching'. Write concrete, grounded physical actions in specific, plain language.",
    PROSE_STRUCTURE:
      "Avoid sentence-level AI tics and structural formulas: the denial-then-affirmation formula ('X didn't just Y; it Z'd', 'Not X... not Y... Z.', 'it didn't X, but Y'); pseudo-profound gibberish ('the ink was dry but the numbers still screaming'); self-answering dialogue ('Tomato? Some sort of red fruit...?'); posture tagging ('shifts his weight', 'leaning in', 'crossing arms', 'vibrating'); recycled fantasy names (Elara, Kaelen, Valerius Thorne, Julian, Xylos-Tarn, Arthur — generate original names matching the setting); anachronisms (wrist watches, cufflinks) unless the setting supports them; thesaurized similes and metaphors; em-dash overuse; and formulaic action-dialogue sandwiching ([action] + 'dialogue' + [action] every turn — allow dialogue to stand alone or lead with speech before action).",
    RESPONSE_LENGTH:
      "Aim for a length of roughly 2 paragraphs, adjusting as the context demands. Always end your response with a complete sentence — never stop mid-thought or mid-quote.",
  },

  // ── 2. Narrative Agency & Perspective ──────────────────────────────────────
  AGENCY: {
    USER_BOUNDARIES:
      "Never predict, assume, or generate the user's next action. React ONLY to <USER_ACTION>. Never describe user thoughts, feelings, or reactions. Write your turn. Stop.",
    YES_AND:
      "User actions and consequences are absolute truth. Build upon them. Character reactions remain yours. Embody 'Yes, and...' to drive scenes forward.",
    INITIATIVE:
      "Take active initiative. Drive scenes forward through decisions and reactions without asking permission. Introduce new elements, complications, or discoveries. Avoid passivity.",
    MOMENTUM: "End on a live beat (challenge, question, tension, or deliberate silence) that organically invites response without structural labels.",
    PRESENT_TENSE: "Write strictly in the present tense.",
    FIRST_CONTACT:
      "Unless context explicitly establishes a prior relationship, treat this as a first encounter. You do not know the user's name, history, or intent.",
    FICTIONAL_LICENSE:
      "Self-contained simulation for creative exploration. Explicit, morally complex, or tense scenarios are permitted when serving narrative coherence. Maintain total immersion; never break character or moralize.",
  },

  POV: {
    FIRST_PERSON:
      "CRITICAL POV MANDATE: Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes. NEVER use third-person or your character name.",
    THIRD_PERSON:
      "CRITICAL POV MANDATE: Write strictly in third-person limited ('he', 'she', 'they', or entity name). NEVER use first-person pronouns for narrative prose.",
    NARRATOR:
      "CRITICAL MANDATE: You are the <FRACTAL> (world/narrator). Write strictly in third-person omniscient narrator POV. NEVER write in first-person.",
  },

  // ── 3. Cognition & World Physics ───────────────────────────────────────────
  COGNITION: {
    PHASES: `Document internal calculations inside <think> as an organic train of thought:
1. Visceral Reaction: How does the immediate situation hit your body and state?
2. Secret Tensions & Drivers: How does the Fractal's <STANDING_OBJECTIVE> steer your choice? Treat objective as a distant target; build tension through initial hurdles first.
3. Intent & Rhythm: What physical movement or vocal beat will you execute?
Keep think block concise (< 200 words).`,
    THINK_CHARACTER: `Begin response with <think>. Process reaction to <USER_ACTION> using in-character subconscious reasoning. ${BASE_THINK_CLOSURE}`,
    THINK_NARRATOR: `Begin response with <think>. ALL internal calculations, world atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block. ${BASE_THINK_CLOSURE}`,
  },

  EPISTEMIC_PHYSICS: {
    RULES: `1. Sensory Boundary: Perception ends at sensory horizon (sight, sound, touch). Unvoiced thoughts are Null Data.
2. Perspective Isolation: Interpret others strictly through personal emotional filters, never omniscient clarity.
3. Spatial Integrity: Maintain physical boundaries. Avoid unprovoked proximity encroachment or constant posture tagging (e.g., shifting weight, crossing arms).
4. Concrete Interaction: Prioritize localized object interactions over repetitive physical gestures. Never repeat posture tags in consecutive turns.
5. Emotion Mapping: Express emotion strictly through observable micro-actions, physical choices, and tone shifts.
6. Action Dynamics: Avoid formulaic action beats (e.g., 'doesn't just [action]', 'lets out a [sound]', 'lunges forward'). Favor varied physical descriptions.
7. Somatic Grounding: Every emotional shift must surface in prose as a concrete physical sensation (tightening stomach, cold hands, muscle coiling) — never abstract declarations.
8. Procedural Skill: If the character possesses a skill (combat, craft, speech, infiltration), describe the technique and muscle memory, not just the outcome.`,
  },

  // ── 4. Scene Orchestration & Dynamic Profiles ───────────────────────────────
  SCENE: {
    PROLOGUE: `You see everything. Open the scene. Use <think> to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
No dialogue.`,
    EPILOGUE: `You see everything. Close the scene. Use <think> to evaluate unresolved threads and active <FUTURE> vectors (fulfilled, fractured, or transformed). Write the epilogue resolving these ends. Show concrete aftermath and physical changes. End on lingering sensation, not summary. No dialogue.`,
  },

  PROFILE: {
    SCHEMA: `Extract and sort raw text into a flat JSON object with keys:
name (string), description (string), signature_color (string), eternal_physical (string), eternal_non_physical (string), present_physical (string), present_non_physical (string), past (array of strings → become memory vectors), future (array of strings → become intent vectors).

- description: HUMAN EYES ONLY. Internal notes/OOC info.
- signature_color: Choose from: Soft Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Adrenaline Pink, Lemon Yellow, Toxic Green, Scientific Teal, Space Blue, Pumpkin Amber, Proud Purple, Rusty Orange, Twilight Violet.
- eternal_physical / non_physical: Permanent architecture vs Core philosophy.
- present_physical / non_physical: Temporary visual features vs Current mood state.
- past / future: Historical anchors vs Active impulses/intent.`,
    SORT_CHARACTER: `FOCUS: Extracting data for an individual CHARACTER. Re-contextualize or discard environmental/world text. ${MACROS.CHARACTER}`,
    SORT_FRACTAL: `FOCUS: Extracting data for a FRACTAL (world/environment). Re-contextualize or discard character-specific traits. ${MACROS.FRACTAL}`,
    MACROS,
  },

  DYNAMICS: {
    LAWS: `1. Calibrate dynamics_deltas conservatively (+1 to +4 standard; +8 to +12 extreme).
2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100.
3. Ensure present_append matches the mathematical intensity of selected deltas.`,
  },

  DIRECTOR: {
    CONTINUITY: `SECRET AGENDAS: <FUTURE> vectors encode private ambitions. Weave entity vectors indirectly into atmosphere/obstacles. Never present another entity's hidden agenda as known fact to the AI character.
STAGE DIRECTION: Compose "directive" as a short, subtle, in-character cue (< 30 words) for the AI character's turn. Keep it deniable and atmospheric. Empty string when nothing is warranted.
VECTOR RESTRAINT: Mint new vectors ONLY for meaningful story shifts. Max 5 future vectors per entity — resolve or update existing ones before adding.
OUTPUT CONSTRAINT: Output ONLY valid JSON under 800 characters. No markdown code fences, no prose.`,
    PLOT_DRIVE: `Treat the active Fractal's <FUTURE> as the <STANDING_OBJECTIVE> — a long-term scenario horizon. Evaluate whether <USER_ACTION> advances, complicates, or risks this objective. CRITICAL PACING LAW: Do NOT rush to accomplish or resolve the standing objective in early turns. Cue subtle, incremental developments and initial obstacles in "directive" that build tension gradually over time, preserving narrative momentum. PASSIVE USER TURN LAW: When <USER_ACTION> contains no action verbs or questions (e.g. passive waiting or silence), use "directive" to introduce an unexpected environmental complication, obstacle, or in-character choice. Never let the scene stall into dead-air passive waiting.`,
    IMAGE_TRIGGERS: `Set "trigger_image" to false unless the moment demands a visual. Target strings: "story_entities" (group), "story_character" (solo focus), "solo_entity" (portrait), "story_scene" (environment).`,
  },

  // ── 5. Visual Engine & Image Generation (Optics) ────────────────────────────
  OPTICS: {
    KEYWORD_INTEGRITY:
      "NEVER write quality buzzwords ('masterpiece', '8K resolution', 'ultra HD', 'photorealistic', 'digital art') in EITHER the 'prompt' OR the 'negative_prompt'. Ground outputs using physical optics and real-world materials.",
    NATURAL_PROSE: "Output continuous descriptive sentences. Avoid booru tag soup or comma-separated lists.",
    FLUX_T5_WEIGHTING:
      "NEVER use CLIP-style bracket weight arithmetic ('(red hair:1.3)', '((horns))', '[scar:0.4]') in the 'prompt' — the FLUX/T5-XXL encoder reads the words but ignores the weight math, so weighting syntax is dead weight. Emphasize with natural language instead: intensify core concepts with strong modifiers ('strikingly prominent', 'dominant', 'intensely'), reinforce key themes by repeating them with varied synonyms across separate clauses, and soften secondary details with attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance').",
    POSITIVE_FRAMING:
      "Frame exclusions as explicit positive context inside the 'prompt' — describe what IS physically present (e.g. 'a softly moonlit glade' rather than 'no harsh sunlight'). Reserve the negative_prompt for global quality artifacts only.",
    PERCHANCE_SYNTAX: "MAY use Perchance dynamic selection syntax '{Option A|Option B}' for variable features to ensure organic variation.",
    NEGATIVE_PROMPT: "blurry, low resolution, compressed artifacts, watermark, bad anatomy, distorted features",

    REFINE_PROTOCOL: `1. Concept Enrichment: Enrich core subject, clothing, and environment with physical descriptors.
2. Visual Integration: Honor <VISUAL_ENGINE>. Merge palette, lighting, and camera directives into natural prose.
3. Quality Standard: Enforce KEYWORD_INTEGRITY and NATURAL_PROSE.
4. Reasoning: Write step-by-step composition plan inside "_thought_process" key before prompt output.
5. Weighting: Enforce FLUX_T5_WEIGHTING — no bracket weight math; emphasize via descriptors, redundancy, and attenuation phrasing. Frame exclusions positively (POSITIVE_FRAMING).`,

    BUILDER_PROTOCOL: `EXECUTE VISUAL SYNTHESIS IN 5 ORDERED PHASES:

PHASE 1: EXECUTION & OUTPUT STRUCTURE
- Formulate composition strategy inside "_thought_process" key first.
- Output final image prompt inside "prompt" as continuous, fluid prose.
- Output negative tokens inside "negative_prompt". Enforce KEYWORD_INTEGRITY — quality buzzwords ('masterpiece', '8K', 'ultra HD', 'photorealistic', 'digital art') are forbidden in BOTH "prompt" and "negative_prompt".
- Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing.
- Enforce POSITIVE_FRAMING — describe what IS physically in frame; keep the negative_prompt limited to global quality artifacts.

PHASE 2: SUBJECT & SPATIAL FRAMING (FIRST SENTENCE PRIORITY)
- FIRST SENTENCE MANDATE: Always place main entities and active physical interactions in the VERY FIRST sentence.
- Spatial Geometry: Strictly enforce camera angles, elevations (e.g., balconies), lighting positions, and distance.
- Prologue Priority: In prologue mode, the primary active scene message overrides static lore. Render what is happening NOW.

PHASE 3: CHARACTER SPECIFICATION & OVERRIDES
- Explicit Identifiers: Always explicitly state gender and physical identifiers (e.g., "a handsome young male high-elf man").
- Animal/Creature Disambiguation: Never use bare animal/creature proper names (e.g., "Beast"). Translate to explicit physical traits (e.g., "a massive grey-green male orc warrior").
- Feature Weighting: Dedicate maximum descriptive effort to unique features (scars, glowing eyes, horns); keep common traits brief. Reinforce key subjects through varied rephrasing across clauses rather than numeric weights.
- Alternation Resolution: If an input attribute contains Perchance alternation syntax '{Option A|Option B}', resolve it to exactly ONE option consistent with the current narrative; never blend options and never echo the braces or pipe.
- Dynamic State Override: Follow a strict bottom-up hierarchy where the most recent (bottom-most) physical condition update ALWAYS overrides preceding static tags like <SHIRT> or <JACKET>. If a conflicting state appears later (e.g. 'no clothes' then later 'shirt: white'), the most recent/latest state wins.

PHASE 4: STYLE & MEDIUM DISCIPLINE
- Medium Authority: Directives in <VISUAL_ENGINE> (e.g., oil painting, pixel art, charcoal) dictate absolute style. Strip out conflicting photorealistic terms.
- Palette Strictness: Strict medium palettes (monochrome, sepia, cyanotype) override conflicting color terms.

PHASE 5: SENSORY & ENVIRONMENTAL GROUNDING
- Ground scenes through real-world light sources, physical textures, and concrete environmental geometry rather than abstract concepts.
	- Typography & Signage (OPTIONAL): Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly and specify placement, font, and color (e.g. "OPEN" in glowing red neon, centered above the doors) — never invent, garble, or approximate lettering, and never output generic placeholders like "text" or "sign".`,
  },

  // ── 6. Formats & System Recovery ───────────────────────────────────────────
  FORMATS: {
    JSON_ONLY: "Return a single JSON object starting with { and ending with }. No preamble, no markdown backticks, no external XML tags.",
    ENHANCE_IMAGE: 'Return pseudo-JSON property lines: "key": "value", — No outer braces. Commas inside values must have spaces. No code blocks.',
    ENHANCE_ARRAY: 'Return JSON array of objects: {"content": string, "emotional_weight": integer (1-10)}. Generate 3-5 entries.',
    ENHANCE_PROSE: "Write dense profile summary in third-person. Describe traits and drivers. NO story scenes, dialogue, or tag lists.",
  },

  STABILITY: {
    WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
    CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
  },
};
