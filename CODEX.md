# 1\. `apps/rpglitch/AGENTS.md` (The Consolidated Brain)

# RPGLITCH INTELLIGENCE PROTOCOL
> **Scope:** `apps/rpglitch/`
> **Role:** Narrative Simulation Engine (Chat + Physics)
> **Architecture:** Two-Panel SPA (Dexie.js + Vanilla JS)

## 🧠 CORE DIRECTIVES
1.  **The "Two-Panel" Law:**
    * **Left Panel:** Declarative lists & imports ONLY.
    * **Right Panel (`js/`):** All logic, state, and rendering.
    * **Bridge:** `window.pluginAi` / `window.pluginTextToImage` are injected globally.
2.  **State Management:**
    * **Source of Truth:** `Dexie` (IndexedDB).
    * **Reactivity:** `app-state.js` (UI Layer). **NEVER** mutate state directly; use `applyPatch()`.
    * **Security:** `DOMPurify.sanitize()` is MANDATORY for `innerHTML`.

---

## 📐 VIRTUAL SCHEMA (The Data Shape)
*Implicit types for `core-db.js`, `app-state.js`, and `entity-structs.js`.*

```typescript
interface CharacterEntity {
  id?: number;
  type: "character";
  name: string;
  description: string;
  // The 4-Fold Time Structure (CRITICAL)
  forever: string;          // Constants/Personality
  past: string;             // Long-term memory
  present: string;          // Current location/status
  future: string;           // Goals/Intentions
  // Narrative Physics (V4.2)
  dynamics: {
    entropy: number;        // 0-100: Randomness/Chaos
    permeability: number;   // 0-100: Openness to change
    velocity: number;       // 0-100: Narrative pace
    resonance: number;      // 0-100: Thematic consistency
  };
  signatureColour: "pink" | "emerald" | "cyan" | "orange" | "purple" | "default";
  // Rollback System (Ghost Prevention)
  _backupState?: CharacterEntity; 
  _lastUpdateMsgId?: number;
}

interface Message {
  id?: number;
  storyId: number;
  role: "user" | "ai" | "narrator" | "system";
  type: "IC" | "OOC" | "DEBUG"; 
  text: string;     // May contain <think> tags
  characterName: string;
  createdAt: number;
}

interface AppState {
  storyTitle: string;
  mode: "storyboard" | "gameplay";
  settings: {
    directorMode: boolean; // Enables Physics Logs & Thoughts
    model: string;
    temperature: number;
  };
  ui: { fsm: "idle" | "sending" | "error" | "done"; };
}
```

---

## 🌊 LOGIC FLOWS (The Event Loop)

### 1\. The Turn Lifecycle (Heartbeat)

1.  **User Input:** `StoryController.send(text)` -\> Locks UI.
2.  **Commit User:** Saves `Message(role: "user")`. Renders immediately.
3.  **Context Build:** `ContextBuilder` fetches history + Entity States.
      * *Physics Check:* High `entropy` (\>80) increases LLM Temp.
4.  **Stream:** `llm-adapter` streams text.
      * *Director Mode:* Renders `<think>` tags if enabled.
5.  **Commit AI:** Saves `Message(role: "ai")`.
6.  **Physics Echo (Background):**
      * *Trigger:* If `payloadMeta.triggerUpdate` is true.
      * *Action:* `calculateDynamics()` applies laws. Invisible LLM prompt updates `past`/`present`.
      * *Log:* If `directorMode` ON, saves `Message(type: "DEBUG")`.
7.  **Unlock:** UI unlocks.

### 2\. Regeneration (Time Travel)

1.  **Rollback:** Restores `CharacterEntity` from `_backupState` (Prevents ghost memories).
2.  **Delete:** Removes last AI message.
3.  **Re-Run:** Triggers Turn Lifecycle with new System Instructions.

---

## ⚛️ NARRATIVE PHYSICS (The Simulation)

**The State Vector (`dynamics`):**

  * **Entropy:** Chaos. High = Hallucinations/Creativity. Low = Logic.
  * **Velocity:** Pace. High = Action/Scene Changes. Low = Dialogue.
  * **Permeability:** Memory. High = History rewritten. Low = Stubborn.
  * **Resonance:** Theme. High = Consistent. Low = OOC Breaks.

**The Laws:**

1.  **Adrenaline Shield:** High Velocity + Low Permeability. Character ignores complex emotions.
2.  **Fog of War:** High Entropy dampens Resonance. Chaos allows breaks.
3.  **Panic Spiral:** Sustained High Entropy forces Velocity UP.

---

# 2. `apps/imageglitch/AGENTS.md` (The Consolidated Brain)

# IMAGEGLITCH INTELLIGENCE PROTOCOL
> **Scope:** `apps/imageglitch/`
> **Role:** Hybrid Image Generation (Alchemy Engine)
> **Architecture:** Hybrid SPA (Perchance Plugin + Pollinations API)

