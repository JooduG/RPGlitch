# config.js planning (rebuilt 2026-10-19)

## The one rule: centralize agreements, not coincidences

A value belongs in `src/config.js` iff **two or more modules must agree on it** (a budget both sides of a handoff honor, a threshold a writer and a reader share, a ceiling code and tests both pin). A value that merely _equals_ another value stays co-located with its owner. `3` retries and `3` present-segments are not the same fact and must never share a name — tuning one must be incapable of changing the other.

Consequences:

- **No primitives layer.** No `QUORUMS`/`SCALES`/`DURATIONS_MS` aliasing. Every constant is named for what it _means_, grouped by the subsystem that owns it, with its code-truth source pinned in the comment. Shared only where the agreement is real (each case argued below).
- **Flat frozen exports**, matching the already-landed `src/config.js` shape (`DEFAULT_PROMPT_CEILING`, `resolve_prompt_budget_allocation`, memory caps). Extend that surface — do not create a second one.
- **Single-consumer tables stay home**: speech cadence tables, visual-style guidance presets, per-shot resolutions, narrative ratios. Moving them adds indirection with zero agreement payoff.
- **Byte-contract discipline**: prompt-shaping values feed byte-pinned contracts (prompts.test.js, prompt-contract gates, harness baseline). Every migration slice must end with harness 12/12 identical + 0 problems, or an explicit re-cut + re-pin if the change is intentional.

---

## Canonical constant list (code truth @5b106a0d)

### 1. Prompt context budgets (owner: compiler handoff — builder/history/entities/temporal)

```js
export const IMAGE_RESOLUTIONS = Object.freeze({
  LANDSCAPE: Object.freeze({ width: 768, height: 512 }), // 3:2 landscape aspect ratio optimized for environmental scene visuals (optics.js:48)
  PORTRAIT: Object.freeze({ width: 512, height: 768 }), // 2:3 portrait aspect ratio optimized for solo character portraits (optics.js:49-50)
  SQUARE_SMALL: Object.freeze({ width: 512, height: 512 }), // 1:1 square aspect ratio for avatar thumbnails and rapid preview cards
  SQUARE_LARGE: Object.freeze({ width: 768, height: 768 }), // 1:1 high-resolution square aspect ratio for ensemble multi-character cards (optics.js:51)
});

export const LATENCY_TIERS_MS = Object.freeze({
  TICK: 1000, // 1,000ms (1s): Initial retry backoff delay for network requests and diffusion generation (resilience.js:27 / visual.svelte.js:98)
  INTERACTION: 5000, // 5,000ms (5s): UI undo-delete toast window and background task preemption wait (Feed.svelte:194 / llm-gate.js:55)
  DELAY: 10000, // 10,000ms (10s): Maximum upper delay cap for exponential backoff retries (resilience.js:28 / visual.svelte.js:99)
  HEARTBEAT: 15000, // 15,000ms (15s): Watchdog evaluation interval checking engine heartbeat health (status.svelte.js:388)
  STEP: 30000, // 30,000ms (30s): Standard circuit breaker recovery probe timeout and prompt build vector budget (resilience.js:34 / builder.js:330)
  STALL: 60000, // 60,000ms (60s): Visual prompt extraction pass timeout and streaming stall watchdog grace (visual.svelte.js:249 / status.svelte.js:389-390)
  CEILING: 120000, // 120,000ms (2m): Hard timeout for text-to-image neural diffusion synthesis (visual.svelte.js:249/461/484/542/571)
  LIFETIME: 240000, // 240,000ms (4m): Hard maximum generation lifetime and background forge consolidation ceiling (status.svelte.js:391-392)
});

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

export const PATIENCE_POLICY = Object.freeze({
  SOFT_LIMIT: 2, // 2 strikes/attempts: visual cooldown rounds, and consecutive successful probes required to heal circuit breaker (resilience.js:33 / optics.js:122)
  HARD_LIMIT: 3, // 3 strikes/attempts: max retry attempts, failure trip threshold, max concurrent probes, and narrative attempts (resilience.js:26-35 / story.js:1065 / visual.svelte.js:97)
});

export const DYNAMICS_SCALE = Object.freeze({
  MIN: 1, // Lowest possible value on the 1-100 narrative tension and significance scale (dynamics.js:661)
  EXTREME_LOW: 15, // Collapse / isolation floor triggering automated emotional beats (dynamics.js:775)
  MID: 50, // Universal neutral equilibrium baseline for meters and new memory significance (normalizer.js:236/385)
  HIGH: 75, // High tension threshold triggering dramatic escalation, intimate framing, or Dutch angles (dynamics.js / style.js:184 / optics.js:149)
  EXTREME_HIGH: 85, // Climax / breakthrough ceiling triggering automated visual synthesis beats (dynamics.js:774)
  MAX: 100, // Absolute ceiling on the 1-100 narrative tension and significance scale (dynamics.js:661)
});

export const DYNAMICS_CALIBRATION = Object.freeze({
  DELTA_STANDARD: "±1-4", // Normal turn fluctuation guideline documented for LLM director in prompt (dynamics.js:661)
  DELTA_EXTREME: "±8-12", // High drama / crisis turn fluctuation guideline documented for LLM director in prompt (dynamics.js:661)
  BOUNDARY_CLIP: "5-95", // Safety buffer preventing ordinary turns from artificially slamming against scale endpoints (dynamics.js:661)
});

export const GRAVITY_RATE = 0.08; // Natural rate per turn at which unprovoked tension meters drift back toward MID 50 (dynamics.js:294/313)

export const EMOTIONAL_WEIGHT_SCALE = Object.freeze({ MIN: 1, MAX: 10, DEFAULT: 5 }); // 1-10 emotional salience scale for entry | w:N veil flags, default baseline 5 (temporal.js / profile-fields.js)
```

