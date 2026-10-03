# RPGlitch Technical Roadmap

This roadmap defines the target architectural blueprints, active engineering sprints, queued strategic initiatives, and technical backlog for **RPGlitch**.

- **Temporal Mirror**: `ROADMAP.md` is the **FUTURE mirror** representing the delta between the current state and the desired target state. Its completed counterpart is [CHANGELOG.md](CHANGELOG.md) (the **PAST mirror**).
- **Core Specifications**:
  - [README.md](README.md): Strategic product overview, game design, and simulation philosophy.
  - [ARCHITECTURE.md](ARCHITECTURE.md): Authoritative software architecture, layer boundaries, and state reality in `src/`.
  - [DESIGN.md](DESIGN.md): Nordic visual design tokens, typography, and motion contracts.
  - [SECURITY.md](SECURITY.md): Threat defense, input sanitization, and sink controls.
- **Idea Promotion Lifecycle**: Uncommitted mechanical ideas and exploratory proposals incubate in [`.agents/skills/simulation/references/`](.agents/skills/simulation/references/) as `suggestion-*.md`. When an idea is **promoted** from an exploratory possibility into a planned initiative, it is **removed from the incubator and fully migrated into this roadmap**.

---

## Immediate Priority: Stress Test Forensics & High-Yield Remediation

This track addresses the critical issues identified during live Perchance stress testing (`rpglitch-stress-test-report.md` & `rpglitch-long-term-review-trace.json`). Staged strictly from lowest-effort/highest-yield to deeper prompt mechanics.

### 1. Session & Timeline Lifecycle (Chrono, Mutex & Persistence)

