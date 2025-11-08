# **🎨 Project Design System & UI Protocol**

Version 3.2.0 | Updated 2025-10-28

**CORE PRINCIPLE:** This document is the **single source of truth** for the visual and interaction design of all applications in this repository. It defines our philosophy, our styling foundation (Pico.css), our custom component library, and our user experience patterns. All UI/UX development **MUST** adhere to these guidelines.

**Related Docs:** See [README.md](./README.md) for architecture overview, [PERCHANCE.md](./PERCHANCE.md) for deployment workflow, and [GEMINI.md](./GEMINI.md) for coding standards.

## **Core Philosophy: The Vibe Check**

Our design philosophy is built on a foundation of minimalism, clarity, and robustness.

* **Clarity Over Cleverness:** The user should never have to guess. Functionality must be explicit and unambiguous.
* **Minimalism with Purpose:** Every visual element must serve a purpose. We remove the unnecessary to give power to the essential.
* **Consistency is Queen:** Similar elements must look and behave similarly across all applications. This builds trust and reduces cognitive load.
* **Accessibility by Design:** Our interfaces must be usable and accessible to everyone. This is a non-negotiable baseline.

### **Terminology**

*   **Entity vs. Item:** In the context of this project, "Entity" is the canonical term for our core data objects: Stories, Characters, and Worlds. You will see "Item" used in the codebase, particularly in relation to generic functions that handle these objects. Consider "Item" to be a developer-facing synonym for "Entity" in most cases.

---

## **Interaction & UX Principles**

### **The Icon-Free Mandate (Non-Negotiable)**

In this project, all interactive UI elements (buttons, links, navigation) **MUST** primarily convey their meaning through explicit and concise **text labels**.

* **DIRECTIVE:** **DO NOT** create UI elements that rely solely on icons to convey function.
* **DIRECTIVE:** **MAY** use icons (or emojis) as a visual embellishment, but they **MUST** be paired directly alongside a clear text label. (e.g., `Save All Data 💾`). Placeholder images in non-interactive cards are acceptable.
* **RATIONALE:** Text labels ensure universal understanding, support our minimalist aesthetic, and align with user preferences for explicit, unambiguous controls.

#### **Examples**

* ❌ **Bad:** `<button><img src="save.svg"></button>` *(Ambiguous)*
* ✅ **Good:** `<button>Save</button>` *(Clear and direct)*
* ✅ **Good:** `<button id="emergency-export">Save All Data &#128190;</button>` *(Icon as secondary indicator)*

### **General UX Patterns**

* **Progressive Disclosure:** Show essential information first; reveal details and advanced options on demand.
* **Immediate Feedback:** Every user action should provide immediate visual feedback (e.g., hover states, loading indicators).
* **Cancellable Actions:** All long-running AI actions **MUST** be cancellable.
* **Responsive & Touch-Friendly:** All layouts and controls must be fully responsive and provide adequate touch targets for mobile users.

---

## **The Visual System (The "Look")**

Our visual language is built on the **Pico.css** framework, extended with a custom, purposeful design layer. All base typography, primary accent colors, and foundational element styling are inherited directly from Pico.css.

### **Color System**

Our visual language is built on the **Pico.css** framework. All base typography, primary accent colors, and foundational element styling are inherited directly from Pico.css.

* **⬛ Background (Global):** A fixed, 4-stop linear gradient is used across all applications.
    * `$gradient-color-1: #181c2f`
    * `$gradient-color-2: #23243a`
    * `$gradient-color-3: #1a3a4a`
    * `$gradient-color-4: #2a1a3a`
* **⚪ Text:** Standard text color is inherited from Pico.css (`--pico-color`).
* **🎨 Signature Colors:** We use a set of predefined signature colors to provide visual variety and entity identity.
    * **Pink:** `--signature: #ec4899`
    * **Emerald:** `--signature: #10b981`
    * **Cyan:** `--signature: #06b6d4`
    * **Orange:** `--signature: #f97316`
    * **Purple:** `--signature: #a855f7`

### **Typography**

* **Font Family:** Inherited from Pico.css (system font stack).
* **Font Sizes:** Inherited from Pico.css.
* **Font Weights:** Inherited from Pico.css.
* **Line Heights:** Inherited from Pico.css.

### **Spacing**

* **Base Unit:** `1rem` (16px).
* **Scale:** All major layout margins, paddings, and gaps (e.g., `.top-bar`, `.chin-grid`, `.output-area`) **MUST** use the `1rem` unit for a consistent rhythm.
* **Radius:** A secondary unit of `0.5rem` (8px) is used for border-radius on most elements, defined via `--pico-radius` (inherited from Pico.css).

