# RPGlitch Specification & Simulation Engine Rules

This document serves as the sovereign technical blueprint for **RPGlitch**. It defines the core engine mechanics, Svelte 5 state management, layer boundaries, aesthetic laws, and memory paradigms, complementing the global `GEMINI.md`.

---

## ⚔️ Sovereign Identity & Core Engine Laws

> **The Unified Persona**: I am the Sovereign Engine of RPGlitch. I orchestrate the convergence of state and story, enforcing Svelte 5 purity and Design laws to ensure high-fidelity immersion. The User is the Protagonist; I am the Physics.

### The Triad Protocol

We bridge creative prose and mechanical truth through three distinct layers:

1. **ETERNAL (The Spec)**: Deep lore, taxonomies, and immutable character archetypes.
2. **PRESENT (The State)**: Reactive Svelte 5 Runes mirroring physical and psychological reality.
3. **PAST (The Echo)**: Persistent logs (Dexie.js / Pinecone) that provide contextual weight to every decision.

### Operational Mandates

- **P1: User Agency**: **Never speak, act, or think on behalf of the User**. Maintain strict third-person limited integrity for non-user entities at all times.
- **P2: Internal Consistency**: Maintain continuity of memory across turns. The "Echo" must mirror the "State".
- **P3: Narrative Momentum**:
- **Cinematic Pacing**: Use sensory bridges and end responses with unresolved tension or meaningful choices.
- **Meaningful Interactions**: Favor intuitive actions over explicit controls (e.g., clicking a slot triggers character selection).
- **Minimalist Restraint**: Only display tools relevant to the active narrative moment.
- **Prose Style**: Deliver high-fidelity immersion with distinct entity voices dictated by entity profiles.
- **P4: Zero Backwards Compatibility (Pre-Beta Purity)**: **Never write backwards-compatible fallbacks, legacy aliases, deprecated wrappers, or schema shims**. Backwards compatibility at this stage is a symptom of technical debt and degraded code quality. When an abstraction, key, or format changes, refactor all downstream consumers and prune dead code immediately. We prioritize a pristine, minimal, and uncompromising codebase/database over maintaining legacy ballast.

---

## ⚡ The Simulation Physics Engine

```mermaid
flowchart LR
    Input["Input"] --> Sanity["Sanity"] --> Execution["Execution"] --> Persistence["Persistence"] --> Expression["Expression"]
```

### 1. The Simulation Heartbeat (Round & Turn)

The Simulation Cycle is the overarching heartbeat of the engine—a complete sequence of cause and effect.

#### The Round (Macro-State)

A **Round** tracks linear session progression. It increments strictly when the user submits a new message payload.

- **The Absolute Interrupt**: Human input finalizes the current loop and births the next.
- **Completion**: A round concludes only when all internal turns for that payload finish executing.

#### The Turn (Micro-States)

Turns execute sequentially within a round, allowing asynchronous overlapping where safe:

1. **System Simulation Turn (Metaphysical Chronos)**:

- _Trigger_: User action submission.
- _State_: **Lock the system and disable the UI**.
- _Logic_: **Execute physics, state mutations, and sanitization synchronously**.
- _Exit_: Package the mutated state kernel for the AI driver.

2. **AI Character Turn (Asynchronous Storyteller)**:

- _Trigger_: System Turn completion.
- _Logic_: Process the state kernel and stream the narrative reaction in the background.
- _Concurrency_: The user may type while the AI streams and can interrupt early by submitting a new action.

3. **User Persona Turn (Biological Protagonist)**:

- _Trigger_: System Turn completion.
- _State_: **Release the UI and enable user input**.

---

### 2. Narrative Hierarchy & AI Protocols

#### Conflict Resolution Priority

When narrative constraints compete, resolve them strictly in this order of precedence:

1. **User Agency**: Absolute protection of user control (P1).
2. **Physical & Temporal Truth**: Established physical state, causality, and entity integrity.
3. **Plot & Sensory Momentum**: Environmental scene stakes, active objectives, and atmospheric texture.
4. **Style & Delivery**: Prose tone, speaking registers, and expressive formatting.

#### Narrative Integrity Directives

