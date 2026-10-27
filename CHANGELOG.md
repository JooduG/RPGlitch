# Changelog

All notable changes to **RPGlitch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## `[Unreleased]`

- **Promoted Configuration Surface Harmonization & Backwards-Compatibility Purge (`src/config.js`, `src/state/`)**:
  - **Zero Backwards-Compatibility Purge**: In accordance with Core Engine Law P4, completely purged all shim re-exports (`DIRECTOR_MS_POOL_CAP`, `MAX_DEVELOPER_LOG_ENTRIES`, `FREEZE_WATCHDOG_*`).
  - **Direct Consumer Wiring**: Updated downstream consumers across `src/state/runtime.svelte.js`, `src/state/log.svelte.js`, `src/state/log.test.js`, and `src/state/status.test.js` to import directly from `TELEMETRY_CAPS` (`DIRECTOR_LATENCY_POOL`, `DEVELOPER_LOG_ENTRIES`) and `WATCHDOG_POLICY` in `@config`.
  - **Promoted Baseline Dynamics**: Promoted `DEFAULT_AI_DYNAMICS` (4-axis somatic) and `DEFAULT_FRACTAL_DYNAMICS` (2-axis environmental) to `src/config.js`, anchoring default baselines to `DYNAMICS_SCALE.MID` (50) and eliminating duplicated fallback definitions in `runtime.svelte.js`.
  - **Unified Image Regeneration Pipeline**: Extracted the duplicate 55-line prompt-refinement, JSON-peeling safety net, `visual_engine.generate_candidates`, and candidate delivery logic from `App.svelte` and `ImagePicker.svelte` into a single canonical `run_image_regeneration` function in `src/ui/image/ImagePicker.svelte.js`.
  - **Deduplicated Portalled Context Menus**: Extracted reusable `src/ui/entity/ContextMenu.svelte` handling portalled body mounting, fixed z-9999 stacking, viewport-clamped positioning, and outside-click/escape dismissal. Replaced duplicate context menu DOM and logic across `EntityCard.svelte` and `Message.svelte`.
  - **Streaming State Mutex Guard in `run_mock`**: Kept `simulation_state` active throughout word streaming in `App.svelte:run_mock` and wrapped stream termination and simulation completion in a `finally` block to prevent mid-stream re-triggers and UI unlocking.
  - **Runtime Character Legacy Property Deprecation**: Reduced `runtime.character` in `src/state/runtime.svelte.js` to a clean 1-line getter pointing to `runtime.active_user` and removed redundant character mutation branches in `save_entity`.
  - **Git Mirror Comments Purged**: Stripped all bottom-of-file historical `CHANGELOG` comment blocks across `src/state/` (`status.svelte.js`, `log.svelte.js`, `interface.svelte.js`, `chrono.svelte.js`, `index.js`, `runtime.test.js`, `runtime.svelte.js`) and touched `src/ui/` files.

- **Dead Execution Code Purge & Persistence Hardening (`src/intelligence/`, `src/media/`, `src/data/`)**:
  - **Dead Intelligence Functions Purged**: Deleted dead `eternal_field_dedup` from `temporal.js`, purged dead `strip_relational_brackets` from `veil.js`, and eliminated the redundant 30-line entity sanitization loop and unused import in `story.js` (`execute_ghostwriter`), as `sheets.js` already guarantees owner perspective isolation across the Epistemic Wall.
  - **Aesthetic Trait Flattening Deduplicated**: Extracted single pure `flatten_aesthetic_map(entity)` in `src/intelligence/modules/style.js` and updated `render_optics_fallback` and `aesthetic_resolver.flatten` in `src/media/optics.js` to delegate directly to it, adhering to the Single Implementation Rule.
  - **Ledger Genesis Bracket Replay Bug Fixed**: Updated `replay_entity_field` in `src/data/ledger.js` to parse bracket directives from `entry.new_value` when `key: null` (Genesis/sorter batch writes), ensuring subsequent single-key updates never erase un-mutated Genesis brackets. Normalized story ID queries in `query_story_snapshot` to match both string and numeric IDs.
  - **Deep Clone Reactivity Modernization**: Replaced legacy `JSON.parse(JSON.stringify(...))` deep clones with `structuredClone(...)` and `$state.snapshot(...)` in `src/data/repository.js`, `src/data/sessions.svelte.js`, and `src/state/runtime.svelte.js`.
  - **Clean Code & Git Mirror Purge**: Removed all bottom-of-file historical `CHANGELOG` comment blocks and kept top headers under 10 lines across touched files, yielding a net deletion of 288 lines of code.

- **Direct Prompt Compilation & Slot-Resolver Maze Collapse (`src/intelligence/prompts.js`, `builder.js`, `modules/`)**:
  - **Slot-Resolver Indirection Demolished**: Deleted `SYSTEM_SLOT_RESOLVERS`, `SYSTEM_STATE_KEYS`, `PROMPT_META_RESOLVERS`, `resolve_meta_args`, `resolve_prompt_plan`, and `render_prompt_plan` in `src/intelligence/prompts.js`. Prompt assembly is now direct, flat, and linear from top to bottom.
  - **Dead Module Wrappers Purged**: Deleted redundant `resolve_*_slot` wrapper functions across `src/intelligence/modules/` (`resolve_constitution_slot` in `constitution.js`, `resolve_core_protocols_slot` in `protocols.js`, `resolve_role_slot` in `system.js`, `resolve_entities_slot`, `resolve_target_context_slot`, `resolve_cast_slot`, `resolve_memory_advisory_slot`, and `resolve_entity_context_slot` in `entities.js`, `resolve_history_slot` and `resolve_chapter_history_slot` in `recency.js`, and `resolve_dynamic_axes_slot` in `dynamics.js`).
  - **Unified Prose/NPC Mode Builder**: Merged `normalize_prose_context` and `normalize_npc_context` into a single, clean `build_prose_mode(config, context)` in `src/intelligence/builder.js`.
  - **Byte-Identical Output**: Compiled prompt outputs across all 12 contract modes in `prompt-verification.test.js` and `prompt-contract.test.js` remain 100% byte-identical.
  - **Net-Negative Footprint**: Achieved 240 net lines deleted across `src/intelligence/` with all bottom-of-file changelog comment blocks and bloated headers removed.

- **Intelligence Pipeline Flattening & Plan/Catalog Indirection Purge (`src/intelligence/`, `src/utils/`, `src/data/`)**:
  - **Aggressive Intelligence Modules Flattening**: Eliminated intermediate plan object allocations across `src/intelligence/modules/` (`constitution.js`, `output.js`, `system.js`, `recency.js`, `reflex.js`, `protocols.js`, `entities.js`, `task.js`), collapsing redundant `resolve_*_plan()` -> `render_*_plan()` -> `render_*()` chains into direct string builders while preserving 100% byte-identical compiled prompt outputs across all 12 contract modes.
  - **Catalog Deletion & Direct Property Path Traversal**: Deleted `src/utils/catalog.js` and `src/utils/catalog.test.js`. Inlined `interpolate_tokens` into `src/utils/xml.js` and replaced `resolve_catalog_atom` with direct property traversal.
  - **Round-Trip Data Point Purge in Context Builder**: Eliminated unnecessary `to_data_points` round-tripping for raw entity eternal and present fields in `src/intelligence/builder.js`, reading fields directly while preserving nascent default strings for empty entities.
  - **Bracket Bond Deduplication & Bug Fix**: Extracted universal `has_bracket_bond(entity, target_identifier_or_entity)` helper to `src/utils/text.js`, unifying bracket relation resolution across `src/intelligence/builder.js` and `src/data/sessions.svelte.js`. Fixed bug in `create_from_selection` where `@id` bracket references were missed when comparing against names.
  - **Git Mirror Comments Purge**: Removed bottom-of-file historical `CHANGELOG` comment blocks across all touched files, yielding a net deletion of 900 lines of code.

- **Repository Housekeeping & Simulation Audit Alignment (`simulation-audit.js`, `simulation-audit.test.js`, `sync:ignores`)**:
  - Reconciled all workspace ignore layers across `.gitignore`, `.eslintcache`, `.markdownlintignore`, `.prettierignore`, `.stylelintignore`, and VS Code / Vitest configurations via `npm run sync:ignores`.
  - Audited environment secrets and verified that `.env` is securely ignored with zero leaked secrets in tracked templates.
  - Aligned the simulation audit test suite with the semantic `<ENTRY round="..." origin="...">` tag protocol in `simulation-audit.js` and `simulation-audit.test.js`. Verified 100% passing tests across `npm run audit:simulation` (5/5 tests green) and full unit test suite (72 test files, 1,451 tests green).

- **Dynamic Prompt Resource Allocation & Unified Entity RAG Engine (`src/config.js`, `src/intelligence/`, `prompts.js`, `recency.js`, `prompt-contract.test.js`)**:
  - **Dynamic Turn Headroom Metering (`src/intelligence/prompts.js`)**: Replaced static 8k entity slicing with dynamic turn headroom metering. Prompt compiler calculates exact serialized length of guaranteed supportive modules (`role`, `axiomatic_constitution`, `core_protocols`, `dynamic_axes`, `task`, `recency`), deriving dynamic headroom `headroom = Math.max(0, PROMPT_CHAR_ENVELOPE - fixed_footprint)` (with `PROMPT_CHAR_ENVELOPE = 20000`) and allocating it directly to entity sheet generation.
  - **Rebranded Recency Module & Semantic Tagging (`src/intelligence/modules/recency.js`, `recency.test.js`)**: Rebranded `history.js` to `recency.js` under P4 Pre-Beta Purity with zero backward-compatibility wrappers. Renamed dialogue turn elements from `<ACTION>` to `<ENTRY round="..." origin="...">` inside `<RECENT_ROUNDS>` blocks. Director deduplication preserves history inside `<TASK>` without redundant `<RECENT_ROUNDS>` in root system envelope.
  - **Universal 4-Quadrant RAG Allocation Topologies (`src/config.js`, `ENTITY_GUARANTEES`)**: Implemented `ENTITY_GUARANTEES` specifying `ASYMMETRIC` (speaker 1200c / listener 800c / fractal 600c / future 200c) and `SYMMETRICAL` (actors 900c / fractal 600c / future 200c) baseline quotas across `ETERNAL_NON_PHYSICAL`, `ETERNAL_PHYSICAL`, `PRESENT_NON_PHYSICAL`, and `PRESENT_PHYSICAL`. Past quadrant is 100% RAG-scored and dynamic.
  - **Symmetrical Relational Sovereignty (`src/intelligence/modules/constitution.js`)**: Updated Constitution Law L3 to universally relational phrasing (_"Never puppeteer the listener or other participants"_).
  - **Prompt Contract Re-Pinning (`prompt-contract.test.js`)**: Re-pinned byte contracts for all 12 prompt modes (`director: 6491`, `director_terse: 1459`, `interaction: 8208`, `ghostwrite: 7581`, `npc: 8938`, `narrator: 7822`, `narrator_prologue: 7850`, `narrator_epilogue: 7785`, `continuum: 4746`, `enhancement: 1669`, `sorting: 4193`, `optics: 5394`) following harmonization of «ACTION» to «ENTRY» and «HISTORY» to «RECENT_ROUNDS». All 72 Vitest suites (1,451 unit tests) pass 100% green.

- **Repository Hygiene & P4 Purges (`src/lib/vitest-examples/`)**:
  - Purged obsolete starter template scaffolding (`Welcome.svelte`, `Welcome.svelte.spec.js`, `greet.js`, `greet.spec.js`) from `src/lib/vitest-examples/`, eliminating orphaned test files and IDE type-checking warnings.

