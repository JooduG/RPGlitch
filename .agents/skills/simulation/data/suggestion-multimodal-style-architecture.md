# Suggestion: Sensory Media, Composable Style Entities & Platform Motion

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Sensory Layer, Generative Video, Modular Style Entities & Platform Integration  
> **Scope:** Composable Style Cards (Dexie), Text-to-Video Cinematic Motion, Declarative DSL Pools, `oc` Event Pipeline, Unified `<TypingDots />` Primitive  

---

## 1. Executive Summary

This specification formalizes sensory and platform architecture across three interconnected tiers:
1. **Composable Style Entities:** Elevating narrative prose presets and visual optics into first-class editable cards stored in IndexedDB.
2. **Generative Video Motion Logic:** Standardizing prompt syntax for camera movement modes and reference-frame delta motion.
3. **Platform Integration & Motion Primitives:** Left-Panel declarative DSL loot pools, the `oc` OpenCharacter event bridge, and a consolidated `<TypingDots />` primitive.

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

## 3. Text-to-Video Cinematic Motion Directives

Structure all video generation prompts using this standardized format:

```text
[Camera Movement]: [Establishing Scene Action]. [Environmental Physics & Secondary Motion].
```

### Camera Movement Modes

| Movement Mode | Pacing & Tension | Best Suited Scenarios |
| :--- | :--- | :--- |
| **`Handheld Tracking`** | Fast, reactive, physical shake, ground-level perspective. | Action sequences, physical escapes, sudden panic, high `chaos`. |
| **`Slow Dolly / Push-In`** | Measured, creeping approach toward subject's face/hands. | Intimate dialogue, high `intensity` confrontations, revelations. |
| **`Floating Drone / Crane`** | Smooth, sweeping aerial movement establishing scale. | Fractal scene transitions, prologue establishers, epilogues. |
| **`Static Locked-Off`** | Zero camera translation; only internal subject motion. | Deliberate tension, surveillance perspectives, frozen confrontations. |

### Reference-Frame Delta Motion Prompting
When animating an existing generated frame, describe **only motion, particle, and lighting changes** without re-describing static clothing or facial features.

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

---

## 6. The Unified `<TypingDots />` Primitive & Dead Code Cleanup

### Component Specification (`src/ui/primitives/TypingDots.svelte`)

```svelte
<script>
  /**
   * Unified Loading / Busy Dots Primitive
   * @type {{ size?: 'sm' | 'md' | 'lg', color?: string, class?: string }}
   */
  let { size = 'md', color = 'bg-(--signature-color,white)', class: extra_class = '' } = $props();

  const size_map = {
    sm: 'h-1.5 w-1.5 gap-1',
    md: 'h-2 w-2 gap-1.5',
    lg: 'h-3 w-3 gap-2'
  };
</script>

<div class="flex items-center justify-center {size_map[size]} {extra_class}" role="status" aria-label="Loading">
  <span class="{size_map[size].split(' ')[0]} {size_map[size].split(' ')[1]} {color} rounded-full animate-pulse motion-reduce:animate-none"></span>
  <span class="{size_map[size].split(' ')[0]} {size_map[size].split(' ')[1]} {color} rounded-full animate-pulse [animation-delay:150ms] motion-reduce:animate-none"></span>
  <span class="{size_map[size].split(' ')[0]} {size_map[size].split(' ')[1]} {color} rounded-full animate-pulse [animation-delay:300ms] motion-reduce:animate-none"></span>
</div>
```

### Consolidation & Cleanup Targets
1. Replace 4 hardcoded inline pulsing-dot implementations in `Body.svelte:88-102`, `Attachments.svelte:87-92`, `ImagePicker.svelte:153-159`, and `StorymodeBar.svelte:145-154`.
2. Delete dead `@keyframes scan` in `src/ui/message/Message.svelte:607-615`.
3. Delete unused `@keyframes blink` in `src/ui/message/Typewriter.svelte`.
4. Add `motion-reduce:animate-none` across all pulsing/shimmer keyframes for WCAG accessibility.
