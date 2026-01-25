# Architectural Patterns

## Section 7: Architectural Patterns

For production applications, choosing the right architecture is critical.

### Pattern A: The Interaction Engine (Standard Chat)

For applications focused on textual interaction (chat bots, simple RPGs), the architecture leverages the `oc` object as an event bus.

- **Architecture:** Event-Driven. Listen to `MessageAdded`.
- **State:** Mostly relies on chat history + simple variables.
    - **Best For:** Simple characters, chat bots.

### Pattern B: The Visual Engine (Image Gen)

For applications focused on generative imagery, the architecture uses a **Two-Stage Pipeline**: Compile → Render.

- **Stage 1 (Probability):** Perchance lists select _what_ to draw.
- **Stage 2 (Weighting):** Diffusion syntax (`(keyword:1.2)`) controls _how_ it draws.
- **Pipeline:** Lists -\> Prompt String -\> `textToImage()` -\> Display.

### Pattern C: The Simulation Engine (Advanced)

For applications that require deep state persistence, complex world logic, and long-term memory (e.g., RPGs, Strategy Games), the "Standard Chat" pattern is insufficient.

**The Simulation Engine** treats the AI not as a chatbot, but as a component in a larger loop. The application manages the state; the AI merely renders the next frame.

#### 1\. The Component Triad

The architecture is built on three distinct roles:

1. **The Actor (Foreground):** The primary LLM call that generates the prose/dialogue the user sees. It has no memory of its own; it only knows what is in the current context window.
2. **The Simulator (Background):** A hidden, secondary process that calculates the _consequences_ of the action. It updates the database (health, inventory, world state) based on what happened.
3. **The Archivist (Maintenance):** A background process that manages context window space. It compresses old logs into "Memories" and ensures the `<PAST>` field remains dense and relevant.

#### 2\. The "Heartbeat" Protocol

To keep the simulation alive without consuming excessive tokens or API calls, implement a **Heartbeat Protocol**.

- **Logic:** Do not update every entity every turn.
- **Cycle:** Update the **Active Character** on Turn 1, the **User State** on Turn 2, and the **World/Environment** on Turn 3.
- **Effect:** This distributes the computational load while ensuring the entire world stays "fresh" and reactive over time.

#### 3\. The "Director" Loop (Feedback-Driven Variance)

In a standard chat, "Regenerate" just rolls the dice again. In a Simulation Engine, "Regenerate" is a corrective feedback loop.

**The Loop:**

1. **Rejection:** The user rejects Message A.
2. **Analysis:** The Engine compares Message A to the User's inputs to determine _why_ it failed (e.g., "Too repetitive," "Ignored instructions").
3. **Variance Injection:** The Engine generates a temporary **"Director Note"** (e.g., _"Critique: The previous attempt was too passive. Increase aggression by 20%."_).
4. **State Rollback:** Crucially, any background updates triggered by Message A (e.g., damage taken) are reverted to prevent "Ghost Memories."
5. **Execution:** The Actor generates Message B with the new Director Note guiding it.

#### 4\. Implementation Strategy

This architecture requires abandoning the `oc` object for logic.

- **State:** Use `Dexie.js` (IndexedDB) as the Single Source of Truth.
- **Logic:** Write a `StoryController` class in the Right Panel (JavaScript) to manage the prompt construction and API calls.
- **API:** Use `window.ai()` directly. Do not rely on Perchance's built-in chat UI state.

**Example Flow:**

```javascript
async function handleTurn(userInput) {
    // 1. Commit User Input to DB
    await db.messages.add({ role: "user", text: userInput })

    // 2. Build Context (Kernel + World + Entity Snapshots)
    // Actual implementation usage:
    const builder = new ContextBuilder(storyId)
    const prompt = await builder.build()

    // 3. Call The Actor
    const response = await window.ai(prompt)

    // 4. Commit AI Response to DB
    await db.messages.add({ role: "ai", text: response })

    // 5. Trigger Background Simulation (Fire and Forget)
    // Does NOT block the UI. Updates stats/inventory in the background.
    TurnManager.runBackgroundUpdate(storyId)
}
```

---

## Section 8: Expert Patterns and Best Practices

### Architecting for Consistency

#### The Single Source of Truth

The `instruction/role` (or the Kernel Layer in advanced apps) must be the definitive source for the character's traits.

#### Show, Don't Just Tell

Instead of listing keywords ("witty, brave"), include concrete examples of dialogue within the instruction. This provides the AI with a clear pattern to emulate.

### Security: The "Zero Trust" Model

Integration of user input and AI-generated content introduces a novel security vector: **Prompt Injection XSS**.

#### Mandatory DOMPurify Implementation

**Law:** `DOMPurify.sanitize()` is **MANDATORY** for any dynamic HTML content, whether from the user or AI.

The architecture treats all text as "radioactive"—it must be decontaminated before it touches the DOM.