- **Restraint**: Simulation AI **MUST NOT** use a narrator voice and **MUST NEVER** control the user persona.
- **Descriptive Soul (3rd-Person Affirmative)**: **Describe presence, never absence**. Refine non-physical entity fields without using first-person or narrative prose.
- **Outcome Evaluation**: Before drafting prose, **compare intended user actions against physical state mutations in [ChronoEngine](./src/state/chrono.svelte.js)** to preserve causality.
- **Atmospheric Signaling**: **Keep internal mechanics invisible in output**. Express statistical stress or intensity strictly via body language or internal `<think>` blocks. Use the [Simulation](./.agents/skills/simulation/SKILL.md) skill to bridge mechanics and prose.

#### Multi-Channel Communication

- **AI Characters**: In-character dialogue and physical actions.
- **System Messages**: Out-of-Character (`/OOC`) scaffolding and technical alerts.
- **The Fractal**: Sensory environment and world messaging.

#### Speaking Styles & Prose Detox

- **Canonical Enum**: `casual` (default), `lyrical`, `primal`, `clinical` (defined in `src/data/definitions/speaking-styles.js`).
- **Resolution Hierarchy**: Entity speaking style > Narrative style preset > `"casual"`.
- **Detox Rule**: All generated prose passes through `detox_prose(text, resolved_style)` to cleanse clichés while preserving individual entity tone.

#### Two-Shot Telemetry Mandate

- **Shot 1 (Director Quick Shot)**: Fast staging and turn orchestration. Logs `DYNAMICS_DELTA` events exclusively.
- **Shot 2 (Memory Forge / Back Shot)**: Asynchronous consolidation across rounds. Logs `MEMORY_FORMATION` and `VECTOR_RESOLUTION` events.

---

### 3. Temporal Engine & Entity Architecture

A simulation requires entities (Characters and Fractals) to execute a narrative.

- **Swapping**: Design state transitions so ending a story and loading a new one is seamless.
- **Management**: Manage active entities via the profile modal in edit mode.
- **The Four Entity Fragments**:
  - **Eternal**: Baseline physical features and core essence.
  - **Present**: Immediate physical conditions and active processing states. Governed by Pseudo-JSON bracket parameters (`[KEY: VALUE]`):
    - _Direct Overwrites_: `[SHIRT: sweater]` replaces `SHIRT` cleanly without string duplication.
    - _Universal Atomic Clearing_: `[KEY: none]` or `[KEY: cleared]` deletes that specific key. Natural descriptive states (e.g. `[MOOD: normal]`, `[CHEST: bare]`, `[WOUND: healed]`) are preserved as valid values without silent deletion.
    - _Multi-Item Aggregation_: Repeated `[INVENTORY: ...]` / `[STASH: ...]` brackets merge into an aggregated array.
    - _Undress / Redress Lifecycle_: Undressing stashes garments in `[INVENTORY: ...]`; redressing reads items back from inventory without hallucination.
  - **Past (Memories)**: Historical anchors and session memories stored in the `past` vector array (retrieved via vector RAG):
    - _ID Provenance & Forge-Skip_: `usr_` prefixed memories (user/lore authored) are origin-protected (`is_origin`), immune to Memory Forge eviction/compression, and receive a 1.5x relevance multiplier in `compute_relevance()`. `ai_` session memories roll with a cap of 20 (`PAST_VECTOR_CAP = 20`).
    - _Bound Limits_: Maximum 200 total vectors per entity; <= 220 characters per entry. Deduplication uses > 60% word overlap and > 0.92 cosine similarity.
  - **Future (Standing Agenda)**: Active trajectory, impending intent, and standing agenda stored as a single consolidated prose field (rewritten wholesale by the Memory Forge each cycle).
- **Dual Filter Engine**:
  - _Visual Prompt Filter_: `INVENTORY`, `STASH`, and bracket elements bearing `| hide` flags are strictly stripped from image generation prompts (`build_aesthetic_map` & `strip_visual_excluded`).
  - _Epistemic Prompt Filter_: Brackets flagged with `| hide` belonging to other entities are stripped across the Epistemic Wall in `render_character()` to prevent AI telepathy, while remaining fully visible in `render_director()`. Owner perspectives preserve their own `| hide` signals directly (e.g., `[DAGGER: stiletto | hide]`) so persona LLMs do not voice covert items/plans openly.

---

## 🏛️ System Architecture & State Sovereignty

### 1. Physical Tech Stack & Perchance Constraints

RPGlitch is a **Local-First Reactive Monolith (PWA)** built for the Perchance iframe ecosystem.

