# The Definitive Developer's Guide to the Perchance Platform

**Purpose:** Comprehensive reference for understanding the Perchance platform, from fundamental procedural generation to advanced AI-driven applications.

**Note:** This guide is **application-agnostic**. For RPGlitch and ImageGlitch specific deployment, build configuration, and troubleshooting, see [PERCHANCE.md](./PERCHANCE.md) and [CLAUDE.md](./CLAUDE.md).

---

## Quick Navigation

- **New to Perchance?** Start with [Section 1: Core Engine](#section-1-the-perchance-engine)
- **Building UIs?** Jump to [Section 2: Web Technologies](#section-2-web-technologies)
- **Using AI?** See [Section 4: LLM Theory](#section-4-understanding-language-models) and [Section 5: Advanced Context Architecture](#section-5-advanced-context-architecture)
- **Building production apps?** Read [Section 7: Pattern C](#section-7-pattern-c-the-simulation-engine-advanced)
- **Need the API reference?** See [Section 6: The oc Object](#section-6-programming-with-the-oc-object)

---

## Section 1: The Perchance Engine

The Perchance platform, at its core, is a robust engine for procedural text generation. Its architecture is built upon a simple yet powerful declarative syntax that allows developers to create complex, randomized outputs from structured lists of data.

## The Fundamental Paradigm: Lists and References

A generator's logic is primarily defined in the **Lists Panel** of the editor UI. The central paradigm revolves around creating lists and referencing them to construct randomized text.

### Lists and Items

A list is created by defining a name, followed by its items on subsequent lines. Each item must be indented with a single tab or two spaces.

```text

animal
pig
cow
zebra

```

### Referencing Lists

To use a list, its name is enclosed in square brackets (`[]`). When the engine encounters this syntax, it selects a random item from the specified list.

**Example:** `A random animal is the [animal].` might produce "A random animal is the cow."

### Inline Selection (Shorthand)

For simple, inline random choices without creating a formal list, use curly brackets (`{}`) with items separated by a vertical bar (`|`):

```text

The cow is {very|extremely} large.

```

For single-item lists, use shorthand: `listName = [item]`

### Naming Conventions

List names must adhere to strict rules:

- ✅ Valid: `animal`, `my_list`, `list123`, `MyList`
- ❌ Invalid: Spaces, hyphens, starting with numbers, reserved keywords (`if`, `for`, `while`, `class`, etc.)

### Code Comments

Use two forward slashes (`//`) to comment. Any text following `//` on the same line is ignored.

## Controlling Randomness

### Probability and Weighting

The likelihood of an item being selected can be modified using the caret (`^`) operator followed by a number. Default weight is 1.

```text

condiment
pepper^2      // Twice as likely
salt           // Default weight
chilli flakes^0.5  // Half as likely

```

### Selection Methods

- **`selectMany(n)`**: Selects `n` items, duplicates allowed
- **`selectMany(min, max)`**: Selects a random number between min and max
- **`selectUnique(n)`**: Selects `n` unique items (no duplicates)

### Consumable Lists

A consumable list creates a temporary copy from which items are removed after being selected. This guarantees that an item cannot be chosen again within the same generation pass—essential for unique inventories or preventing narrative repetition.

**Syntax:** `.consumableList`

## Output Transformation

Perchance includes a rich set of built-in properties and methods for transforming text. These can be chained together by appending them with a period (`.`).

### Properties

- `.singularForm`, `.pluralForm` - Grammatical forms
- `.pastTense` - Verb conjugation
- `.upperCase`, `.lowerCase`, `.sentenceCase`, `.titleCase` - Case transforms

**Example:** `[animal.pluralForm.titleCase]` produces "Pigs"

### Methods

- **`.joinItems("separator")`** - Joins multiple items with a separator
- **Example:** `[fruit.selectMany(3).joinItems(", ")]` → "apple, orange, banana"

### Grammatical Helpers

- **`{a}`** - Outputs "a" or "an" based on the following word
- **`{s}`** - Appends "s" to the preceding word for simple pluralization
- **`{min-max}`** - Selects a random integer within a range (e.g., `{1-100}`) or alphabetical range (e.g., `{a-z}`)

## Managing State with Identifiers

To create coherent outputs, you must often store and reuse a randomly selected value within a single generation.

### Storing Values

The syntax `[identifierName = listName]` assigns a randomly selected item to an identifier. The stored value can then be reused elsewhere:

```text

[f = flower.selectOne]
The [f] is beautiful. I love the smell of the [f].

```

### Multi-Action Execution

Multiple assignments and operations can be performed within a single set of square brackets by separating them with commas. Only the final operation's result is displayed as output:

```text

[a = animal, v = verb, a.upperCase + " " + v.pastTense]

```

This first selects an animal, then a verb, then outputs a formatted sentence using both stored values.

## Core Syntax Reference

| Syntax/Property                            | Description                                                         |
| :----------------------------------------- | :------------------------------------------------------------------ |
| `listName`                                 | Defines a list. Items are indented below it.                        |
| `[listName]`                               | Selects and outputs one random item from the list.                  |
| `{item1\|item2}`                           | Shorthand for selecting one random item from an inline list.        |
| `^n`                                       | Sets the selection weight of an item. Example: `item^2`.            |
| `[id = list]`                              | Stores the selected item from `list` in the identifier `id`.        |
| `.selectMany(n)`                           | Selects `n` items from a list, allowing duplicates.                 |
| `.selectUnique(n)`                         | Selects `n` unique items from a list.                               |
| `.consumableList`                          | Creates a list where items are removed after being selected.        |
| `.joinItems("sep")`                        | Joins selected items with a separator. Example: `.joinItems(", ")`. |
| `.titleCase` / `.upperCase` / `.lowerCase` | Case transformations.                                               |
| `.pluralForm` / `.pastTense`               | Grammatical transformations.                                        |
| `{a}`                                      | Outputs "a" or "an" based on the next word.                         |
| `{s}`                                      | Appends "s" to the previous word for simple pluralization.          |
| `{min-max}`                                | Selects a random integer or letter from a range.                    |

---

## Section 2: Web Technologies

A Perchance generator is not merely a script; it is a fully functional, self-contained webpage. The platform seamlessly integrates standard web technologies—HTML, CSS, and JavaScript—allowing developers to build rich, interactive user interfaces.

## The Perchance Editor UI

The editor interface is divided into distinct panels:

- **Lists/Perchance Panel** (Left): Primary workspace for generator logic using Perchance syntax
- **HTML Panel** (Bottom-right): Text editor for the webpage's HTML structure
- **Preview/Output Panel** (Top-right): Live, rendered output of the generator

The editor includes standard IDE features: line wrapping, code folding, font size adjustment, resizable panels, keyboard shortcuts (`Ctrl+S`, `Ctrl+/`, `Tab`), and revision history.

## Structuring the Front-End with HTML

The HTML panel is where the visual structure of the generator is defined. The Perchance engine actively parses this panel with specific rules.

### Perchance Syntax in HTML

The engine evaluates any text within square `[]` and curly `{}` brackets as Perchance code, replacing it with generated output. To display literal brackets, escape them with a backslash:

```html
<div>Use \[brackets\] like this</div>
```

### Basic Interactivity with `update()`

The global `update()` function is the primary mechanism for user-driven interactivity. When called, it re-evaluates all Perchance code on the page, generating a new random output.

```html
<button onclick="update()">Randomize</button>
```

## Styling with CSS

CSS is embedded within `<style>` tags directly in the HTML panel. A critical design choice: the Perchance engine **ignores all content inside `<style>` tags**. This prevents syntax collisions, as CSS selectors often use curly braces (`{}`), which would otherwise conflict with Perchance's shorthand list syntax.

### Theme-Adaptive Styling

The message style input field (for chat apps) accepts CSS with powerful features:

**Theme Adaptation:**

```css
.message-bubble {
  background-color: light-dark(#eeeeee, #333333);
  color: light-dark(black, white);
}
```

## JavaScript Integration

JavaScript code is embedded within `<script>` tags in the HTML panel. Similar to CSS, the Perchance engine does not process content within `<script>` tags—the code is executed directly by the browser.

This separation is crucial: it prevents conflicts between JavaScript syntax (e.g., array literals `[]`) and Perchance syntax, and allows developers to leverage the full JavaScript ecosystem.

---

## Section 3: The Plugin Ecosystem

Plugins transform Perchance from a self-contained tool into an extensible framework. They are reusable, shareable modules that encapsulate specific functionalities, allowing developers to add complex features with a single line of code.

## Importing Plugins

Plugins are integrated using a simple import syntax within the Lists Panel:

**Syntax:** `{import:plugin-name}`

This makes the plugin's functionality available for use within the generator.

### Official vs. Community Plugins

**Official Plugins:** Maintained by the platform creator, guaranteed to be stable and will not be deleted or altered in breaking ways.

**Community Plugins:** Created by users without stability guarantees. Best practice: "fork" or "remix" a community plugin to create a personal copy, ensuring long-term stability.

## Essential Plugin Categories

**UI and Layout:**

- `layout-maker-plugin`, `navbar-plugin`, `tabs-plugin` - Create sophisticated visual layouts.

**Interactivity:**

- `tap-plugin` - Click specific outputs to re-randomize them.
- `goto-plugin` - Foundation for text-based adventures.

**Data Persistence:**

- `kv-plugin`, `remember-plugin` - Store data that persists across page reloads.

## The AI Plugins

The most powerful extensions are the AI plugins:

**`ai-text-plugin`**: Interface to a Large Language Model for generating text (stories, poems, dialogue).

**`text-to-image-plugin`**: Utilizes Stable Diffusion to generate images.

**Funding Model:** Ads are displayed for non-logged-in users to cover server costs.

**Important:** Do not fork AI plugins. Their client-side code is inextricably linked to a backend that cannot be replicated by users.

---

## Section 4: Understanding Language Models

To effectively develop sophisticated AI applications on Perchance, you must understand the theoretical foundations of Large Language Models (LLMs).

## Semantic Degeneracy: Why Language is Inherently Ambiguous

A fundamental concept from computational linguistics: **semantic degeneracy** posits that natural language is inherently ambiguous. An expression does not possess a single, fixed meaning but rather affords a combinatorial explosion of potential interpretations.

**Your primary task as a developer is not to write a "perfect" prompt, but to construct a rich and unambiguous context that constrains the AI's vast possibility space, guiding it toward the desired cluster of interpretations.**

## The "Lost in Conversation" Phenomenon

While LLMs excel at processing large, consolidated blocks of text, their performance degrades significantly when information is presented sequentially over multiple conversational turns.

A large-scale study, "LLMs GET LOST IN MULTI-TURN CONVERSATION," systematically demonstrated this weakness:

- **Average Performance Drop:** 39% when a fully-specified, single-turn instruction was broken down into a multi-turn, underspecified conversation
- **Root Cause:** Not primarily loss of raw capability ("aptitude"), but a massive increase in "unreliability."

### Why Context is Lost

1. **Premature Answer Attempts:** LLMs tend to make assumptions about missing information.
2. **Over-Reliance:** The model becomes anchored to its initial, often incorrect, attempts.
3. **Lost-in-the-Middle Effect:** Models give disproportionate weight to first and last turns, forgetting crucial details provided in the middle.

### Solution: Contextual Consolidation

The primary lesson is to **consolidate all necessary information into a single context window before initiating generation.** This improves both aptitude and reliability.

---

## Section 5: Advanced Context Architecture

Moving beyond simple "Chat Bots," sophisticated AI applications require a structured approach to **Context Engineering**. Instead of a single "Instruction" field, advanced engines use a **Layered Injection Strategy** to ensure stability, consistency, and depth.

## 1\. The Layered Context Model

To prevent the AI from "forgetting" rules or hallucinating facts, the context sent to the LLM should be assembled from distinct, hierarchical layers.

### Layer 1: The Kernel (System Directives)

This is the immutable foundation of your application. It defines the "Laws of Physics" for the AI. It is never seen by the user but is always present in the prompt.

- **Role:** Enforces safety overrides, output formatting (JSON vs. Text), and absolute agency rules (e.g., "Never write dialogue for the user").
- **Priority:** Highest. This layer overrides all others.

### Layer 2: The World State (Environmental Constants)

This layer grounds the narrative in a physical reality. It prevents "White Room Syndrome" by enforcing atmospheric continuity.

- **Content:** Current weather, lighting, location physics, and "Sensory Tiers" (Mandating descriptions of smell, sound, and temperature).

### Layer 3: The Entity Snapshot (Dynamic State)

Instead of a static biography, advanced apps inject a **Real-Time Snapshot** of the character. This snapshot is generated programmatically before every turn.

## 2\. The Four-Field Data Schema

For complex RPGs or simulations, a simple "Description" field is insufficient. Adopt the **Four-Field Schema** to separate immutable truths from temporary states.

| Field       | Name   | Purpose                                       |
| :---------- | :----- | :-------------------------------------------- |
| **forever** | Truth  | Immutable traits and core personality.        |
| **present** | State  | Mutable details: Clothing, Wounds, Inventory. |
| **past**    | Log    | Compressed narrative log.                     |
| **future**  | Vector | Current goals and impending threats.          |

**Why this works:**
Separating `<PRESENT>` from `<FOREVER>` allows a character to change clothes, get injured, or change moods without "forgetting" who they are. The AI is instructed to prioritize `<PRESENT>` for the immediate scene while checking `<FOREVER>` for consistency.

## 3\. Parametric Steering (Narrative Physics)

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
`;
```

---

## Section 6: Programming with the `oc` Object

**⚠️ ARCHITECTURAL NOTE:** This section details the standard Perchance API (oc). This is the default for most chat characters. However, RPGlitch utilizes Pattern C (The Simulation Engine) and bypasses the oc object entirely in favor of a custom StoryController backed by Dexie.js. If you are working on RPGlitch core logic, ignore this section and reference [apps/rpglitch/js/manager-turns.js](apps/rpglitch/js/manager-turns.js).

The `oc` (Online-Character or Online-Chat) object is the central hub for scripting in the standard AI Character Chat environment.

**Note:** For advanced applications using the "Simulation Engine" pattern (Section 7, Pattern C), reliance on the `oc` object is often minimized or bypassed in favor of direct state management. However, understanding it is crucial for modifying existing chat behaviors.

## Manipulating Messages and History

The entire chat history is accessible as a mutable array at `oc.thread.messages`.

| Property       | Type    | Description                                    |
| :------------- | :------ | :--------------------------------------------- |
| `author`       | String  | "user", "ai", or "system"                      |
| `content`      | String  | The message text                               |
| `hiddenFrom`   | Array   | Controls visibility. `["user"]` hides from UI. |
| `expectsReply` | Boolean | If true, triggers AI generation immediately.   |

### The Message Rendering Pipeline

For advanced UI manipulation (e.g., converting text commands into clickable buttons), the `oc.messageRenderingPipeline` allows middleware-style processing of messages before display.

## Calling AI APIs

The `oc` object provides direct access to underlying AI models:

**`oc.getInstructCompletion({instruction, ...})`**
Makes a direct call to the text generation LLM.

**`oc.textToImage({prompt, ...})`**
Programmatically calls the text-to-image model.

---

## Section 7: Architectural Patterns

For production applications, choosing the right architecture is critical.

## Pattern A: The Interaction Engine (Standard Chat)

For applications focused on textual interaction (chat bots, simple RPGs), the architecture leverages the `oc` object as an event bus.

- **Architecture:** Event-Driven. Listen to `MessageAdded`.
- **State:** Mostly relies on chat history + simple variables.
  - **Best For:** Simple characters, chat bots.

## Pattern B: The Visual Engine (Image Gen)

For applications focused on generative imagery, the architecture uses a **Two-Stage Pipeline**: Compile → Render.

- **Stage 1 (Probability):** Perchance lists select _what_ to draw.
- **Stage 2 (Weighting):** Diffusion syntax (`(keyword:1.2)`) controls _how_ it draws.
- **Pipeline:** Lists -\> Prompt String -\> `textToImage()` -\> Display.

## Section 7: Pattern C: The Simulation Engine (Advanced)

For applications that require deep state persistence, complex world logic, and long-term memory (e.g., RPGs, Strategy Games), the "Standard Chat" pattern is insufficient.

**The Simulation Engine** treats the AI not as a chatbot, but as a component in a larger loop. The application manages the state; the AI merely renders the next frame.

### 1\. The Component Triad

The architecture is built on three distinct roles:

1. **The Actor (Foreground):** The primary LLM call that generates the prose/dialogue the user sees. It has no memory of its own; it only knows what is in the current context window.
2. **The Simulator (Background):** A hidden, secondary process that calculates the _consequences_ of the action. It updates the database (health, inventory, world state) based on what happened.
3. **The Archivist (Maintenance):** A background process that manages context window space. It compresses old logs into "Memories" and ensures the `<PAST>` field remains dense and relevant.

### 2\. The "Heartbeat" Protocol

To keep the simulation alive without consuming excessive tokens or API calls, implement a **Heartbeat Protocol**.

- **Logic:** Do not update every entity every turn.
- **Cycle:** Update the **Active Character** on Turn 1, the **User State** on Turn 2, and the **World/Environment** on Turn 3.
- **Effect:** This distributes the computational load while ensuring the entire world stays "fresh" and reactive over time.

### 3\. The "Director" Loop (Feedback-Driven Variance)

In a standard chat, "Regenerate" just rolls the dice again. In a Simulation Engine, "Regenerate" is a corrective feedback loop.

**The Loop:**

1. **Rejection:** The user rejects Message A.
2. **Analysis:** The Engine compares Message A to the User's inputs to determine _why_ it failed (e.g., "Too repetitive," "Ignored instructions").
3. **Variance Injection:** The Engine generates a temporary **"Director Note"** (e.g., _"Critique: The previous attempt was too passive. Increase aggression by 20%."_).
4. **State Rollback:** Crucially, any background updates triggered by Message A (e.g., damage taken) are reverted to prevent "Ghost Memories."
5. **Execution:** The Actor generates Message B with the new Director Note guiding it.

### 4\. Implementation Strategy

This architecture requires abandoning the `oc` object for logic.

- **State:** Use `Dexie.js` (IndexedDB) as the Single Source of Truth.
- **Logic:** Write a `StoryController` class in the Right Panel (JavaScript) to manage the prompt construction and API calls.
- **API:** Use `window.ai()` directly. Do not rely on Perchance's built-in chat UI state.

**Example Flow:**

```javascript
async function handleTurn(userInput) {
  // 1. Commit User Input to DB
  await db.messages.add({ role: "user", text: userInput });

  // 2. Build Context (Kernel + World + Entity Snapshots)
  // Actual implementation usage:
  const builder = new ContextBuilder(storyId);
  const prompt = await builder.build();

  // 3. Call The Actor
  const response = await window.ai(prompt);

  // 4. Commit AI Response to DB
  await db.messages.add({ role: "ai", text: response });

  // 5. Trigger Background Simulation (Fire and Forget)
  // Does NOT block the UI. Updates stats/inventory in the background.
  TurnManager.runBackgroundUpdate(storyId);
}
```

---

## Section 8: Expert Patterns and Best Practices

## Architecting for Consistency

### The Single Source of Truth

The `instruction/role` (or the Kernel Layer in advanced apps) must be the definitive source for the character's traits.

### Show, Don't Just Tell

Instead of listing keywords ("witty, brave"), include concrete examples of dialogue within the instruction. This provides the AI with a clear pattern to emulate.

## Security: The "Zero Trust" Model

Integration of user input and AI-generated content introduces a novel security vector: **Prompt Injection XSS**.

### Mandatory DOMPurify Implementation

**Law:** `DOMPurify.sanitize()` is **MANDATORY** for any dynamic HTML content, whether from the user or AI.

The architecture treats all text as "radioactive"—it must be decontaminated before it touches the DOM.

---

## Section 9: References and Resources

## Official Perchance Documentation

**General Learning:**

- [Perchance Welcome Page](https://perchance.org/welcome)
- [Perchance Tutorial](https://perchance.org/tutorial)
- [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial)
- [Perchance Reference](https://perchance.org/perchance-reference)
- [Example Generators](https://perchance.org/examples)
- [Learn Web Programming](https://perchance.org/learn-web)

**UI & Basics:**

- [List/Perchance Panel](https://perchance.org/learn-perchance-ui-lists)
- [Creating Top-Level Lists](https://perchance.org/learn-perchance-101-top-level)
- [Using Lists](https://perchance.org/learn-perchance-101-using-lists)
- [HTML and Preview/Output Panel](https://perchance.org/learn-perchance-ui-html-preview)
- [UI Navigation](https://perchance.org/learn-perchance-ui-navbar)

**Plugins:**

- [Plugins Overview](https://perchance.org/plugins)
- [AI Text Plugin](https://perchance.org/ai-text-plugin)
- [Text to Image Plugin](https://perchance.org/text-to-image-plugin)
- [Super Fetch Plugin](https://perchance.org/super-fetch-plugin)
- [Remember Plugin](https://perchance.org/remember-plugin)
- [Upload Plugin](https://perchance.org/upload-plugin)

**Application Examples:**

- [AI Character Chat](https://perchance.org/ai-character-chat) (Highly relevant to Section 5)
- [AI RPG](https://perchance.org/ai-rpg)
- [AI Text-to-Image Generator](https://perchance.org/ai-text-to-image-generator)

## Related Documentation in This Repository

- **[PERCHANCE.md](./PERCHANCE.md)** — Deployment, build configuration, and RPGlitch/ImageGlitch specific integration
- **[CLAUDE.md](./CLAUDE.md)** — Development protocols, coding standards, and project workflow
- **[design-system.md](./design-system.md)** — UI/UX guidelines and component library
- **[README.md](./README.md)** — Project overview and quick start

---

## Changelog

**4.2.0 (2025-12-05)** — **Architectural Overhaul**

- Added **Section 5: Advanced Context Architecture**: Introduced Kernel/World/Entity layers and Four-Field Schema.
- Added **Section 7: Pattern C (Simulation Engine)**: Documented Actor/Simulator/Archivist triad, Heartbeat Protocol, and Director Loop.
- Updated Section 4 to emphasize "Contextual Consolidation."
- Deprecated reliance on `oc` object for complex state logic.

**4.1.0 (2025-11-20)** — **Complete Restructuring**

- Merged MASTER_ARCHITECT section into main content.
- Reorganized into logical progression sections.
- Moved app-specific details to PERCHANCE.md.
