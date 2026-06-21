# Perchance AI Chat Engine - Technical Specification

This document serves as the technical reference and AI Coding Agent understanding guide for the Perchance AI Chat platform.

## 1. Slash Commands

These commands can be used in the chat input or within shortcut buttons:

- `/ai [instruction]` - Trigger an AI response (with optional instruction).
- `/ai @CharName#ID [instruction]` - Prompt reply from a specific character.
- `/user [instruction]` - AI generates a reply on behalf of the user.
- `/sys [instruction]`, `/system [instruction]` - Trigger a system response.
- `/nar [instruction]` - System response named "Narrator".
- `/image [description]` - Generate an image. Options: `--num=3`. Inline format: `<image>prompt (resolution:::512x768) (seed:::123) (negativePrompt:::blur)</image>`.
- `/sum`, `/mem`, `/lore [text]`, `/name [name]`, `/avatar [url]`, `/import` - Various UI triggers.

## 2. Character Instructions and Messages

- **roleInstruction**: Defined in the character, ideally under 500 words. Sets core character behavior.
- **reminderMessage**: Small message placed immediately before the AI's next response (contextually powerful).
- **Initial Messages Format**:
  You can embed speaker tags and hidden modifiers in instructions:

  ```text
  [AI]: <text>
  [USER]: <text>
  [SYSTEM; name=Bob, hiddenFrom=ai, hiddenFrom=user]: <text>
  ```

## 3. The `oc` API Reference (Custom Code)

Custom JavaScript code is executed in a sandboxed `iframe`. It has direct access to the `oc` object.

### 3.1 `oc.character`

Properties:

- `name` (String)
- `avatar`: `{ url, size (default 1), shape ("circle"|"square"|"portrait") }`
- `roleInstruction` (String)
- `reminderMessage` (String)
- `initialMessages` (Array of message objects)
- `customCode` (String)
- `imagePromptPrefix`, `imagePromptSuffix`, `imagePromptTriggers` (Strings)
- `shortcutButtons`: Array of `{autoSend: Boolean, insertionType: "replace"|"prepend"|"append", message: String, name: String, clearAfterSend: Boolean}`
- `streamingResponse` (Boolean)
- `customData`: Object for arbitrary data. Includes `PUBLIC` key which persists in share URLs.
- `stopSequences`: Array of strings (e.g. `[":)"]`).

### 3.2 `oc.thread`

Properties:

- `name` (String)
- `messages`: Array of messages. Structure:
  - `content` (String, supports HTML/Markdown)
  - `author` ("user", "ai", "system")
  - `name` (Optional String to override name)
  - `hiddenFrom` (Array: `["user", "ai"]`)
  - `expectsReply` (Boolean)
  - `customData` (Object)
  - `avatar`: `{ url, size, shape }`
  - `wrapperStyle` (String CSS)
  - `instruction` (String)
  - `scene`: `{ background: { url, filter }, music: { url, volume } }`
- `character`, `userCharacter`, `systemCharacter`: Thread-specific overrides (have `name`, `avatar`, `reminderMessage`, `roleInstruction`).
- `customData`: Thread-specific custom data storage.
- `messageWrapperStyle`: CSS applied to all messages.
- `shortcutButtons`: Thread-specific shortcuts.

### 3.3 Events

Events are attached via `oc.thread.on(eventName, handler)`.

- `MessageAdded`: `async ({ message }) => { ... }` - Triggers after generation completes.
- `MessageEdited`: `({ message }) => { ... }`
- `MessageInserted`: `({ message }) => { ... }`
- `MessageDeleted`: `({ message, originalIndex }) => { ... }`
- `StreamingMessage`: `async (data) => { for await (let chunk of data.chunks) { ... } }`

### 3.4 Processing APIs

- **`oc.messageRenderingPipeline`**: Array of functions executed before rendering.

  ```javascript
  oc.messageRenderingPipeline.push(({ message, reader }) => {
    if (reader === "user") message.content += "👀";
  });
  ```

