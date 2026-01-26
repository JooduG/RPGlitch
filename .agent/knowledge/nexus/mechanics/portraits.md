# Design Specification: Reactive Triptych Portraits

**Version:** 1.0
**Target App:** RPGlitch
**Objective:** Replace static character avatars with dynamic, emotive "Living Portraits" that react to the narrative's psychological state (Permeability) and chaos level (Entropy) without requiring multiple image generations.

---

## 1\. Core Concept

Instead of generating a single portrait, the system generates a **Character Contact Sheet** (Triptych) containing three distinct emotional states side-by-side in a single image.

The UI acts as a "Camera Viewport," sliding over this wide image to reveal only the specific face that matches the current dramatic moment. This guarantees 100% facial consistency while providing reactive visual feedback.

---

## 2\. Technical Constraints & Asset Pipeline

Due to platform limitations on the Perchance `text-to-image-plugin`, arbitrary resolutions are not supported. We must strictly adhere to the supported **Landscape** preset.

### 2.1 Resolution Standards

- **Generation Resolution:** `768px` (Width) x `512px` (Height)
- **Aspect Ratio:** 3:2 (Landscape)
- **Slice Dimensions (Viewport):** `256px` x `512px` (per panel)
- **Effective Portrait Ratio:** 1:2 (Tall/Vertical)

### 2.2 The "Three-State" Schema

The generated image is conceptually divided into three equal vertical zones:

| Zone       | X-Coordinates   | Semantic State         | Trigger Condition                   |
| :--------- | :-------------- | :--------------------- | :---------------------------------- |
| **Left**   | `0px - 256px`   | **Closed / Defensive** | Low Permeability (Hostile/Guarded)  |
| **Center** | `256px - 512px` | **Mask / Neutral**     | Default / Moderate Permeability     |
| **Right**  | `512px - 768px` | **Open / Vulnerable**  | High Permeability (Aroused/Shocked) |

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

---

## 3\. UI/UX Implementation (Frontend)

The visual implementation relies on a **Window/Strip** CSS architecture. This avoids complex Canvas manipulation in favor of performant GPU-accelerated CSS transforms.

### 3.1 CSS Architecture (`_component-cards.scss`)

- **`.portrait-viewport` (The Window):**
    - **Dimensions:** Fixed 1:2 aspect ratio (matches the 256x512 slice).
    - **Function:** Hides the "off-stage" parts of the image (`overflow: hidden`).
    - **Styling:** Acts as the character card frame with borders/shadows.

- **`.portrait-strip` (The Slider):**
    - **Dimensions:** Width `300%` (relative to viewport).
    - **Position:** Absolute positioning `top: 0, left: 0`.
    - **Function:** Holds the 768x512 image. Slides horizontally using `transform: translateX()`.
    - **Animation:** `transition: transform 0.5s cubic-bezier(...)` for "snappy" sliding effects.

### 3.2 Animation States

- **State: Neutral:** `translateX(-33.33%)` (Centers the middle panel).
- **State: Defensive:** `translateX(0%)` (Shows the left panel).
- **State: Vulnerable:** `translateX(-66.66%)` (Shows the right panel).
- **State: Glitch (High Entropy):** Adds a CSS `@keyframes` vibration animation (`translate(1px, -1px)`) and `filter: contrast(1.3)` to simulate visual overload/panic.

---

## 4\. Logic Controller (Middleware)

The **Visual Manager** acts as the bridge between the Simulation Engine (Physics) and the DOM.

### 4.1 Input Variables

The logic accepts the `physics` state object calculated by `engine-physics.js`:

- `permeability` (0-100): Emotional openness/dominance.
- `entropy` (0-100): Narrative chaos/instability.

### 4.2 State Mapping Logic (`manager-visuals.js`)

#### **Priority 1: Chaos Override**

- **IF** `entropy > 80`: Force **Glitch Mode**.
    - _Visual:_ Center Panel + Vibration Animation + Saturation Boost.
    - _Meaning:_ The character is overwhelmed or the reality is destabilizing.

#### **Priority 2: Emotional State (Standard Operation)**

- **IF** `permeability < 30`: **State: Defensive** (Left Panel).
    - _Context:_ Character is angry, resisting, or exerting dominance.
