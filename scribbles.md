# 🧠 RPGlitch Cognitive Architecture & Prompt Engineering (v5.0)

> **Status**: UNDER DEVELOPMENT, NOT CANON!

---

## 🏗️ 1. The Intelligence Pipeline

The RPGlitch cognitive engine relies on a strictly layered architecture that moves data from static blueprints into a dynamic, filtered prompt context before routing it to the LLM.

### Tier 1: The Blueprint (Data Schema)

- **Entity Fragments (`entity_fragments.js`)**: The fundamental DNA of characters and environments. Defines all data schemas and AI formatting directives (e.g., `CORE_COGNITIVE_ARCHITECT`).
- **Temporal Vectors (`vector_engine.js`)**: The standardized structure for all dynamic memories and goals (`{ id, text, summary, axis_tags, entity_tags, timestamp }`).

### Tier 2: The Assembly Line (Context Broker)

- **Context Broker (`intelligence_broker.js`)**: Assembles the raw data into cohesive chunks. It applies physical sorting (Lexical Filter) and modality purification (Diegetic Filter).
- **Prompt Builder (`prompt_builder.js`)**: Maps the assembled context into explicit XML system prompts based on specific operational modes (Simulation, Enhancement, Visual).

### Tier 3: The Gateway (Execution)

- **LLM Service (`intelligence_service.js`)**: The network bridge routing the assembled payload to the AI provider.
- **Dynamics Engine (`dynamics_engine.js`)**: The primary game loop orchestrator managing chronological turns, state updates, and triggering memory consolidation.

---

## 📖 2. The Entity Memory Hierarchy

Entity data is injected into the prompt as a layered psychological stack, giving the AI immediate scene awareness alongside deep historical grounding.

1. **Eternal (The Persistent Anchor)**
    - **Physical/Non-Physical Traits:** Immutable baseline data (e.g., phenotype, psychological archetype, vocal tics).
2. **Present (The Immediate State)**
    - **Conditions & Status:** Fluid physical wounds, active HUDs, and immediate emotional volatility.
3. **Future Vectors (The Drivers)**
    - **Objectives & Dooms:** Actionable tasks paired with atmospheric stakes. Stored as structured vectors. If a vector carries emotional physics tags, it is injected as a `[FUTURE_VECTOR]`.
    - _Example:_ `Infiltrate the facility. [FUTURE_VECTOR: Failure means the virus is released.]`
4. **Past Vectors (The Historical Anchor)**
    - **Distilled Lore:** The structured, condensed memories of past narrative beats. Stored as `[PAST_VECTOR]`.
5. **Chrono History (The Active Window)**
    - **Sliding Dialogue:** The last 10 unconsolidated conversational turns providing immediate scene momentum.

---

## 📡 3. RAG Retrieval & Memory Echoes

RPGlitch solves the "Goldfish Memory" and "Token Bloat" problems of standard LLM roleplay via an active semantic/kinetic retrieval system.

### A. The Consolidation Loop (Echo)

Every 12 turns, the **Narrative Director** automatically intervenes to prevent context overflow:

1. It slices the oldest 10 messages from the active Chrono history.
2. The **Echo Service** condenses these messages into a single-sentence `summary` and extracts proper nouns (`entity_tags`).
3. The engine automatically derives kinetic `axis_tags` (e.g., `IMPACT`, `STASIS`) by running the summary through the Dynamics Engine.
4. The messages are marked as `consolidated`, hidden from the sliding window, and the new **Past Vector** is saved to the Entity's memory.

### B. Weighted Retrieval & Injection

To inject only relevant lore during a turn, the **Vector Engine** scores all available Past and Future vectors against the user's latest input:

- **Vibe Match (+2 Points):** The input triggers physics `axis_tags` that match the vector (e.g., a memory of combat retrieved during a firefight).
- **Noun Match (+1 Point):** The input contains `entity_tags` (names/locations) present in the vector.

**Reverse Injection Pattern:** To combat the LLM "Lost in the Middle" phenomenon, the top 3 scored memories are injected into the prompt in _reverse order_. The highest-scoring, most critical memory is placed at the absolute bottom of the identity block—closest to the active conversation.

---

## 🔍 4. Context Filtering (Purification)