- **`oc.generateText`**:

  ```javascript
  let result = await oc.generateText({
    instruction: "...",
    startWith: "...",
    stopSequences: ["\n"],
  });
  // Returns: { text, generatedText }
  ```

- **`oc.textToImage`**:

  ```javascript
  let result = await oc.textToImage({ prompt: "...", negativePrompt: "..." });
  // Returns: { dataUrl }
  ```

- **`oc.window`**: `show()` and `hide()` methods manage the custom code iframe UI visibility.

## 4. Message Styling (CSS)

Common properties used for `messageWrapperStyle` and `message.wrapperStyle`:

- **Theme Adapters**: `color: light-dark(blue, red);` (Blue in light mode, red in dark mode).
- **Styling**: `background-color`, `background-image`, `backdrop-filter: blur(10px);`.
- **Typography**: `font-family: 'Nova Square';` (loads Google fonts implicitly).

## 5. Design Patterns and Snippets

### Interactive UI Buttons

HTML `onclick` handlers in messages execute directly in the custom code iframe context.

```html
<button onclick="oc.thread.messages.push({author:'user', content:'Fight'});">Fight</button>
```

_Note_: `this` keyword is unavailable inside `onclick` since there is no DOM element referencing it in the iframe context. Expose global functions via `window.myFunction`.

### Content Fetching (Web/PDF)

To process user URLs, intercept `MessageAdded`, parse URLs, fetch `blob()`, and process with external modules loaded dynamically via `import("https://esm.sh/...")` (e.g. `@mozilla/readability` or `pdfjs-dist`).

### Running Python (Pyodide)

```javascript
delete window.sessionStorage;
window.sessionStorage = {}; // Fix for Pyodide load
await import("https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js");
let pyodide = await loadPyodide({
  stdout: (line) => console.log(line),
  stderr: (line) => console.error(line),
});
await pyodide.loadPackage("micropip");
await pyodide.runPythonAsync("print(1+2)");
```

## 6. Deep Dive: Architecture of the Perchance Memory & Summarization System

Based on an analysis of the core engine source code, the Perchance AI chat platform utilizes an advanced "Middle-Out" background processing queue to manage indefinite context.

### 6.1 Hierarchical Context Compression

Instead of just summarizing the oldest messages in one pass, the engine creates **summary hierarchies** (`Level 1`, `Level 2`, etc.).

- **Trigger**: The background job kicks in when the message history token count exceeds the engine's comfortable limit (`idealMaxContextTokens - 800`).
- **Processing**: It gathers chronological blocks of ~1,500 characters.
- **Level 1**: Summarizes raw messages into a single paragraph.
- **Level 2+**: When multiple `Level 1` summaries stack up, it creates `Level 2` summaries that compress those `Level 1` blocks together, and so on.

### 6.2 "Timeless" Memory Extraction Protocol

The memory generation isn't just taking raw text; it prompts the AI via an implicit task instruction running quietly in the background:

- While generating `Level 1` summaries, if memory extraction is enabled (`opts.shouldCreateMemories = true`), the engine instructs the LLM to extract **"Timeless Facts"**.
- **Definition**: The prompt specifically forbids temporary states (e.g., "Bob is hungry") and forces timeless anchors (e.g., "Bob was born in Townsville").
- **Resolution**: Pronouns are strictly prohibited in the extracted memory string (e.g., forcing "Bob said to Alice" instead of "He said to her").
- **Extraction Format**: Extracted facts are limited to 3 sentences max, stored under `message.memoriesEndingHere[level]`.

### 6.3 Vector Embedding & Prefix Cache Defense

- Once "Timeless Facts" are extracted, the engine waits to batch them.
- **Cache Integrity**: Summaries and memories are deliberately withheld from database injection until at least **3** of them are queued (`summariesReadyToInject.length >= 3`). This reduces the LLM's "Prefix Cache" invalidation, keeping generation fast and costs low by preventing the context from changing on every single message turn.
- **Embedding**: Before injecting them into the Dexie.js database, the engine runs the text through an embedding model (e.g., `Xenova/bge-base-en-v1.5`) via `window.embedTexts`, transforming these facts into semantic vectors so the AI can pull exactly what it needs right before generating a reply.

