# RPGlitch Technical Roadmap

_AUTHORITATIVE SPECIFICATION (2026-10-14) — Unified, code-grounded engineering backlog synthesized from the Sovereign Engine Architecture, the Prompt Pipeline Audit, and the Entity Referencing Master Plan. Code reality pins: workspace `src/` @1827b58 / f1d8d645 (226/226 in sync). Evidence anchors: sim/dossier.md finding IDs (F1–F7, E2, M1, L1–L35), audit_report.md (Round 1 Gothic Baseline), and identified-issues.md (Issues 1–12, 13–22)._

This roadmap defines the authoritative technical backlog, active engineering sprints, and target architectural blueprints for **RPGlitch**.

- **Temporal Mirror**: `ROADMAP.md` is the **FUTURE mirror** representing exclusively the unbuilt delta between current state and desired target state. Completed milestones are recorded in [CHANGELOG.md](CHANGELOG.md) (the **PAST mirror**).
- **Core Specifications**:
  - [README.md](README.md): Strategic product overview, game design, and simulation philosophy.
  - [ARCHITECTURE.md](ARCHITECTURE.md): Authoritative software architecture, layer boundaries, and state reality in `src/`.
  - [DESIGN.md](DESIGN.md): Nordic visual design tokens, typography, and motion contracts.
  - [SECURITY.md](SECURITY.md): Threat defense, input sanitization, and sink controls.
  - [memory-rag-budget-architecture.md](`tmp/memory/memory-rag-budget-architecture.md`): Sovereign memory RAG, token budget reservoirs, and anti-slop specification.
- **Idea Promotion Lifecycle**: Uncommitted mechanical ideas and exploratory proposals incubate in [`.agents/skills/simulation/references/`](.agents/skills/simulation/references/) as `suggestion-*.md`. When an idea is **promoted** from an exploratory possibility into a planned initiative, it is **removed from the incubator and fully migrated into this roadmap**.

---

## 🏛️ System Architecture & The Execution Red Thread

The active engineering delta is organized along a continuous **architectural red thread** designed for maximum execution efficiency. The red thread resolves foundational prompt hygiene and release gating first, establishes directorial governance, unifies the relational macro graph across the Epistemic Wall, hardens memory budgets beneath the context cliff, and concludes with presentation virtualization and empirical live evaluation:

```mermaid
flowchart TD
    subgraph ShippedCore ["Shipped Core Architecture (v0.7.0 – v0.9.0 Sovereign Foundations)"]
        direction TB
        S1["v0.7.0: Intelligence Kernel & State Unification (Tracks 0–4)"]
        S2["v0.8.0: 4-Quadrant RAG, Detox & Stream Beat Backstop (Tracks 1–5)"]
        S3["Phase I: Prompt Pipeline Hygiene, P4 Purges & Release Safety"]
        S4["Phase II: Directorial Governance, Constitution & Syntax Parity"]
        S5["Phase III: Relational Macro Graph, Epistemic Wall & Perspective (Track 6)"]
        S6["Phase IV: Ghostwriter Perspective & Narrative POV Rework (Track 7)"]
        S7["Phase V: Memory RAG Hardening, Context Cliff & Somatics (Tracks 8, 9, 11)"]
        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
    end

    subgraph ActiveBacklog ["Active Engineering Delta (Pending Realignment)"]
        direction TB
        R1["State-of-the-Application Review & Strategic Realignment"]
    end

    ShippedCore ==> ActiveBacklog
```

### 🛡️ Release Engineering & Execution Invariants

- **Prompt Byte Contract Gate:** Any change to prompt-emitted strings alters contract byte-pins and baseline fixtures. Prompt changes are bundled logically to minimize baseline re-cut frequency.
- **Pins-Survive Rule:** Byte-pins in test fixtures must survive refactoring intact unless the prompt's emitted syntax is deliberately altered. When a prompt tag or delimiter changes across modes, all 12 contract modes must be audited and re-pinned together under a single atomic verification pulse.
- **Variant Mechanism Protocol:** Output variants (such as `selfie`, character portraits, and scene visuals) must be resolved at the prompt compiler boundary through explicit schema options rather than ambient state or mutable global singletons.
- **Detox-Trial Calibration:** Generated prose detoxification passes (`detox_prose`) evaluate anti-cliché, authorial voice neutrality, and somatic constraints against calibrated style definitions (`casual`, `lyrical`, `primal`, `clinical`). Trials and threshold calibrations must run against frozen fixtures to preserve somatic physics.
- **Byte-Identity Advantage:** Wherever code deduplication or refactoring achieves identical compiler output, it is deployed as an immediate zero-risk quick win.
- **Empirical Measurement Precedence:** Structural hypotheses that alter generation behavior (e.g. think-before-input sequencing, pacing alterations) are measured through the test harness before locking.
- **P4 Pre-Beta Purity:** Never retain dead compatibility shims, unused layers, or unconsumed schema attributes. Refactor downstream consumers and purge dead code immediately.

