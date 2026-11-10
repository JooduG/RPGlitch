/**
 * @file src/config.js
 * ⚙️ RPGlitch Sovereign System Configuration & Subsystem Domain Agreements
 *
 * Promoted configuration surface providing canonical scales, physical boundaries,
 * and cross-module subsystem agreements across @engine, @storage, @definitions,
 * @media, @utils, and @ui.
 * Follows P4 Pre-Beta Purity: zero backwards compatibility layers, zero magic numbers.
 *
 * Layout rule: §1 and §2 own every number (no cross-references between homes).
 * §3 contains only references to §1/§2 plus a few homeless policy literals.
 * Nothing in §3 may be referenced by §1/§2 (evaluation order depends on it).
 */

// =============================================================================
// [SECTION 1: PLATFORM TIME & PATIENCE — no dependencies]
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
  STALL: 60000, // 60,000ms (60s): Visual prompt extraction pass timeout and streaming stall watchdog grace
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
// [SECTION 2: CANONICAL DOMAIN HOMES — every number lives here exactly once]
// =============================================================================

// ── 1. Directorial Staging & Dynamic Equilibrium ─────────────────────────────
/** Universal narrative tension and dramatic scale (1-100) with calibrated operational boundaries. */
export const DYNAMICS_SCALE = Object.freeze({
  MIN: 1, // Lowest possible value on the 1-100 narrative tension and significance scale
  EXTREME_LOW: 15, // Collapse / isolation floor triggering automated emotional beats
  LOW: 25,
  MID: 50, // Universal neutral equilibrium baseline for meters and new past-vector significance
  HIGH: 75, // High tension threshold triggering dramatic escalation, intimate framing, or Dutch angles
  EXTREME_HIGH: 85, // Climax / breakthrough ceiling triggering automated visual synthesis beats
  MAX: 100, // Absolute ceiling on the 1-100 narrative tension and significance scale
  GRAVITY: 0.08, // Natural per-turn pull of unprovoked tension meters back toward MID
  VARIANCE: 0.05, // Random atmospheric variance factor applied during turn dynamics progression

  DELTA_STANDARD: "±1-4", // Normal turn fluctuation guideline documented for LLM director in prompt
  DELTA_EXTREME: "±8-12", // High drama / crisis turn fluctuation guideline documented for LLM director in prompt
  BOUNDARY_CLIP: "5-95", // Safety buffer preventing ordinary turns from artificially slamming against scale endpoints
});

/**
 * Dynamics axis definitions and metadata: somatic (character) and fractal (environmental) axes,
 * plus explicit `low` and `high` spectrum bounds.
 * @type {Record<string, { label: string, low: string, high: string, scope: "somatic" | "fractal" }>}
 */
export const DYNAMICS_AXES = Object.freeze({
  // Character (Somatic) axes
  chaos: { label: "Chaos", low: "Order", high: "Volatility", scope: "somatic" },
  intensity: { label: "Intensity", low: "Stillness", high: "Surge", scope: "somatic" },
  openness: { label: "Openness", low: "Insulation", high: "Permeability", scope: "somatic" },
  affinity: { label: "Affinity", low: "Isolation", high: "Coalescence", scope: "somatic" },

  // Fractal (Environmental) axes
  velocity: { label: "Velocity", low: "Suspension", high: "Acceleration", scope: "fractal" },
  entropy: { label: "Entropy", low: "Coherence", high: "Glitching", scope: "fractal" },
});

// ── 2. Canonical Length Thresholds ───────────────────────────────────────────
export const LENGTH_THRESHOLDS = Object.freeze({
  TINY: 25, // < 25 characters -> 1 snappy beat
  SMALL: 150, // < 150 characters -> 1-2 beats
  COMPACT: 200, // Physical & agenda baseline floor
  MEDIUM: 300, // Psychological & past memory floor
  EXPANSIVE: 500, // Core personality floor & expansive input cadence (>= 500)
  INGESTATION: 8000, // Web bio + lore intake budget (single home; html.js caps reference this)
  PROMPT_MAX: 20000, // Hard prompt character ceiling (policy; currently unenforced)
});

