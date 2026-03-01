# 🧠 Prompt Audit — RPGlitch Intelligence Pipeline (v5.0)

> **Source of Truth**: This document merges the **Executive Summary**, **Technical Specification**, and **Architectural Scribbles**.
> **Status**: [ACTIVE] · **Branch**: `main` · **Last Audit**: 2026-02-27

---

## ⚡ Document Conflict Log (Summary vs. Tech Spec)

The following discrepancies were found between the source documents.

| Feature           | Executive Summary (`.md`) | Technical Spec (`..md`) | Resolution Note                          |
| :---------------- | :------------------------ | :---------------------- | :--------------------------------------- |
| **Entity Tag**    | `<ENTITY>`                | `<AI_CHARACTER>`        | Spec preferred for granularity.          |
| **Narrative Tag** | `<NARRATIVE_LENS>`        | `<NARRATIVE_STYLE>`     | Spec preferred for code alignment.       |
| **Rule Format**   | `RULE_NAME`               | `RULE.NAME`             | Spec preferred for object-path notation. |
| **Tone Typos**    | Omitted                   | Preserved (`ELDRIITCH`) | Spec preferred for continuity.           |

---

## 🏗️ 1. Architecture & Jurisdiction

The "Meridian Progression" tracks data flow from static definition to active orchestration.

### Tier 1: The Blueprint (Data Contracts)

- **`intelligence_registry.js`**: Defines the `ENTITY_DEFINITION` and available enhancers.
- **`intelligence_atoms.js`**: Base specialized renderers (State -> XML).

### Tier 2: The Molecule (Cognitive Logic)

- **`intelligence_logic.js`**: Houses the `SYSTEM_PROMPTS` manifest.
- **`PromptBuilder`**: Enforces the Literalism Protocol (`GROUNDING`, `USER_AGENCY`).
- **`intelligence_echo.js`**: Manages memory condensation and resonance.

### Tier 3: The Orchestrator (Active Execution)

- **`intelligence_broker.js`**: The `ContextBroker`. Handles payload assembly.
- **`intelligence_service.js`**: The `LlmService`. Routes enhancement calls.
- **`narrative_engine.js`**: Connects the kernel to the simulation loop.

### Tier 4: The Projection

- **`image_engine.js`**: Bridges the intelligence layer to visual generation.

---

## 🔄 2. Pipeline Orchestration

```mermaid
graph TD
    subgraph "Orchestration (JS)"
        Bus[bus.svelte.js] --> Broker[ContextBroker]
{{ ... }}
    end
```

---

## 🧩 3. XML Atoms (`intelligence_atoms.js`)

### 👤 `render_entity`

**Conflict Detected**: Summary proposed `<ENTITY>`, but Tech Spec uses `<AI_CHARACTER>`.

**Merged Specification (v5.0):**

```xml
<ENTITY_LAYER>
    <ENTITY role="AI" name="Viper">
        <FRAGMENT type="Eternal" enhancer="CORE_COGNITIVE_ARCHITECT">Analytical calculation.</FRAGMENT>
        <FRAGMENT type="Armor" enhancer="LOADOUT">Heavy durasteel plating.</FRAGMENT>
    </ENTITY>
    <ENTITY role="USER" name="John">
        <FRAGMENT type="Identity" enhancer="CORE_COGNITIVE_ARCHITECT">Resourceful engineer.</FRAGMENT>
    </ENTITY>
</ENTITY_LAYER>
```

---

## 📜 4. Protocol Rules (`intelligence_logic.js`)

| Audit Name             | Summary               | Spec Reference             | Logical Function                       |
| :--------------------- | :-------------------- | :------------------------- | :------------------------------------- |
| **USER_AGENCY**        | `USER_AGENCY`         | `RULE.USER_AGENCY`         | Prevents mind-reading/acting for user. |
| **AFFIRMATIVE_ORDERS** | `POSITIVE_GOVERNANCE` | `RULE.POSITIVE_GOVERNANCE` | Enforces present-tense/no-preamble.    |
| **GROUNDING**          | `GROUNDING`           | `RULE.GROUNDING`           | Anti-hallucination mandate.            |

---

## 🎭 5. Narrative Physics

### A. Physics Reflexes

Dynamic instruction injection based on keyword detection.