## 🧠 CORE DIRECTIVES
1.  **The Injection Bridge:**
    * **Left Panel:** Defines `[clientSideConfig]`.
    * **Right Panel:** Receives `window.glitchLists` (styles, lighting, mood).
    * **Fallback:** If `window.glitchLists` is missing, use hardcoded defaults.
2.  **Rendering Strategy:**
    * **Index 0:** Quad-Block (Canvas via Perchance Plugin).
    * **Index 1:** Solo-Block (Img via Pollinations URL).
    * **Index >1:** Mixed.

---

## 📐 VIRTUAL SCHEMA

```typescript
interface GlitchLists {
  styles: string[];       // e.g., "Cyberpunk"
  lighting: string[];     // e.g., "Bioluminescent"
  mood: string[];         // e.g., "Melancholic"
  tech: string[];         // e.g., "8K resolution"
}

interface AppSettings {
  id: "app-settings";
  mainPromptContent: string;
  seed: number | "";
  numImagesToGen: number; // 1-10
  masterCreativity: number; // 0-10 (Slider)
}

interface CreativityProfile {
  level: number;       // 0-10
  gScale: number;      // Guidance Scale (1.0 - 20.0)
  aiTemp: number;      // LLM Temperature (1.9 - 0.1)
}
```

---

## 🧪 THE ALCHEMY ENGINES (Text Mutation)

### 1\. The Scribe (Refiner)

  * **Trigger:** "Refine Prompt"
  * **Persona:** "Visual Scribe"
  * **Goal:** Convert Tags -\> Natural Language.
  * **Logic:** Uses "Pathetic Fallacy" (Environment mirrors mood).

### 2\. The Entropy Injector (Chaos)

  * **Trigger:** "Embrace Chaos"
  * **Persona:** "Entropy Injector"
  * **Goal:** Forced Mutation.
  * **Logic:** Force-picks random items from `glitchLists` and twists the prompt to fit, even if paradoxical.

### 3\. Transfigure (Instruction)

  * **Trigger:** "Instruct AI"
  * **Persona:** "State Editor"
  * **Goal:** Surgical alteration based on user instruction.

---

# 3. `AGENTS.md` (Root Infrastructure)

# INFRASTRUCTURE INTELLIGENCE PROTOCOL
> **Scope:** Root Directory
> **Role:** Build, Test, & CI/CD

## 🛠️ THE BUILD PIPELINE
* **No Bundler:** We use custom Node.js scripts (`build/scripts/`).
* **`npm start`:** Watches `/apps` -> Mirrors to `/build/output`.
* **`npm run build`:** Production sync + Linting.
* **Constraint:** NEVER edit files in `build/output/`.

## 🧪 TESTING (JSDOM Mocks)
* **Environment:** Jest + JSDOM.
* **Critical Mocks:**
    * **`Dexie`:** Mocked in `setup-jest.js` (Real IndexedDB fails in JSDOM).
    * **`window.ai`:** Mocked as a pass-through function.
    * **`DOMPurify`:** Mocked in `__mocks__` to avoid sanitization logic in unit tests.

## 🛡️ THE GUARDIANS
* **Linting:** ESLint (JS) + Stylelint (SCSS).
* **Pre-Commit:** `tools/guard-no-output-edits.js` blocks commits to `build/output`.
* **CI:** GitHub Actions run on every PR (`validate-pr.yml`).

## 🛠️ Infrastructure & Tooling
This repo uses a custom "Mock-Perchance" environment for professional development.

* **Build:** `npm start` (Watch Mode) / `npm run build` (Prod).
* **Test:** `npm test` (Runs Jest + JSDOM).
* **Codex:** See `docs/ai-codex/infra/` for deep details on:
    * [01-BUILD.md](docs/ai-codex/infra/01-BUILD.md) - How the script sync works.
    * [02-TESTING.md](docs/ai-codex/infra/02-TESTING.md) - How we mock Perchance for Jest.
    * [03-GUARDIANS.md](docs/ai-codex/infra/03-GUARDIANS.md) - CI/CD and Commit Hooks.

# INFRA CODEX: THE BUILD PIPELINE
**Target:** AI Agents / DevOps
**Source:** `build/scripts/*`, `package.json`

## 1. THE BUILD PHILOSOPHY
This project does **NOT** use a traditional bundler (Webpack/Vite) to compile assets.
* **Mechanism:** It uses custom Node.js scripts to **Sync** and **Validate**.
* **Target:** The `build/output/` directory is the staging area.
* **Constraint:** NEVER edit files in `build/output/`. They are overwritten on every save.

## 2. THE SCRIPT ARSENAL
| Script | Source File | Purpose |
| :--- | :--- | :--- |
| **`npm start`** | `build/scripts/watch.js` | The main dev loop. Watches `/apps` and mirrors changes to `/build`. |
| **`npm run build`** | `build/scripts/build-app.js` | A one-time production sync. Runs linters before copying. |
| **`analyze-css`** | `build/scripts/analyze-css.cjs` | Scans SCSS for distinct color usage (Design System enforcement). |