---

## Subsystem Domain Agreements (Cross-Module Compiler & Engine Handoffs)

```js
// ── 1. Prompt Context Budgets & Compiler Handoff (builder ↔ history ↔ entities ↔ temporal) ──
export const CHARS_PER_TOKEN = 3.35; // Calibrated empirical ratio (~3.35 chars/token) for prompt text budgeting (src/config.js:13)
export const CONTEXT_TOKEN_CLIFF = TEXT_TIERS_CHARS.NOVELLA; // 20,000 chars (~6,000 tokens): Hard inference server ceiling past which middle-truncation occurs (history.js:81)

// ── 2. Temporal Memory, Compaction & Retrieval (temporal ↔ embeddings ↔ builder) ──────────
export const PAST_ENTRIES = Object.freeze({ SESSION_CAP: 20, TOTAL_CAP: 180, ENTRY_MAX_CHARS: TEXT_TIERS_CHARS.SNIPPET }); // Pool bounds: max 20 session bracket entries, 180 total lifetime entries (45,000 chars), 250 chars per snippet entry (temporal.js:60-62)
export const COMPACTION = Object.freeze({ FANOUT: 8, MAX_HEIGHT: 5, SUMMARY_MAX_CHARS: TEXT_TIERS_CHARS.PARAGRAPH }); // Hierarchical prism geometry: 8 child entries per cluster node, max tree depth 5, 500 chars summary (temporal.js:80-86)
export const FRAGMENTATION = Object.freeze({ THRESHOLD: 70, WEIGHT_CUTOFF: 6 }); // Defrag trigger: fires at 70% fragmented, spares entries with emotional weight >= 6 (temporal.js:109/965)
export const PRESENT_MAX_CHARS = TEXT_TIERS_CHARS.PARAGRAPH; // 500 chars: Immediate physical/present state layer (temporal.js:64)
export const ETERNAL_MAX_CHARS = TEXT_TIERS_CHARS.PAGE; // 1,500 chars: Permanent identity facts in core entity profile layer (temporal.js:63)
export const TEMPORAL_SCORING = Object.freeze({
  SEMANTIC_GAIN: 3, // Multiplier scaling vector cosine similarity in hybrid memory scoring formula (temporal.js:68)
  RECENCY_FLOOR: 0.5, // Baseline recency weight floor preventing older vital entries from zeroing out (temporal.js:69)
  DECAY_SOFTEN: 0.5, // Damping factor softening exponential time decay of historical entries (temporal.js:70)
  IN_SCENE_SALIENCE_BOOST: 1.3, // 1.3x multiplier boosting entries involving entities currently co-present in active scene (temporal.js:71)
});
export const HYBRID_WEIGHTS = Object.freeze({
  ENTITY_OVERLAP: 3.0, // Weight for matching entities mentioned in the active round (temporal.js:74)
  LEXICAL_FREQUENCY: 1.0, // Weight for exact keyword matches between query and entry text (temporal.js:75)
  EMOTIONAL_SALIENCE: 0.4, // Weight factoring the entry's original emotional weight score (temporal.js:76)
  RECENCY: 1.2, // Weight factoring round distance and temporal decay (temporal.js:77)
});

// ── 3. Narrative Feed, Pacing & Story Chronology (history ↔ normalizer ↔ reflex) ──────────
export const DIALOGUE_WINDOW = Object.freeze({
  ROUNDS: 8, // 8 rounds of active conversational dialogue sliced into primary prompt context (~16 feed turns @ 2 turns/round) (history.js:57)
  MAX_CHARS: TEXT_TIERS_CHARS.PARAGRAPH, // 500 chars: Per-turn character ceiling in dialogue history window (history.js:58)
});

export const VISUAL_FEED_WINDOW = Object.freeze({
  ROUNDS: 1, // 1 round of immediate action context fed into visual prompt extraction pipeline (~2 feed turns) (history.js:397)
  MAX_CHARS: TEXT_TIERS_CHARS.SNIPPET, // 250 chars: Per-beat snippet ceiling forwarded into visual synthesis prompt (history.js:398)
});

export const SIMULATION_LOG_ROUNDS = 5; // 5 rounds of recent story history sliced for simulation logs & memory query retrieval (~10 feed turns) (builder.js:272 / history.js:466)
export const CHAPTER = Object.freeze({
  ARCHIVE_CAPACITY: 12, // Maximum number of closed chapters preserved in an entity's persistent DB history before pruning (normalizer.js:219)
  PROMPT_HISTORY_LIMIT: 6, // Maximum number of recent closed chapters rendered into prompt <CHAPTER_HISTORY> block (history.js:427)
});

export const ENTITY_SCHEMA = Object.freeze({
  NAME_MAX_CHARS: TEXT_TIERS_CHARS.LABEL, // 80 chars: Maximum string length for character, faction, or fractal entity names (normalizer.js:126)
  SUMMARY_MAX_CHARS: TEXT_TIERS_CHARS.SHORT, // 100 chars: Word-boundary truncation limit for compact entity summaries rendered in cast lists (entities.js:689)
});

export const STAGNATION = Object.freeze({
  SOFT_PERMIT_ROUNDS: 8, // 8 stagnant rounds: lifts anti-staging constraints, allowing proactive entity movement (reflex.js:68)
  HARD_MANDATE_ROUNDS: 16, // 16 stagnant rounds: forces external event, scene transit, or unexpected NPC arrival (reflex.js:70)
  DRIFT_CUTOFF: 0.15, // Semantic vector drift < 0.15 indicates conversation looping / narrative stall (reflex.js:70 & runtime.svelte.js:402)
});

export const SPENT_ROUNDS = 5; // Number of recent rounds scanned for repetitive prose and mannerisms (reflex.js:662)
export const MAX_SPENT_ITEMS = 8; // Maximum number of unique repetitive phrases injected into the negative prompt constraints (reflex.js:663)
export const OPENING_CLAUSE_MIN_CHARS = TEXT_TIERS_CHARS.TINY; // 15 chars: Minimum length required to flag a repetitive sentence opening clause (reflex.js:703/706)
export const SOMATIC_MARKER_CAP = 1; // Maximum physical cliché reaction markers permitted per turn before stripping (styles.js:142)
export const TRUNCATION_MIN_CHARS = TEXT_TIERS_CHARS.SLUG; // 40 chars: Minimum sentence character floor before missing terminal punctuation triggers truncation recovery (story.js:68)

// ── 4. Web Ingestion & Story Import (normalizer ↔ html ↔ director) ─────────────────────────
export const INGESTION = Object.freeze({
  WEB_CHARS: TEXT_TIERS_CHARS.STORY, // 8,000 chars: Maximum characters parsed from external web bio pages when importing characters (utils/html.js:27)
  LORE_CHARS: TEXT_TIERS_CHARS.NOVELETTE, // 10,000 chars: Maximum characters parsed from external web lore/wiki pages when importing world lore (utils/html.js:32)
});

// ── 5. Engine Dynamics & Director Staging (dynamics ↔ director ↔ optics) ───────────────────
export const SEISMIC_SHIFT_DISPLACEMENT = 60; // Cumulative displacement delta across all axes required to trigger an automated visual beat (dynamics.js:777)
export const ENTROPY_VARIANCE = 0.05; // Random atmospheric variance factor applied during turn dynamics progression (dynamics.js:316)
export const DIRECTOR_OUTPUT = Object.freeze({
  NOTE_LINES: 5, // Maximum number of lines permitted in the Director's staging guidance note (director.js:275)
  NOTE_CHARS: 500, // Hard character ceiling for the Director's staging guidance note (director.js:275)
  KEYWORDS_MAX: 5, // Maximum number of thematic staging keywords extracted per turn (director.js:389)
});

// ── 6. Hardware Tensors, Concurrency & UI Subsystems (embeddings ↔ llm-gate ↔ ui) ──────────
export const EMBEDDING_SPECS = Object.freeze({
  DIMENSIONS: 384, // Tensor dimensionality (384-d) for all-MiniLM-L6-v2 semantic sentence embeddings (embeddings.svelte.js:34)
  CACHE_CAPACITY: 1500, // Maximum number of 384-d tensor vectors held in the in-memory LRU vector cache (embeddings.svelte.js:37)
  QUANTIZE_MAX: 255, // 8-bit unsigned integer scalar ceiling (0-255) for quantized vector storage in IndexedDB (embeddings.svelte.js:76)
});

export const LLM_GATE_POLICY = Object.freeze({
  CONCURRENCY: 1, // Strict concurrency cap of 1 active turn executing on the inference pipe at a time (job-queue.js:21/57 & story.js)
  PRIORITY_FOREGROUND: 10, // Priority score 10: High priority granted to user-facing interactive narrative turns (llm-gate.js:29)
  PRIORITY_BACKGROUND: 1, // Priority score 1: Low priority granted to background tasks like Caretaker consolidation (llm-gate.js:29)
});
```

