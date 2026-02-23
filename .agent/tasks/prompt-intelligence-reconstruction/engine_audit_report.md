# RPGlitch: Engine Interior Guide & Audit Report

This document consolidates all technical discoveries, architectural descriptions, and planned updates from the recent Engine Internals Audit.

## 🟢 Internal System Descriptions

### 1. The Core Engine Facade ([engine.js](src/core/engine/engine.js))

The `Engine` acts as the central orchestrator for the simulation logic and state transitions. Its `NarrativeDirector` module handles the [consolidate](src/core/engine/engine.js#L62-L114) function. It triggers once **12 unconsolidated messages** are reached, slicing the **first 10** for the `Echo` summarization service and appending the result to the entity's `timeline.past`.

### 2. Context Assembly & Payload Logic ([broker.js](src/core/intelligence/broker.js))

The [ContextBroker](src/core/intelligence/broker.js#L6-L251) prepares the payloads sent to the LLM. It fetches data in modular fragments:

- **Eternal:** Core identity and immutable traits.
- **Static:** History and backstory benchmarks.
- **Dynamic (World Data):** The current **Fractal** (world-fragment). This contains location-specific physics, localized lore, and the environmental state.
- **Snapshot:** The raw entity object (AI or User) passed into the assembly.
- **Entity:** Primary identity data filtered through the `LexicalFilter`.

### 3. The Lexical Sorting Filter ("Physically Move")

The [LexicalFilter](src/core/intelligence/broker.js#L191-L210) is the mechanism that "physically moves" data within the AI's context. It extracts keywords from the [vanguard](src/state/runtime.svelte.js#L71-L74) (the top-most narrative thread/objective) and compares them against all available memory fragments. Fragments containing matching keywords are sorted to the top of the context window, ensuring the AI sees them first and prioritizes them as "high-relevance" information.

### 4. Content Purification (Diegetic Filtering)

The [DiegeticFilter](src/core/intelligence/broker.js#L214) maintains the boundary between narrative prose and visual metadata. This allows the AI to "think" in colors and textures without leaking those notes into the story text.

- **Prose Mode:** Strips out all `[VISUAL]` tags (instructions for the AI image engine), leaving only the story text for the user.
- **Visual Mode:** Strips out `[TACTILE]` or sensory tags (via [DiegeticFilter](src/core/intelligence/broker.js#L214)), isolating purely visual instructions.

### 5. Entity Memory Hierarchy

The system manages memory in three distinct, layered structures:

- **Eternal Past (Traits):** Defined in [ENTITY_SCHEMA.eternal](src/core/narrative/schema.js#L8-L25). This covers permanent physical and mental baselines (phenotype, archetype) that anchor the character identity. These are "Locked" attributes that rarely change.
- **Static Past (Backstory):** Defined in [ENTITY_SCHEMA.past](src/core/narrative/schema.js#L42-L48), covering origin stories and historical anchors.
- **Temporal Past (Timeline/Resonance):** Stored in `character.timeline.past`. This is a dynamic, summarized layer of memories managed by the `Engine`'s consolidation loop.
    > [!NOTE]
    > **Schema vs. Runtime State:** While [schema.js](src/core/narrative/schema.js) defines the fields you see in the UI Editor, the actual entity objects in memory are "Hydrated" with fields like `timeline.past`. This field is created automatically when the engine consolidates 12 messages into a summary.

### 📖 Entity Memory Map

Memory flows from specific data buckets into the LLM context to ground the character:

1. **Persistent Anchor:** `Eternal` traits provide the physical/mental foundation.
2. **Contextual Anchor:** `Static` backstory provides the narrative history.
3. **Dynamic Anchor:** `Temporal` timeline provides recent memory (Resonance).
4. **Immediate Context:** `Chrono` (beats) provides the last 10-12 messages.
5. **Drivers:** Runtime `threads` (vanguard/echoes) define current goals.

### 6. Specialized Generator Contexts

The AI utilizes different distinct roles and prompt templates based on the task:

- **Story Mode:** High-temperature generation focusing on prose and character interaction, defined in [ContextBuilder.build](src/core/intelligence/context.js#L59).
- **Enhance Mode:** Used for profile refinement. It utilizes the [FIELD_REGISTRY](src/core/narrative/schema.js#L55-L70) in [schema.js](src/core/narrative/schema.js) to determine specific roles (e.g., `BIOMETRIC_RENDER_ENGINE`, `EPISODIC_MEMORY_COMPILER`).
- **Visual Mode:** Uses the [visualize](src/media/image-generation.js#L413) method. This takes a "Raw Intent" (like a character description) and "Polishes" it into a specific prompt using the `AestheticRouter` before calling the generation engine.
- **Physics Mode:** Low-temperature logic checks (0.3). Used for rule-check outcomes and handled via the **Security** builder.
- **Security Mode:** Defined in `ContextBuilder.buildSecurityPrompt` ([context.js:L138](src/core/intelligence/context.js#L138)) to analyze narrative integrity.

### 7. Narrative Thread Persistence ([runtime.svelte.js](src/state/runtime.svelte.js))

The [vanguard](src/state/runtime.svelte.js#L71-L74) is the primary objective returned by the runtime state, used as the guiding prompt for all AI generation. [echoes](src/state/runtime.svelte.js#L75-L77) are secondary narrative threads that provide surrounding depth.

---

## � Recommended Review Path (Prompt Audit)

To perform a deep review of how RPGlitch "thinks," follow this "Inside-Out" path:

1.  **The Blueprint (Data Shape):** [schema.js](src/core/narrative/schema.js) — Review the `ENTITY_SCHEMA` to see the raw "DNA" of characters and worlds.
2.  **The Components (Templates):** [context.js](src/core/intelligence/context.js) — Review the base `Screenplay` Kernels and system instructions.
3.  **The Assembly Line (Payloads):** [broker.js](src/core/intelligence/broker.js) — Review how data is fetched, filtered (Lexical/Diegetic), and injected into templates.
4.  **The Gateway (LLM Bridge):** [service.js](src/core/intelligence/service.js) — Review the final `generate` call, handling temperatures and token limits.
5.  **The Specialized Pipes:**
    - [image-generation.js](src/media/image-generation.js) — Visual prompt polish and the `AestheticRouter`.
    - [echo.js](src/core/intelligence/echo.js) — Memory summarization and "Resonance" generation.
6.  **The Orchestrator:** [engine.js](src/core/engine/engine.js) — See when and why these prompts are triggered in the game loop.

---

## �🔵 Suggestions & Plans for System Updates

### 1. Fractal Lore Leak Fix

**Investigation:** The `description` field in the Story Fractal (developer notes) was being leaked into the AI context.
**Fix:** Patched in [broker.js](src/core/intelligence/broker.js#L135-L142) to exclude human-only description fields from the LLM prompt.

### 2. Implementation of the "Literalism Protocol"

**Observation:** The AI occasionally generates hypothetical or "made-up" examples to explain technical concepts.
**Status:** Implemented in [.agent/rules/05-standards.md](.agent/rules/05-standards.md). See **Section 9: The Literalism Protocol** for strict grounding rules.

### 🛡️ Specialized Prompt Builders

- **Echo (Memory):** `ContextBuilder.buildDataEchoPrompt` ([context.js:L233](src/core/intelligence/context.js#L233)) - Summarizes narrative beats into long-term "Resonance".
- **Security (Integrity):** `ContextBuilder.buildSecurityPrompt` ([context.js:L138](src/core/intelligence/context.js#L138)) - Analyzes the last message for [DYNAMICS] (entropy, velocity, resonance).
