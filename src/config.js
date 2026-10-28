/**
 * @file src/config.js
 * ⚙️ RPGlitch Sovereign System Configuration & Subsystem Domain Agreements
 *
 * Promoted configuration surface providing canonical scales, physical boundaries,
 * and cross-module subsystem agreements across @intelligence, @state, @media, and @ui.
 * Follows P4 Pre-Beta Purity: zero backwards compatibility layers, zero magic numbers.
 */

// =============================================================================
// [SECTION 1: SCOPED SCALES — PROSE/IDENT SHARED UNITS + PLATFORM PRIMITIVES]
// =============================================================================

/**
 * Prose scale: the shared unit of story text. Dialogue turns, director notes,
 * advisories and cluster summaries are all "one chunk of prose" by design, so
 * they tune together. Nothing outside the prose family may reference these.
 */
export const PROSE = Object.freeze({
  SNIPPET: 250, // A story beat: past bracket entry, prompt chapter summary, visual snippet
  PARAGRAPH: 500, // A narrative paragraph: present layer, dialogue turn, director note, agenda, cluster summary
  PAGE: 1500, // A full page: eternal identity facts, generation headroom
});

/**
 * Identifier scale: short machine-facing strings. Names, titles, slugs.
 */
export const IDENT = Object.freeze({
  SLUG: 40, // An identifier: chapter slug, truncation floor, terse input threshold
  LABEL: 80, // A title: entity name, chapter title
});

/** Hard platform prompt envelope in characters (~6,000 tokens @ 3.35). */
export const PROMPT_CHAR_ENVELOPE = 20000;

/**
 * Standard latency tiers (ms) for network probes, timeouts, and watchdog evaluation.
 */