### 9. Explicitly NOT centralized (stay co-located)

- **`SETTLED_FACT_LIMIT: 12` & `SETTLED_FACT_TRUNCATE_CHARS: 260`** (`temporal.js:89` / `entities.js:689`): Internal extraction advisory prompt limits for the Caretaker background pass.
- **`DEDUP_OVERLAP_THRESHOLD: 0.6`** (`temporal.js:506`): Internal word-overlap Jaccard cutoff for detecting redundant candidate memories.
- **Audio pipeline buffers** (`audio.svelte.js`): `TTS_PREGEN_SENTENCES = 3`, `TTS_CACHE_CAPACITY = 64`, `SFX_MANIFEST_MAX_BYTES = 65536` — internal audio synthesis parameters.
- **Telemetry & viewport buffers**: `FEED_SCROLL_SLACK_PX = 40` (`Feed.svelte`), `DEV_LOG_MAX_ENTRIES = 500` (`log.svelte.js`), `DIRECTOR_LATENCY_POOL_CAP = 50` (`runtime.svelte.js`).
- **`STABILITY_LADDER`** (`{at: 1, level: "WARNING"}`, `{at: 3, level: "CRITICAL"}` in `reflex.js:54`): Single-consumer error escalation table owned exclusively by `reflex.js`. (Note: its critical threshold of 3 directly mirrors `PATIENCE_POLICY.HARD_LIMIT`).
- **`PACING_RULES`** (`EXPANSIVE: {chars: 300, words: 60}`, `TERSE: {chars: 40, words: 8}` in `reflex.js:51-52`): Single-consumer input pacing classifier owned entirely by `reflex.js`.
- **`INPUT_SIZE_TIERS`** (`TINY: 12`, `SMALL: 90`, `MEDIUM: 400` in `reflex.js:58-63`): Single-consumer beat clamp table owned entirely by `reflex.js`.
- **Speech cadence tables + typography gains** (`speech.js` — single consumer; earlier draft also renamed keys `measured→deliberate` and changed 0.95→0.92 against code truth and test pins — do not touch).
  Rate clamp is one concept — `SPEECH_RATE = {MIN: 0.5, NORMAL: 1.0, MAX: 2.0}` (`speech.js:152`) plus
  `SLOPE_ANCHOR = 50` / `SLOPE_PER_POINT = 0.001` as its slope pair. Cadence table itself stays home.