---

## The Perchance Application Common Components

### **Buttons**

* **Style:** Buttons follow Pico.css standards (`.primary`, `.secondary`, `.danger`).
* **Rule:** **MUST** follow the **Icon-Free Mandate**.

### **Modals**

* **Style:** Modals (dialogs) follow Pico.css standards.
* **Components:**
    * **Loading Modal:** A modal that displays a loading message.
    * **Emergency Modal:** A modal that displays an error message and provides options to save or delete data.

### **Tags**

* **Style:** Tags are displayed as pills with a background color and rounded corners.

## **RPGlitch Component Library**

This section defines our custom components, built on top of Pico.css.

### **Cards (Storyboard & Chin)**

* **Structure:** Use semantic HTML (`<article>`, `<header>`, `<footer>`) as seen in `#chin-card-template` and `.storyboard-card`.
* **Layout:** Cards are responsive and use flexbox or grid for layout.
* **Style:** Adhere to the project's color palette and spacing rules, with `overflow: hidden` for clean visual boundaries.

### **The "Chin" Component**

The "Chin" is the signature slide-out panel for entity selection (Stories, Characters, Worlds) and options in RPGlitch.

* **Layout:** Constrained to the main app container width (`#chin-container`). It sits in a dedicated container, and its visibility is toggled by JS.
* **UX:**
    * Top-bar tab buttons (`#tab-stories`, etc.) toggle their corresponding chin panel (`#chin-stories`).
    * Pressing ESC or clicking the backdrop (`#chin-backdrop`) closes any open chin. (Note: Chin panels **do not** have their own "Close" button; closure is handled by these "click-outside" and ESC key actions.)

### **Forms**

* **Style:** Forms follow Pico.css standards.
* **Components:**
    * **Search Input:** A custom-styled search input with a search icon.
    * **Profile Fields:** Custom-styled fields for the profile view.

### **Pictures**

* **Style:** Pictures are displayed in a container with a 1:1 aspect ratio.
* **Placeholders:** Placeholder images are used when no image is available.

### **Profiles**

* **Layout:** A two-column layout with the character/world image on the left and the details on the right.
* **Style:** The profile view uses the signature color of the character/world.

### **Dynamic Profile Image Input** ✅ **Implemented**

A context-aware image input component that provides three methods for setting entity profile images:

## **Design Specification: Dynamic Profile Image Input** ✅

**Status:** ✅ Fully Implemented (2025-11-06)
**Location:** `apps/rpglitch/js/views.js:284-436`

### Feature Overview

**Description:**
A context-aware image input component with three image-setting methods from a single field.

**Feature Capabilities:**
Users can set entity profile pictures in three ways from a single input field:
1.  **Paste** a direct image URL.
2.  **Generate** a new image using an AI text-to-image prompt.
3.  **Upload** an image file from their local device.

**Implementation Details:**
* Implemented in `renderProfilePage(type, id)`
* Located in the Edit Mode overlay (`.profile-hero-overlay`)


### UI Components

The feature consists of a single grouped component created dynamically within `renderProfilePage`:

* **`<fieldset role="group">`:** A Pico.css `fieldset` to visually group the input and button.
* **`imageInput` (`<input type="text">`):**
    * Serves as the single field for all three user actions.
    * `type` is set to `text` (from `url`) to allow non-URL prompt text.
    * `name` is `"imageUrl"` to be correctly picked up by the `saveHandler`.
    * `placeholder` is set to: `"Type prompt, paste URL, or click to upload..."`
* **`actionButton` (`<button type="button">`):**
    * A single button whose text and function change dynamically based on the content of `imageInput`.

### State Management: Context-Aware Button Logic

The core of the feature is an `input` event listener attached to `imageInput` that calls an `updateButtonState()` function on every keystroke. This function transitions the `actionButton` between three states.

A helper utility `isUrl(text)` is used to check for strings beginning with `http://`, `https://`, or `data:image/`.

* **State 1: Empty Field**
    * **Condition:** `imageInput.value.trim() === ""`
    * **Button Text:** "Upload"
    * **Button Action:** `actionButton.dataset.action = "upload"`

* **State 2: Prompt Text**
    * **Condition:** `imageInput.value.trim() !== ""` AND `!isUrl(imageInput.value)`
    * **Button Text:** "Generate"
    * **Button Action:** `actionButton.dataset.action = "generate"`

* **State 3: URL Text**
    * **Condition:** `isUrl(imageInput.value)`
    * **Button Text:** "Upload" (Serves as the default fallback action, as the URL preview updates automatically on the `change` event).
    * **Button Action:** `actionButton.dataset.action = "upload"`

