# Changelog

All notable changes to **RPGlitch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Synaptic Bracket Engine (`src/intelligence/synaptic.js`)**: Implemented the universal bracket predicate domain engine (`[KEY: value | flags]`) with brace-depth aware tokenization preserving Perchance `{a|b}` alternations, targeted slice splicing preserving prose/layout, three-way epistemic filtering (`'owner' | 'other' | 'vision'`), deterministic supersession ledger, and cross-field relationship harvesting.
- **Synaptic Test Suite (`src/intelligence/synaptic.test.js`)**: Comprehensive 17-test TDD suite verifying alternations, targeted mutations, clearing atoms, secrecy signals, and relationship extraction.
- **Multi-Tempus Relational Constellation Graph (`src/ui/profile/RelationalGraph.svelte`)**: Harvests universal bracket relationships across all four tempuses (`eternal`, `present`, `past`, `future`), displays multi-tempus badges (🏛️ Eternal, ⚡ Present, 📜 Past, 🚀 Future) in interactive node tooltips, and syncs newly authored bonds directly to `present.non_physical` brackets. Verified by 4 unit tests in `src/ui/profile/RelationalGraph.test.js`.
- **Flat Bracket Temporal Vector Pools (`src/intelligence/temporal.js`)**: Extended `resolve_vector_pool` to parse and resolve flat bracket strings alongside arrays, with emotional salience weight extraction (`w:`) for RAG vector pools, and string-appending support in `append_past_vector`. Verified by 50 unit tests in `src/intelligence/temporal.test.js`.
- Staged generation lifecycle indicators in `src/ui/message/Feed.svelte` displaying Director evaluation status and active delegated speaker thinking states.
- Confirmation modal guard in `src/ui/console/StoryboardBar.svelte` with actions to resume, conclude, or cancel active narrative sessions.

### Changed

- **Epistemic Wall Integration (`src/intelligence/modules/entities/epistemic.js`)**: Routed privacy sanitization through `filter_epistemic_brackets`, preserving secrecy signal (`| private`) for owners while stripping hidden keys for others and checking for uncompiled `| hide` leaks.
- **Relational Dispositions (`src/intelligence/modules/entities/presence.js`)**: Unified `render_dispositions` to harvest entity-keyed relationships from universal bracket predicates with graceful fallback to legacy relationship vectors.
- **Director Quick Shot Relational Actuator (`src/intelligence/director.js`)**: Synchronized incoming relationship updates into universal bracket predicates on `present.non_physical` via `apply_bracket_mutation`.
- **Barrel Exports (`src/intelligence/index.js`)**: Cleanly exported `parse_bracket_entries`, `filter_bracket_entries`, `apply_bracket_mutation`, and `extract_entity_relationships` to the domain intelligence layer.
- Refined sweep duration and gradient opacity curves in `src/ui/motion/Shimmer.svelte` for visual consistency.

---

## [0.4.0] - 2026-09-29

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

## [0.3.0] - 2026-09-24

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

## [0.2.0] - Earlier Milestones

- Prior architecture and prototype iterations preserved in Git commit history.
