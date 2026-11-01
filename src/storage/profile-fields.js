/**
 * src/storage/profile-fields.js
 * ============================================================================
 * 📋 PROFILE FIELDS, FLAT LEAF MAP & ENHANCERS
 * ============================================================================
 *
 * Provides flat field mappings and enhancer directives for Caretaker Core
 * and entity ingestion, mapping human/UI labels and aliases to canonical 4-quadrant
 * paths.
 * ============================================================================
 */

export const FLAT_LEAF_MAP = Object.freeze({
  character: Object.freeze({
    appearance: "eternal.physical",
    "eternal.physical": "eternal.physical",
    personality: "eternal.non_physical",
    "eternal.non_physical": "eternal.non_physical",
    current_look: "present.physical",
    "present.physical": "present.physical",
    state_of_mind: "present.non_physical",
    "present.non_physical": "present.non_physical",
    future: "future",
    agenda: "future",
    past: "past",
    memories: "past",
  }),
  fractal: Object.freeze({
    environment: "eternal.physical",
    "eternal.physical": "eternal.physical",
    permanent_truths: "eternal.non_physical",
    metaphysical_truths: "eternal.non_physical",
    "eternal.non_physical": "eternal.non_physical",
    atmosphere: "present.physical",
    active_atmosphere: "present.physical",
    "present.physical": "present.physical",
    current_state: "present.non_physical",
    "present.non_physical": "present.non_physical",
    future: "future",
    trajectory: "future",
    past: "past",
    history: "past",
  }),
});

/**
 * Resolves a flat leaf or alias key into a canonical dot-notation path.
 *
 * @param {string} field_name
 * @param {"character" | "fractal"} [entity_type="character"]
 * @returns {string | null}
 */
export function resolve_flat_path(field_name, entity_type = "character") {
  if (!field_name || typeof field_name !== "string") return null;
  const type_map = FLAT_LEAF_MAP[entity_type];
  if (!type_map) return null;

  const normalized = field_name.trim().toLowerCase().replace(/\s+/g, "_");
  return type_map[normalized] || null;
}

/**
 * Directives matching PROFILE_FIELDS.enhancer tags verbatim.
 * Exported for Caretaker Core in prompts and Profile Studio.
 */
export const ENHANCER_DIRECTIVES = Object.freeze({
  BIOMETRIC_RENDERER:
    "[KEY: value] permanent biometrics (gender, age, ethnicity, build, face, eyes, hair, scars). Visible body details only — no clothing, equipment, or psychological traits.",
  COGNITIVE_ARCHITECT:
    "[KEY: value] core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics. Bracketed traits only.",
  SOMATIC_TRACKER:
    "[KEY: value] current appearance (clothing, colors, expression, posture, condition, held). Use {Option A|Option B} for variables. Visible temporary items and poses only.",
  TACTICAL_ANALYZER: "[KEY: value] immediate emotional pressure, active mental focus, and present behavioral drivers. Bracketed conditions only.",
  TRAJECTORY_SIMULATOR:
    "[KEY: value] active trajectory or standing agenda: clear intent, building pressure, or impending event driving this entity toward its next state change. Bracketed items only; no story scenes or dialogue.",
  PAST_COMPILER:
    "Settled historical fact or precedent: [KEY: value | flags] (flags: 'hide' / 'show', 'w: 1-10'). Specific over vague; exclude transient moods or immediate dialogue.",
  SPATIAL_RENDERER:
    "[KEY: value] permanent geography (terrain, architecture, materials, landmarks, scale). Concrete visible landscape features only — no transient weather, lighting, or lore.",
  METAPHYSICAL_ARCHITECT:
    "[KEY: value] metaphysical substrate: governing laws, constant environmental forces, and physical constants. Bracketed truths only.",
  ATMOSPHERIC_TRACKER:
    "[KEY: value] current atmospheric state (lighting, weather, atmosphere, events). Use {Option A|Option B} for variables. Momentary sensory elements only.",
  ECOSYSTEM_ANALYZER:
    "[KEY: value] current environmental state: active anomaly, immediate pressure, momentary shifts in physics or atmosphere. Bracketed state only.",
  ECOSYSTEM_SIMULATOR:
    "[KEY: value] environmental trajectory, building atmospheric pressure, impending environmental event, or anomaly apex driving this world toward its next state change. Bracketed items only.",
  HISTORIAN:
    "Settled historical cataclysm, founding myth, or defining epoch: [KEY: value | flags] (flags: 'hide' / 'show', 'w: 1-10'). Specific over vague; exclude active weather or temporary conditions.",
});
