# 🎨 Project Design System & UI Protocol

Version 3.4.0 | Updated 2025-12-02

**CORE PRINCIPLE:** This document is the **single source of truth** for the visual and interaction design of all applications in this repository. It defines our philosophy, styling foundation (Pico.css), and reusable component patterns. All UI/UX development **MUST** adhere to these guidelines.

**Related Docs:** See [README.md](./README.md) for navigation, [PERCHANCE.md](./PERCHANCE.md) for deployment, and [CLAUDE.md](./CLAUDE.md) for coding standards.

---

## Core Philosophy: The Vibe Check

Our design philosophy is built on a foundation of minimalism, clarity, and robustness.

* **Clarity Over Cleverness:** The user should never have to guess. Functionality must be explicit and unambiguous.
* **Minimalism with Purpose:** Every visual element must serve a purpose. We remove the unnecessary to give power to the essential.
* **Consistency is Queen:** Similar elements must look and behave similarly across all applications. This builds trust and reduces cognitive load.
* **Accessibility by Design:** Our interfaces must be usable and accessible to everyone. This is a non-negotiable baseline.

### Terminology

* **Entity vs. Item:** "Entity" is the canonical term for core data objects: Stories, Characters, and Worlds. "Item" is used in the codebase as a developer-facing synonym.

---

## Interaction & UX Principles

**Clarity First, Space Efficient**
Interactive elements should use text labels whenever possible to ensure clarity. However, universally recognized utility icons (Settings, Close, Save, Download) are permitted to conserve space, provided they include a `title` or `aria-label` attribute.

* ✅ **Good:** `<button>Save Data</button>`
* ✅ **Good:** `<button title="Settings">⚙️</button>`
* ❌ **Bad:** `<button>👁️</button>` (Ambiguous icon without label/title)

### General UX Patterns

* **Progressive Disclosure:** Show essential information first; reveal details on demand.
* **Immediate Feedback:** Every user action should provide immediate visual feedback (hover states, loading indicators).
* **Cancellable Actions:** All long-running AI actions **MUST** be cancellable.
* **Responsive & Touch-Friendly:** All layouts and controls must be fully responsive with adequate touch targets.

---

## The Visual System (The "Look")

Our visual language is built on **Pico.css**, extended with a custom design layer. All base typography, primary accent colors, and foundational styling are inherited from Pico.css.

### Color System

* **⬛ Background (Global):** A fixed, 4-stop linear gradient is used across all applications.
  * `#181c2f`, `#23243a`, `#1a3a4a`, `#2a1a3a`
* **⚪ Text:** Standard text color is inherited from Pico.css.
* **🎨 Signature Colors:** Predefined colors for visual variety and entity identity. These are exposed via CSS variables (`var(--signature-pink)`, etc.).
  * **Pink:** `#ec4899` | **Emerald:** `#10b981` | **Cyan:** `#06b6d4`
  * **Orange:** `#f97316` | **Purple:** `#a855f7`

### Typography

* **Font Family:** System font stack (inherited from Pico.css)
* **Font Sizes, Weights, Line Heights:** All inherited from Pico.css

### Spacing

* **Base Unit:** `1rem` (16px) for all major layout margins, paddings, and gaps
* **Border Radius:** `0.5rem` (8px) for most elements, `1.5rem` for chat bubbles.

---

## Component Patterns

### Common Components

#### Buttons

* Follow Pico.css standards (`.primary`, `.secondary`, `.danger`)
* **MUST** follow the Icon-Free Mandate

#### Modals

* Loading Modal: Displays loading message
* Emergency Modal: Displays error message with options to save/delete

#### Tags

* Displayed as pills with background color and rounded corners

### RPGlitch-Specific Components

**The Universal Stage (Layout)**
A 3-column CSS Grid designed to look like a "Tabletop" or "Control Center."