// ── 3. Visual Media Resolutions ──────────────────────────────────────────────
export const IMAGE_RESOLUTIONS = Object.freeze({
  PORTRAIT: Object.freeze({ width: 512, height: 768 }),
  LANDSCAPE: Object.freeze({ width: 768, height: 512 }),
  SQUARE_SMALL: Object.freeze({ width: 512, height: 512 }),
  SQUARE_LARGE: Object.freeze({ width: 768, height: 768 }),
});

// ── 4. Hardware Tensors ──────────────────────────────────────────────────────
export const EMBEDDING_SPECS = Object.freeze({
  DIMENSIONS: 384, // Tensor dimensionality (384-d) for all-MiniLM-L6-v2 semantic sentence embeddings
  CACHE_CAPACITY: 1500, // Maximum number of 384-d tensor vectors held in the in-memory LRU cache
  MAX_EPHEMERAL_VECTORS: 200, // Maximum ephemeral vectors held in the in-memory FIFO cache before eviction
  QUANTIZE_MAX: 255, // 8-bit unsigned integer scalar ceiling (0-255) for quantized vector storage
});

// ── 5. Unified Temporal Tempo ──────────────────────────────────────────────────
export const TEMPO_ROUNDS = Object.freeze({
  STANDARD: 8, // 8 rounds: Working memory transcript window & soft stagnation permit
  SLOW: 16, // 16 rounds: Critical hard stagnation disruption mandate
});

// ── 6. Tokenizer Calibration ─────────────────────────────────────────────────
export const CHARS_PER_TOKEN = 3.35; // Calibrated empirical ratio (~3.35 chars/token) for prompt text budgeting

// ── 7. Sieve & Retrieval Scoring ─────────────────────────────────────────────
/** Origin protection multiplier boosting author canon and immutable memories */
export const ORIGIN_SCORE_MULTIPLIER = 1.5;

// =============================================================================
// [SECTION 3: DERIVED VIEWS & SINGLE-KEY POLICY — references §1/§2, plus a few homeless literals]
// =============================================================================

// ── 1. Somatic Markers ───────────────────────────────────────────────────────
export const SOMATIC_MARKER_CAP = 1; // Maximum physical cliché reaction markers permitted per turn before stripping

// ── 2. Telemetry ─────────────────────────────────────────────────────────────
/** Telemetry and diagnostic ring buffer capacity caps */
export const TELEMETRY_CAPS = Object.freeze({
  DIRECTOR_LATENCY_POOL: 50, // Rolling window size for director execution latency tracking
  DEVELOPER_LOG_ENTRIES: 500, // Maximum developer log buffer capacity before FIFO truncation
});

// ── 3. Image Trigger (image cadence policy; bands live on DYNAMICS_SCALE) ────
export const IMAGE_TRIGGER = Object.freeze({
  displacement_threshold: 50, // Cumulative cross-axis delta sum tripping an automatic scene image
  cooldown_rounds: 3, // Unified cooldown (rounds) between automatic scene image generations
  default_tier: "story_scene", // Fallback tier for auto-triggered beats (canonical tiers live in optics IMAGE_TIERS)
  max_pending_images: 5, // Max queued + unresolved image beats before eviction (queue) / skip (spawn)
});

// ── 4. Field Floors (view over LENGTH_THRESHOLDS) ────────────────────────────
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

