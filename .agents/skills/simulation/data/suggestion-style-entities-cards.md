# Suggestion: Composable Style Cards & Entity Architecture

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Sensory & Narrative State Architecture, Modular Presets  
> **Scope:** Refactoring Narrative/Visual Styles into Composable First-Class Entity Cards  

---

## 1. Executive Summary

Narrative styles (literary prose rhythms) and visual styles (diffusion prompt parameters) are currently handled as static configuration strings. This proposal defines the **Composable Style Cards Architecture**:
1. **Style Cards as First-Class Entities:** Elevating styles into modular cards stored in IndexedDB with custom prompts, sensory weights, and tokens.
2. **Dual-Stack Composition:** Allowing users and scenarios to pair a **Narrative Style Card** with a **Visual Style Card**.
3. **Dynamic Hot-Swapping:** Switching stylistic lenses mid-campaign without rewriting entity character sheets.

---

## 2. Schema & Structure for Style Cards

```javascript
/**
 * @typedef {Object} StyleCard
 * @property {string} id - Unique identifier (e.g., "style_noir_detective")
 * @property {"narrative" | "visual"} type - Card category
 * @property {string} name - Display title (e.g., "Neo-Noir Chiaroscuro")
 * @property {string} description - Brief summary of the aesthetic/rhythm
 * @property {string} prompt_payload - Injected prompt directive or diffusion tokens
 * @property {string} [negative_payload] - Banned terms or negative visual prompts
 * @property {string[]} [sensory_hierarchy] - Priority order (e.g., ["sight", "sound", "scent"])
 * @property {string} [accent_color] - UI theme accent associated with the style
 */
```

---

## 3. Narrative Style Cards vs. Visual Style Cards

### 3.1 Narrative Style Cards (Prose & Rhythm)
Injects voice-locked literary guidelines into the LLM system prompt:
- **"Gritty Realism" (Abercrombie):** Fatigue, cynicism, heavy physical friction.
- **"Cyberpunk Alienation" (Gibson):** Cold neon chiaroscuro, high jargon density, technical precision.
- **"Transactional Wit" (Austen):** Social leverage, sharp subtext, lexical irony.

### 3.2 Visual Style Cards (Diffusion Optics)
Appends photographic and rendering parameters to image generation calls:
- **"35mm Analog Film":** Grain, natural sodium lighting, soft focus falloff.
- **"Graphic Novel Ink":** Heavy ink outlines, high contrast cross-hatching, desaturated palette.

---

## 4. Dynamic Composition in Storyboard & Storymode

```text
┌───────────────────────────┐      ┌───────────────────────────┐
│   NARRATIVE STYLE CARD    │      │     VISUAL STYLE CARD     │
│    [Gibson Cyberpunk]     │  ──► │   [35mm Analog Noir]      │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              ▼                                  ▼
   [LLM Prose Generation]             [Diffusion Image Calls]
```

Users can drag-and-drop or hot-swap style cards from the Storyboard deck, enabling rapid genre shifts without modifying core character personalities.