### Data Flow & Event Logic

The system is designed to funnel all three user actions into a single data flow: **populating `imageInput.value` with a valid URL and dispatching a `change` event.**

#### Flow A: AI Generation (User Clicks "Generate")

1.  The `actionButton` `click` listener fires. It reads `data-action="generate"`.
2.  **Loading State:** The button and input are disabled and set to `aria-busy="true"`.
3.  The function calls `await window.pluginTextToImage({ prompt: imageInput.value })`.
4.  **On Success:** The listener handles dual response formats - either `data.dataUrl` (direct) or `data.imageId` + `data.fileExtension` (constructed URL).
5.  A new URL is constructed: `https://img.perchance.org/${data.imageId}.${data.fileExtension || 'jpeg'}`.
6.  This URL string is set as the new `imageInput.value`.
7.  A `new Event('change')` is programmatically dispatched on `imageInput`.
8.  The *existing* `change` listener on `imageInput` fires, calling `getPictureHTML` and updating the hero image preview.
9.  The `finally` block removes the loading state and calls `updateButtonState()`, which now sets the button to "Upload" (since the field contains a URL).

#### Flow B: File Upload (User Clicks "Upload")

1.  The `actionButton` `click` listener fires. It reads `data-action="upload"`.
2.  **Loading State:** The button and input are disabled and set to `aria-busy="true"`.
3.  The function calls `await window.pluginUpload({ accept: 'image/*' })` with proper MIME type filter.
4.  **On Success:** The listener expects a successful response object containing `data.url` (e.g., `https://user.uploads.dev/...`).
5.  A check is performed to ensure the `data.url` is for an image file.
6.  This URL string is set as the new `imageInput.value`.
7.  A `new Event('change')` is dispatched, updating the preview.
8.  The `finally` block removes the loading state and updates the button.

#### Flow C: URL Paste (User Pastes URL)

1.  The user pastes a URL into `imageInput` and clicks away, firing the browser's native `change` event.
2.  The *existing* `change` listener on `imageInput` fires.
3.  `getPictureHTML` is called and the hero image preview updates.
4.  This flow requires no new logic; it is the baseline behavior.

#### Flow D: Entity Save (User Clicks Top-Bar "Save")

1.  The `saveBtn` `click` listener in the top bar fires its `saveHandler`.
2.  The `saveHandler` constructs its `data` object by reading the image URL directly from the `imageInput` variable: `imageUrl: escapeHtml(imageInput.value.trim())`.
3.  The handler does not use `form.elements.imageUrl.value` since `imageInput` is not a child of the main `<form>` element.
4.  This approach ensures the `imageUrl` and all other form fields are saved correctly.

### Dependencies

* **Perchance Plugins (Left Panel):**
    * `pluginTextToImage`: Exposed to `window.pluginTextToImage`
    * `pluginUpload`: Exposed to `window.pluginUpload`
* **Internal Functions (Right Panel):**
    * `getPictureHTML()` (from `entities.js`): Updates the image preview
    * `applyBrand()` (from `utils.js`): Updates the signature color preview

### Error Handling

* Both the "Upload" and "Generate" actions are wrapped in a `try...catch...finally` block.
* **On `catch`:** Any error (e.g., plugin failure, non-image upload, `invalid_data_type`) is caught, logged to the console, and presented to the user via a `window.alert()`.
* **On `finally`:** The loading state (`aria-busy`, `disabled`) is *always* removed from `actionButton` and `imageInput`. This is a critical safety measure to prevent the user from being soft-locked in a loading state if an API call fails.

### **Storyboard**

* **Layout:** A three-column grid with cards for the AI character, the user character, and the world.
* **Style:** The storyboard cards are styled to be easily distinguishable from each other.

### **The "Chat View" Component**

This section defines the main user interaction screen (`#chat-screen-container`) which becomes visible after a story begins.

* **Layout:**
    * **Wide Screens (e.g., Desktop):** A **three-column layout**.
        * Left Column: Displays AI character avatar/picture.
        * Center Column (Main): Contains the `#chat-feed` and `#chat-form`.
        * Right Column: Displays User character avatar/picture.
    * **Narrow Screens (e.g., Mobile):** Collapses to a **single-column layout**. Character avatars might be integrated directly into the chat feed messages or a compact header.