- **Canonical System Configuration Harmonization (`src/config.js`, `@config`, `config.md`)**:
  - **Literary Scale & Tier Standardization (`src/config.js`, `TEXT_TIERS_CHARS`)**: Established canonical character scale (`TINY: 15`, `SLUG: 40`, `LABEL: 80`, `SHORT: 100`, `SNIPPET: 250`, `PARAGRAPH: 500`, `PAGE: 1500`, `CHAPTER: 5000`, `STORY: 8000`, `NOVELETTE: 10000`, `NOVELLA: 20000`, `ARCHIVE: 45000`, `LIBRARY: 100000`), standardized `LATENCY_TIERS_MS` (TICK to LIFETIME), `PATIENCE_POLICY` (2 soft / 3 hard), and universal `DYNAMICS_SCALE` (1-100). Purged obsolete static token budget allocation helpers in favor of dynamic runtime character headroom under P4 Pre-Beta Purity.
  - **Temporal Memory Hardening (`src/intelligence/temporal.js`, `temporal.test.js`)**: Replaced magic numbers with canonical constants from `@config` (`PAST_ENTRIES.SESSION_CAP = 20`, `PAST_ENTRIES.TOTAL_CAP = 180`, `ENTRY_MAX_CHARS = 250`, `COMPACTION.FANOUT = 8`, `SUMMARY_MAX_CHARS = 500`, `PRESENT_MAX_CHARS = 500`, `ETERNAL_MAX_CHARS = 1500`, `TEMPORAL_SCORING`, `HYBRID_WEIGHTS`). All 82 unit tests 100% green.
  - **Narrative Chronology & Window Calibration (`src/intelligence/modules/history.js`, `history.test.js`)**: Replaced magic numbers with `DIALOGUE_WINDOW` (`ROUNDS: 8`, `MAX_CHARS: 500`), `VISUAL_FEED_WINDOW` (`ROUNDS: 1`, `MAX_CHARS: 250`), `CHAPTER` (`ARCHIVE_CAPACITY: 12`, `PROMPT_HISTORY_LIMIT: 6`), and wired `CONTEXT_TOKEN_CLIFF` (6000 tokens) and `CONTEXT_CLIFF_CHARS` (20000 chars).
  - **Pacing Contracts & Repetitive Prose Stagnation (`src/intelligence/modules/reflex.js`, `reflex.test.js`)**: Wired `MOMENTUM_TIERS` to `STAGNATION` (`SOFT_PERMIT_ROUNDS: 8`, `HARD_MANDATE_ROUNDS: 16`, `DRIFT_CUTOFF: 0.15`), `DEFAULT_SPENT_WINDOW = SPENT_ROUNDS` (5), `MAX_SPENT_ITEMS = 8`, and standardized opening clause repetitive extraction to a strict 15-character floor (`OPENING_CLAUSE_MIN_CHARS: TEXT_TIERS_CHARS.TINY`) without word-count constraints.
  - **Entity Normalization Capping (`src/data/normalizer.js`, `normalizer.test.js`)**: Wired entity name truncation to strict 80 characters (`ENTITY_SCHEMA.NAME_MAX_CHARS: TEXT_TIERS_CHARS.LABEL`), chapter archive capacity to `CHAPTER.ARCHIVE_CAPACITY` (12), and chapter title/summary/agenda bounds to canonical tiers (`LABEL: 80`, `SLUG: 40`, `PARAGRAPH: 500`).
  - **Unified Cooldown Arbitration & Dynamics Gate (`src/intelligence/dynamics.js`, `src/media/optics.js`, `optics.test.js`, `src/intelligence/temporal.js`, `temporal.test.js`)**: Unified image generation cooldown to a single 3-round constant (`IMAGE_TRIGGER_COOLDOWN_ROUNDS = 3`) evaluated via a single helper function in `optics.js` (evaluating 1 message = 1 round count for cooldowns). Wired dynamics gate extreme bands to `DYNAMICS_SCALE.EXTREME_HIGH` (85), `EXTREME_LOW` (15), `SEISMIC_SHIFT_DISPLACEMENT` to `DYNAMICS_SCALE.MID` (50), and `FRAGMENTATION.THRESHOLD` to `DYNAMICS_SCALE.HIGH` (75).
  - **Backlog Items 1–4 Execution & P4 Realignment (`src/intelligence/modules/reflex.js`, `src/utils/text.js`, `src/intelligence/temporal.js`, `src/intelligence/modules/entities.js`, `src/media/optics.js`, `src/utils/styles.js`, `src/platform/embeddings.svelte.js`, `src/platform/llm-gate.js`)**:
    - **Item 1 (Reflex Pacing & Character Purity)**: Wired `INPUT_PACING` (`TERSE: 40`, `STANDARD: 250`, `EXPANSIVE: 500`) into `reflex.js`, purged legacy `words` count from `PACING_RULES` and `classify_pacing`, and updated `INPUT_SIZE_TIERS` to strict character thresholds (`TINY: 15`, `SMALL: 40`, `MEDIUM: 250`, `EXPANSIVE: Infinity`).
    - **Item 2 (Universal Boundary Truncation)**: Implemented `truncate_at_boundary` in `src/utils/text.js` protecting pseudo-JSON brackets against mid-tag word-splitting by cleanly clipping at the last intact `]` before the limit; wired into `cap_present_prose` in `src/intelligence/temporal.js`.
    - **Item 3 (Cast Summaries Harmonization)**: Wired `ENTITY_SCHEMA.SUMMARY_MAX_CHARS` (100) into `summarize_entity` in `src/intelligence/modules/entities.js`, eliminating the 100 vs 120 character disparity.
    - **Item 4 (Subsystem Config Integration)**: Wired phantom config records from `src/config.js` into their respective subsystems: `IMAGE_RESOLUTIONS` in `src/media/optics.js`, `SOMATIC_MARKER_CAP` in `src/utils/styles.js`, `EMBEDDING_SPECS` in `src/platform/embeddings.svelte.js`, and `LLM_GATE_POLICY` in `src/platform/llm-gate.js`. Verified 0 errors across 1,454 unit tests and `svelte-check`.
  - **LLM Gate & Job Queue Simplification (`src/platform/llm-gate.js`, `src/utils/job-queue.js`, `src/config.js`)**:
    - **P4/P5 Honest Literals**: Purged `LLM_GATE_POLICY` middleman from `src/config.js`; defined local honest literals `LLM_PRIORITY` (`FOREGROUND: 10`, `BACKGROUND: 1`) inside `src/platform/llm-gate.js` with zero external config dependencies.
    - **Job Queue De-bloat**: Purged uncalled speculative lifecycle gate (`advance()`, `is_stale()`, `STALE_RESULT`, and unused `story_id`/`round` job parameters) from `src/utils/job-queue.js`. Streamlined to a lean, reliable concurrency queue with FIFO execution and latest-pending coalescing.
  - **Resilience & Watchdog Latency Alignment (`src/utils/resilience.js`, `src/state/status.svelte.js`)**: Wired `ExponentialBackoffRetryer` and `CircuitBreaker` constructor defaults to `PATIENCE_POLICY` (`HARD_LIMIT: 3`, `SOFT_LIMIT: 2`) and `LATENCY_TIERS_MS` (`TICK: 1000`, `DELAY: 10000`, `STEP: 30000`). Wired `FREEZE_WATCHDOG_INTERVAL_MS` to `LATENCY_TIERS_MS.HEARTBEAT` (15000) and `FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS` to `LATENCY_TIERS_MS.LIFETIME` (240000). Verified with `svelte-check` (0 errors, 0 warnings).

- **Track A: Unblocked Local Investigations (Execution Pulse)**:
  - **Composer Serialized Queue Drainage (`StorymodeBar.svelte`)**: Refactored message submission queue from reactive `$effect` array mutation (`pending.shift()`) to an explicit serialized async worker (`drain_pending_queue()`). Eliminates lingering amber `"Queued"` status badges on round handoffs and ensures rejected sends are safely restored to the composer input textarea without message loss. Verified with `svelte-autofixer` MCP.
  - **Automated Prompt Atom & Mutual-Exclusion Matrix (`simulation-audit.js`, `simulation-audit.test.js`)**: Built automated `generate_prompt_atom_matrix` emitting Table 1 (Comprehensive Atom Manifest with modes, parameters, and sample markup) and Table 2 (Cross-Mode Mutual-Exclusion & Co-Existence Matrix). Synthesizes PART III directly into `tmp/simulation-audit-report.md` via `npm run audit:simulation`.
  - **Centralized System Config & Token Budget Allocations (`src/config.js`)**: Promoted prompt token ceiling configuration to root `src/config.js` (`DEFAULT_PROMPT_CEILING = 6000`, `resolve_prompt_budget_allocation`, `PROMPT_BUDGET_WEIGHTS`), enabling programmatic ceiling tuning and dynamic budget tests without UI pollution or layer violations.
  - **100-Round Consolidation Caretaker Stress Suite (`consolidation-stress.test.js`)**: Created 100-round simulated roleplay stress harness validating that origin-pinned memories (`usr_` prefix / `is_origin`) are never evicted, session memory pools strictly respect the `PAST_VECTOR_CAP = 20` FIFO cap, `| hide` tags remain intact, and sensory memory degradation deterministically degrades lower-weight memories (`w <= 6`) while keeping high-weight canon (`w >= 7`) crisp.
  - **Strict Layer Boundary Enforcement Gate (`audit-layers.js`, `package.json`)**: Created automated AST/import scanner `audit-layers.js` enforcing downward layer hierarchy (`src/ui` -> `src/state` -> `src/media` -> `src/intelligence` -> `src/data` -> `src/platform`/`src/utils`) with 0 upward leaks, wired into `npm run audit:layers` and `npm run audit`.
  - **Feed DOM & Scroll Scalability Benchmark (`feed-dom-benchmark.test.js`, `tmp/feed-benchmark-report.md`)**: Benchmarked 100-round roleplay feeds (200 sequential messages, ~3,000 DOM nodes), confirming that keyed Svelte 5 rendering runs instantaneously (0.17 ms serialization, 57 KB footprint) and that complex DOM virtualization is not required.
  - **AudioContext Lifecycle & Teardown Verification (`audio.test.js`, `audio.svelte.js`)**: Added lifecycle tests verifying safe AudioContext instantiation and clean `destroy()` teardown without uncaught exceptions.

  - **Somatic Recall Degradation & Weight Unification (`temporal.js`, `temporal.test.js`, `protocols.js`, `builder.js`)**:
    - Implemented `degrade_memory_text` using diegetic block glyphs (`■■■`, no ellipses) to signal missing memories directly to the LLM without contaminating XML grammar or hallucinated facts.
    - Updated `format_hybrid_recall` to degrade lower-weight memories (`emotional_weight <= 6`) when `resolve_recall_clarity(dynamics) === 'fragmented'`, preserving high-weight canon crispness (`w >= 7`).
    - Keyed sensory memory degradation strictly off numeric weights (`emotional_weight <= 6`) under fragmented recall clarity (`resolve_recall_clarity(dynamics) === 'fragmented'`), preserving high-weight canon crispness (`w: 7-10`) regardless of origin provenance.
    - Added `resolve_somatic_interference_protocol` to inject grounding rules when Chaos or Entropy exceeds threshold (`DYNAMICS_FRAGMENTATION_THRESHOLD = 70`).
    - Wired `temporal_engine.format_hybrid` with entity dynamics into prompt builder past accessors and single-field enhancement.
  - **Educational 4-Quadrant Lorebook Guidance (`profile-fields.js`, `Profile.svelte`)**:
    - Enriched Character and Fractal taxonomy descriptions in `PROFILE_FIELDS` to explain how `eternal`, `present`, `past`, and `future` quadrants act as living vector slices of the world lorebook without keyword dumps.
    - Embedded educational info (`"i"`) icons with field tooltips into parsed pseudo-JSON card headers and TextField headers in `Profile.svelte`.
  - **Token Calculation Calibration & Token Budget HUD (`text.js`, `text.test.js`, `bridges.js`, `runtime.svelte.js`, `prompts.js`, `DevWing.svelte`)**:
    - Calibrated token estimation ratio to `CHARS_PER_TOKEN = 3.35` in `src/utils/text.js`, eliminating token undercounting against live Perchance BPE tokenization.
    - Wired real-time prompt compilation token snapshots (`system`, `entities`, `history`, `task`, and `<ENTITIES>` actors/cast/memories sub-breakdown) through `bridges.js` to `runtime.last_prompt_token_snapshot`.
    - Integrated interactive Token Budget HUD badge and collapsible allocation breakdown popover in `DevWing.svelte`.
  - **Unified Cooldown & Optics Preemption Protection (`dynamics.js`, `optics.js`, `story.js`)**:
    - Unified `IMAGE_TRIGGER_COOLDOWN_ROUNDS = 2` across dynamics evaluation and optics trigger arbitration.
    - Granted preemption protection to Turn 3 deferred optics runs, while caretaker background queue suppresses abort errors cleanly and advances `runtime.back_shot_cursor` only upon successful commit.
  - **Barrel Architecture Purity & Design Token Unification**:
    - Audited all 8 sites across `src/` containing re-exports outside canonical `index.js` barrels, completely eliminating dead re-exports, test-only aliasing, and layer-crossing bridge facades.
    - Severed cross-domain circular coupling between `src/media/` and `src/intelligence/` by removing compiler re-exports from `src/media/optics.js`, repointing `src/media/visual.svelte.js` to `@intelligence`, and exporting `compose_visual_generation_prompt` directly from `@intelligence`.
    - Unified the JS design token pipeline: updated `.agents/skills/design/scripts/sync-css.js` to emit pre-computed `SIGNATURE_COLORS`, `PALETTE`, and `PALETTE_CSS_VARIABLES` directly inside `src/media/tokens.js`, eliminating runtime string manipulation and regex filtering in `src/media/palette.js`.
    - Removed `export { SIGNATURE_COLORS } from "@data"` from `src/media/index.js` in favor of a 100% local, self-contained export directly from `./tokens.js`.
    - Removed dead `render_physical_block` and `whole_vector_slice` aliasing from `src/intelligence/modules/sheets.js`.
    - Purged dead `export { DIRECTOR_SCHEMA }` from `src/intelligence/director.js` and `export { generate_uuid }` from `src/state/log.svelte.js`.
    - Stripped internal parser re-exports from `src/intelligence/story.js`, canonical role re-exports from `src/intelligence/modules/history.js`, and style/color re-exports from `src/utils/styles.js` and `src/media/palette.js`.
    - Repointed all direct unit test suites (`story.test.js`, `history.test.js`, `log.test.js`, `tokens.test.js`, `optics.test.js`, `styles.test.js`) to import directly from their sovereign modules or canonical `@utils`/`@data`/`@intelligence` barrels.

- **Test Suite Narrowing & Type Safety (`prompts.test.js`)**:
  - Replaced raw `in` operator assertion (`expect("task" in mode).toBe(false)`) with `Reflect.has(mode, "task")` to resolve TypeScript/IDE `in-operator-narrowing` diagnostics cleanly.

