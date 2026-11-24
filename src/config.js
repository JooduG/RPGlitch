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

// =============================================================================
// [SECTION 2: CANONICAL DOMAIN HOMES - every number and shared vocabulary lives here exactly once]
// =============================================================================

// ── 1. Directorial Staging & Dynamic Equilibrium ─────────────────────────────
/**
 * The dynamics domain (single home): SCALE = range + trigger bands, PHYSICS = drift math,
 * DELTA = prompt-doc strings, CHAOS…ENTROPY = the six axis definitions.
 * Axis children are UPPER (config convention); runtime axis ids are lowercase, so readers
 * index DYNAMICS[axis.toUpperCase()] - the `?.` guards degrade gracefully on mismatch.
 */
export const DYNAMICS = Object.freeze({
  SCALE: Object.freeze({
    MIN: 1, // Lowest possible value on the 1-100 narrative tension and significance scale
    EXTREME_LOW: 15, // Collapse / isolation floor triggering automated emotional beats
    MID: 50, // Universal neutral equilibrium baseline for meters and new past-vector significance
    HIGH: 75, // High tension threshold triggering dramatic escalation, intimate framing, or Dutch angles
    EXTREME_HIGH: 85, // Climax / breakthrough ceiling triggering automated visual synthesis beats
    MAX: 100, // Absolute ceiling on the 1-100 narrative tension and significance scale
  }),
  PHYSICS: Object.freeze({
    GRAVITY: 0.08, // Natural per-turn pull of unprovoked tension meters back toward MID
    VARIANCE: 0.05, // Random atmospheric variance factor applied during turn dynamics progression
  }),
  DELTA: Object.freeze({
    STANDARD: "±1-4", // Normal turn fluctuation guideline documented for LLM director in prompt
    EXTREME: "±8-12", // High drama / crisis turn fluctuation guideline documented for LLM director in prompt
    CLIP: "5-95", // Safety buffer preventing ordinary turns from artificially slamming against scale endpoints
  }),
  // Character (Somatic) axes
  CHAOS: Object.freeze({ label: "Chaos", low: "Order", high: "Volatility", scope: "somatic" }),
  INTENSITY: Object.freeze({ label: "Intensity", low: "Stillness", high: "Surge", scope: "somatic" }),
  OPENNESS: Object.freeze({ label: "Openness", low: "Insulation", high: "Permeability", scope: "somatic" }),
  AFFINITY: Object.freeze({ label: "Affinity", low: "Isolation", high: "Coalescence", scope: "somatic" }),
  // Fractal (Environmental) axes
  VELOCITY: Object.freeze({ label: "Velocity", low: "Suspension", high: "Acceleration", scope: "fractal" }),
  ENTROPY: Object.freeze({ label: "Entropy", low: "Coherence", high: "Glitching", scope: "fractal" }),
});

// ── 2. Canonical Length Thresholds ───────────────────────────────────────────
export const LENGTH_THRESHOLDS = Object.freeze({
  TINY: 25, // < 25 characters -> 1 snappy beat
  SMALL: 150, // < 150 characters -> 1-2 beats
  COMPACT: 200, // Physical & agenda baseline floor
  MEDIUM: 300, // Psychological & past memory floor
  EXPANSIVE: 500, // Core personality floor & expansive input cadence (>= 500)
  INGESTION: 8000, // Ingestion extraction & readable truncation ceiling
});

// ── 3. Visual Media Resolutions ──────────────────────────────────────────────
export const IMAGE_RESOLUTIONS = Object.freeze({
  PORTRAIT: Object.freeze({ width: 512, height: 768 }),
  LANDSCAPE: Object.freeze({ width: 768, height: 512 }),
  SQUARE_LARGE: Object.freeze({ width: 768, height: 768 }),
});

// ── 4. Unified Temporal Tempo ──────────────────────────────────────────────────
export const TEMPO_ROUNDS = Object.freeze({
  STANDARD: 8, // 8 rounds: Working memory transcript window & soft stagnation permit
  SLOW: 16, // 16 rounds: Critical hard stagnation disruption mandate
});