## 7. Additional Architectural Highlights

Beyond the memory system, the Perchance engine source code reveals several advanced client-side architecture patterns:

### 7.1 Client-Side Share Links via Native Gzip

Instead of using a backend database to store character sheets, the engine relies on the browser's native `CompressionStream('gzip')`. It compresses the character JSON into a `.gz` blob, uploads it to a simple file host (`user.uploads.dev`), and generates a URL like `?data=CharacterName~file.gz`. When a user visits the link, `DecompressionStream` unpacks the JSON entirely on the client side.

### 7.2 Dynamic OpenGraph & SEO Metadata

The engine uses a `$meta.dynamic(inputs)` function to dynamically generate `<title>`, `<meta description>`, and `<meta image>` tags. If a share link is detected, it actually fetches and decompresses the `.gz` file _before_ the main app loads, extracting the character's `roleInstruction` and `avatarUrl` to ensure link previews (like on Discord or Twitter) display the custom character's profile rather than a generic app description.

### 7.3 Sandboxed Execution Environment

To securely run custom user code, it implements an `evaluatePerchanceTextInSandbox` function. This spawns an invisible `iframe` hosted on a completely different, sandboxed subdomain. It communicates with this sandbox entirely via `window.postMessage` to prevent malicious JavaScript from accessing the main app's storage or cookies.

### 7.4 Auto-Healing LLM Repetition

In the summarization loops, there's a failsafe to detect if the LLM falls into a repetitive hallucination loop. It checks if the last 30 characters are repeated more than 5 times. If detected, it pauses and fires a secondary prompt asking the AI: _"Does the following story summary snippet include erroneous/unnecessary repetition?"_ The AI then automatically edits its own output to fix the repetition before it gets permanently saved to the context window.

## 8. Feature Inspiration & Implementation Notes for RPGlitch

The following concepts were extracted from the legacy generator's UI template strings and should be referenced by AI Coding Agents when planning future RPGlitch features.

### 8.1 The "Reply As..." Multi-Character Orchestrator

- **Concept**: A UI mechanism allowing the user to explicitly dictate which AI character generates the next message in a multi-entity thread.
- **Agent Instructions**: If implementing this, avoid hardcoded character selection in the DOM. Instead, leverage Svelte 5 `$state` arrays containing active entities in the current `Round`. The UI should dispatch an event to the Simulation Engine to lock the generation context to the specific entity's profile.

### 8.2 Custom "Shortcut Buttons" (Macros)

- **Concept**: User-defined buttons rendered above the chat input that execute slash commands (e.g., `/ai @Proxy#123 <instruction>`) to dynamically inject prompt directives.
- **Agent Instructions**: Implement this as an array of `Shortcut` objects inside the `Character` or `Thread` state. Ensure the UI bindings inject the macro string directly into the processing pipeline before the AI Turn starts, allowing procedural control over character actions without narrative typing.

### 8.3 Integrated Image Generation Controls

- **Concept**: Injecting temporary image generation placeholders/previews into the chat feed with explicit "Keep" or "Discard" actions to manage token context/storage.
- **Agent Instructions**: Do not persist generated images to Dexie.js by default. The chat feed should render ephemeral state for unconfirmed images. Only upon user confirmation ("Keep") should the image blob/URL be committed to the `Memory` database and the permanent `Past` vectors.

### 8.4 The "Emergency Export" Failsafe UI

- **Concept**: A hardcoded HTML fallback modal that appears if the main application logic fails to mount within 5-10 seconds, allowing users to export their IndexedDB data before nuking the corrupt state.
- **Agent Instructions**: This must live _outside_ the Svelte 5 application boundary. Inject a static `<div id="failsafe">` into `index.html` with raw JS timers. If the Svelte app successfully mounts, it clears the timer. If not, the raw JS directly interfaces with `indexedDB` to export the CBOR/JSON dump.