- **Visual-style guidance presets** 7/8/9 + per-style deviations (`visual-styles.js` data, not tuning). One real agreement inside: `optics.js:92` restates tier defaults 7/9 — point optics at the style table or a shared `OPTICS_TIER_DEFAULTS`, that's the only move.
- **Per-shot resolutions** (`optics.js:48-51`) + `MIN_PROMPT_LENGTH` 10 + candidate counts — diffusion call-site data.
- **Narrative `internal_ratio` 0.5 + fallback** (`narrative-styles.js`) — style DNA, not a tunable.
- **Sheets `40`-char inline threshold** (`sheets.js` — serializer internals).
- **`clean_text` default limit 500** (`utils/text.js` — function default, not a contract).
- **Design tokens, CSS timings, PNG/RFC constants, Dexie versions, lore stats** — already excluded, stay excluded.

---

## Dimensional Cross-Reference Index (By Unit & Context)

To evaluate values in context against peers of the same physical unit:

### ⏱️ Time & Durations (`_MS`)

| Constant                       | Value            | Plain English Meaning                                                     |
| :----------------------------- | :--------------- | :------------------------------------------------------------------------ |
| `LATENCY_TIERS_MS.TICK`        | `1,000ms (1s)`   | Initial retry backoff delay for network requests and diffusion generation |
| `LATENCY_TIERS_MS.INTERACTION` | `5,000ms (5s)`   | User interaction undo toast window and background task preemption wait    |
| `LATENCY_TIERS_MS.DELAY`       | `10,000ms (10s)` | Maximum exponential backoff retry ceiling for network requests            |
| `LATENCY_TIERS_MS.HEARTBEAT`   | `15,000ms (15s)` | Watchdog evaluation heartbeat interval checking engine health             |
| `LATENCY_TIERS_MS.STEP`        | `30,000ms (30s)` | Standard probe timeout in circuit breaker & prompt vector build budget    |
| `LATENCY_TIERS_MS.STALL`       | `60,000ms (60s)` | Visual extraction pass timeout and streaming stall watchdog grace         |
| `LATENCY_TIERS_MS.CEILING`     | `120,000ms (2m)` | Hard timeout for text-to-image neural diffusion synthesis                 |
| `LATENCY_TIERS_MS.LIFETIME`    | `240,000ms (4m)` | Hard maximum lifetime for generation and background forge consolidation   |