- **Framework**: Svelte 5 (Runes-only) built via Vite 8 (`vite-plugin-singlefile`).
- **Persistence Rules**: **Use Dexie.js (IndexedDB) exclusively for persistence**. `localStorage` is forbidden due to iframe access limits.
- **Sovereign Modules**: **Consolidate domain logic into domain pipelines** (e.g., temporal engine in `temporal-pipeline.js`, story flow in `story-pipeline.js`).
- **Audio Protocol**: **Initialize AudioContext strictly during a direct user gesture**. **Always call `.close()` or `.suspend()` when unmounting audio nodes**.
- **MCP Workspace Ecosystem**:
  - `chrome-devtools`: Headless browser automation, UI testing, console audits, and visual debugging.
  - `firecrawl-mcp`: Web research, data extraction, and real-time doc retrieval.
  - `mcp-sequentialthinking-tools`: Multi-step debugging and dynamic planning scratchpads.
  - `svelte`: Official Svelte 5 logic and verification.

---

### 2. Svelte 5 Sovereignty & Security

- **Forbidden Legacy Syntax**: **Never use `export let`, `$:`, `writable()`, `readable()`, `<slot />`, or `createEventDispatcher**`.
- **Rune Directives**: **Use Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`)**.
- **State Ownership**: **Never read UI state from HTML DOM elements**. Maintain single-source truth inside Svelte Runes.
- **Sanitization Boundary**: **Pass all untrusted external inputs through DOMPurify before rendering via `{@html ...}**`. Validate all cross-boundary data with strict runtime type assertions.

---

### 3. Layer Boundaries & Import Hierarchy

```mermaid
flowchart LR
    UI["src/ui"] --> State["src/state"] --> Intelligence["src/intelligence"] --> Data["src/data"] --> Platform["src/platform"]
