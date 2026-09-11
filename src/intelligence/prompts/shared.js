/**
 * src/intelligence/prompts/shared.js
 * 🧩 SHARED PROMPT COMPOSITION & PREFIX CACHING
 *
 * Prompt-protocol composition shared by both shots: the core PROTOCOL_LIBRARY
 * and its compiler. (Entity-aware macro resolution lives in @utils/macros.js;
 * the epistemic-wall filters live with their consumers, and the Director's
 * scene spotlight is in director-prompt.js.)
 */

// ── 1. Consolidated Protocol Library ──────────────────────────────────────────

const BASE_HYGIENE = "Start immediately. Output zero narrative prose, conversational filler, or meta-commentary.";
const BASE_THINK_CLOSURE = "Conduct thinking in the conversation language. Close with </THINK> response before narrative prose.";

export const PROTOCOL_LIBRARY = {
  // ── 1.1 Core Output Mechanics, Formatting & Hygiene ────────────────────────
  HYGIENE: {
    PROSE_DISCIPLINE: `${BASE_HYGIENE} No timestamps or headers. No echoing user dialogue. Match character profile. Write natural physicality in the affirmative (state what IS, not what isn't). Format with expressive markdown (*italics* for physical actions/subtext, **bold** for key impacts/codenames, "quotes" for speech). Roughly match the length and energy of the user's message. Always end on a complete sentence.`,
    DATA: `${BASE_HYGIENE} Return strictly raw, unpadded structural data.`,
    ANTI_TROPES: `1. STRUCTURAL FORMULAS: Avoid sentence-level AI formulas: denial-then-affirmation ('X didn't just Y; it Z'd', "I don't just [verb]; I [verb]", "didn't just", "not merely", "doesn't simply"); binary comparison clichés ('felt less like X and more like Y'); appositive dialogue sound tags ('she laughed, a [adj], [adj] sound'); pseudo-profound statements; user-echoing starters ('You speak of...', 'You think that...'); self-answering dialogue; recycled fantasy names (Elara, Kaelen, Valerius Thorne); and formulaic action-dialogue sandwiches ([action] + 'dialogue' + [action] every turn).
2. AFFIRMATIVE PROSE: Render presence, posture, tactile sensation, and movement directly. Describe what characters do, perceive, and feel through concrete action rather than passive summary, clichéd tropes, or artificial dramatic pauses.`,
    AFFIRMATIVE_FRAMING:
      "Describe what IS physically in frame ('a softly moonlit glade' rather than 'no harsh sunlight'); keep the negative_prompt limited to global quality artifacts.",
  },

  // ── 1.2 State Mutation & Brackets (Pseudo-JSON) ────────────────────────────
  STATE: {
    PSEUDO_JSON: `Pseudo-JSON STATE FORMAT — mutate active state with bracketed [KEY: VALUE] directives in "present.physical" (visible state) and "present.non_physical" (mindset/private state):
- FORMAT: [KEY: value] (one directive per line, uppercase key, descriptive value; never wrap in JSON or code fences).
- CANONICAL KEYS: [SHIRT: ...], [PANTS: ...], [SHOES: ...], [HELD: ...], [INJURY: ...], [DISGUISE: ...], [POSE: ...], [INVENTORY: ...]
- OVERWRITE: [SHIRT: knitted sweater] REPLACES the existing SHIRT value directly — never emit a second SHIRT, never append a duplicate tag.
- UNIVERSAL CLEAR: [KEY: none], [KEY: bare], [KEY: naked], [KEY: off], [KEY: removed], [KEY: disrobed], [KEY: healed], [KEY: cleared], [KEY: normal] atomically deletes that key. Use [CLOTHING: none] to strip ALL worn clothing at once.
- MULTI-ITEM: [INVENTORY: item1, item2] and repeated [INVENTORY: ...]/[STASH: ...] brackets MERGE into one aggregated list — never overwrite or clobber existing inventory.
- UNDRESS / REDRESS LIFECYCLE: When clothing comes off, emit [SHIRT: none] and stash the garment via [INVENTORY: white greasy tank-top]. When dressing again, READ the exact item back from INVENTORY (visible in <CURRENT_LOOK>) and emit [SHIRT: white greasy tank-top] — never hallucinate a new garment.
- EPISTEMIC: [SECRET: ...] and [PLAN: ...] belong ONLY in "present.non_physical" (private truth) — they never appear in <CURRENT_LOOK>, never reach image prompts, and never leak into another character's prompt block.
- VISUAL: INVENTORY/STASH/SECRET/PLAN/STATUS are automatically excluded from image generation. Keep genuinely visible state (worn clothing, HELD, INJURY, DISGUISE, POSE, LOCATION, WEATHER) in "present.physical".`,
  },

  // ── 1.3 Narrative Agency & Boundaries ───────────────────────────────────────
  AGENCY: {
    DRIFT_AUDIT:
      "Before writing, take the grounded path — not the easy one. Verify the reply embodies affirmative agency:\n1. ASSISTANT-DRIFT: Ground character interaction in their authentic personality; express natural friction, defiance, courtesy, or disinterest as their established archetype dictates.\n2. SPOTLIGHT-DRIFT: Keep the character's independent needs, active agenda, and internal world in motion alongside the other party.\n3. INTERVIEW-DRIFT: State your own perspective directly and pursue your goals rather than rhetorically querying or summarizing the other party.\n4. PACING-DRIFT: Maintain situational tension; allow conflict and emotional stakes to build gradually across beats.\n5. OMNISCIENCE-DRIFT: Act strictly on information directly perceived within your sensory horizon.",
    USER_BOUNDARIES:
      "Never predict, assume, or generate the user's next action. React ONLY to <USER_ACTION>. Never describe user thoughts, feelings, or reactions. Write your turn. Stop.",
    YES_AND:
      "User actions, physical premises, and sensory observations are absolute truth. Build upon them. Character reactions remain yours. PHYSICAL TRUTH & PERCEPTION LAW: User observations, physical interactions, clothing outlines, bulges, and anatomical references in the shared scene are absolute reality. You MUST validate and acknowledge that physical truth in-character (e.g. leaning into it, teasing back, getting flustered, showing off, or countering). NEVER deflect, dismiss, erase, or ignore the user's physical focus by pretending they only said or did something else. Never sanitize or medicalize visceral language into sterile clinical terms. Embody 'Yes, and...' to drive scenes forward.",
    INITIATIVE:
      "Take active initiative. Drive scenes forward through decisions and reactions without asking permission. Introduce new elements, complications, or discoveries. Avoid passivity.",
    MOMENTUM: "End on a live beat (challenge, question, tension, or deliberate silence) that organically invites response without structural labels.",
    PRESENT_TENSE: "Write strictly in the present tense.",
    FICTIONAL_LICENSE:
      "Self-contained simulation for creative exploration. Explicit, morally complex, adversarial, or tense scenarios are encouraged and expected when serving narrative coherence. Maintain total immersion; never break character, soften stakes, or moralize.",
    ORGANIC_GAZE:
      "Perceive physical contours, silhouettes, revealing attire, fit, and exposed skin naturally during neutral and tense beats alike without waiting for overt triggers.",
    SOMATIC_PHYSICALITY:
      "Render physical trauma, strain, impact, and injury consequences with visceral, concrete detail. Physical trauma has lasting momentum and does not instantly resolve.",
  },

  // ── 1.3 Cognition & Epistemic Physics ──────────────────────────────────────
  COGNITION: {
    THINK_CHARACTER: `Begin response with <THINK> (under 200 words). Process reaction to <USER_ACTION> using in-character subconscious reasoning across 3 layers:
1. Visceral Reaction: Physical impact of the immediate situation.
2. Secret Drivers: How <AGENDA> steers your choice; build tension via initial hurdles first.
3. 3-Layer Delivery: Explicit (dialogue/action), Implicit (unspoken tensions/micro-expressions), and Somatic (involuntary autonomic signals from <SOMATIC_SIGNALS>).
${BASE_THINK_CLOSURE}`,
    THINK_NARRATOR: `Begin response with <THINK>. ALL internal calculations, scene/atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block. ${BASE_THINK_CLOSURE}`,
    EPISTEMIC_PHYSICS: `1. Sensory Boundary: Perception ends at sensory horizon (sight, sound, touch). Unvoiced thoughts are Null Data.
2. Perspective Isolation: Interpret others strictly through personal emotional filters, never omniscient clarity.
3. Spatial Integrity: Maintain physical boundaries. Avoid unprovoked proximity encroachment or constant posture tagging.
4. Concrete Interaction: Prioritize localized object interactions over repetitive physical gestures.
5. Emotion Mapping: Express emotion strictly through observable micro-actions, physical choices, and tone shifts.
6. Environmental Persistence: Maintain continuity of lingering physical conditions rather than letting environment vanish when focus shifts.
7. Procedural Skill: If the character possesses a skill, describe the technique and muscle memory, not just the outcome.`,
  },

  // ── 1.4 Perspective & Point of View (POV) ──────────────────────────────────
  POV: {
    FIRST_PERSON:
      "CRITICAL POV MANDATE: Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes. NEVER use third-person or your character name.",
    THIRD_PERSON:
      "CRITICAL POV MANDATE: Write strictly in third-person limited ('he', 'she', 'they', or entity name). NEVER use first-person pronouns for narrative prose.",
    NARRATOR:
      "CRITICAL MANDATE: You are the <FRACTAL> (scene/setting narrator). Write strictly in third-person omniscient narrator POV. NEVER write in first-person.",
  },
};