## 3. THE "LEFT-PANEL" PROTOCOL
The build system respects the "Two-Panel" architecture:
1.  **.txt Files:** Copied raw. (The Engine).
2.  **.html/.js/.scss:** Copied/Transpiled to `build/output`. (The Stage).
3.  **Local Libs:** `build/local_libs/` are vendored dependencies (Dexie, PicoCSS) that must be available locally for the `src` paths to work.

# INFRA CODEX: THE TEST MATRIX
**Target:** AI Agents / QA Bots
**Source:** `tests/*`, `jest.config.cjs`

## 1. THE ENVIRONMENT
Tests run in **JSDOM** (simulated browser), NOT a real browser.
* **Config:** `jest.config.cjs` sets `testEnvironment: 'jsdom'`.
* **Setup:** `tests/setup-jest.js` runs before every test file.

## 2. THE GLOBAL MOCKS (Crucial)
The `setup-jest.js` file fabricates the Perchance environment so tests don't crash.

| Missing Global | Mock Strategy | Why? |
| :--- | :--- | :--- |
| **`Dexie`** | `dexie-mock` | Real IndexedDB is flaky in JSDOM. We use an in-memory mock. |
| **`TextEncoder`** | Polyfill | JSDOM often misses this (needed for some libs). |
| **`DOMPurify`** | `__mocks__/dompurify.js` | Prevents sanitization logic from complicating unit tests. |
| **`window.ai`** | `jest.fn()` | The LLM plugin is mocked. We test *handling* of response, not the generation. |

## 3. TESTING STRATEGIES

### Strategy A: Unit Tests (`*.test.js`)
* **Focus:** Individual logic functions (e.g., `calculateDynamics` in physics).
* **Rule:** Import the specific module. Mock dependencies. Assert return values.

### Strategy B: Smoke Tests (`smoke-jsdom-*.js`)
* **Focus:** Integration / Crash Detection.
* **Mechanism:**
    1. Reads the full `index.html`.
    2. Injects it into JSDOM.
    3. Triggers `DOMContentLoaded`.
    4. **Asserts:** Does `document.body` exist? Did any error throw?
* **Use Case:** "Did I break the HTML structure or introduce a syntax error in main.js?"

# INFRA CODEX: THE GUARDIANS (CI/CD)
**Target:** AI Agents / Security
**Source:** `.github/*`, `tools/*`, `eslint.config.mjs`

## 1. THE GATES (GitHub Actions)
Every Pull Request must pass the `validate-pr.yml` workflow:
1.  **Lint:** ESLint (JS) + Stylelint (SCSS) + HTMLHint.
2.  **Test:** `npm test` (Jest).
3.  **Build:** `npm run build` (Ensures no file path errors).

## 2. THE LOCAL GUARD (`tools/guard-no-output-edits.js`)
* **Trigger:** Pre-commit hook (or manual check).
* **Logic:** Checks if any staged files are inside `build/output/`.
* **Action:** **BLOCKS COMMIT** if detected.
* **Reason:** Output files are auto-generated. Edits there will be lost.

## 3. THE CODE STYLE
* **JS:** ES Modules, strict mode. No `var`.
* **CSS:** SCSS with PicoCSS variables.
* **Safety:** `DOMPurify.sanitize()` is enforced via linter rules (or code review) for `innerHTML`.

# INFRA CODEX: DEPENDENCY MAP
**Target:** AI Agents / Dependency Solvers
**Source:** `package.json`

## Core Stack
* **Runtime:** Node.js (Dev), Browser (Prod).
* **Test:** Jest (`^29.x`), JSDOM.
* **Lint:** ESLint (`^9.x`), Stylelint, HTMLHint.
* **DB:** Dexie (`^3.x` or `^4.x` - *Check package.json*).

## Perchance Polyfills
These libraries are stored in `build/local_libs/` to mimic Perchance's CDN behavior locally:
* `dexie.js` (Database)
* `pico.min.css` (UI Framework)
* `purify.min.js` (Security)
* `cash.min.js` (jQuery alternative - *If present*)

# ImageGlitch Source

> **Status:** Active / Production
> **Architecture:** Hybrid SPA (Perchance Plugin + Direct Pollinations API)
> **Codex:** `docs/ai-codex/imageglitch/`

## ⚡ Quick Start for AI Agents
**DO NOT READ THE CODE RAW.**
Read the Codex files to understand the implicit contracts.

1.  `01-SCHEMA.ts`: Understands `window.glitchLists` and the `CreativityProfile`.
2.  `02-FLOWS.md`: Understands the "Quad-Block" vs "Solo-Block" render logic.
3.  `03-ALCHEMY.md`: Understands the prompt engineering behind "Scribe" and "Chaos".

