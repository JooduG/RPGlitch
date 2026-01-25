# Advanced Context Architecture

## Section 5: Advanced Context Architecture

Moving beyond simple "Chat Bots," sophisticated AI applications require a structured approach to **Context Engineering**. Instead of a single "Instruction" field, advanced engines use a **Layered Injection Strategy** to ensure stability, consistency, and depth.

### 1\. The Layered Context Model

To prevent the AI from "forgetting" rules or hallucinating facts, the context sent to the LLM should be assembled from distinct, hierarchical layers.

#### Layer 1: The Kernel (System Directives)

This is the immutable foundation of your application. It defines the "Laws of Physics" for the AI. It is never seen by the user but is always present in the prompt.

- **Role:** Enforces safety overrides, output formatting (JSON vs. Text), and absolute agency rules (e.g., "Never write dialogue for the user").
- **Priority:** Highest. This layer overrides all others.

#### Layer 2: The World State (Environmental Constants)

This layer grounds the narrative in a physical reality. It prevents "White Room Syndrome" by enforcing atmospheric continuity.

- **Content:** Current weather, lighting, location physics, and "Sensory Tiers" (Mandating descriptions of smell, sound, and temperature).

#### Layer 3: The Entity Snapshot (Dynamic State)

Instead of a static biography, advanced apps inject a **Real-Time Snapshot** of the character. This snapshot is generated programmatically before every turn.

### 2\. The Four-Field Data Schema

For complex RPGs or simulations, a simple "Description" field is insufficient. Adopt the **Four-Field Schema** to separate immutable truths from temporary states.

| Field       | Name   | Purpose                                       |
| :---------- | :----- | :-------------------------------------------- |
| **forever** | Truth  | Immutable traits and core personality.        |
| **present** | State  | Mutable details: Clothing, Wounds, Inventory. |
| **past**    | Log    | Compressed narrative log.                     |
| **future**  | Vector | Current goals and impending threats.          |

**Why this works:**
Separating `<PRESENT>` from `<FOREVER>` allows a character to change clothes, get injured, or change moods without "forgetting" who they are. The AI is instructed to prioritize `<PRESENT>` for the immediate scene while checking `<FOREVER>` for consistency.

### 3\. Parametric Steering (Narrative Physics)

Language models struggle with abstract instructions like "Be more chaotic." They respond better to **Parametric Steering**—injecting specific mathematical values that force stylistic changes.

**The Concept:**
Treat the narrative like a physics simulation governed by variables. Calculate these variables in JavaScript and inject them into the prompt.

**Example Variables:**

- **Entropy (0-100):** Measure of chaos/disorder. High entropy forces messy, fragmented descriptions. Low entropy enforces order and calm.
- **Velocity (0-100):** Pacing of the scene. High velocity forces short sentences and urgent action.
- **Permeability (0-100):** Emotional openness. High permeability allows vulnerability; low permeability forces defensiveness.

**Implementation:**

```javascript
// In your prompt builder
systemPrompt += `
<NARRATIVE_PHYSICS>
Current Entropy: ${gameState.entropy}% (High Chaos)
Current Velocity: ${gameState.velocity}% (Fast Paced)
</NARRATIVE_PHYSICS>
Mandate: Your prose rhythm MUST reflect these values.
`
```
