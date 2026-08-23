# Suggestion: Sensory Media, Composable Style Entities & Photographic Framing

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Sensory Layer, Image Generation Optics, Modular Style Entities & Platform Integration  
> **Scope:** Composable Style Cards (Dexie), Cinematic Framing Optics for Image Synthesis, Declarative DSL Pools, `oc` Event Pipeline  

---

## 1. Executive Summary

This specification formalizes sensory and platform architecture across three interconnected tiers:
1. **Composable Style Entities:** Elevating narrative prose presets and visual optics into first-class editable cards stored in IndexedDB.
2. **Cinematic Framing & Perspective Optics:** Standardizing photographic perspective directives and scene delta framing for image synthesis.
3. **Platform Integration:** Left-Panel declarative DSL loot pools and the `oc` OpenCharacter event bridge.

---

## 2. Composable Style Cards as First-Class Entities

Instead of static JS configuration dictionaries, narrative and visual styles become editable, saveable, and hot-swappable records in Dexie.js:

```javascript
/**
 * @typedef {Object} StyleCard
 * @property {string} id - Unique identifier (e.g., "style_cyberpunk_neon")
 * @property {"narrative" | "visual"} type - Card category
 * @property {string} name - Display title (e.g., "Neo-Noir Chiaroscuro")
 * @property {string} description - Summary of aesthetic or prose cadence
 * @property {string} prompt_payload - Injected prompt directive or diffusion tokens
 * @property {string} [negative_payload] - Banned terms or negative visual prompts
 * @property {string[]} [sensory_hierarchy] - Priority order (e.g., ["sight", "sound", "touch"])
 * @property {string} [accent_color] - UI theme accent associated with the style
 */
```

### Dynamic Composition in Storyboard & Storymode

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

---

## 3. Cinematic Framing & Perspective Optics for Image Synthesis

Standardize photographic framing modes in `image-prompts.js` to dynamically calibrate camera perspective against scene intensity and role:

```text
[Camera Perspective / Framing], [Subject Physical State & Expression], [Atmospheric Lighting & Environment Physics], [Style Optics Tokens]
```

### Photographic Framing Modes

| Framing Mode | Camera Perspective & Scale | Best Suited Narrative Scenarios |
| :--- | :--- | :--- |
| **`Intimate Close-Up`** | Tight facial crop, shallow depth of field, sharp focus on eyes/expression. | High `intensity`, intimate dialogue, secret reveals, emotional breaks. |
| **`Medium Action / Torso`** | Waist-up framing capturing hands, stance, wardrobe details, and immediate props. | Dialogue beats, physical interaction, tension, inventory usage. |
| **`Wide Environmental`** | Full silhouette in deep architectural space, sweeping environmental scale. | Prologues, fractal transitions, world exploration, epilogues. |
| **`Dutch / Low-Angle`** | Tilted horizon or steep upward angle emphasizing scale, imposition, and disorientation. | High `chaos`, combat encounters, physical danger, impending collapse. |

### Scene Delta Prompting
When generating sequential image turns of the same entity or setting, keep baseline physical identity (`eternal.physical`) consistent and inject **only state deltas**: active expressions, clothing damage/alterations (`present.physical`), lighting shifts, and immediate environmental hazards.

---

## 4. Declarative Logic DSL & Consumable Lists

Native Left-Panel syntax for procedural weighted encounters and non-repeating loot generation:

```yaml
# Master NPC Encounter Selector with Probability Weights
npc_encounter
  veteran_scout ^2.5
  corrupted_alchemist ^1.0
  wandering_merchant ^0.5

# Stateful Consumable Inventory (guarantees no duplicate selections in a single pass)
loot_pool
  consumableList = true
  damaged_gas_mask
  oxidized_scalpel
  empty_canteen
  field_dressing
```

---

## 5. The `oc` API & Event-Driven Message Pipeline

For native Perchance OpenCharacter chat environments:

```javascript
// 1. Thread Event Interception (Runs after an AI message completes generation)
oc.thread.on("MessageAdded", async ({ message }) => {
  if (message.author === "ai" && message.content.includes("STATE: Hyper-Vigilant")) {
    oc.character.customData.stressLevel = Math.min(100, (oc.character.customData.stressLevel || 0) + 15);
  }
});

// 2. The Message Rendering Pipeline (Converts raw context into interactive UI action chips)
oc.thread.messageRenderingPipeline.push(({ message, reader }) => {
  if (reader === "user") {
    return DOMPurify.sanitize(
      message.content.replace(/\[\[(.*?)\]\]/g, (match, action) => {
        return `<button class="action-btn" onclick="executeUIAction('${encodeURIComponent(action)}')">${action}</button>`;
      }),
    );
  }
  return message.content;
});

// 3. UI Action Dispatcher Bridge
window.executeUIAction = function (encodedAction) {
  const action = decodeURIComponent(encodedAction);
  oc.thread.messages.push({
    author: "user",
    content: `[ACTION TAKEN: ${action}]`,
  });
};
```