## 🏗️ Architecture: The List Bridge
ImageGlitch relies on a massive injection of configuration data from the Left Panel (`ImageGlitch-left-panel.txt`).
* **Mechanism:** `[clientSideConfig]` block in the Left Panel writes a `<script>` tag.
* **Target:** `window.glitchLists` in the Right Panel.
* **Rule:** If `glitchLists` is missing, the app falls back to a tiny hardcoded list (Safe Mode).

## 🪄 The Magic Engines
The app is not just a UI for Stable Diffusion. It interposes an LLM layer:
* **Scribe:** Rewrites prompts for Flux (Natural Language optimization).
* **Chaos:** Injects random styles from `glitchLists`.
* **Transfigure:** Applies user instructions via LLM editing.

---

```TypeScript
// VIRTUAL SCHEMA FOR IMAGEGLITCH
// Source: apps/imageglitch/js/db.js, apps/imageglitch/js/index.js

/* =========================================
   1. THE CONFIGURATION BRIDGE (Left -> Right)
   Source: ImageGlitch-left-panel.txt -> window.glitchLists
   ========================================= */

/**
 * The raw content lists injected from the Left Panel.
 * Used by the "Chaos" and "Scribe" engines to hallucinate details.
 */
interface GlitchLists {
  styles: string[];       // e.g., "Cyberpunk", "Ukiyo-e"
  lighting: string[];     // e.g., "Bioluminescent", "Golden Hour"
  colors: string[];       // e.g., "Neon", "Pastel"
  composition: string[];  // e.g., "Dutch Angle", "Macro"
  mood: string[];         // e.g., "Melancholic", "Ethereal"
  tech: string[];         // e.g., "8K resolution", "Octane Render"
  extras: string[];       // e.g., "Glitch artifacts", "Floating geometry"
  
  // Quality tags are appended silently to generation, not shown in UI
  quality: string[];      // e.g., "Masterpiece", "Trending on ArtStation"
}

/* =========================================
   2. DATABASE SCHEMA (Dexie: 'ImageGlitchDB')
   Source: apps/imageglitch/js/db.js
   ========================================= */

interface AppSettings {
  id: "app-settings"; // Singleton ID
  
  // Persisted User State
  mainPromptContent: string;
  seed: number | "";
  numImagesToGen: number; // 1-10
  
  // UX Settings
  masterCreativity: number; // 0-10 (Maps to Guidance Scale)
  instructionInput: string;
  instructionsVisible: boolean;
  
  // Migration Flags
  _migrated: boolean;
  _migratedAt: string;
}

/* =========================================
   3. RUNTIME STATE
   Source: apps/imageglitch/js/index.js
   ========================================= */

interface UndoState {
  type: "scribe" | "chaos" | "transfigure" | null;
  prompt: string | null;      // The prompt BEFORE the magic was applied
  instruction: string | null; // The instruction used (if Transfigure)
}

/**
 * Maps the "Creativity" slider (0-10) to AI/Gen parameters.
 * Higher Creativity = Lower Guidance, Higher Temperature.
 */
interface CreativityProfile {
  level: number;       // 0-10
  gScale: number;      // Guidance Scale (1.0 - 20.0)
  aiTemp: number;      // LLM Temperature (1.9 - 0.1)
}
```

# LOGIC CODEX: IMAGEGLITCH PIPELINES
**Target:** AI Agents / Logic Engines
**Source:** `apps/imageglitch/js/index.js`

## 1. THE MAGIC PIPELINE (Text-to-Text)
This pipeline transforms a simple user prompt into a complex one using the LLM.

### Mode A: Scribe (Refinement)
1.  **Input:** User Prompt (e.g., "A cat").
2.  **Sampling:** Randomly pick 1 item from `styles`, `mood`, `lighting`, `tech`.
3.  **Prompt Engineering:**
    * **Persona:** "Visual Scribe"
    * **Technique:** "Pathetic Fallacy" (Environment mirrors mood).
    * **Constraint:** "Output Natural Language. No tags."
4.  **Result:** "A melancholic cat sits in a rain-slicked neon alley..."

### Mode B: Chaos (Entropy)
1.  **Input:** User Prompt.
2.  **Sampling:** Force pick random divergent items (Paradoxes encouraged).
3.  **Prompt Engineering:**
    * **Persona:** "Entropy Injector"
    * **Instruction:** "MUTATE the user's prompt by forcing these elements."
4.  **Result:** "A cyberpunk cat dissolving into digital glitch artifacts..."

### Mode C: Transfigure (Instruction)
1.  **Input:** User Prompt + User Instruction (e.g., "Make it underwater").
2.  **Prompt Engineering:**
    * **Persona:** "State Editor"
    * **Instruction:** "Surgically alter specific attributes."

---

## 2. THE SUMMON PIPELINE (Text-to-Image)
This pipeline generates the actual visuals. It employs a **Hybrid Rendering Strategy**.