---

## 🚀 The Active Engineering Delta

---

### Sprint: State-of-the-Application Review & Track A Local Investigations

A comprehensive, code-grounded review of the running application and execution of Track A (Unblocked Local Investigations) to resolve known state machine bottlenecks, audit prompts, and enforce architectural invariants.

- **Objective**: Execute Track A local investigations and canonical configuration harmonization: fix composer queued state machine, generate prompt atom matrix in audit harness, rebuild central `src/config.js` with literary scale, and wire canonical contracts across intelligence, data, media, and state layers under P4 purity.
- **Scope & Target Files**:
  - `src/ui/message/TelemetryCard.svelte` (consolidated telemetry module unifying quick shot, back shot, and vector resolution; renders individual bracket boxes with clean quadrant headers)
  - `src/ui/message/TelemetryCard.test.js` (telemetry formatting, directed edge parsing, and quadrant tests)
  - `src/ui/message/telemetry-format.js` (clean_text_debris, parse_relationship_edge, vector_label, and entity block projection)
  - `src/intelligence/modules/sheets.js` (render_entity_memory_context clean bracket quadrant rendering for Continuum Caretaker)
  - `src/intelligence/modules/sheets.test.js` (sheets module tests verifying clean quadrant envelopes)
  - `src/data/definitions/premade-entities.js` (flattening 10 premades to universal bracket strings across all 4 quadrants)
  - `src/data/normalizer.js` (schema normalization to 4 flat quadrant strings)
  - `src/intelligence/story.js` (somatic vs fractal dynamics delta scope isolation)
  - `src/ui/console/StorymodeBar.svelte` (composer serialized queue drainer and unstick resilience)
  - `src/config.js` (master canonical system configuration, literary scale, latency tiers, and subsystem domain agreements)
  - `src/intelligence/temporal.js` (memory past, eternal, present character caps and hybrid retrieval scoring weights)
  - `src/intelligence/temporal.test.js` (memory RAG character budget tests)
  - `src/intelligence/modules/history.js` (dialogue and visual feed window defaults and chapter prompt history slice)
  - `src/intelligence/modules/history.test.js` (history defaults contract verification)
  - `src/intelligence/modules/reflex.js` (momentum stagnation tiers, spent ledger window, and opening clause min chars)
  - `src/intelligence/modules/reflex.test.js` (reflex pacing and spent ledger contract tests)
  - `src/data/normalizer.js` (entity schema name bounds, chapter archive capacity, and paragraph summaries)
  - `src/intelligence/dynamics.js` (dynamics scale and image trigger cooldown threshold)
  - `src/intelligence/dynamics.test.js` (dynamics gate unit tests)
  - `src/media/optics.js` (unified 3-round image cooldown arbitration and dynamics scale thresholds)
  - `src/media/optics.test.js` (optics trigger arbitration test suite)
  - `src/intelligence/modules/entities.js` (cast summary word-boundary truncation unified to 100 chars)
  - `src/intelligence/modules/entities.test.js` (cast summary contract tests)
  - `src/utils/text.js` (calibrated CHARS_PER_TOKEN and bracket-safe truncate_at_boundary)
  - `src/utils/text.test.js` (text boundary truncation test suite)
  - `src/utils/html.js` (web and lore ingestion limits wired to canonical system configuration)
  - `src/utils/styles.js` (SOMATIC_MARKER_CAP wired to canonical system configuration)
  - `src/platform/embeddings.svelte.js` (EMBEDDING_SPECS wired to canonical system configuration)
  - `src/platform/llm-gate.js` (honest priority literals with zero external config dependencies)
  - `src/utils/job-queue.js` (de-bloated concurrency queue without phantom lifecycle state)
  - `src/utils/job-queue.test.js` (concurrency worker and superseding test suite)
  - `src/media/visual.svelte.js` (IMAGE_RESOLUTIONS alignment with canonical system configuration)
  - `src/utils/resilience.js` (canonical latency tiers and patience policy circuit breaker defaults)
  - `src/state/status.svelte.js` (freeze watchdog intervals wired to canonical latency tiers)
  - `.agents/skills/simulation/scripts/simulation-audit.js` (automated prompt atom matrix)
  - `.agents/skills/simulation/scripts/simulation-audit.test.js` (wire atom matrix tables into unified report)
  - `.agents/skills/simulation/scripts/consolidation-stress.test.js` (100-round consolidation invariant test)
  - `.agents/skills/local-scripts/scripts/audit-layers.js` (strict layer boundary enforcement gate)
  - `src/ui/message/feed-dom-benchmark.test.js` (feed DOM profiling benchmark)
  - `src/media/audio.test.js` (AudioContext lifecycle and teardown contract verification)
  - `src/intelligence/modules/recency.js` (rebranded dialogue history emitting <RECENT_ROUNDS> and <ENTRY round="..." origin="...">)
  - `src/intelligence/modules/recency.test.js` (recency module contract and window verification)
  - `src/intelligence/modules/sheets.js` (dynamic 4-quadrant RAG entity sheet formatting and boundary-safe truncation)
  - `src/intelligence/prompts.js` (dynamic prompt character headroom metering, director recency dedup, and ghostwriter draft seeding)
  - `src/intelligence/modules/constitution.js` (folded constitution plan into direct render_constitution)
  - `src/intelligence/modules/constitution.test.js` (direct render_constitution contract tests)
  - `src/intelligence/modules/output.js` (direct output string builder without plan wrapper hops)
  - `src/intelligence/modules/protocols.js` (folded protocol plan into direct render_core_protocols and purged catalog usage)
  - `src/intelligence/modules/protocols.test.js` (protocols module unit tests)
  - `src/intelligence/modules/system.js` (direct compose_system with role interpolation without catalog indirection)
  - `src/intelligence/modules/system.test.js` (system composition unit tests)
  - `src/intelligence/modules/task.js` (folded task plan into direct render_task and authorial voice sovereignty dedup)
  - `src/intelligence/modules/task.test.js` (task plan contract tests)
  - `src/intelligence/modules/recency.js` (collapsed sensory and history formatting into direct string builders)
  - `src/intelligence/modules/reflex.js` (direct stability and prose posture builders with inlined atom interpolation)
  - `src/intelligence/modules/entities.js` (inlined actor sheet mapping into render_entity_sheets)
  - `src/intelligence/builder.js` (eliminated to_data_points round-tripping for eternal and present fields; wired has_bracket_bond)
  - `src/intelligence/index.js` (pruned internal plan function exports)
  - `src/data/sessions.svelte.js` (wired universal has_bracket_bond for entity selection bracket checks)
  - `src/utils/catalog.js` (purged obsolete catalog lookup engine)
  - `src/utils/catalog.test.js` (purged catalog test suite)
  - `src/utils/xml.js` (inlined interpolate_tokens and property path traversal in render_atom_xml)
  - `src/utils/index.js` (purged catalog export barrel)
  - `src/intelligence/index.js` (barrel export migration from history.js to recency.js)
  - `src/intelligence/builder.js` (import migration from history.js to recency.js)
  - `src/intelligence/builder.test.js` (contract assertions update for ENTRY and ALTERNATION_OPTIONS)
  - `src/intelligence/director.test.js` (director prompt origin and entry contract tests)
  - `src/intelligence/modules/output.js` (director output formatting and lead-actor staging)
  - `src/intelligence/modules/task.test.js` (task module contract test suite)
  - `src/intelligence/prompt-verification.js` (mode contract envelope definitions and tag inventory)
  - `src/intelligence/prompt-verification.test.js` (universal envelope contract and layer tests)
  - `src/intelligence/prompts.test.js` (prompt compilation and structural tests)
  - `.agents/skills/simulation/scripts/prompt-contract.test.js` (contract byte-pins re-pinning)
  - `src/lib/vitest-examples/Welcome.svelte` (purged obsolete template file)
  - `src/lib/vitest-examples/Welcome.svelte.spec.js` (purged obsolete template test)
  - `src/lib/vitest-examples/greet.js` (purged obsolete template file)
  - `src/lib/vitest-examples/greet.spec.js` (purged obsolete template test)
  - `src/data/ledger.js` (event-sourcing ledger Genesis multiline bracket replay fix and story_id normalization)
  - `src/data/ledger.test.js` (Genesis bracket preservation across single-key updates test suite)
  - `src/data/repository.js` (entity deep clone structuredClone migration and header cleanup)
  - `src/intelligence/modules/style.js` (pure flatten_aesthetic_map trait flattening extraction)
  - `src/intelligence/story.js` (execute_ghostwriter redundant entity sanitization loop purge)
  - `src/intelligence/veil.js` (dead strip_relational_brackets purge)
  - `src/state/runtime.svelte.js` (character getter reduction and save_entity proxy decoupling)
  - `src/App.svelte` (unified run_image_regeneration and run_mock streaming lock)
  - `src/ui/image/ImagePicker.svelte.js` (canonical run_image_regeneration pipeline)
  - `src/ui/image/ImagePicker.svelte` (handle_regenerate deduplication)
  - `src/ui/entity/ContextMenu.svelte` (reusable portalled viewport-clamped context menu component)
  - `src/ui/entity/EntityCard.svelte` (portalled menu deduplication)
  - `src/ui/message/Message.svelte` (portalled badge menu deduplication)
  - `src/state/status.svelte.js` (purged bottom changelog block; WATCHDOG_POLICY direct consumption)
  - `src/state/status.test.js` (WATCHDOG_POLICY timing thresholds test contract)
  - `src/state/log.svelte.js` (purged bottom changelog block; TELEMETRY_CAPS direct consumption)
  - `src/state/log.test.js` (TELEMETRY_CAPS developer log buffer cap test contract)
  - `src/state/interface.svelte.js` (purged bottom changelog block)
  - `src/state/chrono.svelte.js` (purged bottom changelog block)
  - `src/state/index.js` (purged bottom changelog block)
  - `src/state/runtime.test.js` (purged bottom changelog block)
  - `src/utils/bridges.js` (mode-tagged prompt token snapshot recording and peak tracking)
  - `src/intelligence/director.js` (brief input sensory physical micro-directive injection)
  - `src/ui/primitives/Accordion.svelte` (trigger inline caret alignment)
  - `src/ui/primitives/DataBox.svelte` (settled 2-cycle resonance pulse)
  - `src/ui/message/Body.svelte` (collapsible developer mode thoughts accordion)
  - `src/ui/message/TelemetryVector.svelte` (memory card engine flag stripping)
  - `src/ui/message/TelemetryBlocks.svelte` (telemetry block engine flag stripping)
  - `src/ui/message/render.js` (concealed bracket and covert directive suppression)
  - `src/ui/message/render.test.js` (concealed bracket rendering unit tests)
  - `src/ui/message/MessageHeader.svelte` (unextended h-0 header DOM weight elimination)
  - `src/ui/Storymode.svelte` (feed ghost row suppression)