- **IF** `permeability > 70`: **State: Vulnerable** (Right Panel).
    - _Context:_ Character is shocked, aroused, submissive, or emotionally open.
- **ELSE**: **State: Mask** (Center Panel).
    - _Context:_ Default interaction, banter, confident facade.

---

## 5\. Integration Checklist

When ready to implement, follow this sequence:

1. **Update Generator (Left Panel):**
    - Modify `[output]` to force `{resolution: "768x512"}`.
    - Inject the "Triptych Template" into the prompt builder logic.

2. **Update Styles (SCSS):**
    - Add `.portrait-viewport` and `.portrait-strip` classes to `_component-cards.scss`.
    - Define the `glitch-vibrate` keyframes.

3. **Update Logic (JS):**
    - Implement `updatePortraitState(physics)` in `manager-visuals.js`.
    - Hook this function into the main game loop (`manager-turns.js`) inside the `onTurnComplete` event.

4. **Update DOM (HTML):**
    - Refactor the character card container to use the `<div class="portrait-viewport"><div class="portrait-strip">` structure instead of a simple `<img>`.

## 6. Ideas that work REALLY GOOD with the Triptych

_These concepts amplify the Triptych's strengths or handle things the Triptych can't do (like items/environment) without breaking consistency._

### **The "Entropy" Glitch / Hypno-Loop**

- **What:** The character portrait vibrates, shifts colors, or distorts visually when the narrative becomes chaotic, intense, or overwhelming.
- **Why:** It turns a static image into a "living" indicator of the scene's intensity. It creates visual stimulation ("goon trance") without needing to generate new images, which saves money/time and preserves facial consistency.
- **How:**
    - **CSS (`_component-cards.scss`):** Create a `.mode-glitch` class with a `@keyframes` animation that rapidly translates the image by 1-2px and applies `filter: contrast(1.3) hue-rotate(...)`.
    - **JS (`manager-visuals.js`):** In your physics loop, check if `entropy > 80`. If true, add the `.mode-glitch` class to the `.portrait-strip`.

### **The "Permeability" Strip-Tease**

- **What:** The character portrait starts blurred, pixelated, or shadowed and physically "clears up" or sharpens as the character opens up emotionally or becomes more submissive/vulnerable.
- **Why:** It gamifies the roleplay. The user feels they are "unlocking" the character through their actions. It creates a visual progression system that aligns perfectly with the Triptych's sliding mechanic.
- **How:**
    - **CSS:** Add a `filter: blur(10px) brightness(0.5)` to the `.portrait-viewport`. Use a CSS transition (`transition: filter 1s`) to make changes smooth.
    - **JS:** Map the `permeability` variable (0-100) to the blur amount. `element.style.filter = blur(${10 - (permeability / 10)}px)`. As permeability goes up, blur goes down.

### **The Diegetic Handout (The Evidence Table)**

- **What:** The AI generates small, isolated images of _objects_ (keys, weapons, devices) that appear in a separate "Inventory" or "Table" area, rather than inside the chat.
- **Why:** Objects don't have faces, so they don't break consistency with the Triptych. It grounds the story in physical reality ("Here is the keycard I found") without confusing the user about who the character is.
- **How:**
    - **Prompting:** Create a separate `[generateItem]` list in the Left Panel that prompts for `(object only), (transparent background), icon style`.
    - **UI:** Add an `<div id="evidence-tray">` to your `index.html` (perhaps below the portrait). When an item is generated, inject it there instead of the chat feed.

### **The "Mind's Eye" Overlay (Cinematic Strips)**

- **What:** Abstract, wide background images (rainy neon streets, dark forests) that fade in _behind_ specific chat messages to set the mood.
- **Why:** It provides atmospheric immersion without showing the character. Since the Triptych shows the _person_ and this shows the _vibe_, they complement each other perfectly.
- **How:**
    - **CSS:** Create a class `.msg-backdrop` with `position: absolute; z-index: -1; mask-image: linear-gradient(...)`.
    - **JS (`ui-render-chat.js`):** When rendering a message, if the AI tags a location change, generate a scenery image and append it as a background to that specific message block.

### **The Background Slide**

