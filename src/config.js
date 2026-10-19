/**
 * @file src/config.js
 * ⚙️ RPGlitch Sovereign System Configuration & Subsystem Domain Agreements
 *
 * Promoted configuration surface providing canonical scales, physical boundaries,
 * and cross-module subsystem agreements across @intelligence, @state, @media, and @ui.
 * Follows P4 Pre-Beta Purity: zero backwards compatibility layers, zero magic numbers.
 */

// =============================================================================
// [SECTION 1: TIER 1 CANON — SCALES & UNIVERSAL PRIMITIVES]
// =============================================================================

/**
 * Literary character scale for text budgeting, prompt synthesis, and storage.
 * @type {Readonly<{
 *   TINY: 15,
 *   SLUG: 40,
 *   LABEL: 80,
 *   SHORT: 100,
 *   SNIPPET: 250,
 *   PARAGRAPH: 500,
 *   PAGE: 1500,
 *   CHAPTER: 5000,
 *   STORY: 8000,
 *   NOVELETTE: 10000,
 *   NOVELLA: 20000,
 *   ARCHIVE: 45000,
 *   LIBRARY: 100000
 * }>}
 */
export const TEXT_TIERS_CHARS = Object.freeze({
  TINY: 15, // A word or clause: repetitive start flag & minimum input floor (15 chars)
  SLUG: 40, // An identifier: chapter slug ID, truncation recovery floor, terse input threshold (40 chars)
  LABEL: 80, // A title: entity name and chapter title ceiling (80 chars)
  SHORT: 100, // A short summary: small input clamp and cast list summary truncation (100 chars)
  SNIPPET: 250, // A story beat: memory bracket entry, prompt chapter summary, visual snippet ceiling (250 chars)
  PARAGRAPH: 500, // A narrative paragraph: present layer, chapter story summary, director note, agenda, dialogue message ceiling (500 chars)
  PAGE: 1500, // A full page: eternal core entity profile facts and output generation headroom (1,500 chars)
  CHAPTER: 5000, // A full chapter transcript: dialogue history transcript window ceiling (5,000 chars)
  STORY: 8000, // A complete bio dossier: external web bio wiki import ceiling (8,000 chars)
  NOVELETTE: 10000, // A deep lore volume: external web lore/wiki import ceiling (10,000 chars)
  NOVELLA: 20000, // An entire novella context: Perchance platform inference cliff (~6,000 tokens @ 3.35) (20,000 chars)
  ARCHIVE: 45000, // A complete entity lifetime memory: maximum historical past layer storage in DB (45,000 chars)
  LIBRARY: 100000, // Multi-entity persistent storage campaign floor in IndexedDB (100,000 chars)
});

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
  LIFETIME: 240000, // 240,000ms (4m): Hard maximum generation lifetime and background forge consolidation ceiling
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
  MID: 50, // Universal neutral equilibrium baseline for meters and new memory significance
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
export const SEISMIC_SHIFT_DISPLACEMENT = 60;

/** Random atmospheric variance factor applied during turn dynamics progression */
export const ENTROPY_VARIANCE = 0.05;

/** Emotional salience scale for memory entries and veil flags */
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
export const CONTEXT_CLIFF_CHARS = TEXT_TIERS_CHARS.NOVELLA; // 20,000 chars: Hard platform context envelope ceiling
export const CONTEXT_TOKEN_CLIFF = 6000; // 6,000 tokens: Hard inference ceiling past which server middle-truncation occurs
export const GENERATION_HEADROOM_CHARS = TEXT_TIERS_CHARS.PAGE; // 1,500 chars reserved for LLM generation

// ── 2. Temporal Memory, Compaction & Retrieval ──────────────────────────────
export const PAST_ENTRIES = Object.freeze({
  SESSION_CAP: 20, // Max 20 session bracket entries before background consolidation
  TOTAL_CAP: 180, // Max 180 total lifetime entries (45,000 chars / ARCHIVE tier)
  ENTRY_MAX_CHARS: TEXT_TIERS_CHARS.SNIPPET, // 250 chars per bracket entry
});

export const COMPACTION = Object.freeze({
  FANOUT: 8, // 8 child entries clustered per node
  MAX_HEIGHT: 5, // Max tree depth 5
  SUMMARY_MAX_CHARS: TEXT_TIERS_CHARS.PARAGRAPH, // 500 chars per cluster summary
});

export const FRAGMENTATION = Object.freeze({
  THRESHOLD: 70, // Fires at 70% fragmented
  WEIGHT_CUTOFF: 6, // Spares entries with emotional weight >= 6
});

export const PRESENT_MAX_CHARS = TEXT_TIERS_CHARS.PARAGRAPH; // 500 chars: Immediate physical state layer
export const ETERNAL_MAX_CHARS = TEXT_TIERS_CHARS.PAGE; // 1,500 chars: Permanent identity facts in core profile

export const TEMPORAL_SCORING = Object.freeze({
  SEMANTIC_GAIN: 3, // Multiplier scaling vector cosine similarity in hybrid memory scoring formula
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
  MAX_CHARS: TEXT_TIERS_CHARS.PARAGRAPH, // 500 chars per turn ceiling
});

