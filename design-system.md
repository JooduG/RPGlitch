# 🎨 Project Design System & UI Protocol

Version 3.3.0 | Updated 2025-11-20

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

*   **Entity vs. Item:** "Entity" is the canonical term for core data objects: Stories, Characters, and Worlds. "Item" is used in the codebase as a developer-facing synonym.

---

## Interaction & UX Principles

### The Icon-Free Mandate (Non-Negotiable)

In this project, all interactive UI elements (buttons, links, navigation) **MUST** primarily convey their meaning through explicit and concise **text labels**.

* **DIRECTIVE:** **DO NOT** create UI elements that rely solely on icons to convey function.
* **DIRECTIVE:** **MAY** use icons (or emojis) as visual embellishment, **paired directly** with clear text label (e.g., `Save All Data 💾`).
* **RATIONALE:** Text labels ensure universal understanding, support our minimalist aesthetic, and align with user preferences for explicit, unambiguous controls.

#### Examples

* ❌ **Bad:** `<button><img src="save.svg"></button>` *(Ambiguous)*
* ✅ **Good:** `<button>Save</button>` *(Clear and direct)*
* ✅ **Good:** `<button>Save All Data 💾</button>` *(Icon as secondary indicator)*

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
* **🎨 Signature Colors:** Predefined colors for visual variety and entity identity.
    * **Pink:** `#ec4899` | **Emerald:** `#10b981` | **Cyan:** `#06b6d4`
    * **Orange:** `#f97316` | **Purple:** `#a855f7`

### Typography

* **Font Family:** System font stack (inherited from Pico.css)
* **Font Sizes, Weights, Line Heights:** All inherited from Pico.css

### Spacing

* **Base Unit:** `1rem` (16px) for all major layout margins, paddings, and gaps
* **Border Radius:** `0.5rem` (8px) for most elements

---

## Component Patterns

### Common Components

**Buttons**
* Follow Pico.css standards (`.primary`, `.secondary`, `.danger`)
* **MUST** follow the Icon-Free Mandate

**Modals**
* Loading Modal: Displays loading message
* Emergency Modal: Displays error message with options to save/delete

**Tags**
* Displayed as pills with background color and rounded corners

### RPGlitch-Specific Components

**Cards (Storyboard & Chin)**
* Use semantic HTML (`<article>`, `<header>`, `<footer>`)
* Responsive layout with flexbox/grid
* Adhere to color palette and spacing rules

**The "Chin" Component**
* Signature slide-out panel for entity selection (Stories, Characters, Worlds)
* Toggled by top-bar tab buttons (`#tab-stories`, etc.)
* Closes via ESC key or backdrop click (no dedicated "Close" button)

**Forms**
* Follow Pico.css standards
* All inputs must have associated `<label>` elements

**Pictures**
* 1:1 aspect ratio containers
* Placeholder images when no image available

**Profiles**
* Two-column layout (image left, details right)
* Uses entity's signature color
* For Dynamic Profile Image Input details, see [apps/rpglitch/README.md](./apps/rpglitch/README.md)

**Storyboard**
* Three-column grid (AI character | user character | world)
* Easily distinguishable card styling

**Chat View Component**
* **Wide Screens:** Three-column layout (AI avatar | chat feed | user avatar)
* **Narrow Screens:** Single-column layout with compact design
* Distinct styling for `role="user"` and `role="assistant"` messages
* Send button state bound to Chat FSM (disabled during `streaming`)
* Typing indicator shown during `streaming` or `sending` states

### ImageGlitch-Specific Components

See [PERCHANCE.md](./PERCHANCE.md) for ImageGlitch's three AI Personas:
* **Refine** (Scribe) - Intelligently improves user prompts
* **Embrace the Chaos** (Chaos) - Adds creative mutation and randomness
* **Transfigure** - Surgically modifies prompts per user instructions

---

## Visual Polish: Signature Vibe Foundation

**Status:** ✅ 95% Implemented (2025-10-28)

RPGlitch visual overhaul completed with:
* **Phase 1:** High-contrast identity, Pico.css typography, signature colors
* **Phase 2:** Pixel-perfect UI (search fields removed)
* **Phase 3:** Full-bleed chat screen with re-balanced grid (1.5fr 3fr 1.5fr)
* **Phase 4:** Custom spinner, typing indicator, background texture, chat bubbles, glow effects

**Reference:** [css-pattern.com](https://css-pattern.com/), [css-loaders.com](https://css-loaders.com/), [css-generators.com](https://css-generators.com/)

---

## Changelog

* **3.3.0 (2025-11-20)** — Complete refactoring: removed implementation details (moved Dynamic Profile Image Input to apps/rpglitch/README.md, ImageGlitch personas to PERCHANCE.md, UI Safety to apps/rpglitch/README.md). Focused file on pure design guidance and component patterns.
* **3.2.0 (2025-10-28)** — Updated Chat View layout, added role attribute clarification, noted conclude-story needs design.
* **3.1.2 (2025-10-28)** — Enhanced Color System, Typography, Spacing sections.
* **3.1.1 (2025-10-22)** — Simplified Visual System, updated Chin UX.
* **3.1.0 (2025-10-22)** — Overhauled Visual System, corrected color palettes.
* **3.0.0 (2025-09-26)** — Major consolidation of design documents.