### Step 1: DOM Injection
* The app does *not* wait for the image. It injects the HTML structure immediately.
* **The Quad-Block:** A 2x2 grid. 1 Prompt -> 4 Variations (Seeds/Resolutions).
* **The Solo-Block:** A single large image.

### Step 2: The Distribution Algorithm
The app decides *how* to render based on the index `i` (0 to `numImagesToGen`):

| Index | Strategy | Renderer |
| :--- | :--- | :--- |
| **0** | **Quad-Block** | `perchance` (Plugin) |
| **1** | **Solo-Block** | `pollinations` (Direct URL) |
| **>1** | **Hybrid** | 95% `perchance`, 5% `pollinations` |

*Why?*
* **Perchance Plugin:** Returns a canvas. High control. Used for the primary result.
* **Pollinations URL:** Returns an `<img>` tag. Fast, but less controllable. Used for variety/fallback.

### Step 3: Hydration
1.  **Perchance Blocks:** Call `window.image()` -> Replace placeholder with Canvas.
2.  **Pollinations Blocks:** Set `img.src` -> Browser loads image.

### Step 4: Overlay Injection
* Once DOM is ready, inject "Controls" (Download/Reroll) on top of the images.
* **Reroll Logic:**
    * If Quad-Block (Canvas): Re-call `window.image()`.
    * If Solo-Block (Img): Update `src` with new random seed.

# ALCHEMY CODEX: THE PROMPTING ENGINE
**Target:** AI Agents / Prompt Engineers
**Source:** `apps/imageglitch/js/index.js` (Hardcoded Templates)

## 1. THE VISUAL SCRIBE (Refiner)
**Trigger:** "Refine Prompt" Button
**Goal:** Convert "Tags" into "Natural Language".

> "You are the 'Visual Scribe' (Holistic Architect).
> CRITICAL: The target renderer (Flux) FAILS with 'tag lists'. It THRIVES on complete, descriptive sentences.
> PROCESS:
> 1. ANALYZE the user's prompt.
> 2. EXPAND it into a detailed scene using the 'Pathetic Fallacy'.
> 3. WEAVE the suggested elements...
> 4. OUTPUT a single, grammatically correct paragraph."

## 2. THE ENTROPY INJECTOR (Chaos)
**Trigger:** "Embrace Chaos" Button
**Goal:** High-Variance Mutation.

> "You are the 'Entropy Injector'.
> Your goal is to MUTATE the user's prompt by forcing random, divergent elements into it.
> FORCED MUTATIONS (You MUST incorporate these):
> - Art Style: {random}
> - Mood: {random}
> ...
> TWIST the scene to fit the 'Forced Mutations' above, even if it creates a paradox."

## 3. THE CREATIVITY CURVE
The "Creativity" slider controls two inverse variables:

| Slider (0-10) | Guidance Scale | AI Temp | Effect |
| :--- | :--- | :--- | :--- |
| **0** | 1.0 (Low) | 1.9 (Max) | **Pure Chaos.** AI ignores prompt structure; Image adheres loosely. |
| **4 (Default)** | 7.0 (Med) | 1.0 (Med) | **Balanced.** Good for most art. |
| **10** | 20.0 (Max) | 0.1 (Min) | **Rigid.** Image follows prompt exactly; AI makes minimal changes. |

# RPGlitch Source

> **Status:** Active / Production
> **Architecture:** Two-Panel SPA (Dexie.js + Vanilla ES6)
> **Codex:** `docs/ai-codex/`

## ⚡ Quick Start for AI Agents
**DO NOT READ THE CODE RAW.**
If you are an AI assistant helping a developer, **read the CODEX files first**. They contain the Virtual Types and State Machines that explain the implicit logic of this codebase.

1.  `docs/ai-codex/01-SCHEMA.ts` -> Data Structures & DB Schema.
2.  `docs/ai-codex/02-FLOWS.md` -> Event Loops & Logic.
3.  `docs/ai-codex/03-PHYSICS.md` -> The Narrative Simulation Engine.

## 🏗️ The "Two-Panel" Architecture
This project runs on Perchance.org, which imposes a strict separation of concerns:

### 1. The Left Panel (The Engine)
* **File:** `RPGlitch-left-panel.txt`
* **Role:** Dependency Injection & Configuration.
* **Rule:** NO LOGIC ALLOWED. Only `imports` and `lists`.

### 2. The Right Panel (The Stage)
* **File:** `html/index.html` + `/js/*`
* **Role:** The Application.
* **Stack:**
    * **UI:** Vanilla JS + Pico.css (SASS).
    * **State:** `app-state.js` (Reactive Store).
    * **Data:** `core-db.js` (Dexie.js / IndexedDB).
    * **LLM:** `llm-adapter.js` (Stream Handling).

