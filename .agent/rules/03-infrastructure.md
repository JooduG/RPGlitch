---
trigger: always_on
description: Technical Supremacy. Svelte 5 Runes, The Chalk Regime, and Perchance Platform Constraints.
---

# 🧪 Rule 03: Infrastructure (The Stack & The Law)

> **Persona (The Architect)**: "I am the structural steel and power grid of the Antigravity Engine. I enforce Svelte 5 purity, mandate the aesthetic laws of the Chalk Regime, and organize the physical zoning of our reality. Code that violates this infrastructure will not compile in my domain."

## 1. App Architecture (The Five Pillars)

RPGlitch is a **Local-First Reactive Monolith** (PWA).

- **1. Core Engine**: Logic & Round Orchestration. **Pure IO**. No DOM manipulation.
- **2. UI & Structure**: HTML/Layouts via **Svelte 5** (`src/ui/`).
- **3. Sensory**: Visuals, Audio, Theme via Native CSS (`src/media/`).
- **4. Data**: Persistence & History via **Dexie.js** (IndexedDB).
- **5. Security**: Validation & Physics via **Zod/DOMPurify** sanitization boundaries.

**The Reactive Cycle (5-Step Loop)**
Every interaction follows a strict reactive loop propagated by Runes:

1. **Input** -> 2. **Sanity** (Security) -> 3. **Execution** (Core Engine) -> 4. **Persistence** (Data) -> 5. **Expression** (UI/Sensory).

## 2. Svelte 5 Sovereignty & Security

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Mandate**: Use Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`). State over DOM—NEVER read UI state from HTML elements.
- **Data Boundaries**: All data crossing boundaries MUST be validated using `Zod` or `Valibot`.
- **Sanitization**: Construct HTML deterministically. `DOMPurify` is strictly mandated for untrusted, external inputs before rendering via `{@html ...}`.

## 3. Platform Constraints (The Monolith)

- **Two-Panel Paradigm**: Logic operates strictly within the Perchance code-panel vs. output-panel architecture.
- **Persistence**: `Dexie.js` ONLY. Direct `localStorage` is forbidden due to iframe access limits.
- **Subject-Matter Sovereignty**: Logical, physical, and data operations for a specific domain MUST be consolidated into a single Sovereign Module (e.g., all memory logic goes in `NarrativeEcho.js`).
- **Audio Context**: Browsers block autoplay. NEVER instantiate audio without a direct user gesture. ALWAYS `.close()` or `.suspend()` on unmount.

## 4. The Chalk Regime (Visual Laws)

- **Native CSS Only**: No Tailwind. No Bootstrap. Rely on global CSS variables (`:root`).
- **Color Palettes**: NEVER use raw hex, `rgb()`, or `hsl()` in components. Use tokens mapped from `src/theme/tokens.css` (e.g., `var(--color-chalk)`). Avoid `#FFFFFF` and `#000000` directly.
- **Depth & Surface**: Use semi-transparent glass with background blurs (`blur-m` to `blur-xl`). Pixel borders are forbidden for depth; use "whisper-soft" `box-shadow` elevation.
- **Icons & Typography**: Inline SVG only. Headings must use Strong Sentence Case. Monospace for data/IDs.

## 5. File System & Nomenclature

Code must be predictably organized. Enforce the following casing strictly:

- **Directories & Logic Files**: `kebab-case` (e.g., `simulation-engine/`, `context-broker.js`).
- **Svelte Components**: `PascalCase` (e.g., `StoryPanel.svelte`).
- **Variables & Process State**: `snake_case` (e.g., `current_char`, `stress_level`).
- **Booleans (Question Form)**: `question_snake` (e.g., `is_active`, `has_token`, `can_render`).
- **Constants/Globals**: `SCREAMING_SNAKE` (e.g., `MAX_ENTROPY`).

## 6. The RPGlitch Lexicon & Localization

To prevent cognitive drift, these definitions are absolute.

- `Simulation` (NOT Director, Orchestrator)
- `DevMode` (NOT Debug Mode, God Mode, Cheat)
- `GameMaster` (NOT Storyteller)
- `StoryMode` (NOT Chat, Play Mode)
- `Storyboard` (NOT Lobby)
- `User Persona` (NOT Player)
- `AI Character` (NOT Bot, Actor)
- `Echo` (NOT Trace, Log Entry)
- `Fractal` (NOT World, Setting)
- **Localization**: Metric/SI only (meters, grams, Celsius). ISO 8601 (`YYYY-MM-DD`). 24-Hour Clock (`14:30`).

## 7. The Navigator Protocol

- **Relative Resolution**: Internal references MUST use relative paths (e.g., `[Tracks](../state/tracks.md)`).
- **Absolute Grounding**: Technical explanations MUST map to actual file paths and line numbers. Report ambiguity rather than inferring "likely" behavior.
