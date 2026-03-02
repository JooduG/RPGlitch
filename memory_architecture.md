# 🧠 RPGlitch Intelligence: Memory & History Architecture

This document provides a deep dive into how the system preserves context, manages history, and distills long-term memories ("Resonances") using a dynamic, RAG-inspired hybrid retrieval system.

---

## 🏗️ 1. The Three-Tier Memory Model

RPGlitch uses a tiered approach to context to balance **narrative continuity** with **token efficiency** (keeping the AI fast and cost-effective).

| Tier                   | Window        | Logic                             | Purpose                                                         |
| :--------------------- | :------------ | :-------------------------------- | :-------------------------------------------------------------- |
| **Tier 1: Snapshot**   | Last 3 Turns  | `ContextBroker.assemble_snapshot` | Immediate scene awareness for "Pulse" / Logic / Image checks.   |
| **Tier 2: History**    | ~10 Turns     | `Engine.generateAiResponse`       | Active conversational flow. Raw dialogue/actions.               |
| **Tier 3: Resonance**  | Permanent     | `Echo.memorize`                   | Distilled, structured long-term memory in the Entity's `PAST`.  |

---

## 📜 2. Short-Term History (The Sliding Window)

### Data Fetching & Clarification

When the user sends a message, `Engine.generateAiResponse` fetches messages from the Dexie database:

- It only pulls messages where `meta.consolidated` is NOT true.
- It takes the **last 10 messages** to form the "Active Window".

> [!NOTE]
> **Single Processing Pass**: While `PromptBuilder` has a `list_history` helper, the core simulation pipeline processes history **once**. `LlmService.generate` takes the message array, formats it into a plain-text `[CONVERSATION HISTORY]` block, and appends it to the final instruction string. This preserves the distinction between the "hard" system rules and the "fluid" conversation stream.

---

## 📡 3. The Echo System (Long-Term Memory)

The "Echo" (`src/core/intelligence/intelligence_echo.js`) is the long-term memory writer managed by the `NarrativeDirector`. It converts episodic memory into queryable semantic memory using a **Hybrid Tagging Schema**.

### The Consolidation Trigger

1. Every **12 turns**, the `NarrativeDirector.consolidate()` method triggers.
2. It takes the **oldest 10** messages from the active history.
3. These are sent to `Echo.memorize()`.

### The Distillation Process (Hybrid Tagging)

To prevent tag hallucination while maintaining specific noun-tracking, Echo processes the memory in two steps:

1. **Entity Tags (The Noun Check):** Echo asks the LLM to summarize the history and extract ONLY proper nouns, locations, and objects.
2. **Axis Tags (The Vibe Check):** The system automatically runs the resulting summary through `scan_reflexes()` (from `dynamics_engine.js`) to apply strict, hallucination-free kinetic tags (e.g., `VIOLENCE`, `STASIS`, `INTIMACY`).

The result is a **Structured Resonance Object**:

```json
{
    "summary": "Kaelen and the User found a hidden bunker in the jungle.",
    "axis_tags": ["STASIS", "SHIELDED"],
    "entity_tags": ["jungle", "bunker", "Kaelen"]
}
```

### Persistence

- The Resonance Object is pushed to the AI entity's `past.essence` JSON array.
- The 10 source messages are marked as `consolidated: true` in the database, evicting them from the active sliding window.

---

## 🧩 4. Memory Retrieval (The Injection Logic)

To prevent context bloating and context-loss, RPGlitch uses a dynamic **Scoring & Ranking** system to inject only the most relevant memories into the prompt.

1. **The Scan:** When the user types an input, the engine runs `scan_reflexes` (for Axis Tags) and a basic noun extraction (for Entity Tags).
2. **The Scoring:** The memory system queries the `past.essence` array, scoring overlaps:

- +1 point for every matching `entity_tag` (Location/Noun match).
- +2 points for every matching `axis_tag` (Vibe/Kinetic match).

