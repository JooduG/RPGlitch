/**
 * @file src/config.js
 * ⚙️ RPGlitch Sovereign System Configuration & Subsystem Domain Agreements
 *
 * Promoted configuration surface providing canonical scales, physical boundaries,
 * and cross-module subsystem agreements across @engine, @data, @definitions,
 * @media, @utils, and @ui.
 * Follows P4 Pre-Beta Purity: zero backwards compatibility layers, zero magic numbers.
 *
 * Layout rule: §1 and §2 own every number and shared vocabulary (no cross-references between homes).
 * §3 contains only references to §1/§2 plus a few homeless policy literals.
 * Nothing in §3 may be referenced by §1/§2 (evaluation order depends on it).
 */

// =============================================================================
// [SECTION 1: PLATFORM TIME & PATIENCE - no dependencies]
// =============================================================================

/**
 * Standard latency tiers (ms) for network probes, timeouts, and watchdog evaluation.
 */
export const TIMING_MS = Object.freeze({
  TICK: 1000, // 1,000ms (1s): Initial retry backoff delay for network requests and diffusion generation
  INTERACTION: 5000, // 5,000ms (5s): UI undo-delete toast window and background task preemption wait
  DELAY: 10000, // 10,000ms (10s): Maximum upper delay cap for exponential backoff retries
  HEARTBEAT: 15000, // 15,000ms (15s): Watchdog evaluation interval checking engine heartbeat health
  STEP: 30000, // 30,000ms (30s): Standard circuit breaker recovery probe timeout and prompt build vector budget
  CEILING: 120000, // 120,000ms (2m): Hard timeout for text-to-image neural diffusion synthesis
  LIFETIME: 240000, // 240,000ms (4m): Hard maximum generation lifetime and background continuum-consolidation ceiling
});

/**
 * Standard patience policy: retry counts, circuit breaker trip/heal thresholds.
 */
export const PATIENCE_POLICY = Object.freeze({
  SOFT_LIMIT: 2, // 2 strikes/attempts: consecutive successful probes required to heal circuit breaker
  HARD_LIMIT: 3, // 3 strikes/attempts: max retry attempts, failure trip threshold, max concurrent probes
});

/**
 * Priority tiers for the single-flight LLM request gate.
 */
export const LLM_PRIORITY = Object.freeze({ FOREGROUND: 10, BACKGROUND: 1 });

// =============================================================================
// [SECTION 2: CANONICAL DOMAIN HOMES - every number and shared vocabulary lives here exactly once]
// =============================================================================

// ── 1. Directorial Staging & Dynamic Equilibrium ─────────────────────────────
/**
 * The dynamics domain (single home): SCALE = range + trigger bands, PHYSICS = drift math,
 * DELTA = prompt-doc strings, AXES = the six axis definitions keyed by lowercase runtime axis id.
 */
export const DYNAMICS = Object.freeze({
  SCALE: Object.freeze({
    MIN: 1, // Lowest possible value on the 1-100 narrative tension and significance scale
    EXTREME_LOW: 15, // Collapse / isolation floor triggering automated emotional beats
    LOW: 25,
    MID: 50, // Universal neutral equilibrium baseline for meters and new past-vector significance
    HIGH: 75, // High tension threshold triggering dramatic escalation, intimate framing, or Dutch angles
    EXTREME_HIGH: 85, // Climax / breakthrough ceiling triggering automated visual synthesis beats
    MAX: 100, // Absolute ceiling on the 1-100 narrative tension and significance scale
  }),
  PHYSICS: Object.freeze({
    GRAVITY: 0.08, // Natural per-turn pull of unprovoked tension meters back toward MID
  }),
  DELTA: Object.freeze({
    STANDARD: "±1-4", // Normal turn fluctuation guideline documented for LLM director in prompt
    EXTREME: "±8-12", // High drama / crisis turn fluctuation guideline documented for LLM director in prompt
    CLIP: "5-95", // Safety buffer preventing ordinary turns from artificially slamming against scale endpoints
  }),
  AXES: Object.freeze({
    // Character axes
    chaos: Object.freeze({ low: "Restraint", high: "Unbound", scope: "character" }),
    intensity: Object.freeze({ low: "Hush", high: "Adrenaline", scope: "character" }),
    openness: Object.freeze({ low: "Reserve", high: "Exposure", scope: "character" }),
    affinity: Object.freeze({ low: "Aversion", high: "Attunement", scope: "character" }),
    // Fractal (Environmental) axes
    velocity: Object.freeze({ low: "Suspension", high: "Momentum", scope: "fractal" }),
    entropy: Object.freeze({ low: "Stability", high: "Distortion", scope: "fractal" }),
  }),
});