Before fragments reach the prompt, they pass through specialized broker filters to maintain narrative sanity.

### The Lexical Filter (Relevance Sorting)

Extracts keywords from the **Vanguard** (the character's immediate top-priority objective) and compares them against all memory fragments. Fragments containing matches are physically sorted to the top of their respective prompt sections, heavily weighting the AI's attention toward active plot threads.

### The Diegetic Filter (The Fourth Wall)

Maintains the boundary between narrative prose and engine metadata.

- **Prose Mode:** Strips out purely visual formatting metadata (`[VISUAL]`), ensuring the AI doesn't leak developer notes or aesthetic routing tags into character dialogue.
- **Visual Mode:** Strips out abstract narrative concepts, isolating strictly physical and sensory descriptions to feed the image generation engine.

---

## 🎭 5. Narrative Physics & Protocols

### A. Dynamics Reflexes

RPGlitch listens to the user's input and dynamically adjusts the AI's writing style based on detected kinetic intent.

| Reflex ID    | Keyword Triggers   | Instruction Injected                            |
| :----------- | :----------------- | :---------------------------------------------- |
| `ADRENALINE` | run, sprint, dash  | "Short sentences. Action over introspection."   |
| `STATIC`     | scream, weird, rot | "Reality destabilizing. Describe glitching."    |
| `NERVE`      | kiss, hold, soft   | "Sensory focus. Dilate time. Somatic feedback." |
| `STASIS`     | wait, quiet, sleep | "Focus on ambient environment. Slow momentum."  |

### B. The Literalism Protocol (Global Rules)

The baseline behavioral constraints enforced on every standard simulation prompt:

- **USER_AGENCY:** "Never generate dialogue, thoughts, or actions for the User."
- **EPISTEMIC_WALL:** "Treat the User as a Black Box. You have no access to their internal motivations."
- **HYGIENE:** "Forbid preambles, intro-lines, and technical metadata. Start every response directly."
- **IMMERSION:** "Show, don't tell. Describe sensory physics over abstract emotion."

---

## 📝 6. System Prompt Topology (XML Format)

The system prompt is dynamically assembled into a highly structured XML manifest to ensure the LLM perfectly parses character boundaries.

```xml
<SYSTEM role="Viper">
  <STATE turn="42"></STATE>

  <YOUR_IDENTITY name="Viper">
    <FRAGMENT type="Eternal">...</FRAGMENT>
    [PAST_VECTOR]: Escaped the facility using the User's override codes.
    [FUTURE_VECTOR]: Evade the corporate bounty hunters. [CONSEQUENCE: Death]
  </YOUR_IDENTITY>

  <USER_PERSONA name="John">
    <FRAGMENT type="Eternal">...</FRAGMENT>
  </USER_PERSONA>

  <FRACTAL name="The Rust Wastes">
    <FRAGMENT type="Present">Corrosive winds and scrap heaps.</FRAGMENT>
  </FRACTAL>

  <HISTORY>
    <entry role="USER_PERSONA" name="John">We need to move, now.</entry>
  </HISTORY>

  <NARRATIVE_STYLE>Short sentences. Action over introspection.</NARRATIVE_STYLE>

  <PROTOCOLS>
    - USER_AGENCY: Never generate dialogue for the User.
    - IMMERSION: Show, don't tell.
  </PROTOCOLS>
</SYSTEM>
```

---

## 🚀 7. Active Roadmap: Broker Reactivity Upgrade (Phase 2)

**Goal:** Shift `intelligence_broker.js` from an On-Demand (Pull) Model to a Svelte 5 Reactive (Push/Cache) Model.

**Proposed Changes:**

1. **Singleton Migration:** Convert `ContextBroker` to a stateful class instance.
2. **`$derived` Caching:** Pre-compute standard layers (`kernelLayer`, `entityLayer`, `historyLayer`) automatically in the background using `$derived` runes when `runtime` state changes.
3. **Zero-Latency Assembly:** `assemble()` will no longer run heavy data mapping or filtering at generation time; it will instantly read the cached string representations.
4. **Constraint:** The Broker must continue emitting pure POJOs to `prompt_builder.js` to ensure the core prompt string formatting remains entirely decoupled from the Svelte framework.