3. **The Reverse Injection (Fixing "Lost in the Middle"):** - The top 3 ranked memories are retrieved.

- They are injected into the `<YOUR_IDENTITY>` block in **reverse order** (Lowest score at the top, Highest score at the absolute bottom). This ensures the most critical memory is the very last thing the AI reads before processing the new turn.

```xml
<YOUR_IDENTITY name="Kaelen">
    <FRAGMENT type="Past">
        [RESONANCE]: Kaelen read the archives about the old world.
        [RESONANCE]: The User and Kaelen mapped the jungle perimeter.
        [RESONANCE]: Kaelen and the User found a hidden bunker in the jungle.
    </FRAGMENT>
</YOUR_IDENTITY>

```

---

## 🔮 5. Future Threads (Objectives & Consequences)

The `future.essence` array tracks goals and looming threats. To provide the AI with psychological depth without over-engineering the database schema, RPGlitch uses a **"Baked-In" Stakes** prompt engineering format.

Objectives are stored as simple strings, but use strict bracket syntax to link an actionable verb to a looming threat:

- `Infiltrate the biotech facility. [CONSEQUENCE: Failure means the prototype virus is released.]`
- `Find the missing reactor logs. [RISK: The core will melt down if uncalibrated.]`

The LLM parses the first half as the task, and the bracketed section as the atmospheric/psychological pressure.

---

## 🔄 6. Summary of the Lifecycle

1. **Generation**: AI responds → Message stored in DB (`consolidated: false`).
2. **Context**: Next turn, last 10 unconsolidated messages serve as active history.
3. **Threshold**: 12 messages reached → `NarrativeDirector` picks oldest 10.
4. **Resonance**: `Echo.memorize` extracts summary + Entity Tags. System automatically appends Axis Tags.
5. **Consolidation**: Resonance pushed to `past.essence` array; 10 messages hidden.
6. **Retrieval**: User input triggers tag matching; Top 3 memories scored and injected into the prompt in reverse order.

---

## 🚀 Migration Plan: Structured Memory Upgrade

### 🧠 Core State (`src/state/runtime.svelte.js`)

- [ ] **[MODIFY]** `state.character.past.essence` and `state.activeFractal.past.essence` from `string` to `Array`.
- [ ] **[MODIFY]** `state.character.future.essence` and `state.activeFractal.future.essence` from `string` to `Array`.

### 📋 Entity Fragments (`src/core/intelligence/entity_fragments.js`)

- [ ] **[MODIFY]** Update `ENTITY_FRAGMENTS` definitions for `past.essence` and `future.essence` to reflect their structured nature (JSON Array). Add note on the `[CONSEQUENCE: ...]` formatting for future objectives.

### 📡 Memory Logic (`src/core/intelligence/intelligence_echo.js` & `engine.js`)

- [ ] **[MODIFY]** `intelligence_echo.js`: Update `MEMORY_PROTOCOL` prompt to request strict JSON with `summary` and `entity_tags`.
- [ ] **[MODIFY]** `intelligence_echo.js`: Import `scan_reflexes` from `dynamics_engine.js`. Run it on the generated summary to automatically populate the `axis_tags` array. Return full `{ summary, axis_tags, entity_tags, timestamp }` object.
- [ ] **[MODIFY]** `engine.js`: Update `Engine.NarrativeDirector.consolidate` to push the full object into the `past.essence` array instead of appending a string.

### 🧠 Prompt Engineering (`src/core/intelligence/prompt_builder.js`)

- [ ] **[NEW]** Add `score_memories(memories, current_input)` helper to calculate overlap points (+1 entity, +2 axis) based on the current turn's active signals.
- [ ] **[NEW]** Add `inject_memories(state, role)` helper to filter, score, and render the top 3 structured resonances in reverse-ranked order.
- [ ] **[MODIFY]** Update `SYSTEM_PROMPTS.simulation` and `SYSTEM_PROMPTS.prologue` to use `inject_memories` for the `PAST` block, and a standard array mapper for the `FUTURE` block.