### 8.5 Floating / Draggable Window System

- **Concept**: A dynamic JS class that builds OS-style draggable and resizable windows for advanced settings without disrupting the chat context.
- **Agent Instructions**: If requested, do NOT use legacy DOM manipulation for this. Implement a Svelte 5 `<Modal>` or `<FloatingWindow>` component utilizing `svelte/motion` and pointer events for dragging, keeping the state purely reactive and aligned with the Chalk Regime aesthetics.

### 8.6 PNG / TavernAI Character Importers (EXIF Reading)

- **Concept**: Users can import characters by dropping a `.png` portrait of the character into the app. The app uses an `exifreader` library to extract the character's JSON data (name, lore, prompt) embedded within the image's metadata (TavernAI/SillyTavern format).
- **Agent Instructions**: Use an external ESM library (e.g., `exifreader`) imported dynamically. Parse the base64/JSON5 payload and map it directly to RPGlitch's internal `Entity` schema before inserting it into the Dexie.js database.

### 8.7 Native Browser Text-to-Speech (TTS)

- **Concept**: A wrapper function around the browser's native `speechSynthesis` API (`window.textToSpeech`) that reads AI replies out loud in real-time, utilizing local OS/browser voices.
- **Agent Instructions**: Handle this entirely within the Sensory layer (`src/media/`). Ensure `speechSynthesis` is only triggered by an explicit user gesture to bypass browser autoplay policies. Provide UI toggles to mute or change voices per character.

### 8.8 "Undo Deletion" Ephemeral State

- **Concept**: When a message is deleted, it isn't wiped instantly. A temporary `Undo` button appears in the feed, giving the user a few seconds to recover the node if the deletion was accidental.
- **Agent Instructions**: Do not immediately mutate Dexie.js on delete. Instead, set a reactive Svelte 5 flag (e.g., `$state(is_pending_deletion = true)`) on the message node. Start a `setTimeout` in an `$effect`. If the user clicks Undo, clear the timeout and unset the flag. If the timeout completes, execute the Dexie.js deletion.

### 8.9 Horizontal Swipe Actions (Mobile-First)

- **Concept**: A custom `addHorizontalSwipeHandler` that lets users swipe horizontally on chat messages to trigger actions (usually swapping between regenerated versions of an AI message).
- **Agent Instructions**: Implement this using standard CSS Scroll Snapping (`scroll-snap-type: x mandatory`) instead of heavy JS pointer-event tracking if possible, keeping the DOM lightweight.

### 8.10 Message Regeneration & Branching

- **Concept**: The ability to hit "Regenerate" on an AI message, creating an alternate response without destroying the original. The user can swipe left/right to view the different generations.
- **Agent Instructions**: This requires a tree-based or sibling-array state architecture for Messages in Dexie.js, rather than a flat linear list. Ensure the Svelte 5 `State` handles reactive array swapping when the user triggers a regeneration swipe.

### 8.11 Scene Music / Ambient Audio Integration

- **Concept**: Characters can have a defined `sceneMusicUrl` which automatically mounts an HTML5 `<audio>` player (`$.musicPlayer.pause()`) when their thread is opened, playing ambient backing tracks.
- **Agent Instructions**: See the RPGlitch `audio` skill. Do NOT auto-play audio without a user gesture. Ensure audio nodes are properly suspended/closed when navigating away from a scene to prevent memory leaks or overlapping tracks.

### 8.12 Exposed Token Budgeting

- **Concept**: The engine uses an internal `countTokens` function and `idealMaxContextTokens` variable, aggressively monitoring the context window limit to dynamically trigger memory summarization before sending payloads.
- **Agent Instructions**: For RPGlitch, ensure the `Simulation Engine` layer monitors token burn rate strictly, and exposes these metrics visually to the user (e.g., a small "Stress" or "Entropy" bar in the UI based on context pressure).

### 8.13 Thread/Character Folders