- **What:** The main wallpaper of the app (`#world-background`) slowly cross-fades to match the current location of the story.
- **Why:** It creates a sense of travel and scale. It frames the Triptych (the actor) against a changing stage (the set), just like a theatre production.
- **How:**
    - **HTML:** You already have `<div id="world-background">`.
    - **JS:** Use a "Double Buffering" technique. Create a new background div on top, load the new image, fade it in to opacity 1, then remove the old one underneath.

---

## 7. Ideas that work "OKAY" (Neutral / High Friction)

_These could work, but they might clutter the UI or require complex logic to prevent them from looking weird next to the Triptych._

### **The "Body Map" Targeting System**

- **What:** Clicking on the Triptych generates a "Macro Close-up" of a specific body part (lips, eyes, hands) that pops up temporarily.
- **Why:** It fits the erotic/gooning theme of focusing on details. However, the art style of the close-up might look different from the main portrait (e.g., skin texture differences), which can slightly break immersion.
- **How:**
    - **UI:** Place an invisible SVG grid over the `.portrait-viewport`.
    - **JS:** On click, detect the zone (e.g., "lips"). Trigger a generation for `(macro shot of lips), [character description]`. Display the result in a floating modal or tooltip.

### **The "Mind's Eye" Flash (Subliminal Cuts)**

- **What:** Images flash briefly over the entire screen (opacity 20%) during intense moments and then vanish.
- **Why:** It creates a dream-like intensity. However, flashing images over the Triptych might distract from its subtle sliding animations. It competes for the user's attention.
- **How:**
    - **CSS:** Create a full-screen overlay div with `pointer-events: none`.
    - **JS:** When `entropy` spikes, inject an image, set opacity to 0.3, then `setTimeout` to fade it out after 200ms.

### **The "Click to Reveal" (NSFW Spoiler)**

- **What:** The Triptych is heavily blurred or covered by a "Censored" block until the user clicks it.
- **Why:** It builds anticipation, but it's a "one-trick pony." Once clicked, it's just a normal image. It doesn't add ongoing value to the roleplay loop like the sliding faces do.
- **How:**
    - **CSS:** Add a `.censored` class with `filter: blur(20px)`.
    - **JS:** Add an `onclick` listener to the viewport that removes the `.censored` class.

---

## 8. Ideas that are STRAIGHT UP BAD with the Triptych

_These concepts fundamentally conflict with the Triptych's "One Image, Three States" architecture. Implementing them would actively ruin the consistency you are trying to build._

### **The "WhatsApp" Image Dump**

- **What:** The AI sends new "selfies" or photos inside the chat bubbles as part of the dialogue.
- **Why:** **Visual Contradiction.** The new selfie will inevitably look slightly different (different nose, lighting, hair) than the Triptych sitting right next to it. Seeing two "versions" of the character simultaneously destroys the illusion that the Triptych is the "real" person.
- **How:** You would insert `<img>` tags directly into the `chat-feed` div. **(Avoid this)**.

### **The "Paper Mario" Stage (Cutout Standees)**

- **What:** Generating full-body characters with transparent backgrounds and sliding them onto a "stage" area.
- **Why:** **Prompt Incompatibility.** The Triptych requires a "Grid/Panel" prompt layout. The Paper Mario approach requires a "Full Body, White Background" prompt. You cannot generate both in a single image. You would have to choose one system or the other; mixing them is visually messy and expensive.
- **How:** This would require an entirely different CSS architecture using absolute positioning in the `stage-center` column.

### **The "POV" Lens (Voyeur/Hands)**

- **What:** Overlaying images of hands reaching into the screen or looking through a camera viewfinder.
- **Why:** **Perspective Clash.** The Triptych is "Second Person" (You looking at Her). The POV Lens is "First Person" (You looking through Your eyes). Switching between these perspectives confuses the user's sense of self. Also, AI hands are notoriously bad/inconsistent.
- **How:** This would involve a fixed `z-index: 999` overlay image sitting on top of the entire UI.

### **The "Gallery" Tab**

- **What:** Automatically saving generated images to a hidden tab for later viewing.
- **Why:** **Hides the Mechanic.** The power of the Reactive Triptych is that it changes _now_, in front of your eyes. Shoving images into a gallery treats them as static artifacts rather than a living part of the UI. It encourages the user to leave the chat to look at pictures, breaking the "trance."
- **How:** This involves writing image URLs to an array in `state.gallery` and rendering a separate grid view in `ui-views.js`.