// ── 6. Tokenizer Calibration ─────────────────────────────────────────────────
export const CHARS_PER_TOKEN = 3.35; // Calibrated empirical ratio (~3.35 chars/token) for prompt text budgeting

// ── 7. Image Policy ──────────────────────────────────────────────────────────
/**
 * Single home for image tuning, both directions:
 * - Generation (optics/visual pipeline): trigger cadence (WHEN a beat earns an image)
 *   + diffusion guidance (HOW strongly).
 * - Intake (html.js upload validation): upload size/type bounds.
 * NOT here: tier resolutions (IMAGE_RESOLUTIONS §2.3 - structural, stable).
 */
export const IMAGE_POLICY = Object.freeze({
  DISPLACEMENT_THRESHOLD: 50, // Cumulative cross-axis delta sum tripping an automatic scene image
  COOLDOWN_ROUNDS: 3, // Unified cooldown (rounds) between automatic scene image generations
  DEFAULT_TIER: "story_scene", // Fallback tier for auto-triggered beats (canonical tiers live in optics IMAGE_TIERS)
  MAX_PENDING_IMAGES: 5, // Max queued + unresolved image beats before eviction (queue) / skip (spawn)
  GUIDANCE: Object.freeze({
    SCENE: 7, // story_scene tier baseline (environmental shots drift)
    CHARACTER: 9, // solo_entity / story_character / story_entities baseline (portraits hold tighter)
  }),
  UPLOAD: Object.freeze({
    MAX_IMAGE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB default maximum permissible image upload size
    ALLOWED_IMAGE_MIME_TYPES: Object.freeze(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]),
  }),
});

// ── 8. Voice Cadence ─────────────────────────────────────────────────────────
/**
 * Voice cadence model (single home; audio.js CADENCE_RATES/VOICE_CADENCES are views over RATES):
 * base speech-rate multipliers by cadence id + how far entity dynamics bend the base rate.
 */
export const VOICE_CADENCE = Object.freeze({
  RATES: Object.freeze({ drawl: 0.85, measured: 0.95, standard: 1.0, brisk: 1.1, rapid: 1.2 }),
  SHAPING: Object.freeze({
    DYNAMICS_OFFSET: 0.001, // Per-point rate bend per dynamics unit away from neutral 50
    MIN_RATE: 0.5, // Hard floor on the shaped speech rate
    MAX_RATE: 2.0, // Hard ceiling on the shaped speech rate
  }),
});

// ── 9. Canonical Entity Roles ───────────────────────────────────────────────
/**
 * Two role vocabularies - similar names, different jobs:
 * - CANONICAL_ROLES: normalized lowercase role map. Every log row's `role` holds one of these five;
 *   raw model roles (assistant/narrator/prologue…) fold into them via canonicalize_role (text.js).
 *   Narrative participants are everything but SYSTEM (see is_narrative_role in text.js).
 * - NARRATOR_ROLES: lowercase export set - raw_role values marking narrator-voiced beats for the story exporter.
 */
export const CANONICAL_ROLES = Object.freeze({ USER: "user", AI: "ai", NPC: "npc", FRACTAL: "fractal", SYSTEM: "system" });
export const NARRATOR_ROLES = Object.freeze(new Set(["prologue", "fractal", "narrator", "epilogue"]));

// ── 10. Speaking Styles ──────────────────────────────────────────────────────
/** Canonical speaking style ids (single home; the detox hardcoded twin, the registry derived twin, and the VALID Set twin are all gone - lookups use .includes()) */
export const SPEAKING_STYLES = Object.freeze(["casual", "lyrical", "primal", "clinical"]);

// =============================================================================
// [SECTION 3: DERIVED VIEWS & SINGLE-KEY POLICY - references §1/§2, plus a few homeless literals]
// =============================================================================

// ── 1. Field Floors (view over LENGTH_THRESHOLDS) ────────────────────────────
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