- [x] **Storyboard Resume Fix (Session Non-Destruction)**:
  - **Issue**: Clicking "Return to Storyboard" in [`src/ui/console/ControlPanel.svelte`](src/ui/console/ControlPanel.svelte#L55) calls `await session_driver.clear_active()`, wiping `runtime.story_id`, resetting `round = 0`, and clearing `SESSION_ID_KEY`. When [`src/ui/console/StoryboardBar.svelte`](src/ui/console/StoryboardBar.svelte#L14) mounts, `has_active_story` evaluates to `false` and defaults to `SELECT ENTITIES (0/3)` with dead primary clicks.
  - **Fix**: Remove `session_driver.clear_active()` from "Return to Storyboard". Reserve `clear_active()` exclusively for the explicit, destructive "END STORY" button. Preserving `runtime.story_id` restores the reactive `ENTER STORYMODE` button immediately.
  - **Touchpoint**: [`src/ui/console/ControlPanel.svelte`](src/ui/console/ControlPanel.svelte).
- [x] **Stale Story Title on New Story Launch**:
  - **Issue**: Starting Story #2 carried over Story #1's title in the header for the entire session because `app.story_title` and `app.story_title_parts` were not reset or reconciled when `chrono.start()` synchronized the new session.
  - **Fix**: In [`src/state/chrono.svelte.js`](src/state/chrono.svelte.js), re-assert the newly created session's title via `apply_story_title()` upon `runtime.sync(story_id)`, ensuring stale titles from prior stories are cleared. Added `runtime.reset_story_title()` in [`src/state/runtime.svelte.js`](src/state/runtime.svelte.js).
  - **Touchpoints**: [`src/state/chrono.svelte.js`](src/state/chrono.svelte.js), [`src/state/runtime.svelte.js`](src/state/runtime.svelte.js).
- [x] **Generation Mutex Abort Round Rollback & Message Cleanup**:
  - **Issue**: In [`src/state/chrono.svelte.js`](src/state/chrono.svelte.js#L241-L248), when `error.name === "AbortError"`, `runtime.round = previous_round` is skipped, permanently consuming round numbers. Additionally, the user message was already committed via `session_driver.send()`, creating duplicate user entries upon retry.
  - **Fix**: Roll back `state_bridge.runtime.round = previous_round` on abort, and delete the orphaned unresponded user turn row from Dexie upon cancellation.
  - **Touchpoint**: [`src/state/chrono.svelte.js`](src/state/chrono.svelte.js).
- [x] **Director Image Cooldown Persistence**:
  - **Issue**: `last_director_beat_round` in [`src/state/runtime.svelte.js`](src/state/runtime.svelte.js#L185) is an in-memory-only `$state(-1)` variable. It is not persisted in `db.stories`, resetting to `-1` across page reloads or story transitions and prematurely clearing cooldowns (e.g. R14 $\rightarrow$ R15 back-to-back trigger or R10–R13 skipped evaluation).
  - **Fix**: Persist `last_director_beat_round` and `last_dynamics_beat_round` into `db.stories` via the `runtime.save()` effect and load them on story startup.
  - **Touchpoints**: [`src/state/runtime.svelte.js`](src/state/runtime.svelte.js), [`src/data/repository.js`](src/data/repository.js), [`src/data/db.js`](src/data/db.js).
- [x] **Memory Forge Asynchronous Round Misattribution**:
  - **Issue**: [`src/data/sessions.svelte.js`](src/data/sessions.svelte.js#L413) timestamps `log_system_entry` with live `state_bridge.runtime.round`. Background consolidation completing after the player begins round $N+1$ gets misattributed to round $N+1$, causing 0-forge and 2-forge artifacts (e.g. R8 with 0, R9 with 2). Furthermore, dynamically changing `in_scene_npc_ids` alters `entity_targets.length`, throwing off cursor modulo math and repeating entities back-to-back (e.g. `AI_CHARACTER` forged in both R14 and R15).
  - **Fix**: Accept an explicit `target_round` parameter in `log_system_entry(text, role, meta, story_id, round = null)`. Stabilize cursor rotation in [`src/intelligence/temporal.js`](src/intelligence/temporal.js) by preserving index mappings independently of transient in-scene cast changes.
  - **Touchpoints**: [`src/data/sessions.svelte.js`](src/data/sessions.svelte.js), [`src/intelligence/temporal.js`](src/intelligence/temporal.js), [`src/intelligence/story.js`](src/intelligence/story.js).
- [x] **Storyboard Lifecycle & Navigation Guardrails (EndStoryModal & Profile Timeline Mode)**:
  - **Issue**: Navigating to new stories or concluding stories was unshielded, and historical entity profiles had no timeline-scrubbing or branching mechanics.
  - **Fix**: Integrated unified [`src/ui/console/EndStoryModal.svelte`](src/ui/console/EndStoryModal.svelte) ("Generate Epilogue & Conclude" vs. "Conclude Immediately" with click-outside cancel) across both [`src/ui/console/StoryboardBar.svelte`](src/ui/console/StoryboardBar.svelte) and [`src/ui/console/Console.svelte`](src/ui/console/Console.svelte). Hardened left-gutter Director evaluation lens in [`src/ui/message/Feed.svelte`](src/ui/message/Feed.svelte) (pure visual indicator). Implemented [`src/ui/profile/TimelineModal.svelte`](src/ui/profile/TimelineModal.svelte) with "Update from this point" and "Clone from this point" timeline branching across all 4 quadrants (`eternal`, `present`, `past`, `future`).
  - **Touchpoints**: [`src/ui/console/EndStoryModal.svelte`](src/ui/console/EndStoryModal.svelte), [`src/ui/console/StoryboardBar.svelte`](src/ui/console/StoryboardBar.svelte), [`src/ui/console/Console.svelte`](src/ui/console/Console.svelte), [`src/ui/message/Feed.svelte`](src/ui/message/Feed.svelte), [`src/ui/profile/Profile.svelte`](src/ui/profile/Profile.svelte), [`src/ui/profile/TimelineModal.svelte`](src/ui/profile/TimelineModal.svelte), [`src/data/ledger.js`](src/data/ledger.js), [`src/data/index.js`](src/data/index.js).
- [x] **Runtime Lifecycle Orchestration & Storyboard Guardrails**:
  - **Scope**: State machine lifecycle management, speaker generation indicators, storyboard navigation guards, and UI transition timings.
  - **Status**: Completed & Integrated.
  - **Deliverables**:
    - _Deterministic Generation Flow_: Enforces 7-step turn progression (user action -> Director visual lens shimmer in left gutter -> designated speaker portrait mounts -> bubble mounts & typewriter streams -> completion chime).
    - _Active Session Navigation Guard_: Replaced unshielded triggers with unified `EndStoryModal` in `StoryboardBar.svelte` and `Console.svelte` ("Generate Epilogue & Conclude" vs "Conclude Immediately" with backdrop cancel).
    - _Flicker Elimination_: Latched speaker resolution in feed column until Director evaluation settles.
  - **Touchpoints**: [`src/ui/console/EndStoryModal.svelte`](src/ui/console/EndStoryModal.svelte), [`src/ui/console/StoryboardBar.svelte`](src/ui/console/StoryboardBar.svelte), [`src/ui/console/Console.svelte`](src/ui/console/Console.svelte), [`src/ui/message/Feed.svelte`](src/ui/message/Feed.svelte).

### 2. Feed, Visual & Output Integrity

- [ ] **Ghost Empty Fractal Rows on Image Beats**:
  - **Issue**: [`src/media/visual.svelte.js`](src/media/visual.svelte.js#L903) calls `log_message("", "fractal", ...)` to mount image placeholders, polluting the conversation feed and Dexie log with empty string entries.
  - **Fix**: Decouple placeholder attachment records from dialogue messages, or classify them strictly as `role: "system"` with `type: "image_beat"` and filter empty strings from conversational dialogue queries.
  - **Touchpoint**: [`src/media/visual.svelte.js`](src/media/visual.svelte.js).
- [ ] **AI Think-Only Turn Prevention & Recovery**:
  - **Issue**: In Round 9 of the live stress test, the AI emitted only internal reasoning (`<THINK>...</THINK>`) with 0 prose. Because the raw string was non-empty, it passed empty checks and committed an empty bubble to the conversation log.
  - **Fix**: In [`src/intelligence/story.js`](src/intelligence/story.js), check `strip_cognition_blocks(persisted_text).trim().length === 0`. If prose is missing entirely after stripping `<think>` tags, trigger the completion retry directive or treat it as an empty turn rather than persisting an empty bubble.
  - **Touchpoint**: [`src/intelligence/story.js`](src/intelligence/story.js).
- [x] **TextField Header Actions Transition Flicker (UI Polish)**:
  - **Issue**: The `header_actions` slot wrapper in [`src/ui/primitives/TextField.svelte`](src/ui/primitives/TextField.svelte) carried a redundant `in:fade` directive that conflicted with parent-level transitions, causing a double-fade flicker when the actions panel appeared.
  - **Fix**: Remove the redundant `in:fade={{ duration: 200, delay: 50 }}` from the `header_actions` wrapper `<div>`.
  - **Touchpoint**: [`src/ui/primitives/TextField.svelte`](src/ui/primitives/TextField.svelte).
- [ ] **Cinematic Framing Dynamic Lens Biasing (Anti-Wide Lock)**:
  - **Issue**: 9 out of 10 images stayed locked in Wide Environmental framing because `story_scene` tier unconditionally compiles `OPTICS.FIRST_SENTENCE_MANDATE.SCENE` and `ENVIRONMENTAL_SCALE` in [`src/intelligence/prompts.js`](src/intelligence/prompts.js#L192-L215) and [`src/intelligence/modules/task.js`](src/intelligence/modules/task.js#L187-L202), overriding close-up cues.
  - **Fix**: Allow the Director's `visual_staging` to selectively trigger `story_character` or dynamically toggle `FIRST_SENTENCE_MANDATE.ENTITY` when character intimacy or physical confrontation is declared.
  - **Touchpoints**: [`src/intelligence/prompts.js`](src/intelligence/prompts.js), [`src/intelligence/modules/task.js`](src/intelligence/modules/task.js), [`src/media/optics.js`](src/media/optics.js).

### 3. Directorial Dynamics & Narrative Boundaries

- [ ] **P1 User Agency Enforcement (Anti-First-Person Hijacking)**:
  - **Issue**: In rounds 3 and 6 of the live stress test, the AI persona hijacked the user persona in the first person ("my thigh... I adjust posture", "I slam my palm").
  - **Fix**: Add a hard-negative prompt constraint in [`src/intelligence/modules/task.js`](src/intelligence/modules/task.js) (`CHARACTER.BASE` / `CHARACTER.INTERACTION`) forbidding the AI from using first-person pronouns ("I", "my", "we") on behalf of the player/user persona, and reinforcing that only third-person descriptive observation of the user is permitted.
  - **Touchpoints**: [`src/intelligence/modules/task.js`](src/intelligence/modules/task.js), [`src/intelligence/prompts.js`](src/intelligence/prompts.js).
- [ ] **Telemetry String Duplication (`DYNAMICS_DELTA`)**:
  - **Issue**: Telemetry snapshot strings in [`src/intelligence/physics.js`](src/intelligence/physics.js#L512-L558) concatenate duplicate metric tokens (e.g. `Chaos +2 | Intensity +8 ... Chaos +2 | Intensity +8`), bloating the simlog and HUD banners.
  - **Fix**: Deduplicate `log_strings` entries via a `Set` before joining with `|`.
  - **Touchpoint**: [`src/intelligence/physics.js`](src/intelligence/physics.js).
- [ ] **Fatal Stakes & Physical Causality Grounding (Death & Collapse)**:
  - **Issue**: In Round 18, explicit PC drowning death was ignored by the Director and the AI character hallucinated that the player was still standing and kneeling with Benedict's hand on their throat.
  - **Fix**: Enforce strict physical outcome evaluation in Director Task directives (`DIRECTOR.EVALUATION_INPUT`). When fatal terminal states are stated, mandate emitting `next_action: "EPILOGUE_COLLAPSED"` and `story_status: "COLLAPSED"`. In character generation prompts, forbid resurrecting or altering declared biological outcomes.
  - **Touchpoints**: [`src/intelligence/prompts.js`](src/intelligence/prompts.js), [`src/intelligence/modules/task.js`](src/intelligence/modules/task.js), [`src/intelligence/director.js`](src/intelligence/director.js).

---

## Sovereign Architecture Blueprint: Clean-Slate Engine Reconstruction

This umbrella blueprint establishes the first-principles architectural unification of RPGlitch's core simulation runtime, deconstructing duplicate representations and eliminating legacy shims under **P4 Zero Backwards Compatibility (Pre-Beta Purity)**.

### Architectural Pillars

```mermaid
flowchart TD
    subgraph Sovereign Engine Topology
        ENT["1. Unified Entity Cast Registry<br>(Presence state: active | nearby | dormant)"]
        UPM["2. Universal Predicates & Macros<br>(All state, relations & macros unified)"]
        RED["3. Pure Functional Dynamics Reducer<br>(Input -> Deltas -> Baseline/Gravity -> Clamped State)"]
        EVT["4. Identity-Stamped History Log<br>(Origin Entity ID stamped at birth)"]
        QUE["5. Durable Lifecycle Task Worker<br>(Round/Story-keyed execution gates in job-queue.js)"]
    end

    ENT --> UPM
    UPM --> RED
    RED --> EVT
    EVT --> QUE
```

1. **Unified Entity Cast Registry (Scene Presence & Genesis)**:
   - Consolidate active trio and NPCs into a single entity cast registry.
   - Presence tracked strictly via explicit state enum: `'active' | 'nearby' | 'dormant'` (no detached `in_scene_npc_ids` array or fuzzy prefix-stripping lookups).
   - Genesis instantiates an Entity directly with `presence: 'active'` and an assigned `entity_id`.
2. **Universal Predicates & Macro Relational Engine**:
   - **Active Tactical Plan**: [`universal_predicates_and_macro_relational_plan.md`](file:///c:/Users/johng/.gemini/antigravity-ide/brain/63039ce3-5ee6-45f8-bcc6-42462dd704ed/universal_predicates_and_macro_relational_plan.md).
   - Retire the legacy `entity.relationships: string[]` array completely.
   - All relational dynamics stored as universal bracket predicates with `@` entity keys across temporal layers:
     - `eternal.non_physical`: Baseline foundational bonds (`[@JULIEN: childhood bond]`).
     - `present.non_physical`: Immediate situational dynamics (`[@USER: fierce protection | hide]`).
   - Dynamic role targets (`[@USER: ...]`, `[@CHAR: ...]`, `[@FRACTAL: ...]`) and **Unified Perspective Resolution** (`{me}` = Source Entity, `{you}` = Target Entity) integrated natively.
   - Pre-resolve alternations or bind them to structured Director slots rather than guessing via post-hoc regex string diffing.
   - Consolidate presence and sheets modules into `src/intelligence/modules/entities.js`.
   - **Touchpoints**: [`src/utils/macros.js`](src/utils/macros.js), [`src/utils/macros.test.js`](src/utils/macros.test.js), [`src/intelligence/modules/protocols.js`](src/intelligence/modules/protocols.js), [`src/intelligence/modules/protocols.test.js`](src/intelligence/modules/protocols.test.js), [`src/intelligence/modules/task.js`](src/intelligence/modules/task.js), [`src/intelligence/modules/entities.js`](src/intelligence/modules/entities.js), [`src/intelligence/veil.js`](src/intelligence/veil.js), [`src/intelligence/veil.test.js`](src/intelligence/veil.test.js), [`src/intelligence/director.js`](src/intelligence/director.js), [`src/intelligence/story.js`](src/intelligence/story.js), [`src/intelligence/story.test.js`](src/intelligence/story.test.js), [`src/intelligence/builder.js`](src/intelligence/builder.js), [`src/intelligence/temporal.js`](src/intelligence/temporal.js), [`src/intelligence/temporal.test.js`](src/intelligence/temporal.test.js), [`src/intelligence/physics.js`](src/intelligence/physics.js), [`src/intelligence/physics.test.js`](src/intelligence/physics.test.js), [`src/intelligence/prompts.test.js`](src/intelligence/prompts.test.js), [`src/intelligence/prompt-verification.test.js`](src/intelligence/prompt-verification.test.js), [`src/intelligence/profile.js`](src/intelligence/profile.js), [`src/ui/profile/RelationalGraph.svelte`](src/ui/profile/RelationalGraph.svelte), [`src/ui/profile/RelationalGraph.test.js`](src/ui/profile/RelationalGraph.test.js), [`src/ui/profile/Profile.svelte`](src/ui/profile/Profile.svelte).
3. **Pure Functional Dynamics Reducer (`src/intelligence/dynamics.js`)**:
   - Rename `physics.js` $\rightarrow$ `dynamics.js` and gather **all** dynamics calculations into one module.
   - Export pure reducer `reduce_dynamics(current, deltas, baselines, entropy) => next_dynamics` uniformly for all entities.
4. **Identity-Stamped History Log**:
   - Stamp `entity_id` onto log entries at creation in `src/state/log.svelte.js`.
   - Prompt compilation directly emits `<ENTRY origin="${entry.entity_id}">`, eliminating runtime reverse name-to-ID lookup maps (`_attach_history_origins`).
5. **Durable Lifecycle Task Worker (`src/utils/job-queue.js`)**:
   - Enhance `job-queue.js` with session/round context gating (`queue.run(task, { story_id, round, latest: true })`).
   - Aborts stale background tasks automatically with `{ stale: true }` if the story switches or round advances mid-flight.

---

## Active Sprint: Hierarchical Memory Compaction & Entity State Graph

- **Reference Identifier**: `memory-compaction-and-state-transitions`
- **Origin & Heritage**: Derived from MoeChat's proven **Project Prism-DCM** architecture (`SPEC-prism.md`, `SPEC-context-limit.md`), adapted for RPGlitch's multi-entity Svelte 5 simulation runtime.
- **Current Status**:
  - ✅ **Phase A Completed & Shipped**: Universal Bracket Predicates, Veil Engine (`src/intelligence/veil.js`, `src/intelligence/veil.test.js`), Layer 7 Format Consolidation (`src/intelligence/modules/task.js`), Universal Temporal String Harmonization & Vectors Retirement (`src/data/definitions/profile-fields.js`, `src/ui/profile/Profile.svelte`, `src/ui/profile/Profile.svelte.js`, `src/ui/profile/Vectors.svelte`, `src/ui/profile/index.js`), and 8-Bit Vector Quantization (`src/platform/embeddings.svelte.js`) are fully implemented and passing all tests in `src/`.
  - ✅ **Phase B1 Completed & Shipped (Mutation Ledger & Event Sourcing)**: Dexie `mutation_ledger` schema table (`src/data/db.js`), ledger event-sourcing module (`src/data/ledger.js`, `src/data/ledger.test.js`), hybrid materialized state persistence with round-decay stamping, non-physical bracket preservation across forge summary rewrites, and unified entity birth core (`birth_entity_core` in `src/intelligence/profile.js` and `src/ui/entity/ImportModal.svelte`).
  - ✅ **Phase B1.1 Completed & Shipped (Ledger Hardening & Read-Side History Inspector)**: Dedup-before-write guard (`is_identical_mutation`), Memory Forge compare-then-skip guard across all quadrants in `src/intelligence/temporal.js`, visibility/weight flag columns and replay restoration, sequence (`seq: 1`) & writer/decider (`"director"`) reconciliation in `director.js`, genesis quadrant logging across all 4 quadrants in `profile.js`, native JSON birth unification in `ImportModal.svelte`, and read-side `FieldHistoryModal.svelte` timeline and reconstructed state inspector in `DevWing` & `Profile`.
  - 🔄 **Phase B2 In Progress (Active Delta)**: Memory Forge Chapter Consolidation (Tier 1 Chapter nodes, Tier 2 Arc nodes with fanout: 8), prompt middle-out 6,000-token cliff protection, and deterministic hybrid lexical retrieval ranking.
- **Sprint Scope**: Memory Forge consolidation, mutation ledger event sourcing, universal bracket state grounding, deterministic hybrid lexical retrieval, write-time rot prevention, and 8-bit vector quantization.
- **Touchpoints**: [`src/data/db.js`](src/data/db.js), [`src/data/ledger.js`](src/data/ledger.js), [`src/data/ledger.test.js`](src/data/ledger.test.js), [`src/intelligence/temporal.js`](src/intelligence/temporal.js), [`src/intelligence/profile.js`](src/intelligence/profile.js), [`src/intelligence/director.js`](src/intelligence/director.js), [`src/ui/entity/ImportModal.svelte`](src/ui/entity/ImportModal.svelte), [`src/ui/profile/FieldHistoryModal.svelte`](src/ui/profile/FieldHistoryModal.svelte), [`src/ui/profile/DevWing.svelte`](src/ui/profile/DevWing.svelte), [`src/ui/profile/Profile.svelte`](src/ui/profile/Profile.svelte), [`src/ui/profile/RelationalGraph.svelte`](src/ui/profile/RelationalGraph.svelte).

---

## Architecture Blueprint: Hierarchical Memory & State Reconciliation

### Technical Rationale

1. **Mutable State Invalidation Failure (Memory Collision)**
   In `src/intelligence/temporal.js`, historical turns are stored as a flat array capped at `PAST_VECTOR_CAP = 20`. When state changes over time (for example, Turn 3 records an acquired weapon and Turn 12 records its destruction), both entries remain active in the vector index. Similarity search retrieves both contradictory states, leading to context window hallucination.
2. **Hard Window Eviction & Early Loss**
   When history exceeds 20 items, a basic FIFO eviction strategy (`evict_oldest_evictable`) permanently discards early events, truncating initial setup and core character arcs.
3. **Inference Latency & Mutex Contention**
   Semantic search via Transformers.js ONNX embeddings blocks on the main thread and contends for resources with Kokoro TTS audio synthesis. Cold-starts or thread locks degrade retrieval responsiveness.
4. **Middle-Out Truncation Boundary (The 6,000-Token Cliff)**
   As proven in MoeChat's empirical testing (`SPEC-context-limit.md`), exceeding the model server's recommended context window (~6,000 tokens) causes silent, unannounced middle-out prompt truncation: the server keeps ~3,000 tokens of the head and ~3,000 tokens of the tail while discarding the middle without error. RPGlitch's context compiler must proactively fit prompts within this boundary.
5. **IndexedDB Storage Bloat**
   Storing uncompressed 384-dimension Float32 arrays directly inside Dexie.js causes rapid storage growth.

### Systems Design & Data Flow

```mermaid
flowchart TD
    TurnLogs["Simulation Event Stream"] --> Extractor["Entity & Event Extraction Pipeline"]

    subgraph MemoryEngine ["Memory & State Engine (Prism-DCM Architecture)"]
        Extractor --> StateMachine["State Reconciliation Manager"]
        StateMachine --> |"Commit Active Fact"| FactGraph["Current State Graph (Single Source of Truth)"]
        StateMachine --> |"Mark Deprecated"| SupersededStore["Superseded State Ledger (Audit Trail)"]

        Extractor --> |"Append Event"| Tier0["Tier 0: Atomic Turn Events"]
        Tier0 --> Compactor["Hierarchical Tree Compactor (Fanout: 8)"]
        Compactor --> Tier1["Tier 1: Chapter Summary Nodes"]
        Compactor --> Tier2["Tier 2: Narrative Arc Nodes"]

        HybridSearch["Hybrid Retrieval Engine (Lexical Baseline + Additive Cosine)"]
        FactGraph --> HybridSearch
        Tier0 --> HybridSearch
        Tier1 --> HybridSearch
        Tier2 --> HybridSearch
    end

    HybridSearch --> ContextBuilder["Context Window Compiler (Middle-Out Protection)"]
    ContextBuilder --> PromptBuffer["Structured Context Injection (<CURRENT_STATE> + <HISTORICAL_CONTEXT>)"]
```

### Technical Specifications

#### Universal Bracket State Grounding (Layer 1)

- Ground physical, relational, and psychological presence exclusively in **Universal Bracket Predicates** (`present.physical` / `present.non_physical`).
- **Atomic Bracket Overwrites**: Overwrites occur natively in-place (`[SHIRT: sweater]` replaces `SHIRT` cleanly).
- **Universal Atomic Clearing**: `[KEY: none]` or `[KEY: cleared]` removes that specific key, preserving natural descriptive states like `[MOOD: normal]`.
- Active prompts receive only current verified brackets in `<CURRENT_STATE>`, with zero foreign fact accumulation tables or legacy state collisions.

#### Multi-Tier Compaction & Ghost Tokens (Layer 2)

- **Tier 0**: Direct extraction of key turning-point events (`addEvent`).
- **Tier 1 (Chapters)**: When a Tier 0 cluster reaches the fanout threshold (`prismFanout = 8` events), roll the window into a consolidated summary anchor node flagged with `ghost: true`.
- **Tier 2 (Arcs)**: Condense sets of Tier 1 summaries into high-level campaign milestones. Height capped at level 5 (`prismMaxLevel = 5`).
- **Selective Leaf Expansion**: Top-level summary anchors persist in baseline context; matching real-time input keywords dynamically expands only the relevant child events (`expandLeaf`, oldest-first) into working context while suppressing the parent summary line.
- **Offline Summary Default**: Node compaction computes deterministically offline without blocking on LLM calls; optional background AI passes upgrade summaries asynchronously.

#### Deterministic Hybrid Retrieval & Semantic Gravity

- Base ranking computes instantaneously without waiting for embedding generation:

$$\text{Score} = (\text{Entity Overlap} \times 3.0) + (\text{Lexical Frequency} \times 1.0) + (\text{Emotional Salience} \times 0.4) + (\text{Recency} \times 1.2)$$

- Semantic cosine similarity is integrated as an additive multiplier ($\times 1.5$) whenever embedding threads are idle, avoiding hard dependencies on model execution.

#### Write-Time Rot Prevention & Extraction Advisory

- **Extraction Advisory (`# ALREADY REMEMBERED`)**: Before extracting from new turns, supply the extraction prompt with the top 12 known facts/events to prevent re-extracting existing information under different wording.
- **Event Deduplication**: Hash normalized event strings (`eventKey`) to fold duplicate extractions into existing node provenance instead of appending redundant records.

#### Vector Quantization (int8)

- Downscale 384-dimensional vector arrays from 32-bit floats to 8-bit integers (`Uint8Array`) serialized as base64 strings.
- Reduces Dexie.js vector storage overhead by 75% while maintaining cosine similarity preservation $> 0.99$.

### Implementation Touchpoints

- `src/intelligence/veil.js` & `src/intelligence/veil.test.js`: Consolidated Veil Engine providing universal bracket predicate parsing, brace-depth tokenization, targeted slice splicing, 3-way epistemic filtering, and cross-tempus relationship harvesting.
- `src/data/definitions/profile-fields.js` & `src/data/definitions/profile-fields.test.js`: Entity taxonomy definitions and generation directives aligned with universal bracket predicates, relational targeting (`[TARGET: dynamic | flags]`), and atomic clearing.
- `src/intelligence/index.js`: Barrel exports for universal bracket predicate domain functions (`parse_bracket_entries`, `filter_bracket_entries`, `apply_bracket_mutation`, `extract_entity_relationships`).
- `src/intelligence/director.js`: Relational actuator synchronizing incoming dynamics onto `present.non_physical` via `apply_bracket_mutation`.
- `src/intelligence/temporal.js` & `src/intelligence/temporal.test.js`: Leverage existing `entity.chapters` and `temporal_engine.consolidate` for Macro-Quest milestones, and update `compute_relevance()` with the hybrid retrieval formula.
- `src/ui/profile/RelationalGraph.svelte` & `src/ui/profile/RelationalGraph.test.js`: Multi-tempus relationship constellation graph harvesting cross-tempus bracket relationships with tempus badges.
- `src/platform/embeddings.svelte.js` & `src/platform/embeddings.test.js`: Add `quantize_vector_q8()` and `dequantize_vector_q8()` serialization codecs.
- `src/platform/index.js`: Barrel export `quantize_vector_q8` and `dequantize_vector_q8`.
- `src/intelligence/modules/task.js`: Consolidated task and format module. Format context injection into isolated `<CURRENT_STATE>` and `<HISTORICAL_CONTEXT>` blocks, plus temporal bracket formats (`BRACKET_FORMAT`, `PLAIN_BRACKET_FORMAT`, `PLAIN_TEXT_FORMAT`). Added `TASK_LIBRARY.PROTOCOLS.THINK_ENHANCEMENT`, updated `TASK_LIBRARY.SORTING` for bracket-first temporal layers, wired macro directive resolvers, and configured `think_format: "prose_think"` for enhancement.
- `src/intelligence/modules/protocols.js` & `src/intelligence/modules/protocols.test.js`: Relocated canonical macro directives (`MACRO_DIRECTIVES`, `resolve_macro_directive`) and centralized protocol library definitions.
- `src/intelligence/modules/entities.js`: Consolidated entity presence, candidate cast, and profile sheet rendering into a single sovereign module with bracket-driven dynamic harvesting and self-context elimination.
- `src/intelligence/prompts.js` & `src/intelligence/prompts.test.js`: Configured `enhancement` mode with `think_format: "enhancement"` and `format: { mode: "temporal_field" }`.
- `src/intelligence/builder.js` & `src/intelligence/builder.test.js`: Wired `resolve_macro_directive` import from `protocols.js`, and updated `render_enhancement` with temporal bracket format detection and thinking block compilation.
- `src/intelligence/profile.js` & `src/intelligence/profile.test.js`: Verified single-field and multi-field profile enhancement pipelines with sibling context and bracket format assertions; pruned legacy entity relationship arrays.
- `src/intelligence/physics.test.js`: Verified physics engine integration with consolidated entities module and universal bracket mechanics.
- `src/intelligence/prompt-verification.js` & `src/intelligence/prompt-verification.test.js`: Enforced tag inventory and size tripwires for universal bracket contracts and enhancement thinking envelope.
- `src/ui/profile/Profile.svelte`: Profile Studio edit-mode Nordic tip banner prompting bracket structure when temporal fields contain unsegmented prose blocks ($\ge 120$ chars).
- `src/utils/macros.js` & `src/utils/macros.test.js`: Decoupled prompt macro directives into `src/intelligence/modules/protocols.js` and expanded universal macro token replacements.

---

## Queued Strategic Initiatives

### 1. Dynamic Pacing Contracts & Prose Heuristics Engine

- **Scope**: Turn-size proportional scaling, anti-staging constraints, runtime slop linting, and held-moment detection.
- **Status**: Queued in backlog.
- **Origin**: MoeChat's Reply Models specification (`SPEC-models.md` §5, §8, §13).
- **Target Deliverables**:
  - **Input-Proportional Sizing**: Deterministically classify user input in `src/intelligence/modules/task.js`:
    - `TINY` ($\le 12$ chars or action-only): Clamp generation to 1 beat. A simple "hey" or nod receives a focused single response, never an unprompted essay.
    - `SMALL` ($\le 90$ chars): Clamp generation to $\le 2$ beats.
    - `MEDIUM` ($\le 400$ chars): Allow standard narrative pacing ($\le 4$ beats).
    - `EXPANSIVE` ($> 400$ chars): Allow full narrative scope.
  - **Anti-Staging Constraints**: Inject strict directives for terse dialogue turns to prevent gratuitous physical movement (walking to windows, pouring drinks, adjusting clothes) when movement is not the core focus of the turn.
  - **Multi-Tier Slop Linter (`src/utils/styles.js`)**:
    - _Tier 1 (Structural Flaws)_: Purge repetitive construction patterns (`not X, but Y`, `despite himself`, `against her better judgment`, `the air grew thick`).
    - _Tier 2 (Stock Physical Tells)_: Cap cliché somatic markers to $\le 1$ per reply (ghost of a smirk, breath hitched, eyes darkened, white knuckles, jaw ticking).
  - **Held-Moment Permitting**: Detect conversational pauses and silence without forcing abrupt scene transitions.

### 3. World Info & Triggered Lorebook System

- **Scope**: Keyword-triggered world information documents decoupled from individual entity character sheets.
- **Status**: Queued in backlog.
- **Origin**: MoeChat's World Info specification (`SPEC-lorebook.md`).
- **Target Deliverables**:
  - **Standalone Lorebook Entity Schema**: `(id, name, description, scan_depth, token_budget, recursive, entries[])`.
  - **Multi-Pass Regex & Token Matching**: Support regex, glob wildcards, and whole-word matching over the last $N$ turns.
  - **Secondary Filter Logic**: Support `any`, `all`, `not_any` narrowing conditions.
  - **Budget-Conscious Insertion**: Inject fired entries into prompt envelopes with strict token ceilings to avoid crowding live character state.

### 4. Epistemic Partitioning & Multi-Speaker Delegation Hardening

- **Scope**: Zero-omniscience character boundaries, background speech arbitration, and ghostwriting mechanics.
- **Status**: Queued in backlog.
- **Origin**: RPGlitch Simulation Engine physics and MoeChat prompt contract (`SPEC-prompt.md`).
- **Target Deliverables**:
  - **Private Directive Purging**: Ensure `[SECRET: ...]` and `[PLAN: ...]` tags are rigorously scrubbed across the Epistemic Wall before compiling character inference prompts.
  - **Fractal & NPC Audio Stream Concurrency**: Prevent audio synthesis cutoffs when ambient fractal dialogue overlaps with AI character speech.
  - **Ghostwriting & Alternative Branch Exploration**: Allow the Director to supply bracketed alternative dialogue branches for user-guided exploration.

---

## Backlog & Technical Debt

### Codebase Debt & Immediate Micro-Actions

- [ ] Complete transition of any lingering `tasks/` references across tool scripts.
- [ ] Monitor Dexie.js 4 memory store indices during state-transition compaction testing.
- [ ] Verify Kokoro neural TTS mutex handling when background memory worker executes.
- [ ] Audit all prompt templates for middle-out truncation risk against the 6,000-token ceiling (`SPEC-context-limit.md`).
- [ ] Unify simulation logging mechanisms to resolve disparate conversation history formats across UI components.