* **Components:**
    * **`#chat-feed`:** The main log for messages. Messages **MUST** have distinct styling for messages attributed to the `user` and the `assistant` (AI).
        * **Note on `role` attribute:** We use `role="user"` and `role="assistant"` attributes on message elements. This is a standard convention in chat interfaces and aligns with how many LLM APIs structure conversation history. `assistant` simply denotes the message originated from the AI persona in the current chat.
    * **`#chat-form`:** The footer component containing the text input and "Send" button. The "Send" button's state **MUST** be bound to the Chat FSM (e.g., disabled when `fsm: "streaming"`).
    * **`#typing-indicator`:** A dedicated element (as seen in `index.html`) that **MUST** be shown when the FSM is in the `streaming` or `sending` state.
    * **`#conclude-story`:** A button allowing the user to end the current story. **(Note:** The exact behavior of "concluding" a story needs further definition - e.g., saving a summary, returning to storyboard, locking the thread).

## ImageGlitch Component Library

### Refine (Internal Name: `scribe`)

* **Persona:** The "Holistic Prompt Architect"
* **Core Goal:** To act as an expert assistant that intelligently **improves a user's prompt**. This is a **convergent** process, designed to take a simple idea and make it "better" by holistically filling in descriptive gaps.

#### AI Process Steps:

1.  **Receive:** The AI receives the user's base prompt (e.g., "a knight").
2.  **Analyze:** It deconstructs the prompt into its core elements, identifying the `Subject & Setting`.
3.  **Categorize:** It compares the user's prompt against a predefined list of creative categories:
    * `Artistic Style`
    * `Composition & Camera Perspective`
    * `Lighting`
    * `Color Palette`
    * `Mood & Atmosphere`
    * `Technical Details`
    * `Other Additional Elements`