/**
 * CHANGELOG:
 * - 2026-11-10: IMAGE_TRIGGER slimmed — resolve_timeout_ms/ghost_max_age_ms deleted (visual.js reads TIMING_MS.CEILING directly, same 120000); queue_capacity + placeholder_hard_cap merged into max_pending_images: 5 (both guards shared the value/pool).
 * - 2026-11-10: Centralized tunables — EMBEDDING_SPECS gains MAX_EPHEMERAL_VECTORS (sieve.js re-pointed); IMAGE_TRIGGER gains queue_capacity/placeholder_hard_cap/resolve_timeout_ms/ghost_max_age_ms (visual.js re-pointed, 4 module consts deleted) and keeps default_tier (optics DEFAULT_IMAGE_TIER deleted as dead dup); config `tiers` copy deleted — optics trigger validation uses IMAGE_TIERS directly (same 4 strings); SESSION_ID_KEY single-sourced in db.js (sessions.svelte.js dup deleted). No value changes.
 * - 2026-11-10: Cosmetic, no moves: removed §3.1 tombstone (§3 renumbered 1-4), fixed §2.2
 *   header (floors left earlier), §3 banner now admits the homeless literals. No value changes.
 * - 2026-11-10: Renamed LATENCY_TIERS_MS→TIMING_MS (status.svelte.js + resilience.js re-pointed),
 *   moved FIELD_FLOORS to new §3.5 (pure LENGTH_THRESHOLDS view; sieve.js unaffected), renamed
 *   CANONICAL_ORIGIN_SCORE_MULTIPLIER→ORIGIN_SCORE_MULTIPLIER (sieve.js re-pointed). No value changes.
 * - 2026-11-10: Cut IMAGE_TRIGGER.band_high/band_low middlemen — optics reads
 *   DYNAMICS_SCALE.EXTREME_HIGH/EXTREME_LOW directly; header no longer claims a SCALE view.
 * - 2026-11-10: Deleted HARD_LIMITS — sieve.js reads CHARS_PER_TOKEN directly; the other
 *   four keys had no runtime consumers (VECTOR_DIMENSIONS survives in EMBEDDING_SPECS).
 *   §3.4 (Hard Limits) removed, Image Trigger now §3.4. PROMPT_MAX comment updated.
 * - 2026-11-10: Deleted INGESTION — html.js caps (web + lore) read LENGTH_THRESHOLDS.INGESTION
 *   directly. Behavior change: lore cap 10000->8000, web cap unchanged. §3 renumbered (Telemetry 3,
 *   Hard Limits 4, Image Trigger 5).
 * - 2026-11-10: Deleted WATCHDOG_POLICY — status.svelte.js reads LATENCY_TIERS_MS directly
 *   (interval HEARTBEAT, idle/stall graces CEILING 2m, hard max + consolidate LIFETIME 4m).
 *   Behavior change: idle/stall tolerance 90s->120s, hard max 300s->240s. §3.4 is now Telemetry only.
 * - 2026-11-10: Added §2.6 Tokenizer Calibration (CHARS_PER_TOKEN) + §2.7 Sieve & Retrieval
 *   Scoring (CANONICAL_ORIGIN_SCORE_MULTIPLIER) as new canonical homes; §3.2 narrowed to Somatic
 *   Markers, old §3.4 removed, §3.4-§3.6 renumbered. No value changes.
 * - 2026-11-10: Moved TEMPO_ROUNDS to §2.5 (Unified Temporal Tempo) — dependency-free
 *   literal block, values unchanged; §3.4 renamed to Origin & Sieve (keeps CANONICAL multiplier).
 * - 2026-11-10: Reordered so homes precede views (§1 time/patience, §2 domain homes, §3 derived views).
 * - 2026-11-10: Folded GRAVITY_RATE/ENTROPY_VARIANCE into DYNAMICS_SCALE.GRAVITY/VARIANCE —
 *   engine/dynamics.js reads the scale directly; the two aliases are deleted. Net -2 exports.
 * - 2026-11-10: Inlined SEISMIC_SHIFT_DISPLACEMENT (sole consumer was IMAGE_TRIGGER) as a
 *   50 literal with its meaning in the comment; export deleted. Net -1 export.
 *   DYNAMICS_SCALE owns GRAVITY/VARIANCE (read directly; the old aliases are folded away below);
 *   LENGTH_THRESHOLDS owns INGESTATION/PROMPT_MAX (INGESTION.WEB_CHARS and HARD_LIMITS.PROMPT_MAX_CHARACTERS
 *   alias them). No value changes; evaluation order verified by live module import.
 * - 2026-11-10: Repair user edit — reverted three forward references that threw at module load
 *   (GRAVITY_RATE/ENTROPY_VARIANCE→DYNAMICS_SCALE, INGESTION→LENGTH_THRESHOLDS, HARD_LIMITS→LENGTH_THRESHOLDS:
 *   all TDZ ReferenceErrors since targets are declared later), fixed LATENCY_TIERS_MS.CIELING typo
 *   (undefined — would have silently disabled watchdog idle/stall recovery; restored test-pinned 90000s),
 *   reverted STREAM_TIMEOUT→STALL alias (wrong domain) and displacement delinking. Kept the good ideas in
 *   order-safe form: LENGTH_THRESHOLDS.INGESTATION/PROMPT_MAX now alias the earlier INGESTION/HARD_LIMITS
 *   consts (same module order allows it); scale-owned GRAVITY/VARIANCE dropped (file order can't support it —
 *   Section-1 primitives stay the single home).
 * - 2026-11-10: HARD_LIMITS twin values folded into aliases — CHARACTERS_PER_TOKEN and
 *   VECTOR_DIMENSIONS now reference CHARS_PER_TOKEN / EMBEDDING_SPECS.DIMENSIONS (single value each;
 *   keys kept: sieve.test.js pins HARD_LIMITS.VECTOR_DIMENSIONS). No value changes.
 * - 2026-11-10: DEFAULT_AI/FRACTAL_DYNAMICS deleted — replaced by default_dynamics_for_scope(scope) in
 *   src/definitions/dynamics.js (axis membership from DYNAMICS_AXES scopes, values from DYNAMICS_SCALE.MID),
 *   consumed by storage/entities.js birth + engine/runtime.svelte.js setters. Net -2 exports.
 * - 2026-11-10: Post-nuclear prune — deleted 27 dead exports (PROSE/IDENT scales, PROMPT_CHAR_ENVELOPE,
 *   DYNAMICS_CALIBRATION, CONTEXT_TOKEN_CLIFF/DEFAULT_PROMPT_CEILING/resolve_prompt_budget_allocation,
 *   PAST_ENTRIES/COMPACTION/FRAGMENTATION/TEMPORAL_SCORING/HYBRID_WEIGHTS/RAG_MULTIPLIERS,
 *   DIALOGUE_WINDOW/VISUAL_FEED_WINDOW/SIMULATION_LOG_ROUNDS/CHAPTER/ENTITY_SCHEMA/ENTITY_GUARANTEES,
 *   STAGNATION/SPENT_ROUNDS/MAX_SPENT_ITEMS/OPENING_CLAUSE_MIN_CHARS/INPUT_PACING,
 *   IMAGE_TRIGGER_COOLDOWN_ROUNDS const, DIRECTOR_OUTPUT, EMOTIONAL_WEIGHT_SCALE) — all zero
 *   runtime + zero test references. Folded the triplicate IMAGE_TRIGGER cooldown keys into one
 *   cooldown_rounds: 3; dropped TEMPO_ROUNDS.FAST (stale comment, value contradicted live cooldown).
 *   GRAVITY_RATE/ENTROPY_VARIANCE now single-sourced into engine/dynamics.js; IMAGE_TRIGGER.cooldown_rounds
 *   single-sourced into media/optics.js. Renumbered sections 1/2/3. No value changes to any live number.
 * - 2026-10-19: Added ENTITY_GUARANTEES (ASYMMETRIC and SYMMETRICAL topologies) establishing lean character floors per quadrant for dynamic entity RAG allocation.
 * - 2026-10-19: Scoped tier scales — replaced 13-rung TEXT_TIERS_CHARS with PROSE/IDENT
 *   scales + PROMPT_CHAR_ENVELOPE; non-prose values back to honest literals. Zero value
 *   changes: every alias preserves its live number (harness 12/12 identical).
 * - 2026-10-19: Canonical System Configuration Harmonization — Rebuilt src/config.js with TEXT_TIERS_CHARS literary scale, LATENCY_TIERS_MS, PATIENCE_POLICY, DYNAMICS_SCALE, and full cross-module subsystem domain agreements. Purged obsolete static token budget allocation helpers.
 * - 2026-10-18: Track A Slice 3 — Created promoted root src/config.js with DEFAULT_PROMPT_CEILING and resolve_prompt_budget_allocation.
 */