- **Programmatic Prompt Sanitization & Epistemic Wall Hardening (`output.js`, `prompts.js`, `reflex.js`, `dynamics.js`, `entities.js`, `sheets.js`)**:
  - **Director JSON Schema Alignment (`output.js`, `prompts.js`)**: Added `story_status` (`'IN_PROGRESS' | 'COLLAPSED' | 'CONCLUDED'`) to `SCHEMA_ATOMS` and `DIRECTOR_SCHEMA`, eliminating prompt-to-contract drift for scenario termination. Cleaned `next_action` JSON schema syntax.
  - **Directives & Action Referencing Parity (`reflex.js`, `task.test.js`)**: Replaced broken `«INPUT»` meta-references with `«ACTION»` to match the actual emitted XML `<ACTION>` tag. Aligned `ENVIRONMENTAL_HINT` to recommend setting `next_action: "FRACTAL"` instead of non-existent `speaker`.
  - **Entropy Polarity Alignment (`dynamics.js`)**: Inverted `DYNAMICS_AXES.entropy` spectrum bounds to `low="Coherence"` and `high="Glitching"` to match `INSTABILITY` (>70) and `STABILITY` (<30) trigger rules and Pathetic Fallacy background directives.
  - **Symmetrical Epistemic Wall for FRACTAL (`entities.js`)**: Scoped `is_owner` in sheet actor resolution so that `FRACTAL` is only owned when FRACTAL is the active narrator or in director mode, preventing setting secrets from leaking across the Epistemic Wall into character actor prompts.
  - **Programmatic DSL Scrubbing (`sheets.js`, `sheets.test.js`)**: Sanitized rendered profile field rows to strip internal engine flags (`| hide`, `| private`, `| show`, `| w:N`) prior to XML emission so raw metadata never pollutes LLM context. Verified with live schema sweep.
  - **Director Truncation Salvage & Terse Recovery Defense (`director.js`, `director.test.js`)**: Ensured `parse_director_json` flags `_parse_error: true` when a response lacked a complete, authentic closed JSON block (`extract_json_block` returning null), enabling `execute_director_shot` to trigger terse recovery on truncated model outputs rather than silently absorbing partial parses as clean completions.
  - **Simulation & Schema Audit Consolidation (`simulation-audit.js`, `simulation-audit.test.js`)**:
    - Merged `live-schema-sweep.js` directly into [simulation-audit.js](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/simulation/scripts/simulation-audit.js), unifying entity mapping, past vector enrichers, and the multi-mode combinatorial live schema sweep engine.
    - Consolidated output reporting into a single comprehensive report at `tmp/simulation-audit-report.md`, unifying the active turn pipeline verification (Gothic baseline) with the full combinatorial tag tree, triggers, and data keys.
    - Archived legacy standalone files (`live-schema-sweep.js`, `audit_report.md`, `live-schema-report.md`) to the canonical archive (`C:\Users\johng\.gemini\archive\2026-10\`).
  - **Tooling Hygiene & Dependency Prune (`package.json`, `ignores.master.json`, `workspace.js`, `StorymodeBar.svelte`, `TextField.svelte`, `ProfileHeader.svelte`)**: Pruned 8 dead packages (`autoprefixer`, `htmlhint`, `npm-run-all`, `prettier-eslint`, `@standard-config/prettier`, `stylelint-declaration-strict-value`, `sass`, `svelte-preprocess`), purged `.htmlhintignore` sync wires, and aligned UI textarea tag formatting to prettier-plugin-svelte v4.
  - **Platform Embeddings Retry & Native Config Modernization (`embeddings.svelte.js`, `vitest.config.js`, `vite.config.js`)**:
    - **Embeddings Pipeline Retry Stability (`embeddings.svelte.js`)**: Preserved `_debug_pipeline_fn` when resetting `_pipeline` upon inference failure to ensure injected test pipelines persist through retry attempts, preventing accidental fallback to real CDN ESM module imports (`https://esm.sh/...`) in Node/Vitest environments.
    - **Native Config Loader Migration (`vite.config.js`, `vitest.config.js`)**: Replaced deprecated `__dirname` references across all path aliases with `import.meta.dirname` to comply with Vite 8's native config loader (`configLoader: 'native'`).
    - **Vitest Teardown Pool Timeout Tuning (`vitest.config.js`)**: Tuned `teardownTimeout` from `1000` to `4000` ms, eliminating `[vitest-pool]: Timeout terminating forks worker` warnings across heavy test files under the forks pool.
  - **Svelte Tooling Realignment & Global Skill Consolidation (`package.json`, `bridges.js`, `~/.gemini/config/skills/svelte/`)**:
    - **Consolidated into Global Svelte Skill**: Migrated `audit-svelte.js` and `forge-svelte.js` from RPGlitch into the global Svelte skill (`C:\Users\johng\.gemini\config\skills\svelte\scripts/`), with dynamic project-relative dependency resolution so it can audit any workspace cleanly.
    - **Batch Autofixer Upgrade (`svelte-autofix.js`)**: Upgraded `svelte-autofix.js` to support both single-file targeting and full-workspace recursive batch scanning/fixing across all `.svelte` files, mirroring `lint:js:fix`.
    - **Unified Parallel Lint Integration (`package.json`)**: Added `lint:svelte` to `npm run lint` and `lint:svelte:fix` to `npm run lint:fix`, creating symmetrical parity across JS, CSS, MD, and Svelte suites. Streamlined `audit:svelte` to execute `tool:audit-svelte` and `typecheck` in parallel.
    - **Unified Bridges Proxying (`bridges.js`)**: Added `audit-svelte`, `forge-svelte`, and `svelte-autofix` to `GLOBAL_TOOL_PATHS` in [bridges.js](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/bridges.js), routing CLI commands via the unified proxy architecture. Verified with `npm run lint` and `npm run audit:svelte` passing with 0 violations.
  - **Design System Taxonomy & Script Reorganization (`package.json`, `audit-google-design.js`, `audit-design.js`)**:
    - **Language-Strict Linter Boundary**: Eliminated redundant and broken `lint:design` from `// --- CHECKS & LINTING --- //`, preserving linters exclusively for language/format ASTs (`lint:css`, `lint:js`, `lint:md`, `lint:prettier`, `lint:svelte`).
    - **Unified Design Audit Gateway**: Reorganized `audit:design` into a composite script executing `audit:design:code` (Nordic subterranean design laws across `.svelte` and `.css` files) and `audit:design:docs` (`@google/design.md` token specification validation on `DESIGN.md`) in parallel.
    - **Testing Domain Clarity**: Renamed `test:design` to `test:sync` to explicitly reflect that it asserts the compiler pipeline behavior of `sync-css.js`. Pruned accidental `"lint"` dependency from `package.json`.
  - **Full Dependency Suite Update (`package.json`, `package-lock.json`)**: Executed `npm update` to bump all compatible dependencies to latest stable versions across Svelte 5 (`5.57.2`), Vite (`8.3.4`), Bits UI (`2.19.5`), Dexie (`4.4.6`), DOMPurify (`3.4.17`), ESLint (`10.12.0`), Prettier (`3.9.10`), Stylelint (`17.16.0`), and Vitest (`4.1.12`). Verified 100% CI pass.

- **Unified Prompt Library Schema & Universal XML Compiler (`xml.js`, `protocols.js`, `reflex.js`, `constitution.js`, `system.js`, `task.js`, `sheets.js`)**:
  - **Single Catalog Schema Grammar**: Migrated all prompt catalog atoms across `protocols.js` (`PROTOCOL_LIBRARY`), `reflex.js` (`REFLEX_LIBRARY`), `constitution.js` (`CONSTITUTION`), `system.js` (`ROLE_LIBRARY`), and `task.js` (`TASK_LIBRARY`) to a unified strict object schema: `{ tag, body, attrs?, inline? }`.
  - **Universal Atom XML Compiler (`render_atom_xml`)**: Implemented dual-mode universal atom compiler in `src/utils/xml.js` (with tests in `src/utils/xml.test.js`) supporting direct `{ tag, body }` objects and dotted catalog lookups (`render_atom_xml(catalog, key, values, options)`) with token interpolation, `body_only` bypass, and attribute merging.
  - **Biometric Field Block Promotion & P4 Dead Code Purge**: Promoted `render_profile_field_block` to `src/utils/xml.js` and re-exported it from `sheets.js`, maintaining the invariant that relational brackets (`[@TARGET: ...]`) are strictly immune to attribute compaction. Purged dead `physical_to_xml` and its tests under P4 Zero Backwards Compatibility.
  - **Module Compiler Modernization**: Updated `resolve_static_rule`, `resolve_optics_atom`, `resolve_macro_directive`, `PROSE_CONSTRAINTS`, `render_constraints_directive`, `render_director_constraints_directive`, `render_constitution_plan`, `get_role_atom`, and `get_directive_atom` to compile through `render_atom_xml`.
  - **Live Schema Provenance Realignment**: Updated `live-schema-sweep.js` provenance mappings so `TARGET`, `SPATIAL_FRAMING`, and `CINEMATOGRAPHY` map to `task.js`. Verified 174 live prompt compiles with 0 problems.

- **Reflex Catalog Consolidation & Task Director Relic Purge (`reflex.js`, `task.js`, `reflex.test.js`, `task.test.js`)**:
  - Merged `REFLEX_DEFAULTS` calibration config directly into `REFLEX_LIBRARY.DEFAULTS` as the single source of truth, eliminating the loose `REFLEX_DEFAULTS` export under P4 Zero Backwards Compatibility.
  - Added typed `MOMENTUM.CRITICAL` and `MOMENTUM.SOFT` directive atoms to `REFLEX_LIBRARY.MOMENTUM`, converting `render_momentum_directive_xml` into a thin renderer free of hardcoded prose.
  - Purged obsolete `DIRECTOR_ROUTING_RULES_ITEMS`, `render_routing_rules_xml`, and `TASK_LIBRARY.DIRECTOR` relic from `task.js` (routing enums are already unified in `output.js` schema), along with the special-case bypass in `get_directive_atom`.
  - Updated `reflex.test.js` and `task.test.js` to assert the consolidated catalog topology.

- **Root `<SYSTEM>` Envelope Unification & `<TURN>` Dual-System Purge (`system.js`, `story.js`, `prompt-verification.js`, `builder.test.js`, `prompts.test.js`, `prompt-verification.test.js`)**:
  - Eliminated `STORYTELLER_MODES` and `<TURN speaker="..." listener="...">` dual-envelope branching from `system.js`, unifying all 9 RPGlitch prompt modes under the canonical root `<SYSTEM round="..." mode="..." ...attributes>` envelope sealed with `</SYSTEM>`.
  - Simplified `pack_prompt` to unconditionally seal prompts with `</SYSTEM>`, dropping runtime regex tag detection.
  - Standardized completion injection and finishTail recovery in `story.js` on `</SYSTEM>` root closing tags.
  - Re-baselined `CONTRACT` inventories in `prompt-verification.js` and updated unit/contract tests across `prompt-verification.test.js`, `prompts.test.js`, and `builder.test.js`.
  - Updated `live-schema-sweep.js` diagnostic problem checker to validate `</SYSTEM>` closures.
  - Retired obsolete static `prompt-schema-map.js` in favor of dynamic `live-schema-sweep.js` and removed wire in `simulation-audit.test.js`.

- **Option A Slug Casing Harmonization, Unified Protocol Constraints, Grounding Deconstruction & XML Tag Directory**:
  - **Option A Slug Casing Harmonization (`premade-entities.js`, `sheets.js`, `repository.test.js`, `premade-entities.test.js`, `director.test.js`)**:
    - Harmonized all entity ID slugs and attribute slugs to lowercase (`id="julien"`, `target="julien"`, `speaker="julien"`, `origin="julien"`), display names to Title Case (`name="Julien the Banished Prince"`), and XML tags to UPPERCASE (`<CHARACTER>`, `<FRACTAL>`, `<RELATION>`, `<CONSTRAINTS>`).
    - Updated all 10 premade entity blueprints in `premade-entities.js` and their directed relational `@` bracket keys (`[@nova: ...]`, `[@silvers: ...]`, etc.) to lowercase slugs.
    - Maintained `PREMADE_ENTITY_MAP` 1:1 mapping with case-insensitive getters `get_premade_entity_by_id` and `has_premade_entity`.
  - **Merged `REFLEX_DEFAULTS`, `PROSE_CONSTRAINTS`, and `DIRECTOR_CONSTRAINTS` into `REFLEX_LIBRARY` (`reflex.js`, `protocols.js`, `builder.js`)**:
    - Consolidated all constraint definitions into `REFLEX_LIBRARY` emitting typed domain child elements (`<OVERARCHING_QUESTS>`, `<SYNTHETIC_FORMULAS>`, `<CLICHES>`, `<EXHAUSTED_OPENINGS>`, `<LETHALITY>`, `<AGENCY>`, `<GENESIS>`) instead of generic `<item>` tags.
    - Embedded `<CONSTRAINTS>` into `<CORE_PROTOCOLS>` across all simulation prompts (Director, Interaction, Narrator), adhering to the anti-caching mandate.
    - Stripped redundant `<CONSTRAINTS>` from `<TASK><DIRECTIVES>` to keep turn action directives pure.
  - **Grounding Deconstruction (`constitution.js`, `protocols.js`, `prompts.js`)**:
    - Deconstructed standalone `<GROUNDING>` protocol tag and absorbed its physical reality requirements directly into Constitution Law L1 Causality ("Ground every beat in tangible physical reality, localized objects, and tactile resistance rather than abstract outcomes.") and tactical dialogue into `PROSE_DISCIPLINE.TYPOGRAPHY` and `NATURAL_DIALOGUE`.
  - **Simulation Audit Modernization & Markdown Lint Remediation (`simulation-audit.js`, `simulation-audit.test.js`)**:
    - Eliminated header brackets (e.g. `## PHASE 1: THE KERNEL (HYDRATION)`) to resolve IDE markdownlint reference-link warnings.
    - Sanitized consecutive blank lines (MD012) throughout the generated report.
    - Injected conditional prompt layers (Gothic narrative style `<AUTHORIAL_VOICE>`, somatic `<SUBTEXT>` from keywords, and `<MOMENTUM_SOFT_PERMIT>` for stagnation >= 8) into the audit run.
    - Expanded pipeline verification to 25 automated checks (100% passed).
  - **Comprehensive Programmatic XML Tag Specification Map (`prompt-schema-map.js`, `tmp/audit_report.md`)**:
    - Refactored `prompt-schema-map.js` into an automated declarative compiler (`PROMPT_LAYER_TREE` and `render_tag_skeleton`) uniting all 9 RPGlitch prompt modes (`director`, `interaction`, `narrator`, `ghostwrite`, `npc`, `continuum`, `enhancement`, `sorting`, `optics`) under a root `<PROMPT envelope="...">` envelope, eliminating synthetic `<SYSTEM><TURN>` nesting.
    - Purged mocked internal character/fractal fields (`<CORE>`, `<WOUND>`, `<DESIRE>`, `<GOAL>`, `<METHOD>`, `<BUILD>`, `<FACE>`, `<EYES>`, `<GARMENTS>`, `gender`, `height`), keeping canonical identity attributes (`id="[slug]" name="[Title Case]"`) and operational placeholders like `<ACTION round="[number]" origin="[slug]">`.
    - Removed synthetic `<RELATION>` tags from entity fields, establishing clean leaf tags for `<PERSONALITY>`, `<MEMORIES>`, `<BACKSTORY>`, `<PERMANENT_TRUTHS>`, and `<HISTORY>` while preserving `<CAST>` and `<CANDIDATE>`.
    - Differentiated `<DIRECTIVES>` into `<STAGING>` (Director state evaluation and allocation), `<SCENE_ADVANCEMENT>` (Storyteller perspective and momentum), and `<TASK_INSTRUCTION>` (Tool extraction and synthesis) alongside stagnation `<MOMENTUM>`.
    - Co-located accurate module provenance for narrative styles (`narrative-styles.js` for `<SIGNATURE_ELEMENTS>`, `<SENSORY_EXPERIENCE>`, `<RHYTHM>`), visual styles (`visual-styles.js` for `<MEDIUM>`, `<PALETTE>`, `<TEXTURES>`), and speech/detox (`speaking-styles.js` for `<CLICHES>`).
    - Maintained pure, empty canonical XML tag skeletons (`<TAG></TAG>`) across individual prompt mode sections (Sections 2–10).
    - Appended `## PHASE 5: COMPREHENSIVE XML TAG SPECIFICATION MAP` to `tmp/audit_report.md`.

- **Director Schema Co-Location & Unified Constraints Architecture (Wave 2)**:
  - **Director Schema Routing & Keyword Co-Location (`output.js`, `prompts.js`, `task.js`, `builder.js`)**:
    - Co-located all `next_action` turn allocation options (companion, fractal, secondary NPC, genesis minting, and fatal/triumphant epilogues) and the full keyword whitelist directly into the `<OUTPUT_FORMAT mode="json">` schema definition in `SCHEMA_ATOMS.next_action` and `SCHEMA_ATOMS.keywords`.
    - Purged duplicate text-wall blocks (`<ROUTING_RULES>` and `<KEYWORD_DIRECTIVES>`) from Director `<DIRECTIVES>`, eliminating redundant instructions and reducing token load.
    - Cleaned unused keyword helper imports and variables from `builder.js`.
  - **Unified `<CONSTRAINTS>` Layer & Negative Directive Consolidation (`reflex.js`, `protocols.js`, `prompts.js`, `builder.js`)**:
    - Consolidated scattered negative prose constraints (Overarching Quests, Synthetic Formulas, Cliché Clusters) from `protocols.js` alongside recent exhausted phrasing into a unified `<CONSTRAINTS>` directive block without double negatives, retiring the legacy `<SPENT_LEDGER>` wrapper.
    - Exported `PROSE_CONSTRAINTS` catalog and `render_constraints_directive` from `reflex.js`, threading unified constraints into character and scene tasks in `builder.js`.
  - **Pipeline Verification & Single-File Build (`simulation-audit.js`, `dist/index.html`)**:
    - Synchronized `SimulationAudit` drivetrain checks to validate schema-co-located keywords and unified character `<CONSTRAINTS>`, passing all 21 pipeline checks in `tmp/audit_report.md`.
    - Validated all 71 test suites (1,430 unit tests) green and successfully rebuilt single-file distribution bundle via `npm run deploy:prepare`.

- **Unified Turn Architecture, Director Hygiene & Universal Sovereignty**:
  - **Universal `<ACTION round="..." origin="...">` Envelope (`text.js`, `history.js`, `task.js`)**:
    - Unified all conversation history entries and immediate task inputs across the entire prompt pipeline into a singular, symmetrical schema: `<ACTION round="X" origin="...">...</ACTION>`.
    - Eliminated disparate `<ENTRY>`, `<PREVIOUS_TURN>`, `<CURRENT_TURN>`, and `<INPUT>` tags, establishing perfect serialization symmetry across all 9 prompt modes.
  - **Director Prompt Hygiene (`prompts.js`, `builder.test.js`, `prompt-verification.js`)**:
    - Purged `<PROSE_DISCIPLINE><SCENE_MOMENTUM>` from Shot 1 Director protocols and contract inventories; Director is a pure JSON engine for staging mechanics and dynamics deltas, not narrative prose generation.
  - **Universal Participant Sovereignty & Base Task Deconstruction (`constitution.js`, `task.js`, `prompts.test.js`)**:
    - Elevated Axiomatic Constitution Law L3 (`SOVEREIGNTY`) to explicitly protect every participant from being puppeteered, declaring universal voice, body, and action ownership across all characters and player personas.
    - Deconstructed `TASK_LIBRARY.PROSE.CHARACTER.BASE`, stripping redundant agency duplication already guarded by Law L3.
  - **Pipeline Verification & Single-File Production Build (`simulation-audit.js`, `dist/index.html`)**:
    - Synchronized `SimulationAudit` drivetrain checks to validate `<ACTION>` tags; achieved 100% pass across all 20 pipeline checks in `tmp/audit_report.md`.
    - Executed `npm run deploy:prepare` and `npm run build`; verified all 71 test suites (1,429 unit tests) green with single-file bundle updated.

- **Relational Macro Graph, Handle Preservation & Directive Hygiene**:
  - **Entity Handle Preservation & Multi-Relation Aggregation (`macros.js`, `text.js`)**:
    - Purged legacy Rule #3 from `parse_macros` which was replacing entity handles like `@JULIEN` or `@USER` with entity names or uppercase tags (`JULIEN_THE_BANISHED_PRINCE`), keeping handles intact.
    - Updated `safe_parse_pseudo_json` to aggregate repeated `@`-prefixed relational keys into arrays rather than overwriting previous entries, allowing multiple directed relations to the same target (e.g. multiple `[@ASHENWEALD: ...]`) to serialize into distinct `<RELATION>` tags.
  - **Premade Entities Harmonization (`premade-entities.js`)**:
    - Renamed Rust's entity ID to `HANK` (`Hank 'Rust' Brawley`) across all definitions and relational links (`[@HANK: ...]`) to eliminate noun collisions with physical rust.
    - Anchored Silvers' and Julien's backstory memories cleanly to `[@ASHENWEALD: ...]` relations, capturing historical exile and court scandals with full relational graph connectivity.
  - **Engine Flag Sanitization & Entity Role Resolution (`sheets.js`, `sheets.test.js`)**:
    - Stripped engine visibility (`| show`) and weight (`| w:\d+`) flags in `parse_profile_field_rows` while preserving `| hide` for owner epistemic clarity.
    - Mapped dynamic entity roles (`user`, `ai`, `fractal`) to their actual canonical entity IDs in `known_slugs`, ensuring `[@USER: ...]` correctly emits `<RELATION target="...">` directed to the player's entity ID.
  - **Clean Unified Perspective & Tense Directive (`protocols.js`, `protocols.test.js`)**:
    - Merged `PERSPECTIVE` and `TENSE` into a single authoritative sentence: `"Narrate in third-person limited ('he', 'she', 'they', or character name) in the present tense. Never use first-person pronouns in narrative prose."` eliminating awkward blank lines and redundant `"Write strictly in"` phrasing.
  - **Directorial Grounding & Momentum Protocol (`prompts.js`, `prompt-verification.js`, `builder.test.js`)**:
    - Added `CORE_PROTOCOLS.GROUNDING` and `CORE_PROTOCOLS.PROSE_DISCIPLINE.SCENE_MOMENTUM` to Director protocols and verification contracts, establishing physical reality grounding and anti-stagnation rules directly in Director prompts.
  - **Negative Constraint Grouping & Reflex Documentation (`reflex.js`, `reflex.test.js`, `prompt-verification.js`)**:
    - Renamed `<PROHIBITED_PATTERNS>` inside `<SPENT_LEDGER>` to `<CONSTRAINTS>` to eliminate the semantic double-negative.
    - Added exhaustive trigger condition comments above every prompt atom in `REFLEX_LIBRARY`.

- **Phase IV & Prompt Architecture Harmonization (Issues 13, 21, 22)**:
  - **Quad Profile Field XML Expansion (`sheets.js`, `sheets.test.js`)**:
    - Unified `parse_profile_field_rows` across all quad profile fields (`PERSONALITY`, `STATE`, `AGENDA`, `MEMORIES`), replacing unformatted bracket dumps with structured child XML elements (`<CORE>`, `<SPEECH>`, `<FOCUS>`) and compact attributes (<= 40 chars) identical to `APPEARANCE`.
    - Preserved unbracketed prose alongside bracketed entries within field envelopes (`Guarded vigilance.` rendered alongside structured keys).
    - Extracted relational brackets natively into `<RELATION target="slug">...</RELATION>` within `STATE` and `PERSONALITY` envelopes.
    - Completely purged duplicate `<DISPOSITION>` tag generation from `sheets.js` and `resolve_sheet_snapshot`.
  - **Symmetrical Semantic Director Signals (`task.js`, `task.test.js`, `director.test.js`)**:
    - Replaced disjoint `<INPUT origin="JULIEN" round="1">` and `<INPUT origin="SILVERS" type="reply">` in Director input signals with chronological, symmetrical semantic tags: `<PREVIOUS_TURN origin="...">` for companion prior output and `<CURRENT_TURN origin="...">` for player input.
    - Exported `render_task_turn` and enforced Full-Name & Anti-Abbreviation Mandate (`previous` over `last`).
  - **Pronoun-Agnostic Ghostwriting & Authorial Voice Sovereignty (Sub-item 4.2 & 4.4 / Issue 22)**:
    - Stripped hardcoded "first-person" constraint from `TASK_LIBRARY.PROSE.CHARACTER.GHOSTWRITE`, making ghostwrite perspective grammar dynamically governed by `<PERSPECTIVE person="...">` from the entity profile's canonical `pov` field.
    - Registered top-level `pov` in `PROFILE_FIELDS` (`profile-fields.js`).
    - Updated `render_narrative_style_xml` in `style.js` to emit `<AUTHORIAL_VOICE author="..." internal_ratio="...">` with nested `<SOVEREIGNTY player="...">` non-puppeteering constraint.
    - Threaded `player_name: entities.USER?.name || null` through `builder.js` and `protocols.js`.
  - **Prompt Contracts & Simulation Audit (`prompt-verification.js`, `prompt-verification.test.js`, `prompts.test.js`, `simulation-audit.js`)**:
    - Updated frozen `CONTRACT` inventories to reflect native `<RELATION>` tags, `<AUTHORIAL_VOICE>` + `<SOVEREIGNTY>`, and Director `<PREVIOUS_TURN>` / `<CURRENT_TURN>` inputs.
    - Enhanced `.agents/skills/simulation/scripts/simulation-audit.js` CLI runner to intercept direct node execution and delegate to Vitest, resolving `@data` path alias imports cleanly.

- **Bugs & Debt Remediation — Phase C: Narrative Architecture, Perspectives & Budgeting**:
  - **Phase III 3.9 LLM Epistemic Dispositions (`sheets.js`, `sheets.test.js`, `prompt-verification.js`)**:
    - Implemented `render_dispositions` to render relational dynamics from `present.non_physical` into character envelopes as `<DISPOSITION target="...">` for authorized observers across the Epistemic Wall.
    - Added `owner_state: true` to `SHEET_SPECS.USER_PERSONA` so user persona state correctly participates in owner veil filtering.
    - Integrated `disposition_rows` inside `psychology_blocks` when `show_dispositions` is enabled, and applied `strip_relational_brackets` to `state` when `show_dispositions` is true so relational brackets do not duplicate or leak into raw state rows.
    - Updated frozen `CONTRACT` inventories in `prompt-verification.js` across Director, Interaction, Ghostwrite, NPC, and Narrator prompt envelopes to assert `<DISPOSITION>` presence.
  - **Ghostwriter Perspective Alignment & Owner Veil Filtering (Phase IV 4.1, 4.3) (`task.js`, `builder.js`, `story.js`)**:
    - Added `PROSE.CHARACTER.GHOSTWRITE` assistive drafting directive to `TASK_LIBRARY` and wired `is_ghostwrite` into `resolve_character_action_directive`, resolving the L3 Sovereignty agency contradiction on ghostwrite turns by strictly framing ghostwriting as player-assistive draft suggestions rather than unconsented persona puppeteering.
    - Sanitized all non-`USER` entities across the Epistemic Wall in `execute_ghostwriter` (`story.js`) using `filter_epistemic_brackets(..., "other")` so AI and NPC covert brackets never leak into user persona ghostwrite draft prompts, while preserving the user persona's own `| hide` brackets.
  - **Phase V 5.1 ENTITIES Hard Budgeting Under 6k Cliff (`entities.js`, `builder.js`)**:
    - Exported `ENTITIES_MAX_TOKENS = 2000` and `ENTITIES_MAX_CHARS = 8000` in `entities.js`.
    - Wired `calculate_physical_salience` and `whole_vector_slice` from `temporal.js` to score and prune candidate cast and nearby secondary entities when `<ENTITIES>` block approaches budget limits, ensuring Director and Storyteller prompts remain strictly beneath the 6,000-token cliff by construction.

- **Bugs & Debt Remediation — Phase B: Simulation Physics & Memory Integrity**:
  - **M1 Case-Variant Deduplication (`text.js`, `temporal.js`, `text.test.js`, `temporal.test.js`)**:
    - Implemented line-level case-folded deduplication in `merge_prose_into_field`, eliminating turn-over-turn duplication of identical physical states with differing casing ("Gash across chest" vs "gash across chest").
    - Added case-folded deduplication for `AGGREGATE_KEYS` (`INVENTORY`, `STASH`) and unstructured prose appending to `CONDITION`.
    - Refactored `merge_field_content` to apply per-line case-folded duplicate filtering on freeform prose, eliminating the bug where a single matching phrase falsely suppressed new incoming lines.
  - **E2 Concealment Preservation Across Memory Forge Cycles (`text.js`, `temporal.js`, `temporal.test.js`)**:
    - Reconciled incoming synthesized brackets against `existing_brackets` in `temporal_engine.consolidate` and `forge_memory` (`present.non_physical` and `present.physical`), carrying over `| hide` flags and base weights unless an incoming mutation explicitly declares `| show` or clears with `none`/`cleared`.
    - Hardened `merge_prose_into_field` to retain `| hide` flags across structured key overwrites.
    - Added unit test asserting multi-cycle survival of concealed items (`[DAGGER: silver blade | hide]`) through repeated background consolidation passes.
  - **RelationalContext Tuple Wiring (Atom 3.3) (`macros.js`, `builder.js`, `sheets.js`, `entities.js`, `builder.test.js`)**:
    - Constructed `create_relational_context({ me, you, speaker, listener, target, witnesses })` in `builder.js` across Storyteller, Narrator, and Director prompt compilers.
    - Forwarded the relational context tuple through `sheets_args` into `render_entity_sheets`, `render_actor_sheets`, `resolve_sheet_snapshot`, and `parse_physical_rows`.
    - Resolved `@SPEAKER`, `@LISTENER`, `@TARGET`, `@ME`, and `@YOU` dynamically against live scene dialogue participants during prompt compilation and character sheet serialization.

- **Bugs & Debt Remediation — Phase A: Dead Code Purges & Level 1 Fixes**:
  - **Syntax & Quantifier Correction (`ProfileHeader.svelte`)**: Corrected malformed regex quantifier `pattern="^[A-Za-z0-9_-]{(2, 20)}$"` to `pattern="^[A-Za-z0-9_-]{2,20}$"`, restoring HTML5 input validation for custom entity handle editing.
  - **Inert `alternative_branches` Purge (`story.js`, `output.js`)**: Eliminated dead `[ALT-BRANCH]` console logging loop and meta-assignment in `story.js`; pruned lingering schema field in `output.js:56`.
  - **Dead `has_candidates` Purge (`task.js`, `builder.js`)**: Removed unread `values.has_candidates` assignment in `task.js` and discontinued its calculation in `builder.js`.
  - **Think Tag Constant Harmonization (`story.js`, `parser.js`)**: Exported `THINK_CLOSE_TAG` from `parser.js` and replaced literal string matches in `story.js` with canonical constants and case-insensitive regexes.
  - **Idiom-Safe Player Destruction Guard (`director.js`, `director.test.js`)**: Upgraded `is_explicit_player_destruction_declared` with regex word boundaries and idiom exclusion sanitization ("kills me every time", "I die-cast", "deathly pale", "dead tired"), preventing false-positive blocks while strictly preserving Law L3 player sovereignty.
  - **Phase III 3.8 Storage-Ban Gate (`prompts.test.js`)**: Added standing verification test ensuring ephemeral turn pragmatics (`speaker`, `listener`) are banned from durable entity schemas and prompt persistence metadata.

- **Phase III: Relational Macro Graph, Epistemic Wall & Perspective (Track 6)**:
  - **Secondary NPC Identity Inversion Fix (`macros.js`)**: Eliminated blanket `owner.type === "character" ? "ai"` catch-all in `_resolve_owner_perspective`. Classifies secondary NPCs as `entity:<id>` so `@ME` resolves to the NPC's own name instead of stealing the AI companion's identity.
  - **Epistemic-First Sequencing Invariant (`builder.js`, `sheets.js`)**: Removed premature `parse_macros` from `accessors.past` and `accessors.future` in `builder.js`. Established strict two-step pipeline in `sheets.js:resolve_sheet_snapshot` where all 4 entity fields are sanitized first (`strip_epistemic_secrets` to purge `| hide` brackets for unauthorized viewers), and then passed through `render_field_value` for macro expansion on surviving text with proper owner gating.
  - **Canonical Single-Word Slugs & Universal Macro Expansion (`macros.js`, `premade-entities.js`, `veil.js`)**: Standardized all entity relational keys to canonical uppercase single-word slugs (`@SILVERS`, `@NOVA`, `@ORION`, `@JULIEN`, `@ELIAS`, `@TARTARUS`, `@RUST`, `@BEAST`, `@GLITCH`, `@ASHENWEALD`). Exported `create_relational_context` and purged legacy curly braces `{me}`, `{{me}}`, `{you}`, `{{you}}` across all modules under P4 Zero Backwards Compatibility.
  - **Interactive Single-Word Entity Slug Editing (`ProfileHeader.svelte`, `Profile.svelte`)**: Added real-time uppercase `@SLUG` badge and configurable ID editor with strict character-set enforcement (`A-Z`, `0-9`, `_`) and automatic duplicate prevention.
  - **Universal Envelope Contract & Biometric Attribute Compaction (`sheets.js`, `system.js`, `story.js`, `prompt-verification.js`)**:
    - Replaced polymorphic slot tags (`<AI_CHARACTER>`, `<USER_PERSONA>`, `<NPC>`) with universal `<CHARACTER id="UPPERCASE_SLUG" name="...">` envelopes.
    - Biometric appearance attribute compaction: packs concise appearance fields ($\le 40$ chars, no newlines/quotes) directly into XML attributes (`<APPEARANCE build="..." hair="..." />`), eliminating wrapper bloat.
    - Completely purged `<DISPOSITIONS>` wrappers; relational brackets live directly within state/personality.
    - Enforced root `<TURN speaker="..." listener="...">` envelopes for all Storyteller modes (`interaction`, `ghostwrite`, `npc`, `narrator`).
  - **360° Relational Dossier & Omniscient Observer Mode (`RelationalGraph.svelte`)**:
    - Interactive glassmorphic dossier card displaying complete 4-layer state (🏛️ Eternal, ⚡ Present, 📜 Past, 🚀 Future) on constellation node and SVG curve clicks.
    - Omniscient Observer Mode: provides clear visual epistemic lock badges (`🔒 Epistemic Lock`) for concealed `| hide` brackets to allow director oversight while guaranteeing epistemic isolation during live narration.
    - Direct radial graph navigation with single-click profile switching.
  - **Comprehensive Quality Gates & Pre-Flight Verification**:
    - 71 test suites passed (1,412 unit tests), 13 hook contract tests passed, and production bundle verified via `npm run deploy:prepare`.

- **Phase II: Directorial Governance, Constitution & Syntax Parity**:
  - **Universal Axiomatic Constitutional Grounding (Shot 1)**: Grounded Director prompts with `<AXIOMATIC_CONSTITUTION>` (Laws L1–L4) universally across all simulation modes via `DIRECTOR_LAYERS.system` in `prompts.js`, eliminating cognitive divergence between director staging and narrative generation.
  - **Unified `<ROUTING_RULES>` XML Block**: Consolidated next-action turn allocation, candidate reuse discipline for `"GENESIS"`, and fatal trauma collapse thresholds for `"EPILOGUE_COLLAPSED"` into a typed `<ROUTING_RULES>` block in `task.js`. Purged fragmented text directives (`DIRECTOR.ROUTING`, `DIRECTOR.CONVERGENCE`).
  - **Co-Located Dynamic Axes Calibration Bounds**: Emitted delta bounds as attributes on `<DYNAMIC_AXES scale="0-100" delta_standard="±1-4" delta_extreme="±8-12" boundary_clip="5-95">` and added qualitative behavioral `<CALIBRATION>` guidance in `dynamics.js`. Completely purged misplaced `DIRECTOR.DYNAMICS_CALIBRATION` from `task.js` and `prompts.js`.
  - **Scene Momentum Directive XML Compilation in `reflex.js`**: Relocated momentum directive compilation to `render_momentum_directive_xml(stagnation_turns)` in `reflex.js`, emitting `<MOMENTUM tier="soft|critical" turns="...">` only when stagnation reaches threshold ($\ge 8$ soft, $\ge 16$ critical).
  - **Climax Sovereignty Dual Defense (Track 11.4 / Finding F6)**: Implemented `is_explicit_player_destruction_declared(user_input)` in `director.js`. Programmatically intercepted unconsented `EPILOGUE_COLLAPSED` or `COLLAPSED` status in `normalize_director_data`, downgrading to `AI_CHARACTER` and `IN_PROGRESS` with severe somatic trauma staging notes to enforce Law L3 (Sovereignty).
  - **Same-Role Semantic Drift Recalibration (Track 11.3 / Finding L18)**: Updated semantic drift calculations in `story.js` to compare consecutive turns by the same interlocutor (`user[n]` vs `user[n-1]` in Step 2, and `companion[n]` vs `companion[n-1]` in Step 7.5), enabling conversational circularity to naturally trip stagnation thresholds without interleaved speaker cross-talk contamination.

- **Phase I: Prompt Pipeline Hygiene, P4 Purges & Release Safety**:
  - **Single-Source Player Sovereignty**: Consolidated player agency constraints into `<AXIOMATIC_CONSTITUTION>` Law L3 (Sovereignty) in `constitution.js`. Enabled constitution across all simulation modes (including Director Shot 1). Purged duplicate agency text from `protocols.js`, `task.js` (`CHARACTER.BASE`), and Director directives (`USER_PERSONA_LOCK`).
  - **P4 Purge of `alternative_branches`**: Removed `alternative_branches` from `DIRECTOR_SCHEMA`, `director.js`, and Director directives, saving 60–120 output tokens/turn. Archived proposal specification in `.agents/skills/simulation/references/suggestion-fate-branching-choices.md`.
  - **Typed `<INPUT>` Signals**: Standard protagonist inputs omit the transport attribute (`<INPUT origin="..." round="...">`), while auxiliary inputs use `type="..."` (`reply`, `content`, `intent`, `ingestion`).
  - **Pacing Hierarchy Resolution**: Striped conflicting sentence counts from `PACING` bodies in `reflex.js`, establishing `<BEAT_BUDGET>` as the authoritative structural controller.
  - **Spent Ledger Pseudo-XML**: Refactored `render_spent_ledger_directive` in `reflex.js` to emit `<SPENT_LEDGER><PROHIBITED_PATTERNS><ITEM>...`.
  - **Lorebook Ghost-Layer Purge**: Completely eradicated `{ key: "lorebook" }` from `PROMPT_LAYERS` in `system.js`, removed `lorebook_args` from `builder.js`, purged Section 2.5 from `SECURITY.md`, and cleaned schema comments in `db.js`.
  - **Candidate Cast Spatial Pointer & Empty-Roster Guard**: Corrected pointer in `task.js` to "the candidate cast above" and gated `DIRECTOR.CONVERGENCE` on `has_candidates`.
  - **Grounding Hygiene**: Stripped studio lighting ("light fixtures") from `CORE_PROTOCOLS.GROUNDING` in `protocols.js` and isolated to optics.

- **Prompt Pipeline & Entity Referencing Master Rollout Order (`potential-fixes.md`)**: Consolidated audit forensics and entity referencing failure modes into an authoritative 4-batch execution plan combining target-state architecture with contract byte-pin protection, empirical A/B gating, and confidence-rated implementation solutions.
- **Developer Database Keepalive Integration**: Automatic, non-blocking keepalive ping to Supabase Cold Storage (`GET /rest/v1/development_logs?select=id&limit=1`, throttled to $\le 1$ per 10 minutes) on Pinecone access to prevent free-tier project dormancy.
- **Stage 3 Preparations**: Groundwork for perspective and persona systems (Tracks 6–7).
- **Engine Hardening Backlog**: Queued remediations for live simulation forensic findings:
  - Hard budget constraints on `<ENTITIES>` block to eliminate reliance on host middle-out truncation.
  - Fix E2 concealed bracket eviction across background Memory Forge consolidation cycles.
  - Ghostwrite perspective alignment to prevent 3rd-person narrator contradiction on user turns.
  - Recalibrate semantic drift comparison formula to evaluate consecutive turns by the same interlocutor.

---

## `[0.8.0]` - 2026-10-12

- **Live Simulation Forensics & Integrity Verification (29-Round Run, R0–R28 across 111 generations)**:
  - Validated Track 5 Stream Beat Monitor live: `TINY` 4-character input (`"Nod."`) clamped cleanly to 1 beat (~140 chars) without ballooning; `EXPANSIVE` 456-character input unlocked full 2,326-character multi-beat depth.
  - Validated Track 3 Narrative Detox across 48 interaction turns: zero raw em/en-dashes, zero Tier 1A frequency slop, zero syntactic clichés, and somatic markers capped at $\le 1$ per character.
  - Validated Third-Party Epistemic Isolation: `[DAGGER|hide]` stripped cleanly from AI prompts while visible sibling accessories passed through.
  - Validated Prism-DCM Tier-1 chapter compaction rolling turn events into chapter nodes within height bounds.
  - Validated Event Sourcing: genesis quadrant logging, director relational compare-then-skip deduplication, and field history replay.
  - Identified critical backlog remediations: unbudgeted `<ENTITIES>` block swamping 6k cliff, E2 concealed memory eviction during forge consolidation, ghostwriter POV agency conflict, and input-vs-reply stagnation drift calculation flaw.

- **P4 Zero Backwards Compatibility Purges: Lorebook & Physics Shim (`src/data/`, `src/intelligence/`, `src/utils/`)**:
  - Purged `src/intelligence/physics.js` compatibility shim and test file, pointing all downstream concerns directly to `dynamics.js`.
  - Purged standalone `src/intelligence/modules/lorebook.js`, `lorebook.test.js`, and `db.lorebooks` Dexie table.
  - Salvaged `match_keyword_pattern` (regex/glob/whole-word pattern matcher) to `src/utils/text.js`.
  - Removed `lorebook` prompt slot from `PROSE_LAYERS`, `SYSTEM_SLOT_RESOLVERS`, and `story.js` in favor of pure 4-Quadrant Neural RAG.

- **Metasyntax Standing Gate Consolidation (`src/intelligence/prompts.test.js`, `src/intelligence/metasyntax.test.js`)**:
  - Consolidated Section 9 Metasyntax standing gate tests (catalog prose hygiene, frozen referent allowlist, stray `{placeholder}` brace detection, and `@` token confinement) into `src/intelligence/prompts.test.js`.
  - Retired standalone `src/intelligence/metasyntax.test.js` to simplify test suite topography and eliminate duplicate contract suite setup.

- **Track 5: Runtime Stream Beat Backstop & Continuation (`finishTail`) (`src/intelligence/story.js`, `src/intelligence/modules/reflex.js`, `src/platform/transport.js`, `src/platform/llm-gate.js`)**:
  - Implemented `count_prose_beats(prose)` and `is_stream_beat_limit_reached(prose, tier)` in `reflex.js` for beat-boundary punctuation counting outside `<think>` cognition blocks.
  - Implemented runtime Stream Beat Monitor in `story.js:make_character_try` wrapping token streaming with a beat-abort controller when input is classified as `TINY` (cuts after 1st beat) or `SMALL` (cuts after 2nd beat).
  - Enhanced `transport.js` and `llm-gate.js` with graceful abort reason propagation, resolving `BEAT_LIMIT_REACHED` cleanly without raising an unhandled `AbortError` exception.
  - Replaced full re-roll truncation retries with append-only continuation `finishTail`: when `looks_truncated` triggers, the engine preserves the streamed prefix, issues a targeted `FINISH_TAIL` recovery directive, appends the completion clause, and falls back to `force_close_response` if still unclosed.
  - Added unit test suites covering beat limit aborts and append-only continuation in `reflex.test.js`, `transport.test.js`, and `story.test.js`.

- **Track 4: Scene Momentum & Stagnation Backstop (`src/platform/embeddings.svelte.js`, `src/state/runtime.svelte.js`, `src/intelligence/modules/reflex.js`, `src/intelligence/modules/task.js`, `src/intelligence/prompts.js`, `src/intelligence/builder.js`, `src/intelligence/story.js`)**:
  - Implemented `calculate_semantic_drift(current_text, previous_text)` in `embeddings.svelte.js` returning normalized $(1 - \text{cosine\_similarity})$ via 384-d neural embeddings.
  - Added reactive `stagnation_turns` and `last_semantic_drift` to `RuntimeEngineStore` (`runtime.svelte.js`), auto-persisting to IndexedDB `db.stories` and updating via `record_turn_drift(drift)`.
  - Added Directorial Momentum Tiers in `reflex.js`: `MOMENTUM_TIERS` calibration in `REFLEX_DEFAULTS`, `MOMENTUM_SOFT_PERMIT` and `MOMENTUM_HARD_MANDATE` atoms in `REFLEX_LIBRARY.CONDITIONALS`.
  - `resolve_prose_posture_plan` lifts `ANTI_STAGING` at $\ge 8$ stagnant turns and emits soft permit / hard mandate flags into `<DELIVERY_POSTURE>`.
  - Added `MOMENTUM_SOFT_PERMIT` and `MOMENTUM_HARD_MANDATE` directives to `TASK_LIBRARY.DIRECTOR` (`task.js`) and wired prompt compiler injection via `director_directives` (`prompts.js`).
  - Integrated turn-to-turn semantic drift evaluation and telemetry logs into `story.js:execute_turn`.
  - Added full test coverage in `embeddings.test.js`, `runtime.test.js`, `reflex.test.js`, and `prompts.test.js`.

- **Track 3: Anti-Slop Narrative Detox & The Spent Ledger (`src/intelligence/modules/reflex.js`, `src/intelligence/modules/style.js`, `src/intelligence/builder.js`, `src/utils/detox.js`, `src/utils/styles.js`, `src/data/definitions/speaking-styles.js`, `src/data/index.js`)**:
  - Folded Spent Ledger engine (`extract_spent_ledger`, `render_spent_ledger_directive`, mannerism patterns, and windowing constants) directly into `src/intelligence/modules/reflex.js` (Section 8), eliminating redundant standalone `spent-ledger.js` and `spent-ledger.test.js`.
  - Harmonized `src/intelligence/modules/style.js` by deduplicating bare clothing markers dynamically using canonical `CLOTHING_KEYS` and `CLEAR_TOKENS`.
  - Decoupled hardcoded word replacement lists from `src/utils/detox.js` into canonical data definition dictionaries in `src/data/definitions/speaking-styles.js` (`ANTI_AI_REPLACEMENTS`, `TIER_2_CLUSTER_WORDS`), registering them dynamically with `detox.js` and `styles.js` to preserve layer boundary purity (`@utils` does not import `@data`).
  - Implemented Tier 2 vocabulary cluster linter in `src/utils/styles.js:audit_macro_shape` flagging responses when $\ge 2$ Tier 2 cluster words appear.
  - Implemented fatal syntactic construction rewrites in `detox.js` (`not quite X, more like Y`, `she didn't X; she Y`, `the air grew thick`, and naming subtext like `gesture of ownership`).
  - Added Tier 1A high-frequency AI vocabulary marker replacements (49 terms: `delve`, `tapestry`, `realm`, `paradigm`, `embark`, `beacon`, `robust`, `comprehensive`, `cutting-edge`, `leverage`, `pivotal`, etc.) and Tier 1B clarity rewrites (`utilize` $\rightarrow$ `use`, `in order to` $\rightarrow$ `to`, `due to the fact that` $\rightarrow$ `because`, `serves as` $\rightarrow$ `is`, `commence` $\rightarrow$ `start`, `ascertain` $\rightarrow$ `find out`, `endeavor` $\rightarrow$ `attempt`).
  - Expanded somatic markers in `styles.js` with stock facial expressions and mannerisms (`ghost of a smirk`, `barely above a whisper`, `eyes darkened`, `jaw tight`, `fists clenched`, `ran a hand through hair`, `time seemed to stop`), enforcing a 1-per-reply cap.
  - Implemented macro-shape auditor `audit_macro_shape` in `styles.js` guarding against `as-if-overuse` (> 2), `every-para-question`, `familiar-closer`, and `door-slam-closer`.
  - Enforced zero raw em-dashes and preserved Emil Kowalski motion constraints in frontend UI.

- **Track 2: Simulation Log Pipeline Harmonization (`src/intelligence/modules/history.js`, `src/utils/story-export.js`, `src/state/log.svelte.js`)**:
  - Implemented `normalize_history_beat` and `canonicalize_role` in `history.js`, unifying turn beat normalization across prompt compilation, story export, and diagnostic logs.
  - Standardized canonical Sovereign entity roles (`USER`, `AI`, `NPC`, `FRACTAL`, `SYSTEM`) and purged generic LLM terminology (`assistant`, `narrator`).
  - Refactored `format_story_beat` in `story-export.js` to consume `normalize_history_beat`, eliminating duplicate cognition stripping and ad-hoc role handling.
  - Added `get_recent_window(limit, offset)` to `SimulationLogStore` in `log.svelte.js` for zero-query in-memory window slicing during active simulation rounds.
  - Added full unit test coverage in `history.test.js`, `story-export.test.js`, and `log.test.js`.

- **Track 1: Sovereign 4-Quadrant RAG & Dynamic Token Budget Reservoir (`src/intelligence/`)**:
  - Implemented `merge_field_content` in `temporal.js`: key-aware pseudo-JSON bracket merger with deletion triggers (`cleared`/`none`) and word-boundary prose truncation.
  - Implemented `calculate_physical_salience`: 0.5x penalty on physical descriptor brackets during narrative turns, 1.5x boost on scheduled image generation turns, and 1.0x on high semantic similarity (>0.80).
  - Implemented `whole_vector_slice`: slices multi-line bracket vectors at clean tag boundaries without mid-bracket cuts.
  - Compressed secondary in-scene NPCs in `entities.js` and `sheets.js`: non-speaking in-scene NPCs render concise 1-2 line summaries combining eternal baseline core and immediate present stance within `<CAST mode="nearby">`, eliminating full sheet bloat while preserving active speaker sheets.
  - Added unit test coverage in `temporal.test.js` and `entities.test.js` validating all 4 quadrants and NPC cast compression.

- **Forensics Protocol Audit Reconciliation (`src/ui/console/`, `memory-rag-budget-architecture.md`)**:
  - Scrubbed user-facing raw em-dashes from `Console.svelte` (rewind system notification) and `StorymodeBar.svelte` (message queue tooltip) into clean punctuation (`:` and `;`).
  - Reconciled sensory instability memory flags in `memory-rag-budget-architecture.md` with runtime code (`temporal.js`), removing non-existent `[hazy recollection]` and retaining canonical `[fragmented recall]`.
  - Baseline aligned motion transition audits (`audit:design`) and future-track features (`finishTail`, `merge_field_content`, `PROSE.GHOSTWRITE.BASE`) against Roadmap Tracks 2, 4, 6, and 7.

---

## `[0.7.0]` - 2026-10-11

- **Sovereign Engine Core & Intelligence Architecture Pulse (Tracks 0 to 3)**:
  - **Track 0: Intelligence Kernel Language & Domain Purity**:
    - Enforced grammar law across instruction tags and 3-layer token contracts (`{...}` build-time, `«ABSOLUTE»` runtime referents, `@` output vocabulary).
    - Pruned dead identity claims and merged `NPC_BOUNDARY` into `CHARACTER.BASE`.
    - Redesigned 3-sentence universal think block shell and streamlined ghostwrite as pure speaker-swap.
    - Derived continuum mandates and profile sorting rules dynamically from `PROFILE_FIELD_CATALOG`.
    - Dissolved `sensory.js` into sovereign domains (`protocols.js`, `entities.js`, `style.js`, `task.js`, `physics.js`, `optics.js`) and stood up automated metasyntax gating (`metasyntax.test.js`).
  - **Track 1: State & Physics Core Unification**:
    - Unified somatic and environmental dynamics in stateless reducer `reduce_dynamics` in `dynamics.js`.
    - Identity-stamped history logs with `origin="${entry.entity_id}"` directly at log creation in `log.svelte.js`.
    - Unified cast registry with explicit presence enum (`'active' | 'nearby' | 'dormant'`) in `runtime.svelte.js`.
    - Universal bracket predicates (`[@TARGET: ...]`) and role target macro expansion.
    - Lifecycle task worker in `job-queue.js` aborting stale background tasks mid-flight on story/round shifts.
  - **Track 2: Hierarchical Memory & 6k Context Protection (Project Prism-DCM)**:
    - Implemented multi-tier tree compactor in `temporal.js` with `PRISM_FANOUT = 8`, rolling Tier 0 turn events into Tier 1 chapters and Tier 2 arcs within height bounds (`COMPACTOR_MAX_HEIGHT = 5`), plus selective leaf expansion.
    - Established context cliff protection (`CONTEXT_TOKEN_CLIFF = 6000`, `HISTORY_TOKEN_BUDGET = 1600`, `RECALL_TOKEN_BUDGET = 800`) proactively pruning lowest-weight leaves and oldest history.
    - Deterministic hybrid retrieval ranker in `temporal.js` (`Score = Entity Overlap × 3.0 + Lexical Frequency × 1.0 + Emotional Salience × 0.4 + Recency × 1.2`) with dynamics-modulated recall clarity (`[fragmented recall]` when Chaos/Entropy > 70).
    - Write-time rot prevention via FNV-1a normalized `eventKey` provenance folding and top 12 known settled facts extraction advisory (`# ALREADY REMEMBERED`) wired into `PROMPT_LAYERS`.
  - **Track 3: Narrative Pacing, Lorebooks & Story Experience**:
    - Built input-proportional pacing contracts in `reflex.js` (`TINY <= 12`, `SMALL <= 90`, `MEDIUM <= 400`, `EXPANSIVE > 400`) with beat budgets, anti-staging constraints, and held-moment detection.
    - Established multi-tier narrative slop linter in `styles.js` with regex clichés and somatic marker caps.
    - Created standalone world-info lorebook engine (`lorebook.js`, `db.js`, `repository.js`) supporting multi-pass key matching (word, glob, regex), secondary filter criteria (`any`, `all`, `not_any`), and budget-sealed `<LOREBOOK>` slot injection.
    - Delivered epistemic hardening (`strip_covert_directives` in `veil.js`), non-preempting concurrent audio streams in `speech.js`, and Director alternative branches in `director.js`.
    - Hardened P1 User Agency with hard-negative anti-hijacking directives in `task.js` and `protocols.js`.

- **Modules Ground Refactor — Phases 1 to 4 (One Compiler Core, Domain Re-Cut & Universal Prompt Plan)**:
  - **Shared Catalog Engine (`src/utils/catalog.js`, `src/utils/index.js`)**: Created centralized dotted-catalog compiler with byte-exact `{token}` interpolation (`interpolate_tokens`), dotted-path traversal with non-leaf guards returning `""` instead of `"[object Object]"`, default spreads, and fallback key policies (`resolve_catalog_atom`). Added unit test suite `catalog.test.js`.
  - **Harmonized Atom Resolvers (`src/intelligence/modules/{system,task,reflex,protocols}.js`)**: Delegated dotted resolution across all intelligence modules to `resolve_catalog_atom`. Preserved `ROLE_DEFAULTS` and `INTERACTION` fallback in `system.js`, record-driven `{tag, body}` enveloped wrapping and `REFLEX.` prefix stripping in `reflex.js`, and unified `STATIC_REGISTRY` with `{ uppercase: true }` in `protocols.js`.
  - **Constitution Plan/Render Split (`src/intelligence/modules/constitution.js`)**: Exported canonical `CONSTITUTION_ORDER` and implemented `resolve_constitution_plan({ laws })` returning a frozen `{ tag: "AXIOMATIC_CONSTITUTION", laws, dropped }` plan. `render_constitution` delegates cleanly through `render_constitution_plan`. Added unit tests in `constitution.test.js`.
  - **Boundary Freeze Discipline (`src/intelligence/modules/entities.js`, `src/intelligence/modules/sheets.js`)**: Enforced frozen arrays across plan boundaries (`active_names`, `dispositions`, `dynamic_axes`, `agendas`), with `render_dispositions` in `sheets.js` reading `active_names` via `.includes(...)` without backwards-compatible fallbacks (P4). Kept `name_to_id` as a frozen Map.
  - **State & Telemetry Decoupling (`src/intelligence/modules/style.js`, `src/intelligence/builder.js`, `src/intelligence/physics.js`, `src/intelligence/modules/history.js`)**: Purified `style.js` by eliminating `state_bridge` imports; centralized global runtime style reads in `builder.js` under `resolve_builder_style_snapshot` to parse styles once per compile cycle in `normalize_context`. Exported canonical `DYNAMICS_METRIC_NAMES` from `physics.js` and dynamically assembled telemetry filtering regexes in `history.js`.
  - **Sensory Domain Consolidation (`src/intelligence/modules/sensory.js`, `src/intelligence/modules/task.js`, `src/intelligence/builder.js`, `src/intelligence/index.js`)**: Created sovereign `sensory.js` consolidating optics directives (`SENSORY_LIBRARY`), camera framing rules (`CINEMATOGRAPHY_RULES`), cinematography preset matching (`resolve_optics_cinematography`), optics task envelope slots (`resolve_optics_think_slot`, `resolve_optics_target_slot`, `resolve_optics_spatial_framing_slot`), optics actor segments & XML assembly using `define_sheet` for frozen specs (`render_optics_entities_xml`), and prompt compilers (`render_optics_prompt`, `render_optics_fallback`). Repointed intelligence barrel exports to `sensory.js` and added dedicated `sensory.test.js`.
  - **Universal Prompt Plan & Distributed Slot Registries (`src/intelligence/prompts.js`, `src/intelligence/builder.js`)**: Implemented Phase 4 manifest-driven prompt generation. Each module exports its own slot resolvers (`resolve_role_slot`, `resolve_constitution_slot`, `resolve_core_protocols_slot`, `resolve_dynamic_axes_slot`, `resolve_entities_slot`, `resolve_history_slot`, `resolve_task_slots`). Manifest records declared in `define_mode` drive ordered layer assembly, variant execution (`variants: { terse }`), epistemic boundary sealing via `verify_epistemic_integrity`, and single-pipeline compilation (`compile_prompt` dispatches `adapter.normalize` -> `resolve_prompt_plan` -> `render_prompt_plan` -> `pack_prompt`). Completely eliminated `assemble_prompt` and procedural `render_*` builders from `builder.js`.
  - **Simulation Audit Contract Alignment (`.agents/skills/simulation/scripts/simulation-audit.js`, `simulation-audit.test.js`)**: Updated `verify_pipeline` and `execute_turn` to assert against `prompt.system` instead of the obsolete `prompt.task` property, aligning the simulation audit suite with the Phase 4 Universal Prompt Plan where `<TASK>` is sealed inside the closed `<SYSTEM>` envelope by `pack_prompt`. Re-verified full project health with `npm run verify` (100% green).
  - **Byte-Identity Verification**: Machine-asserted 0 bytes of prompt drift across all 52 contracts in `prompt-verification.test.js` and 1,293 passing unit tests in `npm run deploy:prepare`.

  - **Director `REFLEX.*` Inverted Delegation (`src/intelligence/modules/task.js`)**: Removed cross-catalog prefix sniffing from `get_directive_atom` making it pure `TASK_LIBRARY`. Moved delegation into `compile_directive_tags`, delegating `REFLEX.*` keys directly to `get_reflex_atom`.
  - **Declarative `CINEMATOGRAPHY_RULES` Catalog (`src/intelligence/modules/task.js`)**: Replaced procedural if/else ladders in `resolve_cinematography_preset` with a pure declarative rules array matching `{ is_fractal_target?, chaos_gte?, intensity_gte?, affinity_gte?, tier?, preset }`.
  - **Signature Modernization & Dead Surface Elimination (`src/intelligence/modules/task.js`, `builder.js`, `physics.test.js`)**: Standardized `render_keyword_directives_xml(content = "", mode = "DIRECTOR")`, eliminating obsolete `directive` string and indentation arguments. Retired `build_task_state` under P4 Zero Backwards Compatibility.
  - **Plan / Render Split**: Implemented `resolve_task_plan(parameters)` returning frozen `{ tag: "TASK", mode, children }` and `render_task_plan(plan)`, with `render_task(parameters)` delegating cleanly through the pair.

- **System Prompt Module & Envelope Unification (Plan Omega for System)**:
  - **Declarative `ROLE_LIBRARY` Data Catalog (`src/intelligence/modules/system.js`)**: Replaced closure-based `SYSTEM_ROLES` with frozen `{ body }` role templates and `{placeholder}` tokens (`INTERACTION`, `NPC`, `NARRATOR`, `DIRECTOR`, `CONTINUUM_CARETAKER`, `NARRATIVE_STRUCTURER`, `ENHANCER`, `SENSORY_CORTEX`). Introduced `ROLE_DEFAULTS` (`ENHANCER: { enhancer_name: "GENERAL" }`) and missing-slot safe resolution to `""` instead of `"undefined"`.
  - **Sovereign Root Envelope Assembly (`src/intelligence/modules/system.js`, `src/intelligence/builder.js`)**: Relocated `PROMPT_LAYERS`, `render_prompt_layers`, `compose_system`, `pack_prompt`, and `resolve_prompt_meta` from `builder.js` into `system.js`, making `system.js` the single owner of the `<SYSTEM>` envelope lifecycle while transforming `builder.js` into a pure coordinator.
  - **Plan / Render Split**: Implemented `resolve_system_plan` returning frozen `{ tag: "SYSTEM", mode, round, attributes, children }` and wired `compose_system` cleanly through `render_system_plan(resolve_system_plan(...))`.
  - **Dead Surface & Contract Purge**: Purged obsolete `closed` flag and dead `task` option from `render_system_xml` under P4 Zero Backwards Compatibility. Corrected stale `recovery.js` comments and retargeted test contracts in `prompt-verification.test.js` and `system.test.js`.

  - **Prompt Action Alignment (`src/intelligence/modules/task.js`)**: Updated `USER_PERSONA_LOCK` to explicitly include `EPILOGUE_COLLAPSED` and `EPILOGUE_CONCLUDED` in its permitted actions list, reconciling the direct contradiction between lock constraints and the routing rules.
  - **Terminal Trauma Severity Grading (`src/intelligence/modules/task.js`)**: Graded `EVALUATION_INPUT` and `EVALUATION_SCENE` to distinguish definitively fatal terminal destruction from severe but survivable bodily trauma, preventing premature story collapse on non-fatal high-stakes injuries.
  - **Image Preservation in Story Exports (`src/utils/story-export.js`)**: Updated `format_story_beat` and `export_story_markdown` to preserve log rows with image attachments and format them as Markdown media (`![prompt](src)`), preventing image loss on empty-text fractal rows.
  - **Bracket Auto-Repair Case 3 Hardening (`src/utils/text.js`)**: Restricted predicate auto-enclosure in `balance_brackets` to strict uppercase keys (`^[A-Z][A-Z0-9_]{1,24}:`) and entity targets (`^@[A-Z0-9_]{1,24}:`), eliminating false-positive pseudo-JSON corruption on natural language dialogue and prose.
  - **Speaker & NPC ID Synchronization (`src/intelligence/director.js`)**: Synchronized `speaker` and `npc_id` in `normalize_director_data` so that `base.speaker` with `npc:<id>` preserves target identity even when paired with an `AI_CHARACTER` action.
  - **Case-Insensitive Story Status Normalization (`src/intelligence/director.js`)**: Normalized `story_status` to match uppercase canonical status values consistently, preventing lowercase valid statuses from falling back to `IN_PROGRESS`.
  - **Environmental Scene Framing Preservation (`src/media/optics.js`)**: Added `staging_has_scene_focus` check to prevent high intensity/affinity dynamics from suppressing wide panoramic framing when explicitly requested in `visual_staging`.
  - **Profile Field Directive Helpers Consolidation & Universal Brackets (`src/data/definitions/profile-fields.js`)**: Merged `HELPERS.BRACKETS` and `HELPERS.RELATIONAL_BRACKETS` into a single unified bracket guideline that instructs and prefers bracket directives across all fields (`eternal.non_physical`, `present.non_physical`, `future`, `eternal.physical`, `present.physical`, `past`) for both characters and fractals while preserving natural prose compatibility, relational dynamics (`[TARGET: dynamic | flags]`), and atomic clearing (`[KEY: none]`).
  - **Contract Size Re-baselining (`src/intelligence/prompt-verification.js`)**: Re-baselined frozen prompt verification bounds (`CONTRACT_SIZES.continuum.task` and `CONTRACT_SIZES.sorting.task`) to match expanded taxonomy directives.
  - **Premade Entities Past String Standardization (`src/data/definitions/premade-entities.js`, `premade-entities.test.js`)**: Standardized `past` memory fields across all premade characters and fractals into direct multiline bracket strings (`[KEY: value | flags]`), aligning with the other five quadrant fields, the Veil string model, and `GEMINI.md` specifications while eliminating legacy vector object arrays (`[{ id, content }]`).
  - **Premade Entities Semantic Bracket Key Overhaul (`src/data/definitions/premade-entities.js`)**: Cleaned and restructured pseudo-JSON bracket keys across all premade characters and fractals. Eliminated meta-keys (`EVENT`, `DETAIL`, `ACTION`, `OUTCOME`, `TRIGGER`, `METHOD`, `CAUSE`, `HISTORY`) in favor of descriptive domain keys (`TOOTHPICK`, `MEASURING_TAPE`, `TANK_GENESIS`, `MAINFRAME_BREACH`, `HIGH_COURT_EXILE`, `ACADEMIC_EXPULSION`), while properly migrating historical events out of `eternal` into `past`.
  - **Relational Bracket `@` Mandatory Prefix & Natural Spaced Keys (`src/intelligence/veil.js`, `veil.test.js`, `premade-entities.js`, `profile-fields.js`, `ARCHITECTURE.md`)**: Enforced that all relational brackets targeting other entities or active roles strictly require an `@` prefix (e.g. `[@BEAST: ...]`, `[@NOVA CITY: ...]`, `[@USER: ...]`), completely eliminating collisions with common nouns or standard character trait keys (`[BEAST: ...]`). Updated all 49 relational brackets in `premade-entities.js` to use `@`, stripped unnecessary underscores from 86 bracket keys to use natural spaces, updated `simulation-audit.js` for string-based past memory handling, and aligned `HELPERS.BRACKETS` and `ARCHITECTURE.md` documentation.
  - **Profile Studio Raw Past Safeguard (`src/ui/profile/Profile.svelte`)**: Hardened raw profile field extraction to automatically map and join content from legacy vector arrays or objects into clean multiline strings, eliminating `[object Object]` rendering bugs and ensuring all historical Dexie entities render as pseudo-JSON cards.
- Active observation of P1 User Agency hard-negative enforcement (Track 1.1).

---

## `[0.6.0]` - 2026-10-03

- **Technical Debt & Codebase Stabilization (ROADMAP Section 1.1–1.4)**:
  - **Simulation Log & Export History Alignment (`src/utils/story-export.js`)**: Harmonized human-facing Markdown story exports with the canonical `filter_narrative_messages` filter from `src/utils/text.js`. Stripped empty-string rows and image beat placeholder tokens from export transcripts when `include_system: false`, preventing phantom entries in exported files while leaving raw system diagnostic logs intact for developer audits.
  - **Tool Script Workspace Path Migration (`.agents/skills/local-scripts/scripts/workspace.js`)**: Purged obsolete references to the retired `tasks/` directory (`tasks/PRESENT.md`, `tasks/future/`) in workspace diagnostic utilities. Retargeted project todo and backlog sync audits directly to authoritative specifications and active `.agents/` runbooks.
  - **Dexie.js 4 Compound Index Health & Latency Profiling (`src/data/db.test.js`)**: Integrated automated profiling test suite benchmarking compound indexes `[story_id+round+seq]`, `[entity_id+field]`, and multi-entry `*npc_ids` across 600+ high-volume mutation batches. Validated sub-millisecond per-round full-entity state reconstruction latencies (< 50ms total for 6 parallel quadrant queries).

  - **Neural Audio TTS & WASM Embedding Mutex Concurrency Verification (`src/utils/onnx.test.js`)**: Extended `OnnxMutex` unit tests to stress-test concurrent, interleaved Kokoro-82M speech synthesis tasks and 384-d semantic embedding tasks under load. Verified strict mutual exclusion (`max_concurrency_observed <= 1`), sequential non-overlapping execution, and error isolation without WASM heap collision.

- **Track 1 Integrity Remediation (ROADMAP 2.1–2.9)**:
  - **Dynamic Cinematic Lens Biasing & Anti-Wide Angle Lock (`src/media/optics.js`, `src/media/optics.test.js`)**: Enhanced `resolve_image_trigger` to bias image tiers away from generic wide landscapes (`story_scene`) toward character portrayals (`story_character`) when the Director's `visual_staging` specifies portrait/intimate cues (close-up, face, eyes, confrontation, wound, touch) or when AI dynamics indicate extreme intensity or affinity ($\ge 75$).
  - **Biological Mortality Limits & Terminal State Arbitration (`src/intelligence/modules/task.js`, `src/intelligence/director.js`, `src/intelligence/director.test.js`)**: Updated `EVALUATION_INPUT` and `ROUTING` in `TASK_LIBRARY` to instruct the Director to strictly enforce biological mortality limits on fatal trauma (drowning, catastrophic injury, death), mandating `next_action: "EPILOGUE_COLLAPSED"` and `story_status: "COLLAPSED"` to prevent casualty amnesia or casual conversation across fatal outcomes. Normalized bidirectional status mapping in `normalize_director_data`.
  - **Director's Note Speaker Lock & P1 Agency Enforcement (`src/intelligence/modules/task.js`)**: Connected `directors_note` explicitly to `next_action` in `TASK_LIBRARY.DIRECTOR.USER_PERSONA_LOCK` and `SCHEMA_ATOMS.directors_note`. Mandated that staging directives must ONLY instruct the chosen next speaker (AI, Fractal, or NPC) and NEVER script, suggest actions, or narrate thoughts for `«USER_PERSONA»`, preventing storyteller prompt bleed and player hijacking.
  - **Bracketed Field History Clock Trigger (`src/ui/profile/Profile.svelte`)**: Restored the Field History Inspector clock trigger button in the header of parsed pseudo-JSON (`safe_parse_pseudo_json`) fields in Profile Studio, ensuring timeline history inspection is visible on fields whether they contain brackets or raw prose.
  - **Bracket Balancing & Sanitization Repair (`src/utils/text.js`, `src/intelligence/temporal.js`)**: Implemented `balance_brackets()` to automatically enclose unclosed (`[KEY: val`) and unopened (`key | w: 8]`) brackets in state strings, and wired it through `sanitize_non_physical_prose` during Memory Forge consolidation so malformed brackets never persist in `present.non_physical`.
  - **Think-Only Turn Recovery (`src/intelligence/story.js`)**: A reply that is only `<think>` blocks triggers one retry with a dialogue directive instead of persisting an empty bubble.
  - **Telemetry Token Deduplication (`src/intelligence/physics.js`)**: `DYNAMICS_DELTA` log tokens are deduplicated via `Set`.
  - **Empty-Row Filtering (`src/utils/text.js`)**: `filter_narrative_messages` drops empty-text rows (image-beat placeholders) from prompt history; placeholders stay `fractal`-role so the feed still renders the image card.
  - Tests: `physics.test.js`, `story.test.js`, `text.test.js`, `prompt-verification.test.js`, `director.test.js`, `optics.test.js`.

- **Session & Timeline Lifecycle & Profile Timeline Mode (ROADMAP Section 1)**:
  - **Profile Timeline Scrubber & Branching (`src/ui/profile/TimelineModal.svelte`, `Profile.svelte`)**: Built full Four-Quadrant timeline mode accessible from Readonly Profile Studio. Scans `db.mutation_ledger` history, reconstructs full profile at round $X$ via `replay_full_entity_at_round`, displays active mutations, and provides both **"Update from this point"** (in-place revert) and **"Clone from this point"** (branching into a new census entity).
  - **Storyboard & Console End Story Guard (`src/ui/console/EndStoryModal.svelte`, `StoryboardBar.svelte`, `Console.svelte`)**: Unified modal dialog replacing legacy unshielded buttons. Presents **"Generate Epilogue & Conclude"** vs. **"Conclude Immediately"** with click-outside / Escape dismissal and busy locks.
  - **Director Evaluation Lens (`src/ui/message/Feed.svelte`)**: Replaced textual indicators in the left-gutter anchor slot with a pure visual lens (frost spinner ring + bouncing dots) that morphs seamlessly into the designated speaker's portrait upon delegation.
  - **Full Entity Replay Codec (`src/data/ledger.js`, `src/data/index.js`)**: Exported `replay_full_entity_at_round` to reconstruct `eternal`, `present`, and `future` quadrants up to any round limit.
  - **Story Entity Snapshots & Reversion (`src/data/sessions.svelte.js`, `src/data/repository.js`)**: Snapshotting active trio on story creation and added `revert_story_entities(story_id)` to restore baseline states.
  - **Director Image & Dynamics Cooldown Persistence (`src/state/runtime.svelte.js`)**: Persisted `last_director_beat_round` and `last_dynamics_beat_round` in `db.stories` via reactive auto-save and `sync()`.
  - **Chrono Mutex Abort Rollback & Title Reset (`src/state/chrono.svelte.js`, `src/state/runtime.svelte.js`)**: On `AbortError`, rolls back `runtime.round = previous_round` and purges the unresponded user turn row from IndexedDB. Added `reset_story_title()` upon starting new stories.
  - **Memory Forge Explicit Round Attribution (`src/intelligence/story.js`, `src/intelligence/temporal.js`, `src/data/sessions.svelte.js`)**: Added `target_round` override in `log_system_entry` and forwarded target forge rounds so background tasks never misattribute events to round $N+1$.

- **Mutation Ledger Hardening & Field History Inspector (Phase B1.1)**:
  - **Dedup-Before-Write Guard (`src/data/ledger.js`)**: Implemented `is_identical_mutation(entry)` to prevent duplicate no-op ledger line appends when mutations carry unchanged values, visibility, and weights.
  - **Visibility & Weight Flag Restoration (`src/data/ledger.js`)**: Added `visibility` (`'show'`/`'hide'`) and `weight` (`number`) columns to `LedgerEntry` schema and payload formatting; updated `replay_entity_field` to preserve flags in `entries_map` and format them in `reconstructed_brackets` (`[@TARGET: dynamic | hide w:8]`).
  - **Director Writer Attribution & Sequence Normalization (`src/intelligence/director.js`)**: Updated `apply_relationships` to inspect prior state before mutations, extract incoming flags, and stamp `seq: 1`, `writer: "director"`, and `decider: "director"`.
  - **Genesis Quadrant Logging (`src/intelligence/profile.js`)**: Extended `birth_entity_core` to write genesis ledger lines across all four populated quadrants (`eternal.physical`, `eternal.non_physical`, `present.physical`, `present.non_physical`, `past`, `future`).
  - **Unified Native JSON Ingestion (`src/ui/entity/ImportModal.svelte`)**: Routed `import_native_json` through `birth_entity_core` with `run_sorter: false` and `generate_portrait: false`, ensuring imported native entities register genesis ledger records.
  - **Memory Forge Compare-Then-Skip Guard (`src/intelligence/temporal.js`)**: In `temporal_engine.consolidate`, inspect prior states across all quadrants (`present.physical`, `present.non_physical`, `eternal.physical`, `eternal.non_physical`, `future`, `past`) before writing mutations, skipping no-ops, populating `old_value`, and setting `decider: "forge"`.
  - **Field History Modal & Inspector UI (`src/ui/profile/FieldHistoryModal.svelte`, `DevWing.svelte`, `Profile.svelte`)**: Implemented `FieldHistoryModal.svelte` providing a timeline audit view and replayed bracket/prose state inspector, accessible from both `DevWing` and `Profile` field header actions.

### Fixed

- **GitHub Actions CI Workflow & Cross-Platform Hook Hardening**:
  - Restored passing status to [`.github/workflows/ci.yml`](.github/workflows/ci.yml) by injecting `npm run sync` before running the verification matrix, generating `src/media/design.css` to satisfy Tailwind CSS v4 linters in CI.
  - Added generated exclude configurations (`jsconfig.json`, `vitest.config.js`) to Prettier ignore rules in [`ignores.master.json`](ignores.master.json) to eliminate formatting discrepancies during continuous integration.
  - Hardened `resolve_repo_root()` in [`.agents/skills/local-scripts/scripts/hooks.js`](.agents/skills/local-scripts/scripts/hooks.js) to verify path existence before relying on `payload.workspacePaths[0]`, falling back cleanly to `process.cwd()`.
  - Replaced hardcoded Windows workspace paths in [`.agents/skills/local-scripts/scripts/hooks.test.js`](.agents/skills/local-scripts/scripts/hooks.test.js) with dynamic `REPO_ROOT` fixtures so all 14 lifecycle hook contracts execute identically on both Windows and Linux CI environments.
- **TextField Header Actions Transition Flicker (UI Polish)**:
  - Removed redundant `in:fade={{ duration: 200, delay: 50 }}` on the `header_actions` slot wrapper in [`src/ui/primitives/TextField.svelte`](src/ui/primitives/TextField.svelte) that conflicted with parent-level modal transitions, eliminating visual double-fade snapping when action toolbars mount.
- **Storyboard Resume Fix (Session Non-Destruction)**:
  - Fixed an issue in [`src/ui/console/ControlPanel.svelte`](src/ui/console/ControlPanel.svelte) where clicking "Return to Storyboard" prematurely invoked `session_driver.clear_active()`, deleting the active story session from memory and persistent settings. Returning to the storyboard now purely transitions the view, preserving `runtime.story_id` and keeping the reactive `ENTER STORYMODE` button functional in `StoryboardBar.svelte`.

- **Universal 4-Quadrant Temporal String Harmonization & Veil Consolidation**:
  - **Veil Engine**: Consolidated `src/intelligence/modules/entities/epistemic.js` directly into `src/intelligence/veil.js` (absorbing `synaptic.js`), providing single-source truth for universal bracket parsing, epistemic filtering, relational graph edge extraction, and secrecy verification.
  - **Layer 7 Module Consolidation**: Merged `src/intelligence/modules/format.js` directly into `src/intelligence/modules/task.js`. Eliminated cross-sibling module imports, uniting turn execution with output schema contracts and directives.
  - **Universal 4-Quadrant Temporal Strings**: Harmonized `character.past` and `fractal.past` to clean multiline bracket text strings (`[KEY: settled fact]`), retiring legacy vector array schemas in `PROFILE_FIELDS`. All 4 temporal quadrants (`eternal`, `present`, `past`, `future`) now operate symmetrically as strings across entities.
  - **Retired Vectors.svelte**: Completely retired and removed `src/ui/profile/Vectors.svelte`. In `src/ui/profile/Profile.svelte`, `past` now renders through the standard chip-parsing view (`safe_parse_pseudo_json`) in read-only mode and the standard `TextField` with Nordic bracket tips in edit mode.
  - **Profile Studio State Pruning**: Pruned dead vector array methods (`add_vector_item`, `patch_vector_item`, `remove_vector_item`, `update_vector_weight`, `enhance_vector_item`, `_vectors_of_type`, `_set_vectors_of_type`) from `src/ui/profile/Profile.svelte.js`.
  - **Scope Boundary**: Left `src/data/definitions/premade-entities.js` untouched per user directive for future review.

- **Universal Bracket & Temporal Pipeline Harmonization**:
  - **Decoupled Macro Protocols**: Relocated canonical prompt macro directives (`MACRO_DIRECTIVES`, `resolve_macro_directive`) from `src/utils/macros.js` to `src/intelligence/modules/protocols.js`, cleaning the utility boundary and centralizing prompt protocols.
  - **Temporal Output Formatting**: Added `BRACKET_FORMAT`, `PLAIN_BRACKET_FORMAT`, and `PLAIN_TEXT_FORMAT` in `src/intelligence/modules/format.js`. Temporal profile fields (`eternal`, `present`, `past`, `future`) now default to structured bracket directives (`[KEY: value | flags]`) across character and fractal pipelines, while non-temporal fields (`name`, `description`, `signature_color`) preserve plain text.
  - **Single-Field Enhancement Cognition (`<THINK>` Block)**: Enabled `<THINK_ENHANCEMENT>` reasoning blocks in `src/intelligence/modules/task.js` and `src/intelligence/prompts.js`, allowing the model to produce hidden scratchpad rationale before emitting enhanced profile fields. Preserved UI sanitization via `strip_cognition_blocks`.
  - **Eliminated Enhancement Self-Context Duplication**: Refactored `render_enhancement_field_context` in `src/intelligence/modules/entities/sheets.js` to exclude the targeted field from `<ENTITY_CONTEXT>`, avoiding token bloat since the targeted value is already provided via `<INPUT channel="content">`.
  - **P4 Zero Backwards-Compatibility Epistemic Privacy**: Purged legacy `| private`, `[SECRET: ...]`, and `[PLAN: ...]` tokens in favor of canonical `| hide` and `| show` directives in `src/intelligence/synaptic.js` and `src/intelligence/modules/entities/epistemic.js`.
  - **Vector Embedding Noise Reduction**: Implemented `strip_bracket_engine_flags` in `src/intelligence/synaptic.js` and integrated into `src/intelligence/temporal.js` to strip engine metadata (`| hide`, `| show`, `| w: N`) before generating semantic vectors, preventing false-positive semantic collisions on terms like "hide".
  - **Profile Studio Edit-Mode Bracket Tip**: Integrated a subtle Nordic advisory in `src/ui/profile/Profile.svelte` that alerts users when any temporal profile field is authored as an unformatted block of prose ($\ge 120$ characters without brackets or linebreaks).
  - **Prompt Verification Baseline Hardening**: Re-froze `CONTRACT` tag inventories and `CONTRACT_SIZES` in `src/intelligence/prompt-verification.js` for enhancement's thinking envelope and universal bracket contracts.

---

## `[0.5.0]` - 2026-09-30

### Changed

- **Documentation Architecture Refactor (Strategic / Tactical / Operational / Governance)**:
  - **`README.md` (Strategic Layer)**: Elevated to the product front door, articulating the simulation philosophy, canonical Story Triad (`active_user`, `active_ai`, `active_fractal`), Director orchestration, supporting secondary character cast, simulation dynamics, and round/turn heartbeat, with a specification navigation grid and minimal quickstart. Completely purged legacy tabletop and DnD terminology in favor of pure AI roleplay simulation.
  - **`ARCHITECTURE.md` (Tactical Layer)**: Cross-referenced with `README.md`, `DESIGN.md`, `SECURITY.md`, and `ROADMAP.md` while maintaining authoritative software architecture in `src/`.
  - **`SECURITY.md` (Tactical Layer)**: Linked bidirectionally to `ARCHITECTURE.md`, `README.md`, and `DESIGN.md`.
  - **`ROADMAP.md` (Tactical FUTURE Mirror)**: Reconciled active sprint status to accurately mark Phase A and 8-bit vector quantization as shipped to `src/`, established `ROADMAP.md` as the FUTURE mirror to `CHANGELOG.md`'s PAST mirror, and codified the Idea Promotion Lifecycle from `.agents/skills/simulation/references/`.
  - **`GEMINI.md` & Skills (Governance)**: Codified the Specification vs. Skill Law (specifications define application-wide truths; skills provide behavioral playbooks and best practices) and established the idea incubator promotion rule. Synchronized Constitutional Authority & Precedence between global and workspace `GEMINI.md`.
  - **Global Customizations & Skills Decoupling**: Synchronized the Four-Layer Documentation Architecture and Temporal Mirrors framework into global `~/.gemini/GEMINI.md`, and decoupled leaked RPGlitch paths, hardcoded layer chains, and stale rule references across global skills (`project-management`, `quality`, `housekeeping`, `refactor`, `javascript`, `git`, `security/references/`).
  - **Skills Alignment**: Updated `.agents/skills/simulation/SKILL.md` and `.agents/skills/audio/SKILL.md` to cross-reference authoritative specifications and accurately reflect media paths.
- **`ARCHITECTURE.md` Alignment & Layer Specifications**:
  - Restructured layer hierarchy to prioritize barrel paths as primary labels (`src/ui`, `src/state`, `src/intelligence`, `src/data`, `src/platform`/`src/media`, `src/utils`), adding `src/utils` to system topology diagram.
  - Documented rationale for state decoupling (headless test portability in Vitest and Node.js without reactive runtime coupling).
  - Harmonized simulation lifecycle into a unified single-round Two-Shot telemetry pipeline:
    - **System Turn**: Evaluates synchronous physics, sanitization, and state rules without invoking an LLM.
    - **Director Turn (Shot 1 / Quick Shot)**: Fast staging and turn arbitration LLM pass (`phase = "generating"`, `director_thinking = true`).
    - **Agent Turn (Shot 2 / Narrative Turn)**: In-character narrative streaming pass from the delegated speaker (`speaker_thinking = true`). State locks (`phase = "locked"`) are reserved strictly for atomic database state commits and timeline persistence.
    - **User Turn**: Concludes the round when the user action is authored and submitted, finalizing the loop and triggering the next.
    - **The Back Shot**: Asynchronous background narrative support (Memory Forge) executed every round on a dedicated queue for vector consolidation and future agenda synthesis.
  - Formulated the **Story** entity triad requirement: a story requires the convergence of User Persona, AI Character, and Fractal entities. Added specifications for the **NPC World Cast (`active_npcs`)** and **Stage Spotlight (`in_scene_npc_ids`)**, noting shared character pool provenance in Dexie.js.
  - Updated Directed Relational Graph to canonical domain terms (`Character -> Fractal`, `Character -> Character`, `Fractal -> Character`), documented `dynamics_baseline`, and renamed `Environmental Dynamics` to **`Fractal Dynamics`**.
  - Synchronized Epistemic Partitioning section with recent implementations (`filter_epistemic_brackets`, private inventory/stash filtering, hidden relational edges `| hide`, `| private` owner secrecy signaling, and `verify_epistemic_integrity`).
- **Stress Test Forensics & High-Yield Remediation Roadmap Planning**:
  - Integrated comprehensive architectural fixes into [ROADMAP.md](ROADMAP.md) derived from live Perchance stress test trace analysis (`rpglitch-stress-test-report.md`, `rpglitch-long-term-review-trace.json`).
  - Staged **Low-Hanging Fruit** at the absolute top of the roadmap for immediate execution: Storyboard Resume fix (preventing `clear_active()` from wiping the active session), `DYNAMICS_DELTA` telemetry string deduplication, empty ghost fractal row removal, and generation mutex abort round rollback.
  - Staged **Core Physics & Directorial Mechanics** as secondary priorities: explicit round target pass to `log_system_entry` to cure 0-forge/2-forge misattribution, `last_director_beat_round` persistence in `db.stories`, dynamic lens biasing in optics task rules (preventing 9/10 Wide environmental lock), and strict physical causality grounding on PC death.

### Added

- **8-Bit Vector Quantization Engine (`src/platform/embeddings.svelte.js` & `src/platform/index.js`)**:
  - Implemented `quantize_vector_q8` and `dequantize_vector_q8` codecs mapping normalized 384-dimensional Float32 embeddings to uint8 `$[0, 255]$` with base64 and Uint8Array serialization.
  - Preserved cosine similarity fidelity $> 0.99$ while slashing vector storage overhead in Dexie.js by 75%.
  - Upgraded `deserialize_embedding` to seamlessly accept Float32Array, JSON number arrays, and quantized base64/Uint8Array representations.
- **Synaptic Bracket Engine Hardening (`src/intelligence/synaptic.js`)**:
  - Restriced `CLEARING_KEYWORDS` strictly to `none` and `cleared`, eliminating silent data loss for natural descriptive states like `[MOOD: normal]`, `[CHEST: bare]`, and `[WOUND: healed]`.
  - Added `private` flag aliasing in `parse_bracket_entries`, ensuring round-trip resilience when owner-compiled strings are re-parsed.
  - Implemented perspective-aware filtering (`'owner' | 'other'`) in `extract_entity_relationships`, preventing private or hidden relational edges (`| hide`) from leaking across viewpoints.
- **Entity Taxonomy Directives Alignment (`src/data/definitions/profile-fields.js`)**:
  - Updated `character.eternal.non_physical` and `character.present.non_physical` directives to explicitly document targeted bracket predicate and relational edge support (`[TARGET: dynamic | flags]`) alongside natural prose.
  - Defined `HELPERS.RELATIONAL_BRACKETS` covering secrecy flags (`hide` / `private`), weights (`w: 1-10`), and atomic clearing syntax (`[KEY: none]`).
- **Relational Edge Bracket Synchronization (`src/ui/profile/RelationalGraph.svelte`)**: Synchronized edge deletion into `present.non_physical` brackets via atomic `[TARGET: none]` directives, preventing stale bracket predicates from shadowing subsequent relationship modifications.
- **Epistemic Wall Audit Hardening (`src/intelligence/modules/entities/epistemic.js`)**: Extended `verify_epistemic_integrity` to audit for unauthorized `| private` leaks across entity boundaries.
- **Test Suite Expansion**: Added unit tests for 8-bit vector quantization, entity fact supersession, and hierarchical tree compaction (1,150 tests passing across 62 suites).

---

## `[0.4.0]` - 2026-09-29

### Added

- Interactive Antigravity planning workflow integration with direct one-click plan execution.

### Changed

- **Documentation Architecture**: Standardized top-level project specifications (`README.md`, `DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CHANGELOG.md`, `SECURITY.md`). Merged domain lexicon directly into `ARCHITECTURE.md` and consolidated technical backlog into `ROADMAP.md`.
- **Agent Workflows**: Consolidated agent skills into four core capabilities (`housekeeping`, `project-management`, `quality`, `refactor`) with backward-compatible alias redirects for legacy command names (`startup`, `planning`, `implement`, `test`, `debug`, `review`).

### Removed

- Standalone `GLOSSARY.md` (content merged into `ARCHITECTURE.md`).
- Standalone `TODO.md` (technical backlog unified into `ROADMAP.md`).

### Verification

- 100% pass across all 61 unit test suites (1,123 tests), design verification tests, and 16/16 Antigravity lifecycle hook contracts.

---

## `[0.3.0]` - 2026-09-24

### Added

- **Simulation Lifecycle States**: Introduced explicit generation stage runes (`#director_thinking`, `#speaker_thinking`) and transition handlers (`start_director_stage`, `set_delegated_speaker`, `start_stream_stage`, `complete`) in `SimulationStateStore` (`src/state/status.svelte.js`).
- **AI Output Hygiene**: Integrated deterministic style sanitization filters in `src/utils/styles.js` and `src/data/definitions/speaking-styles.js` to strip repetitive AI prose patterns and clichés.
- **Developer Tooling**: Added CLI prompt complexity triage utility (`triage-prompt.js`) with density scoring, alongside automated spec-to-code drift detection hooks in `hooks.js`.

### Changed

- **Svelte 5 Reactivity Migrations**:
  - Migrated `src/state/runtime.svelte.js` from a closure store factory (`create_runtime_store`) to an idiomatic `RuntimeEngineStore` class using `$state` fields, native getters, and explicit reactive tracking for structural errors.
  - Converted `src/ui/Storyboard.svelte.js` module latches into a reactive `StoryboardController` class with private runes (`#is_shuffling`, `#begin_flight_started`) and bound controls in `StoryboardBar.svelte`.
  - Replaced legacy arrays/objects with `SvelteSet` across runtime state stores for reactive deduplication of active cast members and stage entities.
- **Director Domain Pipeline**:
  - Refactored `src/intelligence/director.js` into an isolated three-stage dispatch pipeline (Primary ➔ Terse Recovery ➔ Fallback) with local `invoke_llm` execution.
  - Co-located data normalizers with actuators (`in_scene_change` with spotlight assignment; `relationships` with state graph updates).
  - Inlined targeted sanitizers (`keywords`, `story_status`, `visual_staging`, `genesis`) directly within `normalize_director_data`.
  - Standardized runtime diagnostic logging from legacy `[GameMaster]` identifiers to `[Director]`.
- **Prompt Architecture & XML Schemas**:
  - Rebuilt `src/intelligence/prompts.js` into six modular pipeline stages (Envelope Presets, Protocol Composers, Mode Factory, Manifest Switchboard, Resolvers, and Exports).
  - Hoisted ESM imports to enforce clean module boundaries.
  - Aligned prompt envelope layer keys directly with emitted XML tag names (`think` ➔ `think_format`, `inputs` ➔ `input`, `constitution` ➔ `axiomatic_constitution`, `protocols` ➔ `core_protocols`, `target_context` ➔ `target_entity_context`, `nearby_cast` ➔ `cast`, `field_context` ➔ `entity_context`).
- **Codebase Documentation**: Audited 37 modules across `src/` to eliminate redundant divider banners and enforce consistent JSDoc documentation headers.

### Removed

- Deprecated `ENVELOPE_LAYER_TAGS` mapping dictionary following XML tag schema alignment.
- Unused imports in `src/intelligence/modules/task.js` and duplicate changelog comments in `src/media/optics.js`.

### Fixed

- Gracefully handled empty LLM responses in the Director pipeline to prevent unwarranted fallback executions.
- Fixed newline duplication bug in `synchronize_mission_board` within `hooks.js`.

---

## `[0.2.0]` - Earlier Milestones

- Prior architecture and prototype iterations preserved in Git commit history.