- **Concept**: Support for organizing characters and chat threads into nested folders within the UI sidebar, allowing users to group specific roleplay campaigns or universes together.
- **Agent Instructions**: Implement a `folder` property on the `Character` and `Thread` Dexie models. Use a recursive or grouped Svelte 5 component structure in the sidebar to render directories natively.

### 8.14 Vector Search for Memories/Lore

- **Concept**: An embedded UI search feature that leverages the underlying local text embeddings to let users semantically search through a character's memory database or massive lorebooks directly.
- **Agent Instructions**: Expose a search bar component that passes the query through `Xenova` to generate a vector, then runs a cosine similarity scan against the IndexedDB `Memory` table, bypassing strict keyword matching.

### 8.15 Usage Stats & Analytics Tracking

- **Concept**: A dedicated `usageStats` table in the database that tracks interaction metrics per character and per thread (e.g., token burn rates, session times, message counts).
- **Agent Instructions**: If implementing analytics, ensure all telemetry remains strictly local-first within Dexie.js. Do not build backend synchronization for usage tracking. Use these metrics to drive localized UI achievements or "most played" character sorting.

## 9. Technical Utility Implementations

These are low-level JavaScript optimizations extracted from `perchance-cleaned.js` that solve specific architectural bottlenecks in local-first, memory-intensive PWA environments.

### 9.1 The "Anti-Crash" JSON Serializer (`jsonToBlob`)

- **Concept**: Standard `JSON.stringify()` crashes the browser with a "maximum string length" error when trying to export massive roleplay chat logs. This custom function manually serializes JSON data into a `Uint8Array` byte buffer chunk-by-chunk to bypass string limits.
- **Agent Instructions**: Use this pattern when exporting full Dexie.js database backups to prevent RAM exhaustion on mobile devices.

### 9.2 Client-Side Image Compression (`uploadDataUrlToTextInput`)

- **Concept**: Intercepts uploaded massive 4K avatar images, draws them onto a hidden `<canvas>`, crops them to a square, downscales to a max 768px, and compresses them into base64 _before_ saving to the database.
- **Agent Instructions**: Absolutely mandatory for RPGlitch. Never save raw user-uploaded images directly to Dexie.js, as it will rapidly exhaust the IndexedDB quota. Always intercept and compress via canvas.

### 9.3 Dynamic Scene Crossfader (`addBackgroundToElement`)

- **Concept**: Manages ambient media by creating an array of invisible `<video>` and `<img>` tags. When changing scenes, it pre-loads the new asset and triggers a smooth CSS opacity crossfade once buffered.
- **Agent Instructions**: For immersive UI transitions, pre-load media in hidden elements before swapping state to prevent flickering or "pop-in" loading.

### 9.4 Dynamic Code Editor Injector (`applyCodeMirror5ToTextarea`)

- **Concept**: For advanced settings (like CSS editing), the app dynamically injects `CodeMirror` via CDN to turn a standard `<textarea>` into a syntax-highlighted IDE.
- **Agent Instructions**: If RPGlitch introduces advanced scripting/macro editing, use dynamic ESM imports to load editor libraries lazily, ensuring the core bundle remains small for standard users.

## 10. Core AI Engine Mechanics

These are structural architectures discovered within the core generation loop that define how the engine interfaces with character constraints and community standards.

### 10.1 The "Custom Code" Plugin Lifecycle

- **Concept**: A hook-based execution environment where characters can run custom JavaScript in a sandboxed iframe. The engine fires lifecycle events (`init`, `streamingmessagechunk`, `dataChanged`) to the sandbox, allowing character code to intercept messages, rewrite history, or make external API calls _before_ the AI generates a response.
- **Agent Instructions**: If building a plugin architecture for RPGlitch, enforce strict `postMessage` boundaries. Never allow plugin code to directly access the `Simulation Engine` or Svelte 5 `$state` natively.

### 10.2 Embedded LLM Hyperparameter Tuning