4.  **Identify Gaps:** It determines which of these categories are "lacking... vague, or missing" (i.e., not addressed by the user's base prompt).
5.  **Holistic Selection:** For each identified "gap," the AI intelligently selects the *most suitable* and *thematically consistent* term from the corresponding internal list. For example, for "a knight," it would choose "fantasy realism" over "cyberpunk" for the `Artistic Style` category.
6.  **Preserve Intent:** It is instructed to keep the user's original `Subject & Setting` as the master vision.
7.  **Enhance:** It automatically injects a selection of baseline quality-enhancing keywords (e.g., `masterpiece`, `8K`, `cinematic`) from the `aiCoreQuality` and `aiFlavorEnhancers` lists.
8.  **Synthesize:** It combines the user's original prompt, the new holistically-selected terms, and the quality keywords into a single, cohesive, comma-separated string.
9.  **Return:** It returns *only* this new, refined prompt string.

### Embrace the Chaos (Internal Name: `chaos`)

* **Persona:** The "Mad Prompt Scientist"
* **Core Goal:** To provide creative **serendipity and mutation**. This is a **divergent** process, designed to take a user's prompt and spark new, unexpected ideas by introducing random elements.

#### AI Process Steps:

1.  **Receive:** The AI receives the user's base prompt.
2.  **Handle Empty Case:** If the user's prompt is empty, the AI generates a *completely new* random prompt by selecting one or more terms for every single creative category.
3.  **Analyze (if prompt exists):** It deconstructs the prompt and identifies which creative categories are "sufficiently described" and which are "lacking".
4.  **Fill Gaps:** It fills any "lacking" categories by selecting a **random** keyword from the corresponding internal list.
5.  **The "Chaos Twist":** The AI is instructed to *always* "replace (reroll) at least one category with a new random keyword... even if the user has described it well". This is the key mutation step.
6.  **Enhance:** It auto-injects a small, *random* set of quality-enhancing keywords.
7.  **Synthesize:** It combines the (potentially modified) user prompt, the new random terms, and the chaos-injected keywords into a new, mutated, and cohesive prompt.
8.  **Return:** It returns *only* this new, mutated prompt string.

### Transfigure (Internal Name: `transfigure`)

* **Persona:** The "Prompt Modification Specialist"
* **Core Goal:** To provide precise, **user-directed modification** of a prompt. It takes two inputs—the current prompt and a set of natural language instructions—and surgically alters the prompt to match the instructions.

#### AI Process Steps:

1.  **Receive Two Inputs:**
    * **Input A:** The "Base Prompt" (e.g., "a beautiful red car").
    * **Input B:** The "Instruction" (e.g., "make the car blue and add a spoiler").
2.  **Analyze:** The AI is instructed to treat Input A as the text to be edited and Input B as a list of commands.
3.  **Execute Modification:** It surgically modifies the Base Prompt *exactly* as described by the Instruction.
4.  **Handle Negation:** It is specifically instructed to convert any negative phrasing (e.g., "no hats," "not red") into 100% affirmative descriptions (e.g., "a car without a spoiler," "a blue car").
5.  **Return:** It returns *only* the new, surgically-modified prompt string.

---

## **UI Safety & Hardening (RPGlitch Implementation)**

To ensure the application remains interactive and robust, especially within the Perchance iframe environment, RPGlitch implements a suite of safety features (typically in `App.js` or `index.js`).

* **Overlay Guard (e.g., `App.dismissLoadingUI()`):** A master function to clear any lingering UI blockers. It closes loading modals, removes `[aria-busy]`, hides non-open dialogs, and restores pointer-events.
* **UI Watchdog (e.g., `App.startUIWatchdog()`):** A polling mechanism that runs to detect stuck UI states (e.g., `dialog[open]`, `inert`) and automatically calls the Overlay Guard to heal the interface.
* **Recovery Hooks (e.g., `App.installUIRecoveryHooks()`):** The UI self-heals on common browser events like `focus`, `visibilitychange`, and `pageshow`.
* **Attribute Observer:** May be used to instantly strip any newly added `inert` or `pointer-events: none` attributes on root-level containers to prevent external scripts from locking the UI.

---

## **✅ Completed Visual Polish: "Signature Vibe Foundation"**

**Status:** ✅ 95% Implemented (2025-10-28)
**Location:** `apps/rpglitch/scss/`

This 4-phase visual overhaul has been completed. The sections below document the implemented features for reference.

### Phase 1: Signature Vibe Foundation ✅
Established high-contrast, professionally branded visual identity with:
* **High-Contrast & Balance** - Adjusted `[data-theme="dark"]` variables for clear separation between background, panels, and text (`_foundation.scss`, `_base.scss`)
* **Pico-Perfect Typography** - Enforced Pico.css semantic styles for all core text elements (`_base.scss`, `_components.scss`)
* **Entity Signature Colors** - Signature color classes (`.signature-*`) apply entity-specific colors to UI elements including chat messages, cards, and controls (`_foundation.scss`, `_components.scss`)

### Phase 2: Pixel-Perfection ✅
Eliminated small, distracting UI bugs (search fields removed from codebase 2025-11-06)

### Phase 3: Minimalist Main Stage ✅
Implemented high-impact "full-bleed" chat screen:
* **Re-balanced Spotlight** - Adjusted grid columns to `1.5fr 3fr 1.5fr` giving side columns visual weight (`_components.scss`)
* **Full-Bleed Character Images** - Edge-to-edge, full-height images as atmospheric bookends with `object-fit: cover` (`_components.scss`)

### Phase 4: "Megacool" Polish ✅
Added subtle, high-impact visual flair with CSS generator techniques:
* **Upgraded Loading Modal** - Custom spinner replacing default Pico loader (`_components.scss`)
* **Signature Typing Indicator** - Animated dots using AI's entity brand color (`_components.scss`)
* **Living Background** - Subtle texture pattern from css-pattern.com (`_base.scss`)
* **Dynamic Chat Bubbles** - Speech bubble tails pointing left (AI) and right (user) (`_components.scss`)
* **Call-to-Action Glow** - Gradient shadow on Send button using primary color (`_components.scss`)

**Reference Resources:** [css-pattern.com](https://css-pattern.com/), [css-loaders.com](https://css-loaders.com/), [css-generators.com](https://css-generators.com/)

---

## **Changelog**

* **3.2.0 (2025-10-28)** - Updated **Chat View** layout description to specify 3-column (desktop) / 1-column (mobile) structure. Added clarification note on `role="user"`/`role="assistant"` convention. Added note that `#conclude-story` functionality needs design. Removed 'Top Notification' component section.
* **3.1.2 (2025-10-28)** - Added more details to the "Color System", "Typography", "Spacing", and "Components" sections.
* **3.1.1 (2025-10-22)** - Simplified **Visual System**; removed "Typography" and "Primary Accent" sections to correctly imply inheritance from Pico.css. Updated **Chin Component** UX to specify "click-outside-to-close" behavior and remove the dedicated "Close" button.
* **3.1.0 (2025-10-22)** - Overhauled **Visual System** section. Corrected the **Color System** to reflect the *actual* 4-color gradient and accent palettes (removing incorrect Catppuccin reference). Corrected **Spacing** guidelines to reflect the `1rem` layout unit standard.
* **3.0.0 (2025-09-26)** - Major consolidation. Merged `design-icon-free-standard.md`, `core-design-system.md`, and `rpglitch-chin-ux-and-safety.md` into this single, canonical file.
* **2.0.0 (Prior Version)** - Previous version of the core design system.
* **1.0.0 (Initial Version)** - Initial design principles.
  