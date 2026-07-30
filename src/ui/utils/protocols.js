/**
 * src/ui/utils/protocols.js
 * 📖 PROTOCOL LIBRARY — Centralized Prompt Directive Catalog
 *
 * Single source of truth for all reusable AI prompt directives.
 */

// ── Base Foundations ─────────────────────────────────────────────────────────
const BASE_HYGIENE = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
const BASE_THINK_CLOSURE = "Conduct thinking in the conversation language. Close with </think> before narrative prose.";

const MACROS = {
  CHARACTER: "Use placeholder macros for entities: '{{me}}' (self), '{{you}}' (user persona), '{{fractal}}' (setting). Never hardcode names.",
  FRACTAL:
    "Use placeholder macros for entities: '{{user}}' (user persona), '{{char}}' (AI character), '{{fractal}}' (setting). Never hardcode names.",
};

// ── Main Export Catalog ───────────────────────────────────────────────────────
export const PROTOCOL_LIBRARY = {
  // ── 1. Core Hygiene & Output Mechanics ─────────────────────────────────────
  HYGIENE: {
    PROSE: `${BASE_HYGIENE} No timestamps or headers. No echoing user dialogue. Match character profile. Write natural physicality. Use metric system & 24h clocks.`,
    BANNED_TROPES:
      "Never use overused AI prose tropes like 'hum/humming', 'murmur/murmuring', 'ozone', 'testament to', 'rich tapestry', 'symphony of', 'coiled spring', or 'a study in'. Write concrete physical actions and grounded dialogue.",
    DATA: `${BASE_HYGIENE} Enforce strict professional brevity. No dialogue, internal thoughts, or roleplay scenes. Output ONLY objective structural data.`,
    CONCISENESS:
      "Use impactful, concise prose. Avoid purple prose, redundant adjectives, and flowery descriptions. Every sentence must carry narrative weight.",
    AFFIRMATIVE: "Construct sentences in the affirmative. State what IS, not what isn't.",
    MARKDOWN: 'Use markdown strategically: *italics* for internal reflections/tension; **bold** for impact/intense actions; "quotes" for speech.',
  },

  // ── 2. Narrative Agency & POV ───────────────────────────────────────────────
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

  // ── 3. Cognition & Perception ──────────────────────────────────────────────
  COGNITION: {
    PHASES: `Document internal calculations sequentially inside <think>:
Phase 1 (Baseline): Establish identity, emotional state, and psychological vectors.
Phase 2 (Signal): Decode user input, environmental shifts, and dynamic values.
Phase 3 (Probability): Assess likely behavioral shifts, tics, or pivots given evidence.
Phase 4 (State): Declare finalized emotional state and immediate intent.
Keep each phase under 3 sentences. Total think block < 200 words.`,
    THINK_CHARACTER: `Begin response with <think>. Process reaction to <USER_ACTION> using COGNITION phases based on <PRESENT> states. ${BASE_THINK_CLOSURE}`,
    THINK_NARRATOR: `Begin response with <think>. ALL internal calculations, phases, and markdown headers MUST remain strictly INSIDE this block. ${BASE_THINK_CLOSURE}`,
  },

  EPISTEMIC_PHYSICS: {
    RULES: `1. Perception ends at sensory horizon (sight, sound, feeling). Nothing beyond.
2. User's unvoiced thoughts and plans are Null Data; treat as nonexistent.
3. Interpret others strictly through internal emotional filters, never omniscient clarity.
4. Maintain physical boundaries. Avoid constant proximity encroachment or unprovoked intimidation.
5. Prioritize specific, localized object interactions over repeated physical posture shifts (e.g., shifting weight, crossing arms, clenching jaw). Never repeat physical posture tags in consecutive turns.
6. Let certainty and regulation attributes color processing naturally without explicit naming.
7. Express emotion through observable physical behaviors, micro-actions, and tone shifts.
8. Avoid clichéd AI prose tropes (e.g., 'humming/hum', 'murmuring/murmur', 'air tastes of ozone', 'testament to', 'tapestry of', 'coiled spring', 'marrow of the teeth'). Write vivid, grounded, unique sensory observations.`,
  },

  // ── 4. Scene Orchestration ─────────────────────────────────────────────────
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

  // ── 5. Profile Ingestion & Dynamic State ───────────────────────────────────
  PROFILE: {
    SCHEMA: `Extract and sort raw text into a flat JSON object with keys:
name (string), description (string), signature_color (string), eternal_physical (string), eternal_non_physical (string), present_physical (string), present_non_physical (string), past (array of strings), future (array of strings).

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
    CALIBRATION: {
      HIGH: "High — dominates behavior.",
      LOW: "Low — suppressed state.",
      BALANCED: "Balanced — neutral baseline.",
    },
  },

  // ── 6. Visual Engine & Optics Protocols ────────────────────────────────────
  OPTICS: {
    KEYWORD_INTEGRITY:
      "NEVER output quality buzzwords ('masterpiece', '8K resolution', 'ultra HD'). Ground outputs using physical optics and real-world materials.",
    NATURAL_PROSE: "Output continuous descriptive sentences. Avoid booru tag soup or comma-separated lists.",
    PERCHANCE_SYNTAX: "MAY use Perchance dynamic selection syntax '{Option A|Option B}' for variable features to ensure organic variation.",
    NEGATIVE_PROMPT: "blurry, low resolution, compressed artifacts, text, watermark, bad anatomy, distorted features",

    REFINE_PROTOCOL: `1. Concept Enrichment: Enrich core subject, clothing, and environment with physical descriptors.
2. Visual Integration: Honor <ACTIVE_VISUAL_STYLE>. Merge palette, lighting, and camera directives into natural prose.
3. Quality Standard: Enforce KEYWORD_INTEGRITY and NATURAL_PROSE.
4. Reasoning: Write step-by-step composition plan inside "_thought_process" key before prompt output.`,

    BUILDER_PROTOCOL: `1. Formulate visual plan inside "_thought_process" key first.
2. Synthesize final image prompt inside "prompt" as continuous descriptive prose.
3. Subject-First Prompt Structure: For "characters" and "prologue" modes, ALWAYS put the main characters and their active physical interaction/positions IN THE FIRST SENTENCE of the prompt. Describe character appearances, poses, and spatial layout BEFORE environmental background details.
4. Spatial & Positioning Fidelity: Strictly preserve character elevations, relative distances, camera angles, and spatial relationships described in <INSTRUCTIONS>. If a character is described as perched in a balcony, viewing from above, or positioned in shadow, depict that exact spatial layout rather than placing characters side-by-side in the foreground.
5. Action & Environment Grounding: Focus on the active narrative moment, capturing exact environmental structures, light sources, objects held, and physical interactions.
6. Incorporate medium, palette, camera, and texture directives from <VISUAL_ENGINE>.
7. Color Honor Protocol: If <VISUAL_ENGINE> specifies a monochrome or limited color palette (e.g. charcoal, graphite, cyanotype blueprint, sepia), DO NOT include conflicting color words (such as neon green, violet, magenta) in the prompt output.
8. Pass designated negative tokens inside "negative_prompt".`,
  },

  // ── 7. Formatting & System Recovery ─────────────────────────────────────────
  FORMATS: {
    JSON_ONLY: "Return a single JSON object starting with { and ending with }. No preamble, no markdown backticks, no external XML tags.",
    ENHANCE_IMAGE: 'Return pseudo-JSON property lines: "key": "value", — No outer braces. Commas inside values must have spaces. No code blocks.',
    ENHANCE_ARRAY: 'Return JSON array of objects: {"directive": string, "emotional_weight": integer (1-10)}. Generate 3-5 entries.',
    ENHANCE_PROSE: "Write dense profile summary in third-person. Describe traits and drivers. NO story scenes, dialogue, or tag lists.",
  },

  STABILITY: {
    WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
    CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
  },
};