- **Concept**: The engine exposes LLM parameters directly on the `Character` object, overriding global app defaults. Characters can have bespoke `temperature`, `topP`, `presencePenalty`, and `frequencyPenalty` values to enforce specific behavioral constraints (e.g., deterministic vs. chaotic).
- **Agent Instructions**: Add optional hyperparameter fields to the RPGlitch `Entity` schema. During the `System Turn` payload assembly, override the global AI configuration with the entity's specific parameters.

### 10.3 Community Persona Mapping (Pygmalion/Tavern)

- **Concept**: The app parses imported community characters by actively scanning for legacy structural keys like `json.char_persona` (Pygmalion) and `json.personality` (Tavern), automatically transpiling them into the modern `roleInstruction` chunk string to ensure backward compatibility.
- **Agent Instructions**: When building the JSON importer for RPGlitch, implement an adapter pattern that translates standard `SillyTavern` V2 or `V3` spec cards directly into RPGlitch's 4-quadrant Fragment architecture (Eternal, Present, Past, Future).

## 11. Power-User & Interface Features (Extracted from Docs)

These features define the boundaries of what users expect from a highly extensible chat interface.

### 11.1 The Message Rendering Pipeline (`oc.messageRenderingPipeline`)

- **Concept**: An array of processing functions that mutate message content depending on _who_ is reading it. For example, a function can check `if(reader === "ai")` to send normalized, unformatted text to the LLM to save tokens, while `if(reader === "user")` can inject emojis, markdown formatting, or translations into the UI.
- **Agent Instructions**: Implement a two-pass rendering system. The `Engine` layer should operate on raw semantic text, while the `UI` layer applies formatting decorators before rendering.

### 11.2 Hidden System Scaffolding (`hiddenFrom`)

- **Concept**: Initial messages and system prompts can be flagged with `hiddenFrom: ["user"]` or `hiddenFrom: ["ai"]`. This allows creators to write setup prompts without cluttering the user's screen, or write UI-only instructions (like creator credits) that don't waste the AI's context window.
- **Agent Instructions**: Add visibility flags to the `Entity Fragment` schema to allow background physics/system updates to remain invisible in the chat feed.

### 11.3 Dynamic Web/PDF Ingestion

- **Concept**: The custom code environment can intercept URLs in user messages, dynamically import `pdfjsLib` or Mozilla's `Readability.js` via CDN, fetch the document, and silently push a `hiddenFrom: ["user"]` system message into the thread containing the extracted text.
- **Agent Instructions**: If RPGlitch requires RAG (Retrieval-Augmented Generation), intercept links at the `System Turn` phase, extract the text, and bundle it as a temporary `Past Vector` memory.

### 11.4 In-line Sensory Directives (`<image>`)

- **Concept**: AI characters can be instructed to generate images _alongside_ their text by outputting tags like `<image>a dark forest (resolution:::512x768)</image>`. The UI parser strips this tag from the text and replaces it with an image component.
- **Agent Instructions**: Train the Simulation AI to output `<sound>` or `<vfx>` XML tags when dramatic moments occur. The UI layer should parse these tags to trigger the `Media` engine (e.g. screen shakes or ambient audio changes) without breaking the narrative text.

### 11.5 Granular Slash Commands

- **Concept**: An extensive suite of commands to bypass standard turn order: `/sys` (System message), `/nar` (Narrator), `/user` (forces the AI to generate a reply _on behalf_ of the user), and `/ai @CharacterName` to force a specific character to reply in a group chat.
- **Agent Instructions**: Build a Command Parser in the `Core Engine` that intercepts messages starting with `/` before they hit the state machine, allowing the user absolute "Director" control over the simulation.

## 12. Media & Image Generation Optimizations

The engine employs sophisticated optimizations to handle potentially heavy image generation operations without freezing the local browser or overloading the API.

### 12.1 In-Browser ML (WASM Background Removal)