- **Key Modules**: `src/ui/`, `src/state/`, `src/intelligence/`, `src/data/`, `src/media/`, `src/utils/`, `src/config.js`, `src/lib/`.

---

## 🏛️ Master Verification & Auditable Proof Matrix

| Phase / Track                 | Subsystem / Feature                                | Target Files                                                                                                                                                                                                                         | Verification Proof                                                                                                                                                                                                                                                                                                                                       |
| :---------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase I**                   | **Prompt Hygiene & P4 Foundation**                 | `src/intelligence/modules/system.js`, `src/intelligence/builder.js`, `src/intelligence/modules/task.js`, `src/intelligence/modules/protocols.js`, `src/intelligence/modules/reflex.js`, `src/intelligence/prompts.js`, `SECURITY.md` | Lorebook purge clean in `system.test.js`; byte-identical agency output verified; 5-channel registry frozen; alternative branches gated; candidate spatial pointer fixed; `<SPENT_LEDGER>` XML pilot passing in `reflex.test.js`; `<BEAT_BUDGET>` priority asserted; optics split asserted in `protocols.test.js`.                                        |
| **Phase II**                  | **Directorial Governance & Syntax Parity**         | `src/intelligence/modules/constitution.js`, `src/intelligence/prompts.js`, `src/intelligence/modules/task.js`, `src/intelligence/director.js`, `src/intelligence/story.js`, `src/intelligence/dynamics.js`                           | Unit tests asserting `DIRECTOR_CONSTITUTION` rendered in Shot 1 system envelope; deconstructed directives verified; dynamic axes delta attributes verified; typed XML compilers verified across Shot 1; climax sovereignty guard verified; stagnation drift interlocutor comparison verified; Director routing rules & keyword subtext pipeline audited. |
| **Phase III (Track 6)**       | **Relational Macro Graph & Perspective**           | `src/utils/macros.js`, `src/intelligence/veil.js`, `src/intelligence/modules/sheets.js`, `src/intelligence/builder.js`, `src/ui/profile/RelationalGraph.svelte`                                                                      | Secondary NPC identity isolation test passing; veil-first pipeline ordering test clean; `RelationalContext` tuple compiler-side test; 1-word `@id` resolution asserted; replay round-trip attribute compaction test; storage ban standing gate test for turn roles; 360° dossier dedup asserted.                                                         |
| **Phase IV (Track 7)**        | **Ghostwriter Perspective & Narrative POV**        | `src/intelligence/prompts.js`, `src/intelligence/modules/task.js`, `src/intelligence/story.js`, `src/data/definitions/profile-fields.js`                                                                                             | Unit test verifying ghostwrite output reflects persona's POV setting via scoped base; npc-turn regression test pinning Track 0.6 merge behavior; owner `&#124; hide` preserved; decoupled authorial voice test clean.                                                                                                                                    |
| **Phase V (Tracks 8, 9, 11)** | **Memory RAG Hardening, Context Cliff & Somatics** | `src/intelligence/modules/entities.js`, `src/intelligence/modules/sheets.js`, `src/intelligence/temporal.js`, `src/ui/profile/DevWing.svelte`                                                                                        | Unit test verifying `<ENTITIES>` block respects 2,000 token cap; test verifying `&#124; hide` survival across forge consolidation; somatic recall clarity wiring test; live token breakdown bar chart in DevWing functional; background forge concurrency test clean.                                                                                    |