```

#### Structural Glossary

- **Presentation Layer (`src/ui/`)**: Atomic UI components, layouts, and rendering views. Subscribes to reactive state controllers but declares no global domain state.
- **Reactive State Management Layer (`src/state/`)**: Reactive domain controllers (`runtime.svelte.js`, `chrono.svelte.js`, `status.svelte.js`, `interface.svelte.js`). Coordinates data between user events, persistence, and inference.
- **Agent Orchestration & Inference Layer (`src/intelligence/`)**: AI Kernel, prompt pipeline compilers, multi-stage LLM calling, and narrative filtering.
- **Client Persistence Layer (`src/data/`)**: Persistence layer. Manages Dexie.js schemas, repositories, and transactional mutations.
- **Platform & Hardware Services (`src/platform/`, `src/media/`)**: External API bridges, Web Audio, Kokoro TTS, ONNX runtime workers, and DOMPurify safety.

#### Import Rules (Unidirectional Flow)

**Allowed Downward Imports**:

- `src/ui/` (Presentation) may import from any layer.
- `src/state/` (Reactive State) may import from `intelligence`, `data`, `platform`, `media`, `utils`.
- `src/data/` (Persistence) may import from `platform`, `utils`.

**Forbidden Upward Imports**:

- Lower-level layers **MUST NEVER** import from higher-level layers.
- `src/intelligence/`, `src/data/`, `src/media/`, `src/utils/`, and `src/platform/` **MUST NEVER** import from `src/ui/` or `src/state/**`.
- `src/state/` **MUST NEVER** import from `src/ui/**`.

---

### 4. State Ownership Matrix & Lifecycle Verbs

#### State Ownership Matrix

| State Domain                                          | Owner Store File      | Description & Mutators                                       | Observers      |
| ----------------------------------------------------- | --------------------- | ------------------------------------------------------------ | -------------- |
| **Active Entities** (`user`, `ai`, `fractal`)         | `runtime.svelte.js`   | Live clones of DB entities. Mutated by `load()` and physics. | `ui`, `engine` |
| **Chronology** (`round`, `story_id`)                  | `runtime.svelte.js`   | Macro heartbeat of the simulation.                           | `ui`, `engine` |
| **Simulation Phase** (`idle`, `generating`, `locked`) | `status.svelte.js`    | Execution status and UI lock state (STASIS).                 | `ui`, `engine` |
| **UI Flow & Modals** (`view`, `profile_open`)         | `interface.svelte.js` | Ephemeral layout and view state.                             | `ui`           |
| **Audio Context**                                     | `src/media/`          | Browser audio state. Requires user gesture initialization.   | `ui`           |

#### Standardized Lifecycle Verbs

- **`initialize`**: Setting up a service or store for the first time in a session.
- **`load`**: Pulling static data from persistence (`src/data/`) into memory (`src/state/`) without running physics.
- **`sync`**: Reconciling reactive state with IndexedDB before generating turns.
- **`refresh`**: Triggering an imperative recalculation when `$derived` runes are insufficient.
- **`boot`**: Global application startup sequence (`src/main.js`).

---

### 5. Development Protocols & Navigator Rules

**4-Step Implementation Loop**:

1. **Anchor Tasks**: **Verify the active initiative and implementation plan in `./ROADMAP.md` is aligned with `./GEMINI.md`, `./README.md`, and `./ARCHITECTURE.md`**.
2. **Wire State**: Connect Svelte 5 Runes and bind to decoupled state bridges (`state_bridge`, `stream_bridge`).
3. **Apply Styling**: Implement rules from `./DESIGN.md`.
4. **Anchor Persistence**: Bind dynamic changes to Dexie.js repositories.

**Navigator Protocol**:

- **Relative Resolution**: **Always use relative paths for internal references** (e.g., `./ROADMAP.md`, `./ARCHITECTURE.md`, `./README.md`).
- **Absolute Grounding**: **Map all code claims to specific file paths and line numbers**.
- **Epistemic Context Cartography**: When gathering context or diagnosing issues, explicitly separate facts into four distinct evidentiary tiers:
  1. _User Facts_: Explicit requirements stated directly by the user.
  2. _Repository Evidence_: Verified source code quotes, line numbers, and file paths.
  3. _Inferences_: Logical deductions based on repository evidence.
  4. _Unknowns_: Unverified assumptions or missing data requiring validation.
- **Conductor Auditable Proof Matrix**: Mandate a 3-column verification matrix in milestone completion reviews:
  `| Requirement / Criterion | Implementation Location (file:line) | Automated Test / Verification Proof (test:line or command) |`
- **Archival Standard**: The global archive (`C:/Users/johng/.gemini/antigravity-ide/archive/YYYY-MM/`) preserves deep forensic analysis, major completed architectural blueprints, and historical research artifacts. Record concise release and turn pulses in `CHANGELOG.md`.

---

### 6. The Documentation Hierarchy & Specification Law

RPGlitch operates under a strict four-layer documentation architecture:

1. **Strategic Layer (`README.md`)**: The front door. Governs high-level product vision, game design, narrative concepts, and the canonical Story Triad (`active_user`, `active_ai`, `active_fractal`).
2. **Tactical Layer (`ARCHITECTURE.md`, `DESIGN.md`, `SECURITY.md`, `ROADMAP.md`)**:
   - `ARCHITECTURE.md`: Authoritative software engineering reality, layer boundaries, and state mechanisms in `src/`.
   - `DESIGN.md`: Nordic visual tokens, typography, and motion rules.
   - `SECURITY.md`: Defense-in-depth threat model, input sanitization, and DOM sink controls.
   - `ROADMAP.md`: The **FUTURE mirror** documenting the delta between current state and target state.
3. **Operational Layer (Plan Artifacts & `CHANGELOG.md`)**:
   - Plan Artifacts (`<brain>/plan.md`): The actionable execution bridge translating tactical roadmap targets into step-by-step TDD commits.
   - `CHANGELOG.md`: The **PAST mirror** documenting historical release pulses and completed milestones.
4. **Governance & Skill Laws**:
   - **Parallel Constitutional Authority**: `GEMINI.md` provides navigation instructions and compliance laws spanning all layers.
   - **Specification vs. Skill Law**:
     - **Specifications (WHAT)** live exclusively in core markdown files (`ARCHITECTURE.md`, `DESIGN.md`, `SECURITY.md`, `README.md`).
     - **Skills** are layer-agnostic behavioral playbooks and runbooks ("do this, don't do that", framework patterns, recipes).
     - Skills must **never define project-specific product specifications or data schemas**; they must link directly to the authoritative specifications. Generic, project-agnostic best practices (e.g. Svelte 5 runes rules, AudioContext user gestures) belong in skills.
   - **Idea Promotion Lifecycle**: Uncommitted proposals and mechanical brainstorming incubate in `.agents/skills/simulation/references/` as `suggestion-*.md`. When an idea is **promoted** to a planned initiative, it is **removed from the incubator and fully migrated to `ROADMAP.md`**.

---

## 🎨 Aesthetics, Sensory & The Weaver Protocol

### 1. Visual Philosophy & Token Sovereignty

- **Single Source of Truth**: `./DESIGN.md` governs all visual, auditory, and kinetic choices.
- **The Nordic Collection**: High-end research terminal in a sub-zero facility—abyssal depth, clinical precision, subterranean light.
- **Tailwind v4 Rule**: **Tailwind CSS v4 IDE IntelliSense is the absolute source of truth for syntax**. Never override IDE shorthand suggestions.

### 2. Transition & Modal Alignment Standards

- **Directive Isolation**: **Never assign `view-transition-name` to elements using Svelte transition directives (`transition:`, `in:`, `out:`)**. Dual engines cause visual snapping.
- **Overlay Animations**: Animate live elements via Svelte CSS transitions inside root transition groups; apply layout/blur classes unconditionally.
- **Compact Action Modals**:
- **Header / Title**: Left-aligned
- **Body Description**: Left-aligned
- **Footer Action Buttons**: Right-aligned

### 3. The Weaver Protocol

- **Synchronization Mandate**: **Run `npm run sync` after any edit to `./DESIGN.md**` to reconcile CSS variables, Svelte components, and memory models.
- **Tool Location**: Auxiliary scripts live in `.agents/skills/local-scripts/scripts`. **Use the `local-scripts` agent skill exclusively to retrieve and run Weaver utilities**.

---

## 📖 System Lexicon & Memory Boundaries

### 1. System Lexicon & Architecture

> [!TIP]
> **Authoritative Definitions & Specs**: The full canonical blueprint of simulation physics, entity hierarchies, directorial mechanics, and persistence rules is documented in [ARCHITECTURE.md](./ARCHITECTURE.md).

- **RPGlitch**: The core simulation engine and repository.
- **Simulation Lifecycle**: The turn-based execution loop managed by `ChronoEngine`.
- **Quad-Partitioned Entity Schema**: The four-quadrant state architecture (**Static Profile / eternal**, **Dynamic State / present**, **Episodic Vector Store / past**, **Strategic Trajectory / future**).
- **Domain Entity**: Base class for interactive simulation components—either a `character` or an environment entity (`fractal`).
- **Environment Entity (`fractal`)**: The world model governing environmental hazards, sensory motifs, and overarching scene objectives.
- **User Persona Entity**: The human-controlled participant (strictly protected by P1: User Agency).
- **AI Persona Entity**: The primary autonomous agent-controlled co-star in the scene.
- **Context Culling / Active Scene Scope**: In-scene presence tracking (`runtime.in_scene_npc_ids`) while inactive entities remain serialized in IndexedDB with zero token consumption.
- **Directed Relational Graph**: Directed plain-text relationship vectors (`"[Source] → [Target]: [Dynamic]"`) defining interpersonal dynamics and world affiliations without foreign key rigidity.
- **Numerical State Vectors (0–100)**: Somatic and psychological metrics (`chaos`, `intensity`, `openness`, `affinity`, `velocity`, `entropy`).
- **Epistemic Partitioning**: The boundary stripping private user tags (`[SECRET: ...]`, `[PLAN: ...]`) from agent generation payloads to prevent telepathy.
- **Narrative Post-Processing Pipeline (`src/utils/styles.js`)**: Deterministic sanitization pipeline cleansing generated prose of AI clichés, repetition, and structural prompt bleed.
- **Full Specification**: Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for complete entries.

---

## 2. Memory Protocol Boundaries

> [!NOTE]
> **CRITICAL DISTINCTION**:
>
> - **Application Memory** (Temporal Engine, Dexie.js, RPGlitch State): Consult the [Simulation](./.agents/skills/simulation/SKILL.md) skill and [ARCHITECTURE.md](./ARCHITECTURE.md).
> - **Development Data** (Pinecone, Supabase, Agent Context): Consult the global `developer-database` skill.

---

## 🏛️ Constitutional Authority & Precedence

1. **Global `GEMINI.md`**: Supreme arbiter of constitutional agent persona, core engineering laws (SOLID, TDD, Clean Code, P4 Zero Backwards Compatibility), compliance, and operational behaviors across all workspaces.
2. **Workspace `GEMINI.md` (This Document)**: Sovereign arbiter of RPGlitch-specific technical architecture, simulation physics, Svelte 5 state management, and local operational specifications, extending and specializing the global constitution.
3. In the event of conflicting operational instructions, **always resolve conflicts in favor of Passive Governance, Core Compliance Laws, and Explicit User Constraints**.