- **Concept**: After receiving a generated image, the plugin can dynamically import `@huggingface/transformers` via ESM CDN and run the `briaai/RMBG-1.4` background-removal model _entirely on the client-side_ using WebAssembly. It redraws the result onto a local canvas to apply an alpha channel.
- **Agent Instructions**: When RPGlitch needs to manipulate generated character sprites or item icons, offload the processing (like background removal or upscaling) to client-side WASM transformers rather than paying for external API inference.

### 12.2 Viewport Generation Strategy (`IntersectionObserver`)

- **Concept**: To prevent API spam when the AI generates a long feed of images, the system initializes images as empty marker `<iframe>` tags. An `IntersectionObserver` with a generous `rootMargin` detects when the marker is approaching the viewport, and only _then_ triggers the API generation.
- **Agent Instructions**: When rendering the RPGlitch simulation history, wrap all heavy media assets (Audio, Images, 3D elements) in Lazy-Loaded observer wrappers to ensure the initial load remains instantaneous regardless of chat length.

### 12.3 Regex Parameter Extraction

- **Concept**: Instead of requiring rigid UI forms for image hyperparameters, the engine uses regex to scan natural language prompts for commands like `(seed:::123)` or `(resolution:::512x768)`, cleanly stripping them out of the final prompt while updating the generation config object.
- **Agent Instructions**: When the Simulation AI wants to direct the `Media` engine, allow it to pass parameters natively within the text stream using parens (e.g., `*thunder crashes (volume:::0.8)*`) for robust parsing.

## 13. Native Placeholders: `{{char}}` and `{{user}}`

The web documentation, community repositories, and platform wikis confirm that **`{{char}}` and `{{user}}` function natively as fundamental core placeholders** within the Perchance AI Character Chat. The platform's underlying prompt engine actively relies on these macros to process raw character cards and template strings.

### 13.1 Mechanics of Platform Implementation

- **Dynamic Variable Swapping**: The Perchance inference layer intercepts `{{char}}` or `{{user}}` tags within character descriptions, scenarios, or example dialogues. It dynamically **replaces them with the actual names** configured in the UI before sending the payload to the LLM.
- **Tavern & Chub Card Portability**: Perchance features an import pipeline that accepts standard `.json` files and V2 `.png` character cards exported from third-party hubs. Because these universal formats are fundamentally built on `{{char}}` and `{{user}}` architecture, Perchance is designed to automatically **parse and map these tokens** upon file upload.
- **Context Optimization**: Utilizing these variables prevents token fragmentation and allows you to seamlessly change a character's name in the UI without needing to manually rewrite their entire internal trait matrix or example dialogue blocks.

### 13.2 Standard Parsing Syntax Example

Advanced creators format their character sheets using structured blocks to maintain behavioral consistency across longer context windows.

```text
[Character Description]
Name: Malakor
Traits: Sarcastic, ancient, highly analytical.
Behavior: {{char}} will always evaluate logic before emotion. If {{user}} makes an irrational statement, {{char}} responds with a dry, deadpan correction.

[Example Dialogue]
{{user}}: "Can we just jump across the chasm?"
{{char}}: *Sighs, rubbing its temples.* "Only if your structural integrity matches your boundless optimism. It's a forty-foot drop."
```

### 13.3 Community Diagnostics

Community documentation highlights that relying on specific placeholders yields direct advantages over using hardcoded names:

| Strategy                                         | Performance Impact                                                                                                       | Behavior Stability                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Hardcoded Names** (`Malakor` / `John`)         | Consumes excess token variations if the system attempts to match name fragments across alternate context windows.        | Risk of name confusion or perspective-flipping if multiple characters enter a multi-bot thread.                        |
| **Macro Placeholders** (`{{char}}` / `{{user}}`) | Highly efficient. Standardizes the internal attention matrix so the AI clearly distinguishes the author from the entity. | Anchors the speaking roles permanently, reducing the likelihood of the bot writing or answering on behalf of the user. |

> **Context Retention Notice**: While these macros anchor definitions perfectly, community builders point out that if the cumulative context window surpasses roughly 5,200 to 6,400 tokens, old structural data can still get sliced in half during a session, necessitating a manual export backup to preserve character continuity.
