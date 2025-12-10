# Design Specification: Reactive Triptych Portraits

**Version:** 1.0
**Target App:** RPGlitch
**Objective:** Replace static character avatars with dynamic, emotive "Living Portraits" that react to the narrative's psychological state (Permeability) and chaos level (Entropy) without requiring multiple image generations.

-----

## 1\. Core Concept

Instead of generating a single portrait, the system generates a **Character Contact Sheet** (Triptych) containing three distinct emotional states side-by-side in a single image.

The UI acts as a "Camera Viewport," sliding over this wide image to reveal only the specific face that matches the current dramatic moment. This guarantees 100% facial consistency while providing reactive visual feedback.

-----

## 2\. Technical Constraints & Asset Pipeline

Due to platform limitations on the Perchance `text-to-image-plugin`, arbitrary resolutions are not supported. We must strictly adhere to the supported **Landscape** preset.

### 2.1 Resolution Standards

* **Generation Resolution:** `768px` (Width) x `512px` (Height)
* **Aspect Ratio:** 3:2 (Landscape)
* **Slice Dimensions (Viewport):** `256px` x `512px` (per panel)
* **Effective Portrait Ratio:** 1:2 (Tall/Vertical)

### 2.2 The "Three-State" Schema

The generated image is conceptually divided into three equal vertical zones:

| Zone | X-Coordinates | Semantic State | Trigger Condition |
| :--- | :--- | :--- | :--- |
| **Left** | `0px - 256px` | **Closed / Defensive** | Low Permeability (Hostile/Guarded) |
| **Center** | `256px - 512px` | **Mask / Neutral** | Default / Moderate Permeability |
| **Right** | `512px - 768px` | **Open / Vulnerable** | High Permeability (Aroused/Shocked) |

### 2.3 Prompt Engineering Strategy

The generation prompt **MUST** use the `BREAK` syntax to enforce separation and `(SAME CHARACTER)` to enforce consistency.

**Template:**

```text
(triptych:1.3), (three vertical panels), (split screen layout), (landscape orientation:1.2), (distinct panel borders)

// GLOBAL CONSISTENCY (Applied First)
(SAME CHARACTER IN ALL PANELS), [Character Description], [Outfit], [Art Style]

BREAK

// LEFT PANEL (Closed)
(angry/defensive expression), looking away, crossed arms, shadowed lighting, [Background A]

BREAK

// CENTER PANEL (Mask)
(confident/smug expression), looking at viewer, charming smile, hero lighting, [Background B]

BREAK

// RIGHT PANEL (Open)
(aroused/shocked expression), blushing, sweating, mouth open, messy hair, high key lighting, [Background C]
```

-----

## 3\. UI/UX Implementation (Frontend)

The visual implementation relies on a **Window/Strip** CSS architecture. This avoids complex Canvas manipulation in favor of performant GPU-accelerated CSS transforms.

### 3.1 CSS Architecture (`_component-cards.scss`)

* **`.portrait-viewport` (The Window):**

  * **Dimensions:** Fixed 1:2 aspect ratio (matches the 256x512 slice).
  * **Function:** Hides the "off-stage" parts of the image (`overflow: hidden`).
  * **Styling:** Acts as the character card frame with borders/shadows.

* **`.portrait-strip` (The Slider):**

  * **Dimensions:** Width `300%` (relative to viewport).
  * **Position:** Absolute positioning `top: 0, left: 0`.
  * **Function:** Holds the 768x512 image. Slides horizontally using `transform: translateX()`.
  * **Animation:** `transition: transform 0.5s cubic-bezier(...)` for "snappy" sliding effects.

### 3.2 Animation States

* **State: Neutral:** `translateX(-33.33%)` (Centers the middle panel).
* **State: Defensive:** `translateX(0%)` (Shows the left panel).
* **State: Vulnerable:** `translateX(-66.66%)` (Shows the right panel).
* **State: Glitch (High Entropy):** Adds a CSS `@keyframes` vibration animation (`translate(1px, -1px)`) and `filter: contrast(1.3)` to simulate visual overload/panic.

-----

## 4\. Logic Controller (Middleware)

The **Visual Manager** acts as the bridge between the Simulation Engine (Physics) and the DOM.

### 4.1 Input Variables

The logic accepts the `physics` state object calculated by `engine-physics.js`:

* `permeability` (0-100): Emotional openness/dominance.
* `entropy` (0-100): Narrative chaos/instability.

### 4.2 State Mapping Logic (`manager-visuals.js`)

#### **Priority 1: Chaos Override**

* **IF** `entropy > 80`: Force **Glitch Mode**.
  * *Visual:* Center Panel + Vibration Animation + Saturation Boost.
  * *Meaning:* The character is overwhelmed or the reality is destabilizing.

#### **Priority 2: Emotional State (Standard Operation)**

* **IF** `permeability < 30`: **State: Defensive** (Left Panel).
  * *Context:* Character is angry, resisting, or exerting dominance.
* **IF** `permeability > 70`: **State: Vulnerable** (Right Panel).
  * *Context:* Character is shocked, aroused, submissive, or emotionally open.
* **ELSE**: **State: Mask** (Center Panel).
  * *Context:* Default interaction, banter, confident facade.

-----

## 5\. Integration Checklist

When ready to implement, follow this sequence:

1. **Update Generator (Left Panel):**

      * Modify `[output]` to force `{resolution: "768x512"}`.
      * Inject the "Triptych Template" into the prompt builder logic.

2. **Update Styles (SCSS):**

      * Add `.portrait-viewport` and `.portrait-strip` classes to `_component-cards.scss`.
      * Define the `glitch-vibrate` keyframes.

3. **Update Logic (JS):**

      * Implement `updatePortraitState(physics)` in `manager-visuals.js`.
      * Hook this function into the main game loop (`manager-turns.js`) inside the `onTurnComplete` event.

4. **Update DOM (HTML):**

      * Refactor the character card container to use the `<div class="portrait-viewport"><div class="portrait-strip">` structure instead of a simple `<img>`.
