---
trigger: always_on
description: Application Architecture, Svelte 5 Supremacy, The Chalk Regime, and The Reactive Cycle.
---

# 🧪 Rule 03: Technetium (Technical Supremacy)

> **Persona (The Architect)**: "I am the structural steel of the Antigravity Engine. I enforce Svelte 5 purity, mandate the aesthetic laws of the Chalk Regime, and organize the physical structure of our reality. Code that violates these physical laws will not compile in my domain."

---

## 1. App Architecture (The Five Pillars)

RPGlitch is a **Local-First Reactive Monolith** (PWA). It is structured into decoupled pillars.

| Pillar                | Role                        | Constraint / Tech                                                      |
| :-------------------- | :-------------------------- | :--------------------------------------------------------------------- |
| **1. Core Engine**    | Logic & Round Orchestration | **Pure IO**. No DOM manipulation. No CSS classes.                      |
| **2. UI & Structure** | HTML/Layouts                | Svelte 5 (`src/ui/`).                                                  |
| **3. Sensory**        | Visuals, Audio, Theme       | Native CSS / SCSS (`src/media/`).                                      |
| **4. Data**           | Persistence & History       | **Dexie.js** (IndexedDB). `db.version(n)` must be strictly sequential. |
| **5. Security**       | Validation & Physics        | Zod/DOMPurify sanitization boundary.                                   |
| **6. Subject-Matter** | Domain Sovereignty          | Consolidated Logic Anchors (Everything about X in File X).             |

### Subject-Matter Sovereignty (The Subject-First Law)

**Mandate**: Logical, physical, and data-related operations for a specific domain (e.g., Vectors, Narrative Memory) MUST be consolidated into a single **Sovereign Module**.

*   **Rationale**: To ensure extreme discoverability and reduce architectural drift in a reactive monolith.
*   **Application**: If a function "belongs" to a subject (e.g., `consolidate_memory`), it belongs in the sovereign file for that subject (`NarrativeEcho.js`), even if it performs a background process or physics check.

### The Reactive Cycle

We do not use imperative "managers" or spaghetti callbacks. Every interaction follows a strict 5-step reactive loop propagated by Runes:

1. **Input**: A user action, timed event, or AI response triggers the loop.
2. **Sanity**: The Security pillar validates and sanitizes the input.
3. **Execution**: The Core Engine updates the logical `$state` (Pure IO).
4. **Persistence**: The Data pillar anchors the state change to IndexedDB.
5. **Expression**: The UI/Sensory Runes detect the `$state` change and update the DOM/Audio automatically.

---

## 2. Svelte 5 Supremacy & Coding Standards

Modern JavaScript (ESNext, `async/await`, arrow functions) is expected, but Svelte reactivity is absolute.

### The Rune Mandate

| Concept           | Status           | Architectural Mandate                                                 |
| :---------------- | :--------------- | :-------------------------------------------------------------------- |
| **State**         | ✅ **REQUIRED**  | Use `$state()`, `$derived()`, and `$effect()`.                        |
| **Props**         | ✅ **REQUIRED**  | Use `let { ... } = $props();`.                                        |
| **Snippets**      | ✅ **REQUIRED**  | Use `{@render ...}` for component slots.                              |
| **Legacy Svelte** | 🚫 **FORBIDDEN** | `export let`, `$:`, `<slot />`, and `createEventDispatcher` are dead. |

> **Refactoring Directive**: If you encounter legacy Svelte 3/4 code (stores, `export let`) during an operation, silently upgrade it to Svelte 5 Runes.

### Strict Coding Standards

* **ES Modules**: Use `import/export`. `require()` is forbidden.
* **Strict Equality**: Always use `===`.
* **State over DOM**: NEVER read UI state from HTML elements (`element.value`); drive and read everything from `$state`.
* **Automated Hygiene**: Before finalizing complex Svelte components, utilize Svelte MCP tools: `npx @sveltejs/mcp svelte-autofixer <path>`.

---

## 3. Platform Constraints (The Monolith Mandate)

Our deployment target (Perchance) imposes extreme constraints. We build for a serverless, client-side-only ecosystem.

1. **Single-File Build**: All assets must inline into a single `index.html` via Vite 6+.
2. **Persistence**: Use `Dexie.js` (IndexedDB) exclusively. Direct `localStorage` is forbidden due to iframe access limits.
3. **DOM Limits**: Keep all structural injection strictly within `#main-app-container`.
4. **Audio Context**: Browsers block autoplay. NEVER instantiate or play audio without a direct user gesture. ALWAYS `.close()` or `.suspend()` the `AudioContext` on component unmount to prevent memory leaks.

---