/** Canonical string-length thresholds across simulation, ingestion, and bracketed fields. */
export const LENGTH_THRESHOLDS = Object.freeze({
  TINY: 25, // < 25 characters -> 1 snappy beat
  SMALL: 150, // < 150 characters -> 1-2 beats
  COMPACT: 200, // Physical & agenda baseline floor
  MEDIUM: 300, // Psychological & past memory floor
  EXPANSIVE: 500, // Core personality floor & expansive input cadence (>= 500)
  FIELD_CAP: 2000, // Max character length cap for a single merged tagged-field string
  INGESTION: 8000, // Ingestion extraction & readable truncation ceiling
});

/** Image-beat cooldown, working-memory transcript window, and turn-summary tail (in rounds). */
export const TEMPO_ROUNDS = Object.freeze({
  FAST: 3, // 3 rounds: Unified cooldown between automatic image beats
  STANDARD: 8, // 8 rounds: Working memory <RECENT> transcript window
  SLOW: 16, // 16 rounds: Turn-summary feed tail window
});

/** Emotional weight multipliers and defaults for episodic memory retrieval and brackets. */
export const EMOTIONAL_WEIGHT = Object.freeze({
  ORIGIN_SCORE_MULTIPLIER: 1.5, // Origin protection multiplier boosting author canon and immutable memories
  DEFAULT_WEIGHT: 5, // Default bracketed entry weight when no explicit `w:` flag is present
});

/** Calibrated empirical ratio (~3.35 chars/token) for prompt text budgeting. */
export const CHARS_PER_TOKEN = 3.35;

/**
 * Single home for image tuning, resolutions, trigger cadence, and upload bounds.
 */
export const IMAGE_POLICY = Object.freeze({
  TIERS: Object.freeze(["story_entities", "story_character", "solo_entity", "story_scene"]),
  TIER_RESOLUTIONS: Object.freeze({
    story_scene: Object.freeze({ width: 768, height: 512 }),
    solo_entity: Object.freeze({ width: 512, height: 768 }),
    story_character: Object.freeze({ width: 512, height: 768 }),
    story_entities: Object.freeze({ width: 768, height: 768 }),
  }),
  DISPLACEMENT_THRESHOLD: 50, // Cumulative cross-axis delta sum tripping an automatic scene image
  DEFAULT_TIER: "story_scene", // Fallback tier for auto-triggered beats
  MAX_PENDING_IMAGES: 5, // Max queued + unresolved image beats before eviction (queue) / skip (spawn)
  UPLOAD: Object.freeze({
    MAX_IMAGE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB default maximum permissible image upload size
    ALLOWED_IMAGE_MIME_TYPES: Object.freeze(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]),
  }),
});

/**
 * Voice domain (single home; audio.js VOICE_CADENCES is a view over RATES):
 * speaking style ids, base speech-rate multipliers by cadence id, and dynamics rate shaping.
 */
export const VOICE = Object.freeze({
  STYLES: Object.freeze(["casual", "lyrical", "primal", "clinical"]),
  RATES: Object.freeze({ drawl: 0.85, measured: 0.95, standard: 1.0, brisk: 1.1, rapid: 1.2 }),
  SHAPING: Object.freeze({
    DYNAMICS_OFFSET: 0.001, // Per-point rate bend per dynamics unit away from neutral 50
    MIN_RATE: 0.5, // Hard floor on the shaped speech rate
    MAX_RATE: 2.0, // Hard ceiling on the shaped speech rate
  }),
});

/** Canonical entity roles mapped to their accepted raw/subrole aliases. */
export const ROLES = Object.freeze({
  user: Object.freeze(["user", "user_persona"]),
  ai: Object.freeze(["ai", "ai_character", "model", "assistant"]),
  npc: Object.freeze(["npc"]),
  fractal: Object.freeze(["fractal", "prologue", "epilogue", "narrator"]),
  system: Object.freeze(["system", "telemetry"]),
});

// =============================================================================
// [SECTION 3: DERIVED VIEWS - references §1/§2]
// =============================================================================

/**
 * Lean Floors per field (in string character length).
 * In Tier 1, every field reserves this minimum floor so core identity is never crowded out.
 * Any content beyond this floor spills into Tier 2 where it competes via RAG relevance.
 */
export const FIELD_FLOORS = Object.freeze({
  ETERNAL_PHYSICAL: LENGTH_THRESHOLDS.COMPACT, // 200
  ETERNAL_NON_PHYSICAL: LENGTH_THRESHOLDS.EXPANSIVE, // 500
  PRESENT_PHYSICAL: LENGTH_THRESHOLDS.COMPACT, // 200
  PRESENT_NON_PHYSICAL: LENGTH_THRESHOLDS.MEDIUM, // 300
  FUTURE: LENGTH_THRESHOLDS.COMPACT, // 200
  PAST: LENGTH_THRESHOLDS.MEDIUM, // 300
});