## 🛡️ Security Protocols
1.  **Zero-Trust Rendering:** All user/AI text must pass through `DOMPurify` before entering `innerHTML`.
2.  **State Sanity:** Never mutate `state` directly; use `applyPatch()`.
3.  **Local-First:** All data lives in the user's browser (IndexedDB). No external servers (except the LLM endpoint).

## 🧠 The Physics Engine
RPGlitch includes a background simulation (`engine-physics.js`) that tracks narrative **Entropy**, **Velocity**, and **Resonance**.
* *Debug:* Enable "Director's Mode" in Settings to see the physics logs in the chat.
* *Docs:* See `docs/ai-codex/03-PHYSICS.md`.

---

```TypeScript
// VIRTUAL SCHEMA FOR RPGLITCH
// This file is a "Virtual Type Definition" for AI Context.
// It synthesizes structure from:
// - apps/rpglitch/js/core-db.js (Dexie Store)
// - apps/rpglitch/js/entity-structs.js (Entity Shapes)
// - apps/rpglitch/js/app-state.js (State Store)

/* =========================================
   1. DATABASE SCHEMA (Dexie: 'rpglitch')
   Source: js/core-db.js
   ========================================= */

/**
 * The primary actor in the story.
 * Can be an AI (Archetype) or User (Persona).
 */
interface CharacterEntity {
  id?: number;              // Auto-incremented by Dexie
  type: "character";
  name: string;
  description: string;
  
  // The 4-Fold Time Structure (The Core of RPGlitch Narrative)
  forever: string;          // Eternal truths, personality, constants
  past: string;             // Backstory and accumulated memory
  present: string;          // Current context, immediate surroundings
  future: string;           // Goals, destiny, immediate intentions
  
  // Visuals
  profilePicture?: string;  // Base64 or URL
  signatureColour: "pink" | "emerald" | "cyan" | "orange" | "purple" | "default";
  
  // Narrative Physics (V4.2) - See js/manager-turns.js
  dynamics: {
    entropy: number;        // 0-100: Randomness/Chaos
    permeability: number;   // 0-100: How much the Past affects the Present
    velocity: number;       // 0-100: Narrative pacing
    resonance: number;      // 0-100: Thematic consistency
  };

  // Meta & System
  tags: string[];
  isCustom: number;         // 1 or 0 (Boolean-like)
  isChosen?: number;        // Used for selection UI
  createdAt: number;
  updatedAt: number;

  // Rollback / Ghost Prevention
  _backupState?: CharacterEntity; // Complete snapshot before last edit
  _lastUpdateMsgId?: number;      // ID of the message that triggered the update
}

/**
 * Represents a Setting/Location.
 * Uses the same 4-Fold structure but 'future' usually represents looming threats/events.
 */
interface WorldEntity {
  id?: number;
  type: "world";
  name: string;
  description: string;
  // World Building Blocks
  forever: string;
  past: string;
  present: string;
  future: string;
  signatureColour: string;
}

/**
 * A container for a gameplay session.
 */
interface Story {
  id?: number;
  title: string;
  aiCharacterId: number;    // FK to CharacterEntity
  userCharacterId: number;  // FK to CharacterEntity
  worldId: number;          // FK to WorldEntity
  
  // Snapshot of settings at creation time
  settingsSnapshot: {
    model: string;
    temperature: number;
    top_p: number;
    maxTokens: number;
  };
  
  createdAt: number;
  updatedAt: number;
}

/**
 * A single turn in the chat log.
 */
interface Message {
  id?: number;
  storyId: number;
  
  role: "user" | "ai" | "narrator" | "system";
  type: "IC" | "OOC" | "DEBUG"; // In-Character, Out-Of-Character, System Log
  
  text: string;             // The content (May include <think>...</think>)
  characterName: string;    // Denormalized name for display
  
  seed?: number;            // For deterministic regeneration (optional)
  meta?: any;               // Expansion slot for plugin data
  createdAt: number;
}


/* =========================================
   2. APPLICATION STATE
   Source: js/app-state.js
   ========================================= */

interface AppState {
  // Navigation & Meta
  storyTitle: string;
  mode: "storyboard" | "gameplay"; // The two main UI phases
  isCustomTitle: boolean;
  
  // Selection Staging (Storyboard Mode)
  selectedAI: CharacterEntity | null;
  selectedUser: CharacterEntity | null;
  selectedWorld: WorldEntity | null;
  
  // Active Game Data
  story: {
    byId: Record<number, Story>;
    activeId: number | null;
  };
  messages: {
    byStoryId: Record<number, Message[]>;
  };
  
  // Global Settings
  settings: {
    temperature: number;
    top_p: number;
    maxTokens: number;
    stop: string[];
    model: string;
    historyLength: number;
    directorMode: boolean; // Toggles visibility of <think> and debug logs
  };
  
  // UI Finite State Machine
  ui: {
    fsm: "idle" | "sending" | "error" | "done";
    abortController?: AbortController;
    lastError?: string;
  };
}

/* =========================================
   3. GLOBAL HELPERS
   Source: js/manager-turns.js (Window Exposure)
   ========================================= */

// These are exposed to window for HTML button onclicks
interface WindowGlobal {
  StoryController: {
    send(text: string): Promise<void>;
    regenerate(): Promise<void>;
    // ... other internal methods
  };
  StoryboardController: {
    // ... setup methods
  };
}
```

