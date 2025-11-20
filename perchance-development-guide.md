# The Definitive Developer's Guide to the Perchance Platform

**Purpose:** Comprehensive reference for understanding the Perchance platform, from fundamental procedural generation to advanced AI-driven applications.

**Note:** This guide is **application-agnostic**. For RPGlitch and ImageGlitch specific deployment, build configuration, and troubleshooting, see [PERCHANCE.md](./PERCHANCE.md) and [CLAUDE.md](./CLAUDE.md).

---

## Quick Navigation

- **New to Perchance?** Start with [Section 1: Core Engine](#section-1-the-perchance-engine)
- **Building UIs?** Jump to [Section 2: Web Technologies](#section-2-web-technologies)
- **Using AI?** See [Section 4: LLM Theory](#section-4-understanding-language-models) and [Section 5: AI Character Chat](#section-5-the-ai-character-chat-system)
- **Building production apps?** Read [Section 7: Architectural Patterns](#section-7-architectural-patterns-the-two-panel-standard)
- **Need the API reference?** See [Section 6: The oc Object](#section-6-programming-with-the-oc-object)

---

# Section 1: The Perchance Engine

The Perchance platform, at its core, is a robust engine for procedural text generation. Its architecture is built upon a simple yet powerful declarative syntax that allows developers to create complex, randomized outputs from structured lists of data.

## The Fundamental Paradigm: Lists and References

A generator's logic is primarily defined in the **Lists Panel** of the editor UI. The central paradigm revolves around creating lists and referencing them to construct randomized text.

### Lists and Items

A list is created by defining a name, followed by its items on subsequent lines. Each item must be indented with a single tab or two spaces.

```
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

```
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

```
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

```
[f = flower.selectOne]
The [f] is beautiful. I love the smell of the [f].
```

### Multi-Action Execution

Multiple assignments and operations can be performed within a single set of square brackets by separating them with commas. Only the final operation's result is displayed as output:

```
[a = animal, v = verb, a.upperCase + " " + v.pastTense]
```

This first selects an animal, then a verb, then outputs a formatted sentence using both stored values.

## Core Syntax Reference

| Syntax/Property | Description |
|:---|:---|
| `listName` | Defines a list. Items are indented below it. |
| `[listName]` | Selects and outputs one random item from the list. |
| `{item1\|item2}` | Shorthand for selecting one random item from an inline list. |
| `^n` | Sets the selection weight of an item. Example: `item^2`. |
| `[id = list]` | Stores the selected item from `list` in the identifier `id`. |
| `.selectMany(n)` | Selects `n` items from a list, allowing duplicates. |
| `.selectUnique(n)` | Selects `n` unique items from a list. |
| `.consumableList` | Creates a list where items are removed after being selected. |
| `.joinItems("sep")` | Joins selected items with a separator. Example: `.joinItems(", ")`. |
| `.titleCase` / `.upperCase` / `.lowerCase` | Case transformations. |
| `.pluralForm` / `.pastTense` | Grammatical transformations. |
| `{a}` | Outputs "a" or "an" based on the next word. |
| `{s}` | Appends "s" to the previous word for simple pluralization. |
| `{min-max}` | Selects a random integer or letter from a range. |

---

# Section 2: Web Technologies

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
<!-- Display literal [text] without interpreting as Perchance code -->
<div>Use \[brackets\] like this</div>
```

### Basic Interactivity with `update()`

The global `update()` function is the primary mechanism for user-driven interactivity. When called, it re-evaluates all Perchance code on the page, generating a new random output.

```html
<button onclick="update()">Randomize</button>
```

## Styling with CSS

CSS is embedded within `<style>` tags directly in the HTML panel. A critical design choice: the Perchance engine **ignores all content inside `<style>` tags**. This prevents syntax collisions, as CSS selectors often use curly braces (`{}`), which would otherwise conflict with Perchance's shorthand list syntax.

### Theme-Adaptive Styling (AI Character Chat)

For AI Character Chat generators, the message style input field accepts CSS with powerful features:

**Theme Adaptation:**
```css
.message-bubble {
  background-color: light-dark(#EEEEEE, #333333);
  color: light-dark(black, white);
}
```

**Custom Fonts:**
```css
@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
.message-bubble {
  font-family: 'Roboto', sans-serif;
}
```

**Advanced Effects:**
```css
.message-bubble {
  text-shadow: 1px 1px 2px black;
  background-image: linear-gradient(to right, #ff8177 0%, #b12a5b 100%);
}
```

## JavaScript Integration

JavaScript code is embedded within `<script>` tags in the HTML panel. Similar to CSS, the Perchance engine does not process content within `<script>` tags—the code is executed directly by the browser.

This separation is crucial: it prevents conflicts between JavaScript syntax (e.g., array literals `[]`) and Perchance syntax, and allows developers to leverage the full JavaScript ecosystem. The platform's true potential is unlocked through the special `oc` object, which provides a comprehensive API for interacting with generator state (see [Section 6](#section-6-programming-with-the-oc-object)).

---

# Section 3: The Plugin Ecosystem

Plugins transform Perchance from a self-contained tool into an extensible framework. They are reusable, shareable modules that encapsulate specific functionalities, allowing developers to add complex features with a single line of code.

## Importing Plugins

Plugins are integrated using a simple import syntax within the Lists Panel:

**Syntax:** `{import:plugin-name}`

This makes the plugin's functionality available for use within the generator. For example, after importing `dice-plugin`, you could use its syntax to simulate dice rolls.

### Official vs. Community Plugins

**Official Plugins:** Maintained by the platform creator, guaranteed to be stable and will not be deleted or altered in breaking ways.

**Community Plugins:** Created by users without stability guarantees. Best practice: "fork" or "remix" a community plugin to create a personal copy, ensuring long-term stability.

## Essential Plugin Categories

**UI and Layout:**
- `layout-maker-plugin`, `navbar-plugin`, `tabs-plugin` - Create sophisticated visual layouts without extensive HTML/CSS

**Interactivity:**
- `tap-plugin` - Click specific outputs to re-randomize them
- `goto-plugin` - Foundation for text-based adventures

**Data Persistence:**
- `kv-plugin`, `remember-plugin` - Store data that persists across page reloads

**List and Text Manipulation:**
- `filter-list-plugin`, `conjugate-plugin`, `plural-plugin` - Advanced tools for dynamically altering lists and text

## The AI Plugins

The most powerful extensions are the AI plugins, which integrate large-scale generative models directly into the generator workflow:

**`ai-text-plugin`**: Interface to a Llama-based Large Language Model for generating text (stories, poems, dialogue) based on user-defined instructions.

**`text-to-image-plugin`**: Utilizes Stable Diffusion to generate images from textual descriptions.

### Critical Architectural Insight

While the core Perchance engine operates entirely client-side within the user's browser, AI plugins function as clients for powerful server-side infrastructure. Computationally intensive AI tasks are offloaded to dedicated servers with GPUs. This client-server model enables state-of-the-art AI capabilities within a lightweight browser-based tool.

**Funding Model:** Ads are displayed for non-logged-in users to cover server costs.

**Important:** Do not fork AI plugins. Their client-side code is inextricably linked to a backend that cannot be replicated by users.

---

# Section 4: Understanding Language Models

To effectively develop sophisticated AI applications on Perchance, you must understand the theoretical foundations of Large Language Models (LLMs).

## Semantic Degeneracy: Why Language is Inherently Ambiguous

A fundamental concept from computational linguistics: **semantic degeneracy** posits that natural language is inherently ambiguous. An expression does not possess a single, fixed meaning but rather affords a combinatorial explosion of potential interpretations.

The informational burden required to unambiguously specify a single intended meaning can be conceptualized through **Kolmogorov Complexity**. As a prompt increases in complexity—adding more concepts and relationships—the number of bits of information needed to resolve ambiguities grows at a superlinear rate. This makes it computationally intractable for any system to perfectly reconstruct the intended meaning from the prompt alone.

### Critical Implication

This is **not a flaw** in the LLM, but a fundamental property of language itself. The LLM generates a plausible meaning—one of many accessible interpretations—but almost never the singularly intended one.

**Your primary task as a developer is not to write a "perfect" prompt, but to construct a rich and unambiguous context that constrains the AI's vast possibility space, guiding it toward the desired cluster of interpretations.**

## The "Lost in Conversation" Phenomenon

While LLMs excel at processing large, consolidated blocks of text, their performance degrades significantly when information is presented sequentially over multiple conversational turns.

A large-scale study, "LLMs GET LOST IN MULTI-TURN CONVERSATION," systematically demonstrated this weakness:

- **Average Performance Drop:** 39% when a fully-specified, single-turn instruction was broken down into a multi-turn, underspecified conversation
- **Root Cause:** Not primarily loss of raw capability ("aptitude"), but a massive increase in "unreliability"—the gap between best-case and worst-case performance more than doubled

### Why Context is Lost

1. **Premature Answer Attempts:** LLMs tend to make assumptions about missing information and generate a complete solution early
2. **Over-Reliance:** The model becomes anchored to its initial, often incorrect, attempts
3. **Lost-in-the-Middle Effect:** Models give disproportionate weight to first and last turns, forgetting crucial details provided in the middle
4. **Verbose Responses:** Models' lengthy replies introduce assumptions and hypotheses that can derail subsequent turns

### Architectural Solution in Perchance AI Character Chat

This research justifies the design of Perchance's AI Character Chat: a single, comprehensive instruction/role message is vastly more effective than building a character's personality through a sequence of conversational prompts. While strategies like RECAP (full recap at end) or SNOWBALL (repeating all context at each turn) can mitigate the issue, they remain fundamentally inferior to providing all necessary context at once.

## Principles of Effective Instruction

By synthesizing semantic ambiguity with empirical findings on conversational context loss, a robust framework for effective prompt architecture emerges:

**1. Structure and Clarity**
To combat semantic degeneracy, instructions should be highly structured. Use headings, bullet points, and clear separation of concerns. This reduces ambiguity and makes the context easier for the LLM to parse and prioritize.

**2. Explicitness and Constraint**
Begin prompts with explicit, direct commands (e.g., "Respond only in JSON format. Exclude all explanatory text."). Specify output formats and reiterate constraints to minimize the model's tendency toward unwanted verbosity and creative deviation.

**3. Contextual Consolidation**
The primary lesson from the "Lost in Conversation" research: **consolidate all necessary information into a single context window before initiating generation.** This is the most effective strategy for improving both aptitude and reliability.

**4. Iterative Refinement**
Prompting is not a one-shot process but an experimental cycle. Test prompts with small-scale generations, analyze outputs for deviations and gaps, and adjust the instructions accordingly. This iterative feedback loop is essential for guiding a probabilistic system toward a desired outcome.

---

# Section 5: The AI Character Chat System

The Perchance AI Character Chat is a sophisticated, multi-layered context management system designed to harness the power of LLMs while mitigating their inherent weaknesses. It provides developers with a hierarchical set of tools for defining an AI's behavior, managing its knowledge base, and controlling its conversational memory.

## Character Architecture

The platform provides several distinct fields for inputting information, each with a specific role in the hierarchy of context sent to the LLM:

### Instruction/Role Message (The Foundation)

This is the foundational and most critical component of a character's definition. It serves as the permanent, static context that defines the AI's core identity, personality, worldview, and speaking style.

- **Length:** Can be up to 500-1000 words, but conciseness is encouraged to preserve the AI's limited context window for the conversation itself
- **Importance:** Due to the importance of contextual consolidation (see Section 4), this field should be as comprehensive as possible
- **Content:** Core traits, backstory, voice, example dialogues, behavioral constraints

### Reminder Message (Tactical Guidance)

A short, tactical instruction (ideally under 100 words) that is injected into the context immediately before the AI's next response. Its proximity to the point of generation gives it powerful influence due to recency bias.

**Best used for:**
- "Be more descriptive in your next response"
- "Remember to portray the character as feeling sad"
- Temporary, immediate guidance

**Warning:** A long reminder can disrupt conversational flow and should be avoided.

### Initial Messages

Messages that populate the chat thread when a new conversation begins. They are ideal for setting a scene, providing an opening line of dialogue, or establishing the initial roleplay state.

Unlike instruction and reminder messages, initial messages are treated as part of the regular chat history and are subject to being summarized as the conversation grows longer.

### Advanced Formatting

All three fields support an advanced syntax that allows for multiple messages with specified authors (format: `[AUTHOR]: message`). Authors can be `SYSTEM` (default), `AI`, or `USER`.

**Example:**
```
[AI]: I'm a dragon.
[USER]: I'm the queen of the nearby kingdom.
[SYSTEM]: What follows is a story about the queen and the dragon.
```

## Building a World: Lorebooks

When the amount of background information exceeds the practical limits of the instruction field, **Lorebooks** provide a mechanism for managing a large, external knowledge base.

### How Lorebooks Work

A lorebook functions as a dynamic, queryable database. Before generating each response, the AI system performs a semantic search of the lorebook for entries relevant to the current conversation state. The most relevant entries are then injected into the context provided to the LLM.

This is **Retrieval-Augmented Generation (RAG)**—grounding the AI's responses in a specific corpus of user-provided data, reducing hallucinations and enabling access to knowledge beyond its initial training.

### Best Practice: Atomic Entries

Each lorebook entry **MUST be atomic and self-contained**. The AI evaluates entries in isolation, so an entry like "He has a brother named Mark" is ineffective because the system has no guaranteed context for who "he" refers to.

**Better:** "John's brother is named Mark."

Lorebooks are typically managed as external `.txt` files hosted at a URL, which is then added to the character's settings.

## The AI's Memory: Summarization

To manage the finite context window of the underlying LLM, the Perchance chat system employs automatic summarization. As a conversation becomes too long to fit entirely within the context window, the system creates "memories" by summarizing the oldest parts of the chat history.

### Memories vs. Lore

- **Memories:** Chronological, condensed record of the conversation's events
- **Lore:** Non-chronological, static database of facts

The AI searches both memories and the lorebook for relevant context before each turn.

### Manual Memory Control

Developers have direct control via the `/mem` command, which opens the memory editor for the current chat thread. This allows for manual addition, editing, or removal of memories—a powerful tool for correcting the AI's misunderstandings or reinforcing key plot points in a long-running narrative.

## Slash Commands (Power-User Controls)

The chat interface includes a suite of slash commands providing programmatic control:

| Command | Description |
|:---|:---|
| `/ai` | Triggers a response from the primary AI character. |
| `/ai <instruction>` | Triggers an AI response with a single-use, temporary writing instruction. |
| `/ai @CharName#ID <instruction>` | Prompts a reply from a different character in a group chat. |
| `/user <instruction>` | Instructs the AI to generate a reply on behalf of the user. |
| `/image <description>` | Generates an image using the text-to-image plugin. |
| `/sys <instruction>` | Injects a system message into the chat with a specific instruction. |
| `/nar <instruction>` | Shortcut for `/sys @Narrator <instruction>`, changing the system name to "Narrator". |
| `/sum` | Opens the summary editor for the current chat thread. |
| `/mem` | Opens the memory editor for the current chat thread. |
| `/lore` | Opens the lore editor for the current chat thread. |
| `/lore <text>` | Adds a new lore entry directly to the current thread's lore. |
| `/name <name>` | Sets the user's display name for the current thread. |
| `/avatar <url>` | Sets the user's avatar image for the current thread. |
| `/import` | Allows bulk import of chat messages. |

---

# Section 6: Programming with the `oc` Object

Beyond its declarative syntax and pre-built tools, Perchance exposes a powerful JavaScript API through the global `oc` object. This API transforms the platform from a simple generator into a fully-fledged, reactive application framework.

## Introduction to the oc Object

The `oc` (Online-Character or Online-Chat) object is the central hub for all client-side scripting in the AI Character Chat environment. It is accessible within the "custom code" section of the advanced character editor. This code is executed within a sandboxed iframe, ensuring a character's script can only access its own data and the current chat thread's data.

The `oc` object is structured hierarchically:
- `oc.character` - Character-level properties and methods
- `oc.thread` - Current chat session data and methods
- `oc.window` - Controls for the custom code iframe
- Global methods on `oc` - Direct AI API access

## Event-Driven Programming

The foundation of dynamic scripting is its event-driven architecture. Developers can register listener functions that execute in response to specific events within the chat lifecycle using `oc.thread.on()`.

### Key Events

**MessageAdded**
Fires after a message has been fully generated and added to the thread. Most commonly used for post-processing AI responses or reacting to user input.

**MessageEdited**
Fires when a message is edited or regenerated.

**MessageDeleted**
Fires when a user deletes a message.

**MessageStreaming**
Fires continuously as an AI message is being generated, providing access to text chunks in real-time.

### Async Event Handlers

Event handlers can be declared as `async`. The Perchance engine will `await` their completion before proceeding. This allows for complex operations, such as making API calls with `oc.getInstructCompletion`, to be completed within the event loop before the AI generates its next response.

**Example: Intercepting and modifying user messages**
```javascript
oc.thread.on("MessageAdded", async function ({message}) {
  // Check if the latest message is from the user
  if (message.author === "user" && message.content.startsWith("charname ")) {
    // Modify a character property
    oc.character.name = message.content.replace(/^charname /, "");
    // Remove the command message from the chat history
    oc.thread.messages.pop();
  }
});
```

## Manipulating Messages and History

The entire chat history is accessible as a mutable array at `oc.thread.messages`. This allows developers to read, modify, and delete messages programmatically using standard JavaScript array methods (`pop`, `splice`, etc.).

### Message Object Structure

| Property | Type | Description |
|:---|:---|:---|
| `author` | String | "user", "ai", or "system" |
| `content` | String | The message text |
| `hiddenFrom` | Array | Controls visibility. `["user"]` hides from UI; `["ai"]` hides from generation context. |
| `expectsReply` | Boolean | If true, triggers AI generation immediately after insertion. |
| `wrapperStyle` | String | CSS styles applied to the message container bubble. |

### Injecting Messages

New messages are injected using `oc.thread.messages.push()`:

```javascript
oc.thread.messages.push({
  author: "system",
  content: "Current health: 50/100",
  hiddenFrom: ["user"],    // Invisible to player
  expectsReply: false       // Passive update
});
```

## The Message Rendering Pipeline

For advanced UI manipulation (e.g., converting text commands into clickable buttons), the `oc.messageRenderingPipeline` provides a powerful middleware mechanism.

The pipeline is an array to which developers can push a function. This function is executed before any message is displayed to the user or sent to the AI. The function receives the `message` object and a `reader` parameter (`"user"` or `"ai"`), allowing the developer to present a different version of the message to the user than what the AI sees.

**Use Case:** Convert AI output like `[[Attack Goblin]]` into a clickable HTML button for the user, while leaving simple text for the AI to process.

**Example: Text-to-Button Pipeline**
```javascript
oc.messageRenderingPipeline.push(function({ message, reader }) {
  if (reader === 'user') {
    const buttonRegex = /\[\[(.+?)\]\]/g;
    return message.content.replace(buttonRegex, (match, actionText) => {
      const safeText = DOMPurify.sanitize(actionText).replace(/'/g, "\\'");
      return `<button class="action-btn" onclick="window.App.dispatchAction('${safeText}')">${actionText}</button>`;
    });
  }
  return message.content;
});
```

## Dynamic Character Control

Nearly all properties of a character and thread are exposed through the `oc` object and can be modified at runtime:

- `oc.character.name` - Character's display name
- `oc.character.avatar.url` - Avatar image URL
- `oc.character.roleInstruction` - Main instruction/personality prompt
- `oc.character.reminderMessage` - Short tactical reminder
- `oc.character.customCode` - A character's own JavaScript code (even self-modifying)

This capability enables characters that evolve in real-time. For example, a script could listen for the `MessageAdded` event, analyze the AI's response for emotional content, and then programmatically update the `reminderMessage` to reflect a change in the character's mood, influencing all subsequent responses.

## Calling AI APIs

The `oc` object provides direct access to underlying AI models:

**`oc.getInstructCompletion({instruction, ...})`**
Makes a direct call to the text generation LLM with a specific instruction. Useful for meta-tasks like sentiment classification, text summarization, or response rewriting.

**`oc.getChatCompletion({messages, ...})`**
Makes a call using a chat-based format, providing a list of messages for context. Suitable for conversational back-and-forth.

**`oc.textToImage({prompt, ...})`**
Programmatically calls the text-to-image model to generate an image. The prompt can be dynamically constructed based on the current chat state.

## Complete `oc` API Reference

| Object Path / Property / Method | Type | Description |
|:---|:---|:---|
| **`oc.character`** | Object | Contains properties of the character itself. |
| `.name` | String | The character's name. |
| `.avatar.url` | String | URL for the character's avatar image. |
| `.roleInstruction` | String | The main instruction/personality prompt. |
| `.reminderMessage` | String | The short, tactical reminder message. |
| `.initialMessages` | Array | Messages to start a new chat. |
| `.customCode` | String | The character's own JavaScript code. |
| `.customData` | Object | Space for storing arbitrary persistent character data. |
| `.customData.PUBLIC` | Object | Data stored here is included in character share links. |
| **`oc.thread`** | Object | Contains properties of the current chat session. |
| `.messages` | Array | All message objects in the current chat (readable/writable). |
| `.on(event, handler)` | Function | Registers an event handler. Event: "MessageAdded", "MessageEdited", etc. |
| `.messageRenderingPipeline` | Array | Functions to process messages before display or AI processing. |
| `.customData` | Object | Space for storing arbitrary data specific to the current thread. |
| **`oc.window`** | Object | Controls the custom code's visual iframe. |
| `.show()` | Function | Makes the custom code's iframe visible. |
| `.hide()` | Function | Hides the custom code's iframe. |
| **`oc` (global methods)** | | |
| `.getInstructCompletion(options)` | async Function | Calls the instruction-based text AI. Returns promise with result. |
| `.getChatCompletion(options)` | async Function | Calls the chat-based text AI. Returns promise with result. |
| `.textToImage(options)` | async Function | Calls the text-to-image AI. Returns promise with image data. |

---

# Section 7: Architectural Patterns (The Two-Panel Standard)

For production applications on the Perchance platform, a strict architectural pattern is non-negotiable: the **Two-Panel Architecture**. This pattern solves the fundamental problem of building stateful, complex applications on a platform optimized for text generation.

## The Problem: The "God Script" Dilemma

Traditional Perchance development often mixes state logic (variables), generation logic (lists), and UI logic (HTML) into a single monolithic script. While functional for trivial generators, this approach collapses under complexity:

- **State fragmentation:** Perchance lists lack transactional integrity and persistence
- **Business logic mixing:** UI and data logic become inseparable
- **Deployment friction:** Changes to one domain affect all others

The Two-Panel Architecture solves this by enforcing strict separation of concerns.

## The Architecture

The Perchance environment is inherently bipartite, consisting of a "Left Panel" and a "Right Panel," each running in a separate, sandboxed iframe.

### Left Panel: The Declarative Engine

**Responsibilities:**
- Plugin imports (`{import:plugin-name}`)
- Static, declarative data structures (lists of names, encounter tables, etc.)
- Perchance-specific logic

**Key Constraint:** The Left Panel **MUST be stateless**. It does not manage application state (player inventory, quest flags, health points). It behaves like a pure function: Input → Random Process → Output.

### Right Panel: The Interactive Stage

**Responsibilities:**
- Full Single Page Application (SPA) logic
- User interactions and event handling
- Database transactions (IndexedDB)
- UI rendering and state management
- Orchestration of calls to the Left Panel

**Key Advantage:** A completely standard, modern JavaScript application. Use ES6 modules, type-safe code, standard browser DevTools, npm ecosystem libraries.

### The Iframe Wall and Unidirectional Flow

The browser enforces a strict security boundary between the two panels. While they share same-origin policy allowing cross-frame communication, **variable scopes are isolated**.

The architecture dictates **unidirectional flow of control**: The App (Right Panel) *pulls* functionality from the Engine (Left Panel). The Engine never pushes updates to the App or manipulates its DOM.

**Benefits:**
- A crash or reload in the UI does not destabilize the engine
- The engine can be updated without breaking save data
- Enables "hot updates" of game content without breaking player save files

## Plugin Exposure Pattern

Perchance plugins initialize in the left-panel context, but the right-panel JavaScript needs to access them. Since the two panels run in separate iframes, a bridge mechanism is required.

### Three-Step Exposure

**Step 1: Import in Left Panel**
```perchance
ai = {import:ai-text-plugin}
textToImage = {import:text-to-image-plugin}

pluginAi = ai
pluginTextToImage = textToImage
```

**Step 2: Expose to Window in Right Panel HTML**
```html
<script>
  if (typeof ai !== 'undefined') window.pluginAi = ai;
  if (typeof textToImage !== 'undefined') window.pluginTextToImage = textToImage;
</script>
<script type="module" src="js/index.js"></script>
```

**Step 3: Copy to Standard Names in Right Panel JavaScript**
```javascript
function setupPlugins() {
  const pluginMap = {
    pluginAi: 'ai',
    pluginTextToImage: 'textToImage',
  };
  for (const [perchanceName, standardName] of Object.entries(pluginMap)) {
    if (typeof window[perchanceName] === 'function') {
      window[standardName] = window[perchanceName];
    }
  }
}
```

**Step 4: Wait for Plugins**
```javascript
async function waitForPlugins(requiredPlugins, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const allAvailable = requiredPlugins.every(name => typeof window[name] === 'function');
    if (allAvailable) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}
```

Plugins initialize asynchronously after the left-panel parses. The `waitForPlugins()` function acts as a synchronization primitive, preventing the app from booting until the bridge is stable.

## Security: The "Zero Trust" Model

Integration of user input and AI-generated content introduces a novel security vector: **Prompt Injection XSS**. Unlike traditional web apps where the database is a trusted source, in AI apps the backend (the LLM) is **untrusted**.

### Mandatory DOMPurify Implementation

**Law:** `DOMPurify.sanitize()` is **MANDATORY** for any dynamic HTML content, whether from the user or AI.

The architecture treats all text as "radioactive"—it must be decontaminated before it touches the DOM. This necessitates an explicit "Message Rendering Pipeline" (for Pattern A: Interaction Engines):

1. Parse AI output for allowed patterns (e.g., `[[Action Name]]`)
2. Sanitize text content
3. Only then hydrate specific patterns into interactive elements

This creates a "whitelist" model of UI generation—significantly more secure than a "blacklist" approach.

**Example: Safe Rendering**
```javascript
function renderHTML(selector, unsafeHtml) {
  if (!window.DOMPurify) {
    console.error('DOMPurify is not loaded.');
    return;
  }
  const safeHtml = DOMPurify.sanitize(unsafeHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'button'],
    ALLOWED_ATTR: ['href', 'class', 'target', 'data-id']
  });
  document.querySelector(selector).innerHTML = safeHtml;
}
```

## Pattern A: The Interaction Engine

For applications focused on textual interaction (RPGs, Chat Simulators, choice-based narratives), the architecture leverages the `oc` (Online Character) object as a programmable event bus.

### Thread State Management

The `oc.thread` object is the single source of truth for conversation context. It maintains a mutable array (`oc.thread.messages`) representing the linear chat history.

### Event-Driven Model

Standard procedural scripting is replaced by an asynchronous, event-driven model. The `oc.thread.on()` method registers listeners for specific lifecycle events:

- **`MessageAdded`**: Fires after a message is committed. Triggers: database persistence, UI updates, side-effects like parsing game commands
- **`MessageStreaming`**: Fires as the AI generates tokens. Enables "typewriter" effects
- **`Context`**: Fires immediately before the prompt is compiled, allowing "Just-In-Time" context injection

### Context Injection: The "Invisible Instruction" Pattern

To ensure the AI "knows" the game state, use `hiddenFrom: ["user"]` system messages to inject state updates without breaking immersion:

```javascript
function injectGameState(gameState) {
  const stateBlock = `
Current Health: ${gameState.hp}/${gameState.maxHp}
Location: ${gameState.location}
Inventory: ${gameState.inventory.join(', ')}
  `;
  oc.thread.messages.push({
    author: "system",
    content: stateBlock,
    hiddenFrom: ["user"],
    expectsReply: false
  });
}
```

### The "Director" Pattern: Input Interception

Intercept user input before it reaches the AI. Regex check for `/` prefix:
- **Slash command detected:** Execute JavaScript function (e.g., `/inventory` opens inventory modal). Do NOT send to oc.thread.
- **Narrative detected:** Push to oc.thread, triggering AI reply

This separation ensures mechanical interactions don't consume AI tokens or clutter narrative history.

### Interactive Element Hydration

The AI is instructed to output interactive choices using specific syntax: `[[Open Chest]]` or `[[Attack Goblin]]`. The message rendering pipeline detects this syntax and "hydrates" it into clickable HTML buttons for the user, while leaving the text for the AI to process:

```javascript
oc.messageRenderingPipeline.push(function({ message, reader }) {
  if (reader === 'user') {
    const buttonRegex = /\[\[(.+?)\]\]/g;
    return message.content.replace(buttonRegex, (match, actionText) => {
      const safeText = DOMPurify.sanitize(actionText).replace(/'/g, "\\'");
      return `<button class="action-btn" onclick="window.App.dispatchAction('${safeText}')">${actionText}</button>`;
    });
  }
  return message.content;
});
```

## Pattern B: The Visual Engine

For applications focused on generative imagery (e.g., image generators), the architecture shifts to a **Two-Stage Pipeline**: Compile → Render.

### The Syntax Distinction: Probability vs. Weighting

**Stage 1: Perchance Probability (Left Panel)**
Determines **content selection**—whether a word/concept appears at all.
```perchance
{Option A^2 | Option B}  // Option A is twice as likely to be chosen
```

**Stage 2: Diffusion Weighting (Plugin Execution)**
Determines **attention modulation**—how much the model focuses on a word that is present.
```
(keyword:1.2)  // Increase attention by 1.2x
```

**Critical Pattern:** Nest weighting *inside* probability selection:
```perchance
{ (keyword:1.2)^2 | keyword }  // 66% chance with emphasis, 33% without
```

### Structured Prompt Engineering

Rather than a single random string, construct prompts from modular components (Subject, Lighting, Style, Meta-Tags) defined in the Left Panel. This enables:

1. **Consistent structure** across generations
2. **Granular control** over each component
3. **Easy maintenance** of prompt quality standards

### The "Anti-Description" Protocol (Negative Prompts)

Negative prompts are **mandatory**, not optional. Implement a "Universal Negative" list appended to every request:

```
deformed, disfigured, bad anatomy, extra limbs, blurry, watermark, text,
low quality, jpeg artifacts, pixelated, grainy
```

### Execution Pipeline

```javascript
async function generateImagePipeline() {
  // Stage 1: Compile (Left Panel)
  const promptData = window.parent.perchancePlugins.getPrompt();

  // Stage 2: Render (Plugin Execution)
  const imageBlob = await window.parent.perchancePlugins.textToImage({
    prompt: promptData.positive,
    negativePrompt: promptData.negative,
    width: 512,
    height: 768
  });

  // Stage 3: Hydrate (UI Update)
  const imageUrl = URL.createObjectURL(imageBlob);
  document.querySelector('#gallery-display').src = imageUrl;

  // Stage 4: Persist (Database)
  await db.images.add({
    blob: imageBlob,
    prompt: promptData.positive,
    timestamp: Date.now()
  });
}
```

## Database: Local-First Persistence with IndexedDB

The Two-Panel Architecture explicitly rejects Perchance's `remember-plugin` for complex application state. That plugin relies on localStorage/cookies with low storage limits (~5MB) and no query capabilities.

**Mandate:** Use **Dexie.js** (a wrapper for IndexedDB).

### Schema Definition

```javascript
import Dexie from 'dexie';

export const db = new Dexie('HybridAppDB');

db.version(1).stores({
  entities: '++id, &name, type, isChosen',
  stories: '++id, title, updatedAt',
  messages: '++id, storyId, [storyId+createdAt], role',
  settings: 'id',
  images: '++id, timestamp'
});
```

### Transactional Chat Save

```javascript
async function saveUserMessage(storyId, text) {
  await db.transaction('rw', db.messages, db.stories, async () => {
    // Operation 1: Add the message record
    await db.messages.add({
      storyId: storyId,
      role: 'user',
      text: text,
      createdAt: Date.now()
    });

    // Operation 2: Update the parent story metadata
    await db.stories.update(storyId, {
      updatedAt: Date.now()
    });
  });
}
```

### State Rehydration: Offline-First Capability

Upon initialization (after `waitForPlugins()` resolves):

1. **Open Database:** `await db.open()`
2. **Load Active Context:** Query `db.stories` for the most recently updated story
3. **Load History:** Query `db.messages` for that story and populate `oc.thread`
4. **Load Assets:** Fetch active characters/images from `db.entities`

This enables the app to behave like installed software. The user can close the tab, go offline, refresh the page, and return exactly where they left off. This "Game Cartridge" model is superior to server-side sessions for privacy and reliability.

---

# Section 8: Expert Patterns and Best Practices

Achieving high-quality, consistent, and engaging results with Perchance requires moving beyond basic syntax and applying expert patterns.

## Architecting for Character Consistency

### Behavioral Consistency

**The Single Source of Truth**
The `instruction/role` message should be the definitive source for the character's core traits, backstory, and voice. A detailed, well-structured instruction provides a strong anchor for the AI to return to, mitigating conversational drift.

**Tactical Reinforcement**
The `reminder` message should reinforce specific, high-priority traits the AI tends to forget or deviate from. For example: `OOC: Remember to respond with sarcasm`

**Show, Don't Just Tell**
Instead of listing personality keywords (e.g., "witty, brave, loyal"), include concrete examples of the character's dialogue and behavior directly within the instruction. This provides the AI with a clear pattern to emulate, which is often more effective than abstract descriptions.

### Visual Consistency

For generators that create images, maintaining consistent character appearance is paramount.

**Detailed and Specific Prompts**
Prompts should be highly descriptive, detailing not just general appearance but specific features, attire, and scene context. The more constraints provided, the less room for random deviation.

**The Power of the Seed**
The single most critical parameter for visual consistency is the `seed`. Using the same seed for a given prompt produces very similar, if not identical, images. By locking in a seed for a character, developers ensure facial features and core appearance remain consistent across different scenes and poses.

**Negative Prompts**
Essential for quality control. Explicitly exclude common AI image artifacts like "blurry," "low quality," "extra hands," or "deformed," which significantly improves output reliability.

**Parameter Syntax** (for `/image` command):
```
/image a cute rabbit (resolution:::512x768)
/image a cute rabbit (seed:::84756293)
/image a cute rabbit (negativePrompt:::blurry, low quality)
```

## Designing Dynamic and Interactive Experiences

### Pattern: Interactive Choices

A powerful pattern for text adventures, RPGs, or choice-based narratives:

1. Instruct the AI (via `roleInstruction`) to present choices in a specific format: `[[Attack the goblin]]` or `[[Flee the cave]]`
2. Use the `messageRenderingPipeline` to detect this pattern and replace it with clickable HTML `<button>` elements
3. The button's `onclick` handler submits the user's choice as a new message

This creates a seamless, interactive UI for the user while maintaining a simple, text-based format for the AI to process.

### Pattern: AI-Generated UI

A more advanced technique: prompt the AI to not only narrate a scene but generate the interactive choices itself. By instructing the AI to output text in the custom `[[Choice]]` format, the LLM becomes a "UI composer," dynamically creating available actions based on narrative context. This approach can lead to more emergent and unpredictable gameplay.

## Debugging and Optimization

### Debugging AI Behavior

The primary tool for debugging and guiding an AI is **direct intervention**: Edit the message. This act of correction is the most powerful form of feedback, as the AI heavily weights existing messages in the chat history when generating its next response. Correcting unwanted behavior, especially in the first few turns of a conversation, is crucial for steering the AI in the desired direction.

### Performance Optimization

The AI's response time is influenced by several factors:

- **Custom code performance:** For computationally intensive code, be mindful of performance
- **Summarization overhead:** In the character editor's advanced settings, disabling automatic chat summarization and memory creation can significantly speed up response times, though it comes at the cost of the AI's long-term conversational recall

## The Development Workflow: Iterative Refinement

Developing on Perchance, particularly with AI features, is fundamentally an exercise in **probabilistic control**. You are not writing deterministic code but architecting a context to guide a powerful but unpredictable system.

The platform's architecture provides a layered approach to context management—a hierarchy of control from the foundational `instruction` message to the tactical `reminder`, the expansive `lorebook`, and the dynamic `memory`.

**The Iterative Cycle:**

1. **Prompt:** Structure a clear initial context
2. **Generate:** Observe the AI's output
3. **Edit:** Correct deviations by editing messages
4. **Refine:** Adjust core instructions based on observations

By structuring a clear initial context, observing the AI's output, correcting its deviations, and then refining the core instructions based on those observations, a developer can progressively steer the probabilistic system toward producing consistently high-quality, engaging, and intelligent results.

---

# Section 9: References and Resources

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

**4.1.0 (2025-11-20)** — **Complete Restructuring and Optimization**
- Merged MASTER_ARCHITECT section into main content, using authoritative architectural patterns
- Eliminated ~40% redundant content (duplicated topics across 18 sections)
- Reorganized into 9 logical, progression-based sections (novice → advanced)
- Moved all application-specific content (RPGlitch, ImageGlitch) to PERCHANCE.md
- Enhanced clarity with consolidated examples and improved cross-references
- Unified conflicting information using "later is more true" rule
- Added comprehensive architecture section integrating all Two-Panel concepts
- Improved visual hierarchy and scannability with refined headings and tables

**4.0.2 (2025-11-10)** — Comprehensive security hardening (see CLAUDE.md)

**4.0.0 (2025-11-10)** — Full synchronization with GEMINI.md and project documentation