| ID                 | Keywords                | Velocity | Entropy | Instruction                                     |
| :----------------- | :---------------------- | :------- | :------ | :---------------------------------------------- |
| `REFLEX_KINETIC`   | run, sprint, dash...    | 90       | —       | "Short sentences. Action over introspection."   |
| `REFLEX_VIOLENCE`  | attack, shoot, kill...  | 80       | 60      | "Visceral impact. Describe pain/damage."        |
| `REFLEX_EROS`      | touch, caress...        | 30       | 40      | "Sensory focus. Dilate time. Somatic feedback." |
| `REFLEX_COGNITIVE` | think, plan, analyze... | 20       | —       | "Expand internal logic. Trace causal chain."    |

### B. Tone Registry (Lens Matrix)

| Key            | Label         | Vel | Ent | Instruction                                   |
| :------------- | :------------ | :-- | :-- | :-------------------------------------------- |
| `DEFAULT`      | RPGlitch Std  | 50  | 20  | "Standard roleplay. Balanced and reactive."   |
| `NOIR`         | Neo-Noir      | 40  | 30  | "High contrast. Cynical inner monologue."     |
| `ELDRIITCH`    | Cosmic Horror | 30  | 80  | "Describe the unnameable. Sanity is fragile." |
| `HIGH_FANTASY` | Mythic        | 50  | 10  | "Elevated diction. Lineage and duty."         |
| `CYBERPUNK`    | Chrome & Dust | 85  | 50  | "High tech, low life. Slang is prevalent."    |

---

## 📝 6. System Prompt Matrix

### `SYSTEM PROMPT.simulation` (The Master)

```xml
<SYSTEM_PROMPT>
  <ENTITY_LAYER>
    <AI_CHARACTER name="{name}">...</AI_CHARACTER>
    <USER_CHARACTER name="{name}">...</USER_CHARACTER>
  </ENTITY_LAYER>
  <SYSTEM_LAYER>
    <COGNITIVE_CORE>
        Render reasoning in <think> blocks before output. Mode: {tone.style}.
    </COGNITIVE_CORE>
    <VISUALS status="{status}">
        {instruction}
    </VISUALS>
  </SYSTEM_LAYER>
  <INPUT_COMMAND>
    {input}
  </INPUT_COMMAND>
</SYSTEM_PROMPT>
```

---

## 🚧 Infrastructure Gaps & Open Issues

1. **Versioning**: Code identifies as `v3.0`, Docs target `v5.0`.
2. **Looping**: `render_system` lacks the loop for `tone.instructions` (Reflexes are calculated but not transmitted).
3. **Missing Integration**: `RULE.GROUNDING` is defined but not injected into the simulation template.
4. **Typo Propagation**: `ELDRIITCH` (double L) is in code; `CYBERPUNK` instruction case needs fix in source.
5. **Entity Atom**: `render_entity` needs to be updated to match the new fragment hierarchy.

---

## 🚀 7. Addendum: Phase 2 Intelligence Broker Upgrade

This outlines the future upgrade path for `intelligence_broker.js` to use Svelte 5 Runes (`$derived`), shifting from an **On-Demand (Pull) Model** to a **Reactive (Push/Cache) Model**.

### Proposed Architecture

1.  **Reactive Singleton**: Convert `ContextBroker` from a static class (`export class ContextBroker`) to a stateful singleton (`class BrokerStore` -> `export const context_broker = new BrokerStore()`).
2.  **`$derived` Context Layers**: Convert `pull*` methods into `$derived` getters to cache layer states:
    - `kernelLayer`: `$derived` string from static rules.
    - `entityLayer`: `$derived` object tracking `runtime.activeAI` and `runtime.activeUser`. Heavy transformations (`transformToFragments`, `LexicalFilter`, `DiegeticFilter`) run automatically in the background when character state changes.
    - `historyLayer` & `snapshotLayer`: `$derived` tracking `state.messages.byStoryId`. Quietly updates the 10-message slice and 3-message beat map.
3.  **The Assembly Phase**: `assemble(action, type)` no longer processes data. It simply reads the cached `$derived` layers and passes them to the `NarrativeEngine`.

### Architectural Constraints & Boundaries

- **Protection of the Blueprint**: Tier 1 (The Blueprint) modules like `intelligence_atoms.js` and `intelligence_logic.js` MUST remain pure Vanilla JS. The reactive Broker must pass pure POJOs down to the logic layer, ensuring prompt generation remains framework-agnostic.
- **No Impact on Output Shape**: Upgrading the Broker only changes _when_ data is filtered (reactively vs. on-demand). It does _not_ change the final XML shape handed to the Atoms.
- **Overhead Considerations**: Holding `$derived` caching layers in memory means the system retains active stringified representations, trading memory/background computation for instant prompt assembly speed. Time-travel features involving past states may require specific workarounds.