export const LATENCY_TIERS_MS = Object.freeze({
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

/**
 * Universal narrative tension and dramatic scale (1-100).
 */
export const DYNAMICS_SCALE = Object.freeze({
  MIN: 1, // Lowest possible value on the 1-100 narrative tension and significance scale
  EXTREME_LOW: 15, // Collapse / isolation floor triggering automated emotional beats
  MID: 50, // Universal neutral equilibrium baseline for meters and new past-vector significance
  HIGH: 75, // High tension threshold triggering dramatic escalation, intimate framing, or Dutch angles
  EXTREME_HIGH: 85, // Climax / breakthrough ceiling triggering automated visual synthesis beats
  MAX: 100, // Absolute ceiling on the 1-100 narrative tension and significance scale
});

export const DYNAMICS_CALIBRATION = Object.freeze({
  DELTA_STANDARD: "±1-4", // Normal turn fluctuation guideline documented for LLM director in prompt
  DELTA_EXTREME: "±8-12", // High drama / crisis turn fluctuation guideline documented for LLM director in prompt
  BOUNDARY_CLIP: "5-95", // Safety buffer preventing ordinary turns from artificially slamming against scale endpoints
});

/** Natural rate per turn at which unprovoked tension meters drift back toward MID 50 */
export const GRAVITY_RATE = 0.08;

/** Cumulative displacement delta across all axes required to trigger an automated visual beat */
export const SEISMIC_SHIFT_DISPLACEMENT = DYNAMICS_SCALE.MID; // 50: Displacement trip point aligned to neutral dynamics baseline

/** Random atmospheric variance factor applied during turn dynamics progression */
export const ENTROPY_VARIANCE = 0.05;

/** Emotional salience scale for past entries and veil flags */
export const EMOTIONAL_WEIGHT_SCALE = Object.freeze({ MIN: 1, MAX: 10, DEFAULT: 5 });

/** Standard image aspect ratios and resolutions for text-to-image diffusion */
export const IMAGE_RESOLUTIONS = Object.freeze({
  LANDSCAPE: Object.freeze({ width: 768, height: 512 }),
  PORTRAIT: Object.freeze({ width: 512, height: 768 }),
  SQUARE_SMALL: Object.freeze({ width: 512, height: 512 }),
  SQUARE_LARGE: Object.freeze({ width: 768, height: 768 }),
});

// =============================================================================
// [SECTION 2: SUBSYSTEM DOMAIN AGREEMENTS]
// =============================================================================

// ── 1. Prompt Context Budgets & Compiler Handoff ──────────────────────────────
export const CHARS_PER_TOKEN = 3.35; // Calibrated empirical ratio (~3.35 chars/token) for prompt text budgeting
export const CONTEXT_TOKEN_CLIFF = 6000; // 6,000 tokens: Hard inference ceiling past which server middle-truncation occurs
export const DEFAULT_PROMPT_CEILING = CONTEXT_TOKEN_CLIFF;

/**
 * Resolves token allocation ceilings for major prompt partitions.
 * @param {number} [ceiling=6000]
 * @returns {{ ceiling: number, entities_max_tokens: number, history_max_tokens: number }}
 */
export function resolve_prompt_budget_allocation(ceiling = DEFAULT_PROMPT_CEILING) {
  return {
    ceiling,
    entities_max_tokens: 2000,
    history_max_tokens: 1600,
  };
}

// ── 2. Temporal Continuum, Compaction & Retrieval ──────────────────────────────
export const PAST_ENTRIES = Object.freeze({
  SESSION_CAP: 20, // Max 20 session bracket entries before background consolidation
  TOTAL_CAP: 180, // Max 180 total lifetime entries (45,000 chars / ARCHIVE tier)
  ENTRY_MAX_CHARS: PROSE.SNIPPET, // 250 chars per bracket entry
});

export const COMPACTION = Object.freeze({
  FANOUT: 8, // 8 child entries clustered per node
  MAX_HEIGHT: 5, // Max tree depth 5
  SUMMARY_MAX_CHARS: PROSE.PARAGRAPH, // 500 chars per cluster summary
});

export const FRAGMENTATION = Object.freeze({
  THRESHOLD: DYNAMICS_SCALE.HIGH, // 75: Somatic fragmentation fires when chaos/entropy exceeds HIGH tension threshold
  WEIGHT_CUTOFF: 6, // Past vectors at weight <= 6 degrade under fragmentation; >= 7 stay canon
});

export const TEMPORAL_SCORING = Object.freeze({
  SEMANTIC_GAIN: 3, // Multiplier scaling vector cosine similarity in hybrid past scoring formula
  RECENCY_FLOOR: 0.5, // Baseline recency weight floor preventing older vital entries from zeroing out
  DECAY_SOFTEN: 0.5, // Damping factor softening exponential time decay of historical entries
  IN_SCENE_SALIENCE_BOOST: 1.3, // 1.3x multiplier boosting entries involving entities co-present in active scene
});

export const HYBRID_WEIGHTS = Object.freeze({
  ENTITY_OVERLAP: 3.0, // Weight for matching entities mentioned in the active round
  LEXICAL_FREQUENCY: 1.0, // Weight for exact keyword matches between query and entry text
  EMOTIONAL_SALIENCE: 0.4, // Weight factoring the entry's original emotional weight score
  RECENCY: 1.2, // Weight factoring round distance and temporal decay
});

// ── 3. Narrative Feed, Pacing & Story Chronology ──────────────────────────────
export const DIALOGUE_WINDOW = Object.freeze({
  ROUNDS: 8, // 8 rounds of active conversational dialogue sliced into prompt context (~16 feed turns)
  MAX_CHARS: PROSE.PARAGRAPH, // 500 chars per turn ceiling
});

export const VISUAL_FEED_WINDOW = Object.freeze({
  ROUNDS: 1, // 1 round of immediate action context fed into visual prompt extraction (~2 feed turns)
  MAX_CHARS: PROSE.SNIPPET, // 250 chars per beat snippet ceiling
});

export const SIMULATION_LOG_ROUNDS = 5; // 5 rounds of recent story history sliced for simulation logs (~10 feed turns)

export const CHAPTER = Object.freeze({
  ARCHIVE_CAPACITY: 12, // Max closed chapters preserved in persistent DB history before pruning
  PROMPT_HISTORY_LIMIT: 6, // Max closed chapters rendered into prompt <CHAPTER_HISTORY> block
});

export const ENTITY_SCHEMA = Object.freeze({
  NAME_MAX_CHARS: IDENT.LABEL, // 80 chars: Maximum name string length
  SUMMARY_MAX_CHARS: 100, // 100 chars: Word-boundary truncation limit for compact cast summaries
});

/**
 * Lean base character quotas guaranteed per entity role before dynamic RAG overflow allocation.
 * Quadrant keys strictly follow universal nomenclature:
 * ETERNAL_NON_PHYSICAL, ETERNAL_PHYSICAL, PRESENT_NON_PHYSICAL, PRESENT_PHYSICAL, FUTURE.
 * PAST has zero static guarantee (100% dynamic RAG).
 */
export const ENTITY_GUARANTEES = Object.freeze({
  ASYMMETRIC: Object.freeze({
    SPEAKER: Object.freeze({
      ETERNAL_NON_PHYSICAL: 500,
      ETERNAL_PHYSICAL: 200,
      PRESENT_NON_PHYSICAL: 300,
      PRESENT_PHYSICAL: 200,
      FUTURE: 200,
    }),
    LISTENER: Object.freeze({
      ETERNAL_NON_PHYSICAL: 250,
      ETERNAL_PHYSICAL: 150,
      PRESENT_NON_PHYSICAL: 200,
      PRESENT_PHYSICAL: 150,
      FUTURE: 0,
    }),
    FRACTAL: Object.freeze({
      ETERNAL_NON_PHYSICAL: 200,
      ETERNAL_PHYSICAL: 150,
      PRESENT_NON_PHYSICAL: 150,
      PRESENT_PHYSICAL: 150,
      FUTURE: 0,
    }),
  }),
  SYMMETRICAL: Object.freeze({
    AI: Object.freeze({
      ETERNAL_NON_PHYSICAL: 350,
      ETERNAL_PHYSICAL: 200,
      PRESENT_NON_PHYSICAL: 250,
      PRESENT_PHYSICAL: 200,
      FUTURE: 150,
    }),
    USER: Object.freeze({
      ETERNAL_NON_PHYSICAL: 350,
      ETERNAL_PHYSICAL: 200,
      PRESENT_NON_PHYSICAL: 250,
      PRESENT_PHYSICAL: 200,
      FUTURE: 150,
    }),
    FRACTAL: Object.freeze({
      ETERNAL_NON_PHYSICAL: 250,
      ETERNAL_PHYSICAL: 150,
      PRESENT_NON_PHYSICAL: 200,
      PRESENT_PHYSICAL: 150,
      FUTURE: 0,
    }),
  }),
});

export const STAGNATION = Object.freeze({
  SOFT_PERMIT_ROUNDS: 8, // 8 stagnant rounds: lifts anti-staging constraints, allowing proactive entity movement
  HARD_MANDATE_ROUNDS: 16, // 16 stagnant rounds: forces external event, scene transit, or unexpected NPC arrival
  DRIFT_CUTOFF: 0.15, // Semantic vector drift < 0.15 indicates conversation looping / narrative stall
});

export const SPENT_ROUNDS = 5; // Number of recent rounds scanned for repetitive prose and mannerisms
export const MAX_SPENT_ITEMS = 8; // Max unique repetitive phrases injected into negative prompt constraints
export const OPENING_CLAUSE_MIN_CHARS = 15; // Minimum length to flag a repetitive opening clause (no tier: detector tuning, not prose)
export const SOMATIC_MARKER_CAP = 1; // Maximum physical cliché reaction markers permitted per turn before stripping

/**
 * User input pacing thresholds mapping character lengths to beat generation.
 */
export const INPUT_PACING = Object.freeze({
  TERSE: IDENT.SLUG, // <= 40 chars -> clipped 1-beat response
  STANDARD: PROSE.SNIPPET, // 41-250 chars -> standard 2-3 beats
  EXPANSIVE: PROSE.PARAGRAPH, // > 250 chars -> expansive multi-beat response
});

/**
 * Unified cooldown threshold (3 rounds) between automatic scene image generations.
 */
export const IMAGE_TRIGGER_COOLDOWN_ROUNDS = 3;

// ── 4. Web Ingestion & Story Import ───────────────────────────────────────────
export const INGESTION = Object.freeze({
  WEB_CHARS: 8000, // Max characters parsed from external web bio pages (no tier: intake policy, not prose)
  LORE_CHARS: 10000, // Max characters parsed from external web lore/wiki pages (no tier: intake policy, not prose)
});

// ── 5. Engine Dynamics & Director Staging ────────────────────────────────────
export const DIRECTOR_OUTPUT = Object.freeze({
  NOTE_LINES: 5, // Maximum number of lines permitted in the Director's staging guidance note
  NOTE_CHARS: PROSE.PARAGRAPH, // 500 chars hard character ceiling for Director note
  KEYWORDS_MAX: 5, // Maximum number of thematic staging keywords extracted per turn
});

/** Default 4-axis somatic dynamics baseline at neutral equilibrium (MID 50) */
export const DEFAULT_AI_DYNAMICS = Object.freeze({
  chaos: DYNAMICS_SCALE.MID,
  intensity: DYNAMICS_SCALE.MID,
  openness: DYNAMICS_SCALE.MID,
  affinity: DYNAMICS_SCALE.MID,
});

/** Default 2-axis environmental dynamics baseline at neutral equilibrium (MID 50) */
export const DEFAULT_FRACTAL_DYNAMICS = Object.freeze({
  velocity: DYNAMICS_SCALE.MID,
  entropy: DYNAMICS_SCALE.MID,
});

// ── 6. Hardware Tensors, Concurrency & UI Subsystems ─────────────────────────
export const EMBEDDING_SPECS = Object.freeze({
  DIMENSIONS: 384, // Tensor dimensionality (384-d) for all-MiniLM-L6-v2 semantic sentence embeddings
  CACHE_CAPACITY: 1500, // Maximum number of 384-d tensor vectors held in the in-memory LRU cache
  QUANTIZE_MAX: 255, // 8-bit unsigned integer scalar ceiling (0-255) for quantized vector storage
});

/** Calibrated watchdog timing and grace thresholds preventing engine hangs */
export const WATCHDOG_POLICY = Object.freeze({
  INTERVAL_MS: LATENCY_TIERS_MS.HEARTBEAT, // 15,000ms (15s): Watchdog probe heartbeat
  IDLE_GRACE_MS: 90000, // 90,000ms (90s): Maximum idle stasis permitted before recovery
  CHUNK_STALL_MS: 90000, // 90,000ms (90s): Maximum time without stream chunks before timeout
  MAX_MS: 5 * 60 * 1000, // 300,000ms (5m): Hard maximum generation runtime
  CONSOLIDATE_GRACE_MS: LATENCY_TIERS_MS.LIFETIME, // 240,000ms (4m): Max background continuum-consolidation grace
});

/** Telemetry and diagnostic ring buffer capacity caps */
export const TELEMETRY_CAPS = Object.freeze({
  DIRECTOR_LATENCY_POOL: 50, // Rolling window size for director execution latency tracking
  DEVELOPER_LOG_ENTRIES: 500, // Maximum developer log buffer capacity before FIFO truncation
});

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-10-19: Added ENTITY_GUARANTEES (ASYMMETRIC and SYMMETRICAL topologies) establishing lean character floors per quadrant for dynamic entity RAG allocation.
 * - 2026-10-19: Scoped tier scales — replaced 13-rung TEXT_TIERS_CHARS with PROSE/IDENT
 *   scales + PROMPT_CHAR_ENVELOPE; non-prose values back to honest literals. Zero value
 *   changes: every alias preserves its live number (harness 12/12 identical).
 * - 2026-10-19: Canonical System Configuration Harmonization — Rebuilt src/config.js with TEXT_TIERS_CHARS literary scale, LATENCY_TIERS_MS, PATIENCE_POLICY, DYNAMICS_SCALE, and full cross-module subsystem domain agreements. Purged obsolete static token budget allocation helpers.
 * - 2026-10-18: Track A Slice 3 — Created promoted root src/config.js with DEFAULT_PROMPT_CEILING and resolve_prompt_budget_allocation.
 */