### 🔤 Characters (`_CHARS` / `TEXT_TIERS_CHARS`)

| Constant                       | Standard Tier | Value          | Plain English Meaning                                                                              |
| :----------------------------- | :------------ | :------------- | :------------------------------------------------------------------------------------------------- |
| `OPENING_CLAUSE_MIN.chars`     | `TINY`        | `15 chars`     | Minimum clause length to flag a repetitive sentence start                                          |
| `TRUNCATION_MIN_CHARS`         | `SLUG`        | `40 chars`     | Minimum prose length before missing terminal punctuation is repaired                               |
| `INPUT_PACING.TERSE`           | `SLUG`        | `40 chars`     | User input length floor triggering terse, clipped dialogue response (1 beat)                       |
| `NAME_MAX_CHARS`               | `LABEL`       | `80 chars`     | Maximum string length for entity names & chapter titles                                            |
| `ENTITY_SUMMARY_MAX_CHARS`     | `SHORT`       | `100 chars`    | Truncation limit for compact entity summaries rendered in cast lists                               |
| `INPUT_PACING.STANDARD`        | `SNIPPET`     | `250 chars`    | Standard conversational input threshold prompting 2-3 narrative beats                              |
| `PAST_ENTRIES.ENTRY_MAX_CHARS` | `SNIPPET`     | `250 chars`    | Hard character ceiling per bracket entry in past layer & prompt chapter summary                    |
| `VISUAL_FEED_WINDOW.MAX_CHARS` | `SNIPPET`     | `250 chars`    | Character ceiling for narrative snippets forwarded into visual prompt                              |
| `NEARBY_CAST_MIN_CHARS`        | `SNIPPET`     | `250 chars`    | Minimum floor preserved when dynamically slicing nearby cast                                       |
| `INPUT_PACING.EXPANSIVE`       | `PARAGRAPH`   | `500 chars`    | User input length triggering expansive, multi-beat narrative response                              |
| `DIALOGUE_WINDOW.MAX_CHARS`    | `PARAGRAPH`   | `500 chars`    | Per-turn character ceiling in dialogue history window                                              |
| `PRESENT_MAX_CHARS`            | `PARAGRAPH`   | `500 chars`    | Character ceiling for immediate physical/present state layer                                       |
| `DIRECTOR_OUTPUT.NOTE_CHARS`   | `PARAGRAPH`   | `500 chars`    | Hard character ceiling for the Director's staging guidance note                                    |
| `COMPACTION.SUMMARY_MAX_CHARS` | `PARAGRAPH`   | `500 chars`    | Character budget for consolidated hierarchical memory cluster summary                              |
| `CHAPTER.SUMMARY_MAX_CHARS`    | `PARAGRAPH`   | `500 chars`    | Character ceiling for closed chapter story summaries & standing agendas in DB                      |
| `ETERNAL_MAX_CHARS`            | `PAGE`        | `1,500 chars`  | Character ceiling for permanent identity facts in eternal entity profile                           |
| `GENERATION_HEADROOM_CHARS`    | `PAGE`        | `1,500 chars`  | Reserved character buffer (~450 tokens) for LLM output (reasoning + prose)                         |
| `HISTORY_MAX_CHARS`            | `CHAPTER`     | `5,000 chars`  | Ceiling for dialogue history transcript block (~10 turns @ 500 chars)                              |
| `INGESTION.WEB_CHARS`          | `STORY`       | `8,000 chars`  | Maximum characters parsed from external web bio pages when importing characters                    |
| `INGESTION.LORE_CHARS`         | `NOVELETTE`   | `10,000 chars` | Maximum characters parsed from external web lore/wiki pages when importing world lore              |
| `CONTEXT_CLIFF_CHARS`          | `NOVELLA`     | `20,000 chars` | Hard platform context envelope ceiling (~6,000 tokens @ 3.35 chars/token)                          |
| `LIFETIME_MEMORIES_MAX_CHARS`  | `ARCHIVE`     | `45,000 chars` | Maximum text footprint for an entity's lifetime past memory layer in DB (180 brackets × 250 chars) |