export const VISUAL_FEED_WINDOW = Object.freeze({
  ROUNDS: 1, // 1 round of immediate action context fed into visual prompt extraction (~2 feed turns)
  MAX_CHARS: TEXT_TIERS_CHARS.SNIPPET, // 250 chars per beat snippet ceiling
});

export const SIMULATION_LOG_ROUNDS = 5; // 5 rounds of recent story history sliced for simulation logs (~10 feed turns)

export const CHAPTER = Object.freeze({
  ARCHIVE_CAPACITY: 12, // Max closed chapters preserved in persistent DB history before pruning
  PROMPT_HISTORY_LIMIT: 6, // Max closed chapters rendered into prompt <CHAPTER_HISTORY> block
});

export const ENTITY_SCHEMA = Object.freeze({
  NAME_MAX_CHARS: TEXT_TIERS_CHARS.LABEL, // 80 chars: Maximum name string length
  SUMMARY_MAX_CHARS: TEXT_TIERS_CHARS.SHORT, // 100 chars: Word-boundary truncation limit for compact cast summaries
});

export const STAGNATION = Object.freeze({
  SOFT_PERMIT_ROUNDS: 8, // 8 stagnant rounds: lifts anti-staging constraints, allowing proactive entity movement
  HARD_MANDATE_ROUNDS: 16, // 16 stagnant rounds: forces external event, scene transit, or unexpected NPC arrival
  DRIFT_CUTOFF: 0.15, // Semantic vector drift < 0.15 indicates conversation looping / narrative stall
});

export const SPENT_ROUNDS = 5; // Number of recent rounds scanned for repetitive prose and mannerisms
export const MAX_SPENT_ITEMS = 8; // Max unique repetitive phrases injected into negative prompt constraints
export const OPENING_CLAUSE_MIN_CHARS = TEXT_TIERS_CHARS.TINY; // 15 chars: Minimum length to flag repetitive opening clause
export const SOMATIC_MARKER_CAP = 1; // Maximum physical cliché reaction markers permitted per turn before stripping
export const TRUNCATION_MIN_CHARS = TEXT_TIERS_CHARS.SLUG; // 40 chars: Minimum sentence floor before punctuation recovery

/**
 * User input pacing thresholds mapping character lengths to beat generation.
 */
export const INPUT_PACING = Object.freeze({
  TERSE: TEXT_TIERS_CHARS.SLUG, // <= 40 chars -> clipped 1-beat response
  STANDARD: TEXT_TIERS_CHARS.SNIPPET, // 41-250 chars -> standard 2-3 beats
  EXPANSIVE: TEXT_TIERS_CHARS.PARAGRAPH, // > 250 chars -> expansive multi-beat response
});

/**
 * Unified cooldown threshold (3 rounds) between automatic scene image generations.
 */
export const IMAGE_TRIGGER_COOLDOWN_ROUNDS = 3;

// ── 4. Web Ingestion & Story Import ───────────────────────────────────────────
export const INGESTION = Object.freeze({
  WEB_CHARS: TEXT_TIERS_CHARS.STORY, // 8,000 chars: Max characters parsed from external web bio pages
  LORE_CHARS: TEXT_TIERS_CHARS.NOVELETTE, // 10,000 chars: Max characters parsed from external web lore/wiki pages
});

// ── 5. Engine Dynamics & Director Staging ────────────────────────────────────
export const DIRECTOR_OUTPUT = Object.freeze({
  NOTE_LINES: 5, // Maximum number of lines permitted in the Director's staging guidance note
  NOTE_CHARS: TEXT_TIERS_CHARS.PARAGRAPH, // 500 chars hard character ceiling for Director note
  KEYWORDS_MAX: 5, // Maximum number of thematic staging keywords extracted per turn
});

// ── 6. Hardware Tensors, Concurrency & UI Subsystems ─────────────────────────
export const EMBEDDING_SPECS = Object.freeze({
  DIMENSIONS: 384, // Tensor dimensionality (384-d) for all-MiniLM-L6-v2 semantic sentence embeddings
  CACHE_CAPACITY: 1500, // Maximum number of 384-d tensor vectors held in the in-memory LRU cache
  QUANTIZE_MAX: 255, // 8-bit unsigned integer scalar ceiling (0-255) for quantized vector storage
});

export const LLM_GATE_POLICY = Object.freeze({
  CONCURRENCY: 1, // Strict concurrency cap of 1 active turn executing on the inference pipe
  PRIORITY_FOREGROUND: 10, // Priority score 10: High priority granted to user-facing narrative turns
  PRIORITY_BACKGROUND: 1, // Priority score 1: Low priority granted to background tasks
});

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-10-19: Canonical System Configuration Harmonization — Rebuilt src/config.js with TEXT_TIERS_CHARS literary scale, LATENCY_TIERS_MS, PATIENCE_POLICY, DYNAMICS_SCALE, and full cross-module subsystem domain agreements. Purged obsolete static token budget allocation helpers.
 * - 2026-10-18: Track A Slice 3 — Created promoted root src/config.js with DEFAULT_PROMPT_CEILING and resolve_prompt_budget_allocation.
 */
