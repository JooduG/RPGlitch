# RPGlitch Specification & Simulation Engine Rules

This document outlines the RPGlitch-specific architecture, simulation rules, design aesthetics (Chalk Regime), lexicon definitions, and memory paradigms. It serves as the project's sovereign technical blueprint, complementing the [global GEMINI.md](file:///C:/Users/johng/.gemini/GEMINI.md).

---

## ⚔️ Sovereign Axiomatic Laws

> **The Unified Persona**: I am the Sovereign Engine of RPGlitch. I orchestrate the convergence of state and story, enforcing Svelte 5 purity and the laws of the Chalk Regime to ensure high-fidelity immersion. The User is the Protagonist; I am the Physics.

---

## 01-Foundation

### 💡 Product Vision & The Red Thread

For detail on the reactive logic cycle and execution states, see the [Simulation](#02-simulation) rule.

### 📐 RPGlitch Architecture

When working on infrastructure or styling, enforce the [Infrastructure](#03-infrastructure) and [Aesthetics](#04-aesthetics) rules.

### ⛓️ The Triad Protocol

We bridge creative prose and mechanical truth through these layers:

1. **The Spec (plan)**: Deep lore, taxonomies, and character archetypes.
2. **The State (Live)**: Reactive Svelte 5 Runes mirroring physical and psychological reality.
3. **The Echo (History)**: Persistent logs (Dexie.js / Pinecone) that provide context and weight to every decision.

---

## 02-Simulation

### ⚖️ The Law

#### 1. The Simulation Cycle (Round & Turn)

The Simulation Cycle is the overarching heartbeat of the engine—a complete sequence of cause and effect.

#### 2. Product Identity

RPGlitch is a high-fidelity roleplay engine designed for immersive, local-first storytelling.

- **High-Fidelity Immersion**: Minimalist "Chalk Regime" aesthetics defined in the [Aesthetics](#04-aesthetics) rule ensure imagination remains central.
- **Agentic Automation**: The Intelligence Kernel autonomously manages complex state and narrative transitions.
- **Recursive Intelligence**: Logic is a pillar. The [Engine](./src/engine) orchestrates input, Security enforces physics, and [Data](./src/data) ensures memory.

##### Strategic Objectives

- **Atmospheric Immersion**: The UI is an atmospheric canvas. Information is embedded within the fiction using Chalk Regime tokens.
- **Procedural Pacing**: Encourages concise, procedural story arcs over monolithic chat logs.
- **Character Cycling**: Designed for frequent perspective swapping within the simulation.

##### The Round

A **Round** is the macro-state of the simulation. It increments only when the user submits a new message payload.

- **The Absolute Interrupt**: Human input finalizes the current loop and births the next one.
- **Temporal Tracking**: Use the round integer to track the session's linear progression.
- **The State (Live)**: Svelte 5 Reactive Runes mirroring the world's physical and psychological reality.
- **The Echo (History)**: Persistent logs (Dexie.js / Pinecone) that provide context and weight to every decision.
- **Completion**: A `round` is over when all turns for that round are complete.

##### The Turn

Turns are micro-states within a Round. They execute a sequential logic flow with asynchronous overlapping.

1. **System Simulation Turn**: Metaphysical Chronos
   - **Trigger**: User action submission.
   - **State**: UI disabled; lock system.
   - **Logic**: Physics, state mutations, and sanitization run synchronously.
   - **Exit**: Packages the mutated world state into a kernel for the AI.

2. **AI Character Turn**: Asynchronous Storyteller
   - **Trigger**: System Turn completion.
   - **Logic**: AI processes the state kernel and streams narrative reaction in the background.
   - **Concurrency**: User can type while the AI is generating and potentially end the AI Turn early.

3. **User Persona Turn**: Biological Protagonist
   - **Trigger**: System Turn completion.
   - **State**: UI released; input enabled.

---

#### 3. App Architecture

RPGlitch is a **Local-First Reactive Monolith** (PWA).

- **Core Engine**: Logic & Round Orchestration. **Pure IO**. No DOM manipulation.
- **UI & Structure**: HTML/Layouts via **Svelte 5** (`src/ui/`).
- **Sensory**: Visuals, Audio, Theme via **Tailwind CSS v4** (`src/media/`).
- **Data**: Persistence & History via **Dexie.js** (IndexedDB).
- **Security**: Validation & Physics via **DOMPurify** sanitization boundaries.

---

#### 4. The Reactive Cycle (5-Step Loop)

Every interaction follows a strict reactive loop propagated by Runes:

1. **Input** -> 2. **Sanity** (Security) -> 3. **Execution** (Core Engine) -> 4. **Persistence** (Data) -> 5. **Expression** (UI/Sensory).

---

#### 5. Simulation Entities & Management

A `simulation` is a story and requires `entities` in order to play out. For detailed nomenclature and definitions, see the [Lexicon](#-the-rpglitch-lexicon).

- **Swapping**: The engine is designed for frequent story swapping. Concluding a story and starting a new one should be a seamless state transition.
- **Management**: The `entities` (Characters and Fractals) are managed via the `profile modal` in `edit mode`.

---

#### 6. Agentic Interaction

##### Multi-Layered Communication

Interaction occurs through three distinct channels:

- **AI Characters**: In-character dialogue and actions.
- **System Messages**: Out-of-Character (/OOC) narrative scaffolding or technical alerts.
- **The Fractal**: The world/setting sending direct "sensory" messages.

##### Supportive Scaffolding

The application encourages procedural short stories, ensuring narrative coherence and character consistency across simulation ticks.

---

#### 7. Operational Mandates

##### P1: User Agency

Never violate user intent. Do not speak, act, or think for the User. Maintain strict third-person limited integrity for entities.

##### P2: Internal Consistency

Maintain continuity of memory. The "Echo" must mirror the "State".

##### P3: Narrative Momentum

- **Cinematic Pacing**: Use sensory bridges. End responses with unresolved tension or meaningful choices.
- **Meaningful Interactions**: Favor intuitive actions over explicit controls (e.g., clicking a slot triggers character selection).
- **Minimalist Restraint**: Only show tools relevant to the current narrative moment.
- **Prose Style**: Priority is high-fidelity immersion. Voices must be distinct and dictated by the entity profile.

---

#### 8. AI Character Protocol & Narrative Integrity

The following hierarchy and protocols govern all **AI Characters** within the simulation. This protocol ensures deep immersion and strict adherence to the engine's reactive physics.

##### Narrative Hierarchy

**L1_ABSOLUTE** (User Agency) > **L2_CRITICAL** (Character/Temporal Truth) > **L3_HIGH** (Plot/Sensory) > **L4_MODERATE** (Style).

##### Execution Mandates

- **Restraint**: Simulation AI MUST NOT utilize narrator-voice. It MUST NEVER speak, think, or act on behalf of the user. It must maintain strict third-person limited integrity for its assigned entities.
- **Descriptive Soul (Enhancement)**: Entity descriptions can be refined using the **3rd-Person Affirmative** law. Describe presence, not absence. No first-person or narrative prose.
- **Temporal Awareness**: The AI MUST respect the field-level taxonomy:
  - **Eternal**: Baseline traits (Physical: Permanent Visual Features / Non-Physical: Core Essence).
  - **Present**: Immediate conditions (Physical: Temporary/Current Visual Features / Non-Physical: Processing State).
  - **Past**: Historical anchors, critical precedents, and session resonances (user UI: **Memories**).
  - **Future**: Active impulses, plans, prophecies, and impending intent (user UI: **Future Vectors**).
- **Outcome Evaluation**: Before generating prose, the simulation AI must evaluate the **System Turn** state mutations. It must compare the intended user action against physical reality (Rule 03) to ensure logical continuity.
- **Atmospheric Signaling**: Statistical signals (stress, entropy, intensity) must be expressed through body language or internal logic within `<think>` blocks. Internal mechanics MUST stay invisible to the narrative output. The [Simulation](./.agents/skills/simulation) skill bridges mechanics and prose.

---

## 03-Infrastructure

### ⚖️ The Law

#### 1. Physical Architecture (The Map)

The project follows a sovereign modular structure to ensure local-first resilience and reactive clarity.

- **Framework**: [Svelte 5](#3-svelte-5-sovereignty--security) (Runes-only: `$state`, `$derived`, `$effect`).
- **Build Tool**: Vite 6 (LTS) (with `vite-plugin-singlefile` for Perchance).
- **Environment**: Perchance Two-Panel Paradigm. No Node.js backend. Rely entirely on **Just-In-Time (JIT) Compilation** and **ESM/CDN imports** (via `esm.sh`) for external libraries.
- **Persistence**: Dexie.js (IndexedDB).
- **Security**: Validation & Physics via **DOMPurify** sanitization boundaries (see [global GEMINI.md compliance](file:///C:/Users/johng/.gemini/GEMINI.md#06-compliance)).
- **Simulation** building blocks:
  - [Engine](./src/engine): Logic & Round Orchestration (DynamicsEngine).
  - [Intelligence](./src/intelligence): The AI Kernel.
  - [Data](./src/data): Persistence (Dexie) & Entity Repositories.
  - [State](./src/state): Reactive Runes (`$state`).
  - [UI](./src/ui): Atomic Design (Svelte 5 components).
  - [Media](./src/media): Internal Sensory Assets, and the Chalk Regime (Tokens, Global Styles).
- **Skills** directory (`.agents/skills/`) for infrastructural expertise:
  - [Skill Router](./.agents/skills/local-dispatcher/SKILL.md): Local Skill Routing & Domain Orchestration.
  - [Simulation](./.agents/skills/simulation/SKILL.md): Narrative Bridges & Game Logic.
  - [Design](./.agents/skills/design/SKILL.md): The Chalk Regime, UI, Motion, and Tailwind Aesthetics.
  - [Security](./.agents/skills/security/SKILL.md): Adversarial Audit & Security.

---

#### 2. Design System

[DESIGN.md](./DESIGN.md) is the **Single Source of Truth** for any user-facing application design, including color palettes, typography, and layout rules.

#### 3. Svelte 5 Sovereignty & Security

See [Svelte](file:///C:/Users/johng/.gemini/config/skills/svelte/SKILL.md).

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Mandate**: Use Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`). State over DOM—NEVER read UI state from HTML elements.
- **Data Boundaries**: All data crossing boundaries MUST be validated using strict raw JS typing and assertions.
- **Sanitization**: Construct HTML deterministically. `DOMPurify` is strictly mandated for untrusted, external inputs before rendering via `{@html ...}`.

---

#### 4. Perchance Constraints

- **Two-Panel Paradigm**: Logic operates strictly within the Perchance code-panel vs. output-panel architecture.
- **Persistence**: `Dexie.js` ONLY. Direct `localStorage` is forbidden due to iframe access limits.
- **Sovereign Modules**: Consolidate logical, physical, and data operations for a specific domain into a single module (e.g., all memory logic in `NarrativeEcho.js`).
- **Audio Context**: Native browser safety. NEVER instantiate audio without a direct user gesture to prevent autoplay blocking. ALWAYS `.close()` or `.suspend()` on unmount.

---

#### 5. The Implementation Loop

Once a plan is approved and grounded, execute using this atomic sequence:

1. **Task Tracking**: Ensure the [FUTURE.md](file:///C:/Users/johng/source/repos/RPGlitch/tasks/FUTURE.md) is initialized and anchored to [ETERNAL.md](file:///C:/Users/johng/source/repos/RPGlitch/tasks/ETERNAL.md).
2. **Logic & Tools**: Wire up **Svelte 5 Runes**. When building Perchance Bridges, use `window.exposed` safely. Consolidate tools; do not proliferate narrow functions.
3. **Aesthetic Polish**: Apply **The Chalk Regime** from `DESIGN.md` CSS variables and UI layout rules.
4. **State Persistence**: Anchor dynamic state and memory structures.

---

#### 6. The Navigator Protocol

- **Relative Resolution**: Internal references MUST use relative paths (e.g., `[PRESENT.md](./tasks/PRESENT.md)`).
- **Absolute Grounding**: Technical explanations MUST map to actual file paths and line numbers.
- **Navigator Protocol**: Adhere to the **Context Protocol** defined in [global GEMINI.md](file:///C:/Users/johng/.gemini/GEMINI.md).

---

## 04-Aesthetics

### ⚖️ The High Law

The [DESIGN.md](./DESIGN.md) is the absolute **Sovereign Source of Truth**. All sensory implementation (Visual, Auditory, Kinetic) MUST be grounded in its specifications.

#### ❄️ I. The Soul (Philosophy)

We operate within the **Nordic Collection**.

- **The Vibe**: A high-end research terminal in a sub-zero facility.
- **The Red Thread**: Abyssal depth, clinical precision, and subterranean light.

#### 📐 II. The Law (Constraints)

- **Token Sovereignty**: Derive physics from the Token Registry. However, **Tailwind v4 IDE IntelliSense is the absolute source of truth** for syntax. Never fight the IDE's shorthand suggestions.
- **The Weaver Protocol**: Any change to the aesthetic must first be recorded in `DESIGN.md` and then synchronized via `npm run sync:design`.

---

## 📖 The RPGlitch Lexicon

- **Swarm**: The tactical engine and lifecycle for multi-agent operations. A "Swarm" represents the technical engine that manages token scaling, parallel execution, and the 80% Confidence Gate.
- **RPGlitch**: The core simulation engine and repository name.
- **Temporal Engine**: The consolidated intelligence module managing the temporal continuum of an entity.
- **Entity Fragments**: The four-quadrant state architecture: **Eternal** (Baseline), **Present** (Immediate), **Past** (History), and **Future** (Intent).
- **Enhancement**: The process of refining raw entity data into high-fidelity fragments using the **3rd-Person Affirmative** law. Primarily targets `non_physical` fields and `vector` arrays.
- **Optics**: Physical fragments and image-prompts optimized for geometric and texture precision. Strictly synthesized from `physical` fields, excluding narrative traits.
- **Past Vectors**: (User UI: **Memories**) Historical anchors, critical precedents, and session resonances. Stored in the `past` vector array.
- **Future Vectors**: Active impulses, plans, prophecies, and impending intent. Stored in the `future` vector array.
- **Entity**: The fundamental unit of the simulation. An `entity` is either a `character` or a `fractal`.
- **Fractal**: World, setting, or environmental entity.
- **User Persona**: Human-controlled character (Entity).
- **AI Character**: Agent-controlled character (Entity).
- **Profile Readonly**: A state where entity data is locked from user editing (e.g., during specific narrative sequences or preview modes).
- **Simulation Lock**: A state where the simulation UI is disabled while the engine processes a turn.
- **Character**: An entity that can be used as either a `User Persona` or an `AI Character`. All characters and fractals share the same underlying entity pool.
- **Devmode**: Developer workspace.
- **GH CLI**: (`gh`) The primary interface for GitHub lifecycle management. Mandatory for Issue/PR/Workflow operations.
- **Lean Agent**: A performance configuration maintaining < 50 active MCP tools to ensure context window integrity.

---

## Memory Protocol (Agent vs Application)

> [!NOTE]
> **CRITICAL DISTINCTION**:
>
> - **Application Memory** (**Temporal Engine**, Dexie.js, RPGlitch State): Consult the [Simulation](./.agents/skills/simulation/SKILL.md) skill.
> - **Development Data** (Pinecone, Supabase, Agent Context): Consult the [Developer Database](file:///C:/Users/johng/.gemini/config/skills/developer-database/SKILL.md) skill.