### 🪙 Tokens (`_TOKENS`)

| Constant              | Value            | Plain English Meaning                                                         |
| :-------------------- | :--------------- | :---------------------------------------------------------------------------- |
| `CHARS_PER_TOKEN`     | `3.35 chars/tok` | Calibrated empirical ratio for estimating tokenization length from characters |
| `CONTEXT_TOKEN_CLIFF` | `6,000 tokens`   | Hard inference server token ceiling past which middle-truncation occurs       |

### 🔄 Story Chronology & Narrative Pacing (`_ROUNDS`)

| Constant                         | Value       | Plain English Meaning                                                              |
| :------------------------------- | :---------- | :--------------------------------------------------------------------------------- |
| `VISUAL_FEED_WINDOW.ROUNDS`      | `1 round`   | Recent action context fed into visual prompt extraction (~2 feed turns)            |
| `IMAGE_TRIGGER_COOLDOWN_ROUNDS`  | `3 rounds`  | Minimum rounds between automatic scene image generations (standard & dynamic)      |
| `SPENT_ROUNDS`                   | `5 rounds`  | Recent rounds inspected for repetitive phrases and mannerisms                      |
| `SIMULATION_LOG_ROUNDS`          | `5 rounds`  | Recent story history sliced for simulation logs & query retrieval (~10 feed turns) |
| `STAGNATION.SOFT_PERMIT_ROUNDS`  | `8 rounds`  | Rounds without narrative progress before anti-staging restrictions are lifted      |
| `DIALOGUE_WINDOW.ROUNDS`         | `8 rounds`  | Recent conversational dialogue sliced into primary prompt context (~16 feed turns) |
| `STAGNATION.HARD_MANDATE_ROUNDS` | `16 rounds` | Rounds without narrative progress before external scene shift or NPC is forced     |

### 🔢 Items, Counts, Quotas & Hardware Limits