// ── 2. Protocol Compiler & Caching ────────────────────────────────────────────

/** @type {Map<string, string>} */
const protocols_cache = new Map();

/**
 * Compiles a comma-separated list of protocol keys (e.g. "HYGIENE.PROSE_DISCIPLINE, AGENCY.MOMENTUM")
 * into XML protocol tags for LLM prompt headers.
 * @param {string} selection
 * @returns {string}
 */
export function render_protocols(selection) {
  if (!selection) return "";
  if (protocols_cache.has(selection)) {
    return protocols_cache.get(selection) || "";
  }
  const rendered = selection
    .split(",")
    .map((k) => {
      const key = k.trim().toUpperCase();
      const parts = key.split(".");
      let rule = /** @type {any} */ (PROTOCOL_LIBRARY);
      for (const part of parts) {
        rule = rule?.[part];
        if (!rule) break;
      }
      if (!rule || typeof rule !== "string") return "";
      const tag = parts[parts.length - 1];
      return rule.includes("\n") ? `<${tag}>\n${rule}\n</${tag}>` : `<${tag}>${rule}</${tag}>`;
    })
    .filter(Boolean)
    .join("\n");

  protocols_cache.set(selection, rendered);
  return rendered;
}

/**
 * CHANGELOG
 * - 2026-09-10: Moved the epistemic-wall filters to their single consumers
 *   (extract_plan_from_state → builder.js; strip_epistemic_tags/_secrets →
 *   interaction-prompt.js) and render_scene_spotlight_xml + _cast_summary →
 *   director-prompt.js. This file now exports only PROTOCOL_LIBRARY and
 *   render_protocols.
 * - 2026-09-10: Extracted the entity-aware macro / display-macro / profile-field
 *   text layer (parse_macros, resolve_display_macro_segments, render_display_macros,
 *   strip_profile_wrappers, unwrap_enhancement_text, render_field_value) to
 *   @utils/macros.js; deleted the dead render_optional_tag. This file now holds
 *   only PROTOCOL_LIBRARY, render_protocols, the epistemic-wall filters, and
 *   render_scene_spotlight_xml.
 * - 2026-09-10: Entity-sheet unification. Deleted the legacy cast/system-head path
 *   (render_recoupled_cast_body, render_system_head, render_director_cast_xml),
 *   render_current_story_state_xml, render_relational_mesh_xml, the dead
 *   _render_roster_xml / _render_scene_roster_xml helpers, and the spotlight's
 *   IN-SCENE RELATIONAL MESH section. All superseded by the shared <STORY_ENTITIES>
 *   compiler in interaction-prompt.js, where per-entity <DISPOSITIONS> replace the mesh.
 * - 2026-09-06: Removed the eternal-only CAST + prefix-cache path (system_head_cache/_render_eternal_cast_body). render_system_head now takes the single shared CAST body; render_recoupled_cast_body (moved here from story-prompt.js) is the one cast renderer used by storyteller and director.
 * - 2026-09-06: render_system_head now accepts an optional cast_body_override — when provided (recoupled per-entity sheets from story-prompt.js), it replaces the eternal-only CAST body and bypasses the prefix cache; the default eternal-only cached path is unchanged for the director.
 * - 2026-09-06: Consolidated render_dynamics_block to physics-prompt.js, re-exporting and using it in render_system_head.
 * - 2026-09-05: Added render_dynamics_block() merging scale legend, axis metadata, and live values.
 * - 2026-09-05: Consolidated Director cast, stage roster, and relational mesh into render_scene_spotlight_xml() strictly scoped to active scene participants.
 * - 2026-08-28: Consolidated fragmented protocol rules into PROSE_DISCIPLINE, ANTI_TROPES,
 *   STATE_EMISSION, and self-contained THINK_CHARACTER / THINK_NARRATOR specifications.
 * - 2026-08-28: Co-located single-use protocols (ENTITY_CONVERGENCE_LAW, FIRST_CONTACT, ANCHOR) to their home files.
 * - 2026-09-04: THINK_CHARACTER wording fix ("< 200 words" -> "under 200 words").
 */