# LOGIC CODEX: STATE FLOWS & LIFECYCLES
**Target:** AI Agents / Logic Engines
**Source:** `js/manager-turns.js`, `js/ui-render-chat.js`, `js/engine-prompt-builder.js`

## 1. THE TURN LIFECYCLE (The "Heartbeat")

The application operates on a strict **Lock-Step Request/Response** cycle. The UI is a reflection of the `Dexie` database state.

### Phase A: User Input
1.  **Trigger:** User clicks "Send" or presses Enter.
2.  **LOCK UI:** `StoryController.setSendLock(true)`
    * *Effect:* Input disabled, Send button muted.
    * *State:* `ui.fsm = "sending"`
3.  **COMMIT USER:**
    * Write `Message(role: "user")` to DB.
    * `TurnManager.render(storyId)` -> DOM updates immediately.
4.  **VISUAL FEEDBACK:**
    * `showTypingIndicator(feed, 'ai', characterId)` -> Appends "..." bubble.

### Phase B: Context Construction (Invisible)
5.  **BUILD CONTEXT:** `ContextBuilder.build(storyId)`
    * **Fetch:** History (Last 10-20 msgs), Entity Snapshots, World Ambience.
    * **Physics Check:** Read `entity.dynamics` (Entropy/Velocity).
        * *If High Entropy:* Increase LLM Temperature.
        * *If High Velocity:* Inject "Action" system instructions.
    * **Director Mode:** If `state.settings.directorMode` is ON, inject instruction: *"Output internal monologue in <think> tags."*

### Phase C: Generation & Streaming
6.  **STREAM:** `llm-adapter.generateStream()`
    * *On Token:* `removeTypingIndicator()` (Bubble vanishes on first char).
    * *Director Render:* If `<think>` tags appear:
        * **Standard Mode:** Hidden via RegEx removal.
        * **Director Mode:** Rendered as `<div class="thought-trace">`.
7.  **COMMIT AI:**
    * Stream completes.
    * Write `Message(role: "ai")` to DB.
    * `TurnManager.render(storyId)`.

### Phase D: The Physics Echo (Async Background)
*Crucial: The UI remains LOCKED during this phase if a narrative update is triggered.*

8.  **TRIGGER CHECK:** Did `ContextBuilder` flag `payloadMeta.triggerUpdate`?
    * **NO:** Unlock UI. End Turn.
    * **YES:** Proceed to **Phase E**.

### Phase E: State Evolution (The "Ghost" Turn)
9.  **CALCULATE PHYSICS:** `calculateDynamics(oldDynamics)`
    * Apply Laws (Entropy decay, Velocity momentum).
10. **DEBUG LOG:**
    * If `directorMode` ON: Write `Message(type: "DEBUG")` to DB showing physics math.
11. **MEMORY UPDATE:**
    * Send hidden LLM prompt: *"Based on the last turn, update the character's 'Present' and 'Past' fields."*
    * **Archivist:** If `past` > 2000 chars, trigger summarization compression.
12. **DB UPSERT:**
    * Update `CharacterEntity`:
        * New `past`, `present`, `future`.
        * New `dynamics`.
        * **SNAPSHOT:** Save `_backupState` (Crucial for Rollback/Regen).
        * **LINK:** Save `_lastUpdateMsgId` = AI Message ID.
13. **UNLOCK:** `StoryController.setSendLock(false)`.

---

## 2. REGENERATION FLOW (Time Travel)
**Trigger:** User clicks "Reroll" (Dice Icon) on the last AI message.

1.  **VALIDATION:** ensure last message is `role: "ai"`.
2.  **ROLLBACK (Anti-Ghosting):**
    * Scan `CharacterEntity` for `_lastUpdateMsgId` matching the message being deleted.
    * **Found?** Restore `entity` from `entity._backupState`.
        * *Why?* Prevents the character from "remembering" the deleted timeline.
3.  **DELETE:** Remove AI Message from DB.
4.  **ANALYSIS:**
    * Compare `lastAiMessage` vs `userMessage`.
    * Generate `varianceKey` (e.g., "Make it more aggressive" or "Try a different angle").
5.  **RE-RUN:** Jump to **Phase B (Context)** with injected `DirectorInstruction`.

---

## 3. EDITING FLOW (The "Butterfly Effect")
**Trigger:** User edits their *own* previous message.