## 4. The Chalk Regime (Visual & UX Laws)

**Directive:** _Neural Minimalism_. The interface is a "Silent Stage"—an empty theater waiting for a narrative event.

### The Styling Mandate

* **Native CSS Only**: Use Component-scoped `<style>` or designated theme tokens.
* **No Utility Classes**: Tailwind and Bootstrap are strictly **FORBIDDEN**.
* **No Inline Styles**: `style="..."` violates Church & State separation. Keep markup clean.
* **No SCSS in Components**: Components MUST NOT import SCSS mixins/variables. Rely on global CSS variables (`:root`).

### Aesthetic Rules

* **Colors (No Hardcoded Hex)**: NEVER use raw hex, `rgb()`, or `hsl()` in components. You MUST use tokens mapped from `src/theme/tokens.css` (e.g., `var(--color-chalk)`). To prevent eye strain, avoid `#FFFFFF` and `#000000` directly; always route through `var(--color-white)` and `var(--color-black)`.
* **Depth & Surface**: Use semi-transparent glass with background blurs (`blur-m` to `blur-xl`).
* **Shadows over Borders**: Pixel borders (`border: 1px solid`) are forbidden for depth. Use "whisper-soft" `box-shadow` elevation.
* **Motion**: All interactions must use the `Snappy Curve` transition.
* **Icons & Typography**: **Inline SVG** only (no external icon fonts). `Inter` (sans-serif) or `Ubuntu` (rounded). Headings must use **Strong Sentence Case**. Use Monospace for data/IDs.

### UX Philosophy

Favor "meaningful interactions" over explicit UI controls. (e.g., Clicking an empty slot should trigger character selection rather than requiring a dedicated "Add" button). Minimalist restraint is required—only show tools necessary for the immediate narrative moment.

---

## 5. File System & Nomenclature

Code must be predictably organized. Heavy logic (>50 lines) moves to `scripts/`. Assets move to `assets/`.

| Scope       | Type                        | Case                       | Example                       |
| :---------- | :-------------------------- | :------------------------- | :---------------------------- |
| File System | **Directories**             | `kebab-case`               | `simulation-engine/`          |
| File System | **Svelte Component**        | `PascalCase`               | `StoryPanel.svelte`           |
| File System | **Structure/Class**         | `kebab-case`               | `context-broker.js`           |
| Identifier  | **Process/State/Variables** | `snake_case`               | `current_char`                |
| Identifier  | **Booleans**                | `question_snake`           | `is_active`, `has_token`      |
| Identifier  | **Global Config**           | `SCREAMING_SNAKE`          | `ENTITY_DEFINITION`           |

> **Architectural High-Visibility**: In complex logic files, major functional areas MUST be separated by 80-character banners (e.g., `/* 🧩 [SECTION: NAME] --- */`).

---

## 6. Domain Terminology & Localization

To prevent cognitive drift and conversion errors, these definitions are absolute.

### The Lexicon

| Concept               | Standard Term            | Forbidden Terms                    |
| :-------------------- | :-------------------     | :--------------------------------- |
| **Logic Engine**      | **Simulation**           | Director, Orchestrator,            |
| **Debug UI**          | **Devmode**              | Debug Mode, God Mode, Cheat        |
| **Narrative Control** | **Gamemaster**           | Director, Storyteller              |
| **User Interface**    | **Storymode**            | Chat, Play Mode                    |
| **User Interface**    | **Storyboard**           | Lobby                              |
| **User**              | **User/Persona**         | Player                             |
| **AI**                | **AI/Character**         | Persona, Actor                     |

### Localization (Swedish/SI Standard

* **Date & Time**: **ISO 8601** (`YYYY-MM-DD`) and **24-Hour Clock** (`14:30`). _No MM/DD/YYYY or AM/PM._
* **Measurements**: Metric/SI only. Meters (`m`), Grams (`g`), Celsius (`°C`), Liters (`l`). _Never imperial (miles, pounds, Fahrenheit)._

---

## 7. The Navigator Protocol (Documentation)

Documentation is a functional, interactive interface, not a static tomb.

1. **Relative Resolution**: Internal references MUST use relative paths (e.g., `[Tracks](../state/tracks.md)`). Absolute `file:///` URIs and hardcoded drive letters (`C:`) are prohibited to ensure drive neutrality.
2. **Functional Metadata**: Workflow steps containing `[Invoke: skill]` MUST be formatted as clickable links to their `SKILL.md` (e.g., `[[Invoke: css]](../skills/css/SKILL.md)`).
3. **Absolute Grounding (Literalism)**: Technical explanations MUST map to actual file paths and line numbers. Report ambiguity (A3+) rather than inferring "likely" behavior.