| Constant                       | Value            | Plain English Meaning                                                           |
| :----------------------------- | :--------------- | :------------------------------------------------------------------------------ |
| `SOMATIC_MARKER_CAP`           | `1 reaction`     | Max physical cliché reaction tropes permitted per turn before stripping         |
| `LLM_GATE_POLICY.CONCURRENCY`  | `1 worker`       | Strict concurrency cap of 1 active turn on the inference engine                 |
| `PATIENCE_POLICY.SOFT_LIMIT`   | `2 probes`       | Consecutive successful network/probe responses required to heal circuit breaker |
| `PATIENCE_POLICY.HARD_LIMIT`   | `3 strikes`      | Consecutive failure threshold to trip circuit breaker & max retry attempts      |
| `DIRECTOR_OUTPUT.KEYWORDS_MAX` | `5 keywords`     | Max thematic staging keywords extracted per turn                                |
| `MAX_SPENT_ITEMS`              | `8 phrases`      | Max unique exhausted phrases injected into negative prompt constraints          |
| `DIRECTOR_LATENCY_POOL_CAP`    | `50 records`     | Rolling history buffer size of Director execution timings (ms)                  |
| `TTS_CACHE_CAPACITY`           | `64 audio clips` | Maximum synthesized audio clips held in memory cache                            |
| `DEV_LOG_MAX_ENTRIES`          | `500 records`    | Max debug log events preserved in developer mode HUD buffer                     |
| `QUANTIZE_MAX`                 | `255 scalar`     | 8-bit unsigned scalar ceiling (0-255) for compact vector storage                |
| `EMBEDDING_SPECS.DIMENSIONS`   | `384 dims`       | Dimensionality of all-MiniLM-L6-v2 vector embeddings                            |
| `CACHE_CAPACITY`               | `1,500 tensors`  | In-memory LRU cache capacity for 384-d vector tensors                           |
| `SFX_MANIFEST_MAX_BYTES`       | `65,536 bytes`   | 64 KB safety ceiling for sound effects manifest loading                         |

---

## Corrections to the earlier draft (all verified vs src/ @5b106a0d)

1. `TAG_MAX_CHARS: 30` → `TAG_COUNT_MAX = 30` (array slice, not string length — legacy card-conversion artifact scheduled for P4 pruning).
2. Cadence keys/values reverted to code truth (`measured` 0.95, `standard` — no `deliberate`/`steady`, no 0.92).
3. Dropped invented values with no catalog source: drama `LOW: 25`, `VOLUME.mid 0.5`, `SQUARE_SMALL` avatar resolution.
4. Added missing `DYNAMICS_COOLDOWN_ROUNDS: 3` (was in catalog §6, lost in the proposal).
5. Five `1500`s resolved: the four `format_hybrid`/`whole_vector_slice` defaults share `HYBRID_FORMAT_MAX_CHARS`; `ETERNAL_MAX_CHARS` stands alone.
6. Report conflict adjudicated: temporal.js:68-69 confirms GAIN 3 / FLOOR 0.5 — the repo-root report's formula needs the correction, not the code.
7. `PRESENT_MAX_SEGMENTS: 3` harmonized to character domain as `PRESENT_MAX_CHARS = 500` (mirroring `ETERNAL_MAX_CHARS`). Unified bracket-boundary truncation logged to ROADMAP.md.

---

## Redundant Alias Elimination Map (How Middlemen Are Made Redundant)

During migration, all redundant alias constants and wrapper objects are eliminated in favor of direct consumer imports from canonical scales. This table tracks every obsolete middleman and its direct replacement:

| Obsolete Middleman Alias                                     | Old Source Location                 | Canonical Truth To Import Directly                                        | Direct Consumer Destination                  |
| :----------------------------------------------------------- | :---------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------- |
| `IMAGE_TRIGGER.BAND_HIGH`                                    | `optics.js:154` / `dynamics.js:777` | `DYNAMICS_SCALE.EXTREME_HIGH` (85)                                        | `optics.js` & `dynamics.js`                  |
| `IMAGE_TRIGGER.BAND_LOW`                                     | `optics.js:155` / `dynamics.js:778` | `DYNAMICS_SCALE.EXTREME_LOW` (15)                                         | `optics.js` & `dynamics.js`                  |
| `IMAGE_TRIGGER.DISPLACEMENT_THRESHOLD`                       | `optics.js:156` / `dynamics.js:779` | `SEISMIC_SHIFT_DISPLACEMENT` (60)                                         | `optics.js` & `dynamics.js`                  |
| `IMAGE_TRIGGER.COOLDOWN_ROUNDS` & `DYNAMICS_COOLDOWN_ROUNDS` | `optics.js:122-123`                 | `IMAGE_TRIGGER_COOLDOWN_ROUNDS` (3 rounds)                                | Unified single cooldown check in `optics.js` |
| `WATCHDOG_POLICY.INTERVAL_MS`                                | `status.svelte.js:388`              | `LATENCY_TIERS_MS.HEARTBEAT` (15,000ms)                                   | `status.svelte.js`                           |
| `WATCHDOG_POLICY.IDLE_GRACE_MS`                              | `status.svelte.js:389`              | `LATENCY_TIERS_MS.STALL` (60,000ms)                                       | `status.svelte.js`                           |
| `WATCHDOG_POLICY.CHUNK_STALL_MS`                             | `status.svelte.js:390`              | `LATENCY_TIERS_MS.STALL` (60,000ms)                                       | `status.svelte.js`                           |
| `WATCHDOG_POLICY.CONSOLIDATE_GRACE_MS`                       | `status.svelte.js:392`              | `LATENCY_TIERS_MS.LIFETIME` (240,000ms)                                   | `status.svelte.js`                           |
| `WATCHDOG_POLICY.MAX_LIFETIME_MS`                            | `status.svelte.js:391`              | `LATENCY_TIERS_MS.LIFETIME` (240,000ms)                                   | `status.svelte.js`                           |
| `NETWORK_RESILIENCE.RETRY.*`                                 | `resilience.js:26-28`               | `PATIENCE_POLICY.HARD_LIMIT`, `LATENCY_TIERS_MS.TICK` & `DELAY`           | `resilience.js`                              |
| `NETWORK_RESILIENCE.CIRCUIT_BREAKER.*`                       | `resilience.js:32-35`               | `PATIENCE_POLICY.HARD_LIMIT` / `SOFT_LIMIT`, `LATENCY_TIERS_MS.STEP`      | `resilience.js`                              |
| `VISUAL_ENGINE_RETRY.*`                                      | `visual.svelte.js:97-99/249`        | `PATIENCE_POLICY.HARD_LIMIT`, `LATENCY_TIERS_MS.TICK`, `DELAY`, `CEILING` | `visual.svelte.js`                           |
| `PRE_EMBED_BUILD_MS`                                         | `builder.js:330`                    | `LATENCY_TIERS_MS.STEP` (30,000ms)                                        | `builder.js`                                 |
| `FORGE_EMBED_BUDGET_MS`                                      | `temporal.js:65`                    | `LATENCY_TIERS_MS.STALL` (60,000ms)                                       | `temporal.js`                                |
| `LLM_EXTRACTION_TIMEOUT_MS`                                  | `visual.svelte.js:249`              | `LATENCY_TIERS_MS.STALL` (60,000ms)                                       | `visual.svelte.js`                           |
| `FEED_UNDO_DELETE_MS`                                        | `Feed.svelte:194`                   | `LATENCY_TIERS_MS.INTERACTION` (5,000ms)                                  | `Feed.svelte`                                |
| `PREEMPT_TIMEOUT_MS`                                         | `llm-gate.js:55`                    | `LATENCY_TIERS_MS.INTERACTION` (5,000ms)                                  | `llm-gate.js`                                |
| `STORY_LLM_MAX_ATTEMPTS`                                     | `story.js:1065`                     | `PATIENCE_POLICY.HARD_LIMIT` (3 attempts)                                 | `story.js`                                   |

---

## Migration (one organism per commit, P4-style)

1. §2 scoring + weights (highest prompt-byte risk — harness gate mandatory, expect identical).
2. §1 budgets + §5 windows (compiler handoff; reconcile with landed `resolve_prompt_budget_allocation`).
3. §3 trigger gate + HIGH_DRAMA (wire optics/style readers, confirm F6 behavior unchanged).
4. §4 stagnation (wire runtime + reflex to one DRIFT_CUTOFF).
5. §6/§7/§8 leftovers + mirror deletions (each consumer rewired in the same commit, zero dangling refs).
6. Correction note to `state-of-the-application-investigation.md` (gain/floor formula).
