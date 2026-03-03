# 🧠 RPGlitch Intelligence Pipeline (v5.0) — Master Architectural Blueprint

> **Status**: [ACTIVE] · **Branch**: `main` · **Last Audit**: 2026-02-27
> **Purpose**: This document IS JUST IDEAS, IT IS NOT CANON.

---

## 🏛️ 1. Core Philosophy: The Dynamic Stack

RPGlitch does not use static, monolithic prompts. Instead, it treats the prompt as a **dynamic stack** that reassembles itself every time the user acts. The system is designed to defeat "Goldfish Memory," maintain strict character boundaries, and seamlessly weave sensory world-building into standard dialogue without leaking metadata.

**Key Technical Resolutions (v5.0 Standard):**

- **Entity Tags:** All characters are defined via `<AI_CHARACTER>` and `<USER_CHARACTER>` (replacing legacy `<ENTITY>` tags).
- **Rule Formatting:** Standardized to object-path notation (e.g., `RULE.USER_AGENCY`).
- **Narrative Styling:** Handled via the `<NARRATIVE_STYLE>` XML block.

---

## 🏗️ 2. The Meridian Progression (System Architecture)

Data flows from static blueprints to active execution through four distinct tiers.

### Tier 1: The Blueprint (Data Contracts)

_The raw DNA of the characters, world, and formatting rules._

- **`schema.js` / `intelligence_registry.js`**: Defines the fundamental schemas (`ENTITY_SCHEMA`) and metadata fields.
- **`intelligence_atoms.js`**: Houses the foundational rendering functions that convert JSON state data into structured XML tags.

### Tier 2: The Molecule (Cognitive Logic & Prompt Templates)

_The system templates and assembly logic._

- **`intelligence_logic.js` (ContextBuilder)**: Contains the `SYSTEM_PROMPTS` manifest and core screenplay kernels.
- **`PromptBuilder`**: Enforces system protocols (`RULE.GROUNDING`, `RULE.USER_AGENCY`).
- **`intelligence_echo.js`**: The summarization service that converts episodic chat history into long-term "Resonance."

### Tier 3: The Orchestrator (Active Assembly)

_The engine that fetches, filters, and routes data during runtime._

- **`engine.js`**: The central orchestrator. Its `NarrativeDirector` controls memory consolidation checkpoints.
- **`intelligence_broker.js` (ContextBroker)**: Prepares the payload. It fetches fragments, runs them through the Lexical/Diegetic filters, and assembles the exact context needed for the current turn.
- **`intelligence_service.js` (LlmService)**: The gateway that routes the final payload to the LLM, managing temperature and token limits.

### Tier 4: The Projection (Specialized Generators)

_Alternative generation pipelines outside of standard prose._

- **`image_engine.js`**: Translates narrative state and aesthetic routing into visual generation prompts.
- **Security & Physics Builders**: Low-temperature logic checkers used for rule-resolution and narrative integrity analysis.

---

## 🧠 3. Cognitive Memory & Context Injection

To maintain character consistency and deep lore without blowing out the token window, RPGlitch uses a multi-layered, keyword-driven memory hierarchy.

### A. The Memory Hierarchy

The character's "mind" is built from three distinct anchors:

1. **Eternal Past (The Anchor):** Immutable traits, core identity, psychological archetype, and physical phenotype. (Rarely changes).
2. **Static Past (The Backstory):** Origin stories and foundational history.
3. **Temporal Past (The Resonance):** Stored in `timeline.past`. This is dynamic memory. Every 12 turns, `engine.js` slices the oldest 10 messages, sends them to `intelligence_echo.js` for summarization, and appends the result here to prevent context bloat.

### B. Narrative Threads (Future/Present Intent)

- **Vanguard:** The primary, active objective driving the character's immediate actions.
- **Echoes:** Secondary, background narrative threads providing atmospheric depth.

### C. The Filtering Mechanisms

The `ContextBroker` uses two primary filters before injecting memory into the prompt:

1. **Lexical Filter (Keyword Sorting):** Scans the user's input and the active _Vanguard_ for keywords (e.g., "Dragon"). It then physically sorts memory fragments containing those keywords to the **top** of the context window, ensuring the AI prioritizes high-relevance lore.
2. **Diegetic Filter (Metadata Purification):** Ensures the AI's internal reasoning doesn't leak into the story. It strips `[VISUAL]` tags during prose generation, and strips narrative/tactile tags during image generation.

### D. Injection Depth Strategy

Instead of front-loading all global instructions at the top of the prompt, RPGlitch utilizes an **Injection Depth** system. Global vibes, formatting rules, and critical immediate memory are injected exactly **3 or 4 messages back** from the end of the chat history. This bypasses the LLM "Lost in the Middle" syndrome, ensuring instructions heavily influence the immediate response without breaking conversational flow.

---

## 🎭 4. Narrative Physics & Governing Protocols

### A. Core Directives (`intelligence_logic.js`)

