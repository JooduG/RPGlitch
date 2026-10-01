# Changelog

All notable changes to **RPGlitch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- **GitHub Actions CI Workflow & Cross-Platform Hook Hardening**:
  - Restored passing status to [`.github/workflows/ci.yml`](.github/workflows/ci.yml) by injecting `npm run sync` before running the verification matrix, generating `src/media/design.css` to satisfy Tailwind CSS v4 linters in CI.
  - Added generated exclude configurations (`jsconfig.json`, `vitest.config.js`) to Prettier ignore rules in [`ignores.master.json`](ignores.master.json) to eliminate formatting discrepancies during continuous integration.
  - Hardened `resolve_repo_root()` in [`.agents/skills/local-scripts/scripts/hooks.js`](.agents/skills/local-scripts/scripts/hooks.js) to verify path existence before relying on `payload.workspacePaths[0]`, falling back cleanly to `process.cwd()`.
  - Replaced hardcoded Windows workspace paths in [`.agents/skills/local-scripts/scripts/hooks.test.js`](.agents/skills/local-scripts/scripts/hooks.test.js) with dynamic `REPO_ROOT` fixtures so all 14 lifecycle hook contracts execute identically on both Windows and Linux CI environments.
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

## [0.5.0] - 2026-09-30

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
  - Implemented `quantize_vector_q8` and `dequantize_vector_q8` codecs mapping normalized 384-dimensional Float32 embeddings to uint8 $[0, 255]$ with base64 and Uint8Array serialization.
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
