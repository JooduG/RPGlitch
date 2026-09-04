# Suggestion: Composable Style Entities (Dexie.js Style Cards)

> **Status:** Backlog Proposal  
> **Domain:** State Architecture, Persistence Layer & Storyboard UI  
> **Scope:** Dexie `styles` Store, `StyleCard` Schema, Hot-Swappable Storyboard Deck  

---

## 1. Core Thesis

Narrative prose presets (`NARRATIVE_STYLES`) and visual diffusion optics (`VISUAL_STYLES`) currently exist as hardcoded, static JavaScript dictionaries. 

Promoting styles to first-class, user-editable `StyleCard` entities stored in IndexedDB (Dexie.js) enables players to create custom aesthetics, fine-tune diffusion tokens, and hot-swap visual/narrative genres dynamically from the Storyboard deck without mutating character definitions.

---

## 2. Data Schema & Persistence

Add a dedicated `styles` table in `src/data/db.js`:

```javascript
/**
 * @typedef {Object} StyleCard
 * @property {string} id - Unique identifier (e.g., "style_cyberpunk_noir")
 * @property {"narrative" | "visual"} type - Category of the style
 * @property {string} name - Human-readable title
 * @property {string} description - Brief summary of aesthetic or prose tone
 * @property {string} prompt_payload - Injected prompt directive (LLM) or diffusion tokens (Image)
 * @property {string} [negative_payload] - Banned terms or negative visual prompt tokens
 * @property {string} [signature_color] - UI accent color associated with the card
 * @property {boolean} [is_premade] - Read-only flag for immutable system baselines
 * @property {number} updated_at - Timestamp of last modification
 */
```

### Database Migration (`src/data/db.js`)

```javascript
// Add styles table schema
styles: "id, type, name, updated_at"
```

---

## 3. Dynamic Composition & Storyboard Integration

```text
┌────────────────────────────────────────────────────────┐
│                   STORYBOARD DECK                      │
├───────────────────────────┬────────────────────────────┤
│   NARRATIVE STYLE CARD    │     VISUAL STYLE CARD      │
│    [Gibson Cyberpunk]     │     [35mm Analog Noir]     │
└─────────────┬─────────────┴─────────────┬──────────────┘
              │                           │
              ▼                           ▼
   [Intelligence Kernel]         [Image Synthesis]
    (LLM Prose Cadence)           (Diffusion Tokens)
```

1. **Active Session Binding**: `runtime.active_story.narrative_style_id` and `runtime.active_story.visual_style_id` reference Dexie records by id.
2. **Fallback Safety**: If a custom style card is deleted or missing, the engine gracefully falls back to default premades (`"standard"` narrative, `"cinematic"` visual).
3. **Export/Import Compatibility**: Style cards serialize cleanly within JSON story export bundles.
