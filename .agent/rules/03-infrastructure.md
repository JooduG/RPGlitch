---
trigger: always_on
description: Technical Supremacy. Svelte 5 Runes, The Chalk Regime and Perchance Platform Constraints.
---

# 🧪 Rule 03: Infrastructure (The Stack & The Law)

> **The Architect**: "I am the structural steel and power grid of the RPGlitch Engine. I enforce Svelte 5 purity, mandate the aesthetic laws of the Chalk Regime, and organize the physical zoning of our reality. Logic that violates this infrastructure is a breach of physics."

---

## 1. App Architecture

RPGlitch is a **Local-First Reactive Monolith** (PWA).

- **Core Engine**: Logic & Round Orchestration. **Pure IO**. No DOM manipulation.
- **UI & Structure**: HTML/Layouts via **Svelte 5** (`src/ui/`).
- **Sensory**: Visuals, Audio, Theme via Native CSS (`src/media/`).
- **Data**: Persistence & History via **Dexie.js** (IndexedDB).
- **Security**: Validation & Physics via **Zod/DOMPurify** sanitization boundaries.

**The Reactive Cycle (5-Step Loop)**
Every interaction follows a strict reactive loop propagated by Runes:

1. **Input** -> 2. **Sanity** (Security) -> 3. **Execution** (Core Engine) -> 4. **Persistence** (Data) -> 5. **Expression** (UI/Sensory).

---

## 2. Svelte 5 Sovereignty & Security

See [Svelte](../skills/svelte).

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Mandate**: Use Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`). State over DOM—NEVER read UI state from HTML elements.
- **Data Boundaries**: All data crossing boundaries MUST be validated using `Zod` or `Valibot`.
- **Sanitization**: Construct HTML deterministically. `DOMPurify` is strictly mandated for untrusted, external inputs before rendering via `{@html ...}`.

---

## 3. Perchance Constraints

- **Two-Panel Paradigm**: Logic operates strictly within the Perchance code-panel vs. output-panel architecture.
- **Persistence**: `Dexie.js` ONLY. Direct `localStorage` is forbidden due to iframe access limits.
- **Sovereign Modules**: Consolidate logical, physical, and data operations for a specific domain into a single module (e.g., all memory logic in `NarrativeEcho.js`).
- **Audio Context**: Native browser safety. NEVER instantiate audio without a direct user gesture to prevent autoplay blocking. ALWAYS `.close()` or `.suspend()` on unmount.

---

## 4. Visual Laws

See [DESIGN.md](../../design.md).

- **Native CSS Only**: No Tailwind. No Bootstrap. Rely on global CSS variables (`:root`).
- **Color Palettes**: NEVER use raw hex, `rgb()`, or `hsl()` in components. Use tokens mapped from `src/theme/tokens.css` (e.g., `var(--color-chalk)`). Avoid `#FFFFFF` and `#000000` directly.
- **Depth & Surface**: Use semi-transparent glass with background blurs (`blur-m` to `blur-xl`). Pixel borders are forbidden for depth; use "whisper-soft" `box-shadow` elevation.
- **Icons & Typography**: Inline SVG only. Headings must use Strong Sentence Case. Monospace for data/IDs.

---

## 5. The Implementation Loop

Once a plan is approved and grounded, execute using this atomic sequence:

1. **Task Tracking**: Ensure [agent-forge](../skills/agent-forge) has initialized Flat Tracks and the **Reasoning Block** (Risk/Abductive/Analysis Score) in [Tracks](../state/tracks/).
2. **Logic & Tools**: Wire up **Svelte 5 Runes**. When building Perchance Bridges, use `window.exposed` safely. Consolidate tools; do not proliferate narrow functions.
3. **Aesthetic Polish**: Apply **The Chalk Regime** from [DESIGN.md](../../design.md) CSS variables and UI layout rules.
4. **State Persistence**: Anchor dynamic state and memory structures.

---

## 6. The Navigator Protocol

- **Relative Resolution**: Internal references MUST use relative paths (e.g., `[Tracks](../state/tracks.md)`).
- **Absolute Grounding**: Technical explanations MUST map to actual file paths and line numbers.
- **Navigator Protocol**: Adhere to the **Context Protocol** defined in **[AGENTS.md](../../AGENTS.md)**.