* **Grid:** `25vw` (AI) | `1fr` (Stage) | `25vw` (User)
* **Height:** `100vh` (Full Screen, No Body Scroll)
* **Constraint:** `overflow: hidden` to prevent layout breaking.

**Chat Feed (The "Flexbox Jail")**
To ensure the chat feed scrolls *inside* the fixed layout without stretching the page:

* **Container:** `flex: 1; min-height: 0; overflow-y: auto;`
* **Behavior:** Scrollbar appears internally; header and input area remain fixed.

**Message Bubbles (`.story-message`)**

* **Narrator / OOC:**
  * **Align:** Center (Bubble & Text).
  * **Color:** Neutral Grey (`--pico-secondary`).
  * **Style:** Italic.
* **AI Character:**
  * **Align:** Left (Bubble & Text).
  * **Color:** Muted or Signature Color.
  * **Tail:** Points Left.
* **User Character:**
  * **Align:** Right (Bubble & Text).
  * **Color:** Primary or Signature Color.
  * **Tail:** Points Right.
* **Typography:** `white-space: pre-wrap` is mandatory to preserve AI paragraph formatting.

**Character Nameplates (`.character-name-overlay`)**
A solid, high-readability label overlaid on character portraits.

* **Background:** `#181c25` (Dark Blue-Grey)
* **Border:** 2px Solid (Signature Color)
* **Text:** Uppercase, Bold, (Signature Color)
* **Shadow:** Strong drop shadow for depth against variable backgrounds.

#### Cards (Storyboard)

* Use semantic HTML (`<article>`, `<header>`, `<footer>`)
* Responsive layout with flexbox/grid

#### The "Chin" (Mobile Drawer)

* Signature slide-out panel for entity selection on mobile.
* Replaces side columns on screens `< 768px`.
* Toggled by selection buttons.

#### Pictures

* 1:1 aspect ratio containers (Portrait) or 16:9 (World).
* Placeholder images when no image available.

#### Profiles

* Two-column layout (image left, details right).
* Uses entity's signature color.

### ImageGlitch-Specific Components

See [PERCHANCE.md](./PERCHANCE.md) for ImageGlitch's three AI Personas:

* **Refine** (Scribe) - Intelligently improves user prompts
* **Embrace the Chaos** (Chaos) - Adds creative mutation and randomness
* **Transfigure** - Surgically modifies prompts per user instructions

---

## Visual Polish: Signature Vibe Foundation

**Status:** ✅ 98% Implemented (2025-12-02)

RPGlitch visual overhaul completed with:

* **Phase 1:** High-contrast identity, Pico.css typography, signature colors
* **Phase 2:** Pixel-perfect UI (search fields removed)
* **Phase 3:** Full-bleed chat screen with Universal Stage grid.
* **Phase 4:** Custom spinner, typing indicator, chat bubbles with tails, glow effects.

**Reference:** [css-pattern.com](https://css-pattern.com/), [css-loaders.com](https://css-loaders.com/), [css-generators.com](https://css-generators.com/)

---

## Changelog

* **3.4.0 (2025-12-02)** — Added **Universal Stage** layout specs, **Flexbox Jail** scrolling mechanics, and detailed **Message Bubble** alignment/color rules. Updated Nameplate definition to match new solid style.
* **3.3.0 (2025-11-20)** — Complete refactoring: removed implementation details (moved Dynamic Profile Image Input to apps/rpglitch/README.md, ImageGlitch personas to PERCHANCE.md, UI Safety to apps/rpglitch/README.md). Focused file on pure design guidance and component patterns.
* **3.2.0 (2025-10-28)** — Updated Chat View layout, added role attribute clarification, noted conclude-story needs design.
* **3.1.2 (2025-10-28)** — Enhanced Color System, Typography, Spacing sections.
* **3.1.1 (2025-10-22)** — Simplified Visual System, updated Chin UX.
* **3.1.0 (2025-10-22)** — Overhauled Visual System, corrected color palettes.
* **3.0.0 (2025-09-26)** — Major consolidation of design documents.