| Protocol                   | Function                                                                                              |
| :------------------------- | :---------------------------------------------------------------------------------------------------- |
| `RULE.USER_AGENCY`         | Absolute ban on mind-reading or generating dialogue/actions for the User.                             |
| `RULE.POSITIVE_GOVERNANCE` | Enforces present-tense execution, affirmative commands, and bans preambles.                           |
| `RULE.GROUNDING`           | The Literalism Protocol. Bans hallucinated examples; grounds the AI strictly in the provided reality. |

### B. Physics Reflexes

The engine dynamically alters the AI's writing style by detecting kinetic keywords in the active scene.

| ID                 | Trigger Keywords     | Adjustments      | Injection Instruction                           |
| :----------------- | :------------------- | :--------------- | :---------------------------------------------- |
| `REFLEX_KINETIC`   | run, sprint, dash    | Vel: 90          | "Short sentences. Action over introspection."   |
| `REFLEX_VIOLENCE`  | attack, shoot, kill  | Vel: 80, Ent: 60 | "Visceral impact. Describe pain/damage."        |
| `REFLEX_EROS`      | touch, caress        | Vel: 30, Ent: 40 | "Sensory focus. Dilate time. Somatic feedback." |
| `REFLEX_COGNITIVE` | think, plan, analyze | Vel: 20          | "Expand internal logic. Trace causal chain."    |

### C. Tone Registry (Lenses)

| Lens Key    | Tone Adjustments | Style Directive                             |
| :---------- | :--------------- | :------------------------------------------ |
| `DEFAULT`   | Vel: 50, Ent: 20 | Standard roleplay. Balanced and reactive.   |
| `NOIR`      | Vel: 40, Ent: 30 | High contrast. Cynical inner monologue.     |
| `ELDRIITCH` | Vel: 30, Ent: 80 | Describe the unnameable. Sanity is fragile. |
| `CYBERPUNK` | Vel: 85, Ent: 50 | High tech, low life. Slang is prevalent.    |

---

## 📝 5. The Output: Master Prompt Matrix

When all tiers complete their execution, the final XML payload passed to the LLM follows this strict schema:

```xml
<SYSTEM_PROMPT>
  <ENTITY_LAYER>
    <AI_CHARACTER name="{name}">
        <FRAGMENT type="Eternal" enhancer="CORE_COGNITIVE_ARCHITECT">{content}</FRAGMENT>
    </AI_CHARACTER>
    <USER_CHARACTER name="{name}">
        <FRAGMENT type="Identity" enhancer="CORE_COGNITIVE_ARCHITECT">{content}</FRAGMENT>
    </USER_CHARACTER>
  </ENTITY_LAYER>

  <SYSTEM_LAYER>
    <COGNITIVE_CORE>
        Render reasoning in <think> blocks before output.
        <NARRATIVE_STYLE>{tone.style} + {active_reflexes}</NARRATIVE_STYLE>
    </COGNITIVE_CORE>
  </SYSTEM_LAYER>

  <HISTORY>
    </HISTORY>

  <PROTOCOLS>
    {RULE.USER_AGENCY}
    {RULE.GROUNDING}
  </PROTOCOLS>

  <INPUT_COMMAND>
    {input}
  </INPUT_COMMAND>
</SYSTEM_PROMPT>

```

---

## 🚀 6. Execution Roadmap & Infrastructure Upgrades

### Action Items & Pending Fixes

- [ ] **Loop Resolution:** Fix `render_system` to ensure `tone.instructions` (calculated reflexes) are properly injected into the prompt loop.
- [ ] **Protocol Integration:** Ensure `RULE.GROUNDING` is actively appended to the simulation template.
- [ ] **Data Cleansing:** Fix legacy typo propagation in the codebase (e.g., `ELDRIITCH` -> `ELDRITCH`).
- [ ] **Atom Alignment:** Update `render_entity` in `intelligence_atoms.js` to perfectly match the new multi-tiered fragment hierarchy.

### Phase 2 Upgrade: The Reactive Context Broker (Svelte 5)

The next major architectural leap shifts the `intelligence_broker.js` from an **On-Demand (Pull) Model** to a **Reactive (Push/Cache) Model** using Svelte 5 runest.

1. **Reactive Singleton:** Transition `ContextBroker` to an instantiated `BrokerStore`.
2. **`$derived` Caching:** Instead of recalculating the context window upon every user message, the broker will use `$derived` state to maintain live, pre-calculated string representations of the `kernelLayer`, `entityLayer`, and `historyLayer`.
3. **Execution:** The assembly phase becomes virtually instant, trading a small amount of memory overhead for zero-latency prompt generation.
4. **Constraint:** Tier 1 modules (`intelligence_atoms.js`, `intelligence_logic.js`) **must** remain pure Vanilla JS. The reactive Broker must pass pure POJOs down to the logic layer to ensure the prompt generation itself remains completely framework-agnostic.