---

## 🏛️ Historical Shipped Milestones

The complete historical specifications, task decompositions, and touchpoint references have been preserved in the archive:

- **[Release Notes (Unreleased)](CHANGELOG.md#unreleased)**: Sovereign Red Thread Phases I through V (Phase I Prompt Pipeline Hygiene & Release Safety, Phase II Directorial Governance & Syntax Parity, Phase III Relational Macro Graph & Perspective, Phase IV Ghostwriter Perspective & Narrative POV Rework, and Phase V Memory RAG Hardening, Context Cliff & Somatics with sub-items 5.1–5.6, token calibration, somatic recall degradation, DevWing token HUD, and design token consolidation).
- **[Release Notes (v0.8.0)](CHANGELOG.md#080---2026-10-12)**: Tracks 1 through 5 (4-Quadrant RAG & Dynamic Token Budget Reservoir, Simulation Log Pipeline Harmonization, Anti-Slop Narrative Detox & The Spent Ledger, Scene Momentum & Stagnation Backstop, Runtime Stream Beat Backstop & Continuation `finishTail`, and P4 Purges).
- **[Release Notes (v0.7.0)](CHANGELOG.md#070---2026-10-11)**: Tracks 0 through 4 (Intelligence Kernel Language & Domain Purity, State & Physics Core Unification, Hierarchical Memory & 6k Context Protection, Narrative Pacing & Story Experience, Task Compiler Deconstruction).

---

## 📌 Parking Lot & Tactical Backlog

- **Sensory Presentation, Virtualization & Live A/B Harness (Former Phase VI)**:
  - _Feed Virtualization Recon & DOM Windowing_: Trace `visible_feed` upstream of `Feed.svelte`; implement measured DOM windowing keeping only visible messages mounted for smooth 60fps scrolling in 100+ turn roleplays. Audit round sequence step increments (`chrono.svelte.js`) under rapid user submissions (`[BUG]` F6).
  - _Slash Command Directing Bar_: Floating shortcut bar above message input allowing direct Director intervention (`/ooc`, `/time`, `/mood`) without polluting in-character dialogue.
  - _Persistent Session Image Archive & Optics Framing Lenses_: Dedicated gallery modal querying Dexie image attachments across the current story with thumbnail caching. Verify scheduled Director Visual Beats faithfully retain camera lenses, framing descriptors, and aesthetic negative maps through `render_optics_prompt`.
  - _Live Prompt A/B Testing & Evaluation Harness on Perchance_: Interactive prompt A/B evaluation harness against Perchance's live endpoint measuring token budget economy, TTFT, `<THINK>` quality, detox compliance, and context truncation resilience. Test cognitive stimulus ordering (`<INPUT>` before `<THINK_FORMAT>`), prose macro shape anti-slop audit integration (`src/utils/styles.js:186`), and think-channel deduplication.
- **Card Conversion & Import Reliability**: Hardened character import parsing and normalization (`src/data/card-conversion.js`, `src/data/card-conversion.test.js`, `src/intelligence/parser.test.js`, `src/intelligence/profile.js`, `src/ui/entity/ImportModal.svelte`, `src/ui/primitives/TextField.svelte`) supporting boxed String coerion, textarea layout formatting, and JSON salvage in parser layers during character card ingestion.
- **Platform Embeddings Retry & Native Config Modernization**: Hardened `src/platform/embeddings.svelte.js` pipeline reset to preserve `_debug_pipeline_fn` under retry during Node/Vitest suites, eliminating ESM cross-origin import errors. Modernized `vitest.config.js` and `vite.config.js` to `import.meta.dirname` and tuned `teardownTimeout: 4000` to prevent fork pool timeouts.
- **Intelligence Suite Type-Narrowing Hardening (`src/intelligence/prompts.test.js`)**: Replaced loose `in` operator assertion (`expect("task" in mode).toBe(false)`) with `Reflect.has(mode, "task")` to resolve TypeScript/IDE `in-operator-narrowing` diagnostics cleanly.
- **Dynamic Turn Headroom Metering & Entity Allocation (`src/intelligence/prompts.js`)**:
  - Dynamically calculate prompt character headroom on a turn-by-turn basis before assembling character profiles.
  - Measure the exact footprint of fixed/supportive modules (`SYSTEM`, `CONSTITUTION`, `PROTOCOLS`, `HISTORY`, `TASK`) in real time, and subtract from `PROMPT_CHAR_ENVELOPE` (20,000 chars) to know the exact remaining character budget available for the `ENTITIES` module (speaker, listener, fractal, and memory vectors), eliminating artificial static budget middleman variables.
- **Simulation Core & Intelligence Pipeline Hardening (Master Investigation Recommendations)**:
  - _1. Primary Cast Sheet Dynamic Compression (`src/intelligence/modules/sheets.js`)_: When total entity content exceeds dynamic turn headroom, compress primary cast sheets (`AI`, `USER`, `FRACTAL`) from `"full"` mode to `"compact"` (retaining physical anchor brackets and active standing agenda).
  - _2. Actor Embodiment vs. Narrator POV (`src/intelligence/director.js`, `prompts.js`)_: Maintain Fractals as strictly 3rd-person environmental entities; when Director delegates to AI, compile in `interaction` mode embodying configured 1st-person POV (_"I"_, _"my gauntlet"_) rather than 3rd-person narrator prose.
  - _3. Hard Constitutional User Sovereignty Boundary (`src/intelligence/modules/constitution.js`)_: Add explicit negative constraint in `<AXIOMATIC_CONSTITUTION>`: _"«USER_PERSONA» dialogue is strictly forbidden. Never emit spoken quotes attributed to «USER_PERSONA»."_
  - _4. Prompt Atom Compaction (`src/intelligence/modules/`)_: Deduplicate sovereignty restatements, trim repetitive scene directives, and simplify `<THINK>` closing boilerplate to reclaim ~100 tokens/shot.
  - _5. Memory Forge Scope Lockdown (`src/intelligence/story.js`)_: In `director_background_queue`, strictly bound entity consolidation to active story cast `[story.ai_id, story.user_id, story.fractal_id, ...(story.npc_ids || [])]`, preventing queries/mutations on inactive Dexie library records.
  - _6. Settled Fact Hallucination Prevention (`src/intelligence/modules/task.js`)_: When somatic fragmentation fires (`Chaos >= DYNAMICS_SCALE.HIGH` `[75]` or `Entropy >= DYNAMICS_SCALE.HIGH` `[75]`) triggering block glyphs (`■■■`), inject into `<TASK>`: _"When recall is degraded (■), acknowledge uncertainty or sensory static. Never invent or hallucinate exact verbatim dialogue."_
  - _7. Canonical Single-Word Slug Generator (`src/utils/text.js`, `normalizer.js`)_: Enforce regex normalization on generated entity bracket handles: uppercase, single-word snake_case (`@LORD_SILVERS`, not `@LORD SILVERS`).
- **Scattered Tuning Constants**: Re-evaluate a dedicated tuning surface (`src/intelligence/config.js` or `tuning.js`) consolidating stagnation trip points inline in `prompts.js:182` (8/16), salience multipliers inline in `temporal.js`, and token budgets in `history.js:81+`.