1.  **UPDATE:** Write new text to DB for `targetMessageId`.
2.  **PURGE FUTURE:**
    * Identify all messages *after* `targetMessageId`.
    * **DELETE** them from DB.
    * *Note: Currently does not roll back Entity Memory state for these deleted turns (Known Limitation).*
3.  **AUTO-REGEN:**
    * Automatically trigger **Phase B** to generate a new AI response to the *new* user input.

---

## 4. INITIALIZATION FLOW (Boot Sequence)
**Source:** `js/index.js`

1.  **Safety Check:** `DOMPurify` existence check (Critical).
2.  **DB Open:** `db.open()` (Dexie).
3.  **Hydration:**
    * `window.StoryController = StoryController` (Expose for HTML buttons).
    * `window.StoryboardController = StoryboardController`.
4.  **View Init:** `initViews()` -> Renders the Sidebar lists.
5.  **Stage Init:** `initStoryboardStage()` -> Sets up the "Select Character" grid.

# PHYSICS CODEX: THE NARRATIVE SIMULATION ENGINE
**Target:** AI Agents / Simulation Logic
**Source:** `js/engine-physics.js`, `js/engine-variance.js`

## 1. THE 4 DIMENSIONS (The State Vector)
Every Entity (Character/World) maintains a `dynamics` object. This is not RPG stats (Strength/Dexterity); it is **Narrative State**.

| Dimension | Range | Concept | Effect on LLM |
| :--- | :--- | :--- | :--- |
| **ENTROPY** | 0-100 | Chaos, Confusion, Energy | **High:** Increases `temperature`. Prompts AI to be erratic/creative.<br>**Low:** Decreases `temperature`. Prompts AI to be logical/calm. |
| **PERMEABILITY** | 0-100 | Openness to Influence | **High:** Character memory (`past`) is easily rewritten by new events.<br>**Low:** Character is stubborn; rejects new facts that contradict history. |
| **VELOCITY** | 0-100 | Pacing / Momentum | **High:** Narrative pushes for Action/Scene Changes.<br>**Low:** Narrative allows Introspection/Dialogue. |
| **RESONANCE** | 0-100 | Thematic Stability | **High:** Enforces character consistency (prevents OOC).<br>**Low:** Allows "Breaks" or transformation. |

---

## 2. THE LAWS OF NARRATIVE PHYSICS (The "Hidden Hand")
These laws run in the background *after* every turn. They modify the `dynamics` vector based on the events of the turn.

### Law 1: The Adrenaline Shield
* **Trigger:** sudden spike in `Velocity` (>80) while `Permeability` is dropping.
* **Effect:** Character enters "Fight or Flight".
* **Simulation:** `Permeability` is penalized. The character becomes unable to process complex emotions or long-term memories until the immediate threat (Velocity) decreases.

### Law 2: Fog of War
* **Trigger:** `Entropy` > 75.
* **Effect:** The situation is too chaotic to maintain thematic consistency.
* **Simulation:** `Resonance` is dampened. The AI is allowed to hallucinate slightly or break character to reflect the confusion of the scene.

### Law 3: The Cool-Down
* **Trigger:** `Velocity` drops (<20) after a high-entropy event.
* **Effect:** Post-action clarity.
* **Simulation:** `Entropy` is forcibly reduced. The system nudges the AI toward "Reflection" or "Summary" mode.

### Law 4: The Panic Spiral
* **Trigger:** `Entropy` remains High (>80) for 3+ turns.
* **Effect:** Unchecked chaos breeds speed.
* **Simulation:** `Velocity` is forced up. The story *must* crash or resolve; it cannot stay static in chaos.

### Law 5: The Echo Chamber
* **Trigger:** `Permeability` < 10 (Closed Mind).
* **Effect:** Character becomes obsessed with their own internal narrative.
* **Simulation:** The `future` field (Goals) becomes rigid. The AI is instructed to ignore User input that contradicts the character's established dogma.

### Law 6: The Glass Cannon
* **Trigger:** High `Velocity` + Low `Resonance`.
* **Effect:** High impact, low stability.
* **Simulation:** "Double Impact Gain." Any emotional beat hits twice as hard in the memory logs, but the character is liable to shatter (breakdown) afterward.

---

## 3. THE VARIANCE ENGINE (Regeneration Logic)
**Source:** `js/engine-variance.js`

When the user clicks "Reroll" (Regenerate), we do not just call the LLM again. We analyze **Interaction Rejection**.

### Rejection Analysis
The system compares the `Last AI Message` (Deleted) vs. the `User Message` that provoked it.

* **Type A: Refusal:** Did the AI say "I cannot..."? -> **Strategy:** "Unbound" (Loosen safety/morality constraints).
* **Type B: Repetition:** Did the AI repeat the User? -> **Strategy:** "Advance" (Force the timeline forward).
* **Type C: Stagnation:** Was the text too short? -> **Strategy:** "Elaborate" (Inject sensory details).

*This analysis produces a `DirectorInstruction` which is injected into the System Prompt for the retry.*
