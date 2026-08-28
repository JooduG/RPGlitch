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

```text
[Input] ➔ [Sanity] ➔ [Execution] ➔ [Persistence] ➔ [Expression]
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

#### The Hierarchy of Intent

When resolving narrative conflicts, enforce directives strictly in this order:

```text
L1_ABSOLUTE (User Agency) > L2_CRITICAL (Character/Temporal Truth) > L3_HIGH (Plot/Sensory) > L4_MODERATE (Style)
```

#### Narrative Integrity Directives

- **Restraint**: Simulation AI **MUST NOT** use a narrator voice and **MUST NEVER** control the user persona.
- **Descriptive Soul (3rd-Person Affirmative)**: **Describe presence, never absence**. Refine non-physical entity fields without using first-person or narrative prose.
- **Outcome Evaluation**: Before drafting prose, **compare intended user actions against physical state mutations in [ChronoEngine](./src/state/chrono.svelte.js)** to preserve causality.
- **Atmospheric Signaling**: **Keep internal mechanics invisible in output**. Express statistical stress or intensity strictly via body language or internal `<think>` blocks. Use the [Simulation](./.agents/skills/simulation/SKILL.md) skill to bridge mechanics and prose.

#### Multi-Channel Communication

- **AI Characters**: In-character dialogue and physical actions.
- **System Messages**: Out-of-Character (`/OOC`) scaffolding and technical alerts.
- **The Fractal**: Sensory environment and world messaging.

---

### 3. Temporal Engine & Entity Architecture

A simulation requires entities (Characters and Fractals) to execute a narrative.

- **Swapping**: Design state transitions so ending a story and loading a new one is seamless.
- **Management**: Manage active entities via the profile modal in edit mode.
- **The Four Entity Fragments**:
  - **Eternal**: Baseline physical features and core essence.
  - **Present**: Immediate physical conditions and active processing states. Governed by Pseudo-JSON bracket parameters (`[KEY: VALUE]`):
    - _Direct Overwrites_: `[SHIRT: sweater]` replaces `SHIRT` cleanly without string duplication.
    - _Universal Atomic Clearing_: `[KEY: none]`, `[KEY: bare]`, `[KEY: naked]`, `[KEY: off]`, `[KEY: removed]`, `[KEY: disrobed]`, `[KEY: healed]`, `[KEY: cleared]`, `[KEY: normal]` deletes that specific key. `[CLOTHING: none]` wildcard-purges all clothing keys.
    - _Multi-Item Aggregation_: Repeated `[INVENTORY: ...]` / `[STASH: ...]` brackets merge into an aggregated array.
    - _Undress / Redress Lifecycle_: Undressing stashes garments in `[INVENTORY: ...]`; redressing reads items back from inventory without hallucination.
  - **Past (Memories)**: Historical anchors and session memories stored in the `past` vector array (retrieved via vector RAG):
    - _ID Provenance & Forge-Skip_: `usr_` prefixed memories (user/lore authored) are origin-protected (`is_origin`), immune to Memory Forge eviction/compression, and receive a 1.5x relevance multiplier in `compute_relevance()`. `ai_` session memories roll with a cap of 20 (`PAST_VECTOR_CAP = 20`).
    - _Bound Limits_: Maximum 200 total vectors per entity; <= 220 characters per entry. Deduplication uses > 60% word overlap and > 0.92 cosine similarity.
  - **Future (Standing Agenda)**: Active trajectory, impending intent, and standing agenda stored as a single consolidated prose field (rewritten wholesale by the Memory Forge each cycle).
- **Dual Filter Engine**:
  - _Visual Prompt Filter_: `INVENTORY`, `STASH`, `SECRET`, `PLAN`, and `STATUS` are strictly stripped from image generation prompts (`build_aesthetic_map` & `strip_visual_excluded`).
  - _Epistemic Prompt Filter_: `[SECRET: ...]` and `[PLAN: ...]` of the User are stripped across the Epistemic Wall in `render_character()` to prevent AI telepathy, while remaining fully visible in `render_director()`.

---

## 🏛️ System Architecture & State Sovereignty

### 1. Physical Tech Stack & Perchance Constraints

RPGlitch is a **Local-First Reactive Monolith (PWA)** built for the Perchance iframe ecosystem.

- **Framework**: Svelte 5 (Runes-only) built via Vite 8 (`vite-plugin-singlefile`).
- **Environment**: Perchance Two-Panel Paradigm. No Node.js backend. Rely on Just-In-Time (JIT) compilation and ESM CDN imports (`esm.sh`).
- **Persistence Rules**: **Use Dexie.js (IndexedDB) exclusively for persistence**. `localStorage` is forbidden due to iframe access limits.
- **Sovereign Modules**: **Consolidate domain logic into single files** (e.g., all memory handling lives in `NarrativeEcho.js`).
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

```text
[src/ui] ➔ [src/state] ➔ [src/intelligence] ➔ [src/data] ➔ [src/platform]
```

#### Structural Glossary

- **`src/ui/`**: Expression layer (Atomic Svelte components). Renders DOM, captures input, subscribes to state.
- **`src/state/`**: Reactive nervous system (`app.svelte.js`, `runtime.svelte.js`, `status.svelte.js`, `chrono.svelte.js`). Owns all Runes and the turn driver.
- **`src/intelligence/`**: AI Kernel (Prompts, Context Broker, LLM streams).
- **`src/data/`**: Persistence layer. Manages Dexie.js schemas and repositories.
- **`src/media/`**: Sensory assets, visual parameters, and Kokoro-82M Neural TTS.
- **`src/platform/`**: External API bridges, iframe integration, and DOMPurify safety.

#### Import Rules (Unidirectional Flow)

**Allowed Downward Imports**:

- `src/ui/` may import from any layer.
- `src/state/` may import from `intelligence`, `data`, `platform`, `media`, `utils`.
- `src/data/` may import from `platform`, `utils`.

**Forbidden Upward Imports**:

- Lower-level layers **MUST NEVER** import from higher-level layers.
- `src/intelligence/`, `src/data/`, `src/media/`, `src/utils/`, and `src/platform/` **MUST NEVER** import from `src/ui/` or `src/state/**`.
- `src/state/` **MUST NEVER** import from `src/ui/**`.

---

### 4. State Ownership Matrix & Lifecycle Verbs

#### State Ownership Matrix

| State Domain                                          | Owner Store File    | Description & Mutators                                       | Observers      |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------------------ | -------------- |
| **Active Entities** (`user`, `ai`, `fractal`)         | `runtime.svelte.js` | Live clones of DB entities. Mutated by `load()` and physics. | `ui`, `engine` |
| **Chronology** (`round`, `story_id`)                  | `runtime.svelte.js` | Macro heartbeat of the simulation.                           | `ui`, `engine` |
| **Simulation Phase** (`idle`, `generating`, `locked`) | `status.svelte.js`  | Execution status and UI lock state (STASIS).                 | `ui`, `engine` |
| **UI Flow & Modals** (`view`, `profile_open`)         | `app.svelte.js`     | Ephemeral layout and view state.                             | `ui`           |
| **Audio Context**                                     | `src/media/`        | Browser audio state. Requires user gesture initialization.   | `ui`           |

#### Standardized Lifecycle Verbs

- **`initialize`**: Setting up a service or store for the first time in a session.
- **`load`**: Pulling static data from persistence (`src/data/`) into memory (`src/state/`) without running physics.
- **`sync`**: Reconciling reactive state with IndexedDB before generating turns.
- **`refresh`**: Triggering an imperative recalculation when `$derived` runes are insufficient.
- **`boot`**: Global application startup sequence (`src/main.js`).

---

### 5. Development Protocols & Navigator Rules

**4-Step Implementation Loop**:

1. **Anchor Tasks**: **Verify `./tasks/FUTURE.md` is initialized and aligned with `./GEMINI.md` and `./tasks/PRESENT.md`**.
2. **Wire State**: Connect Svelte 5 Runes and expose safe global bridges via `window.exposed`.
3. **Apply Styling**: Implement rules from `./DESIGN.md`.
4. **Anchor Persistence**: Bind dynamic changes to Dexie.js repositories.

**Navigator Protocol**:

- **Relative Resolution**: **Always use relative paths for internal references** (e.g., `./tasks/PRESENT.md`).
- **Absolute Grounding**: **Map all code claims to specific file paths and line numbers**.

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

### 1. System Lexicon

> [!TIP]
> **Authoritative Definitions**: The full canonical glossary of simulation physics, entity hierarchies, directorial mechanics, and persistence rules is documented in [GLOSSARY.md](./GLOSSARY.md).

- **RPGlitch**: The core simulation engine and repository.
- **Swarm**: The tactical engine managing multi-agent token scaling, parallel execution, and the 80% Confidence Gate.
- **Temporal Engine**: Intelligence module managing the temporal continuum of an entity.
- **Entity Fragments**: The four-quadrant state architecture (**Eternal**, **Present**, **Past**, **Future**).
- **Entity**: The fundamental simulation unit—either a `character` or a `fractal`.
- **Fractal**: A world, setting, or environmental entity.
- **User Persona**: The human-controlled character entity (strictly protected by P1: User Agency).
- **AI Character**: An agent-controlled character entity.
- **Stage Spotlight**: In-scene presence tracking (`runtime.in_scene_npc_ids`) while off-screen characters freeze in stasis.
- **Universal Relational Graph**: Plain-text directed vectors (`"[Source] → [Target]: [Dynamic]"`) defining interpersonal bonds and world affiliations.
- **Simulation Lock**: UI stasis state active while the engine processes a turn.
- **Full Dictionary**: Consult [GLOSSARY.md](./GLOSSARY.md) for complete entries.

---

### 2. Memory Protocol Boundaries

> [!NOTE]
> **CRITICAL DISTINCTION**:
>
> - **Application Memory** (Temporal Engine, Dexie.js, RPGlitch State): Consult the [Simulation](./.agents/skills/simulation/SKILL.md) skill.
> - **Development Data** (Pinecone, Supabase, Agent Context): Consult the global Developer Database skill.
