---
trigger: always_on
description: Contains protocols for using generative media tools. Apply this rule whenever the user requests visual assets (images, logos, mockups) or when the conversation context implies a need for creative visualization.
---

# 🎨 UI/UX & Design System

This document defines the **Visual Language** and component standards for RPGlitch and ImageGlitch.

## 1. The Icon Mandate

- **Core Principle:** Clarity over decoration.
- **Rule:** Interactive elements should primarily convey meaning.
  - **Primary Actions:** Use **Text Labels** (e.g., "Save", "Retry") for clear, unambiguous calls to action.
  - **Contextual/Secondary Actions:** Icon-only buttons are permitted **IF AND ONLY IF** they include a descriptive `aria-label` or `title` attribute.
    - ❌ _Bad:_ `<button><svg>...</svg></button>` (Ambiguous)
    - ✅ _Good:_ `<button>Save Game</button>` (Clear)
    - ✅ _Allowed:_ `<button aria-label="Settings" title="Settings"><svg>...</svg></button>` (Accessible Icon-Only)
- **Reason:** Ensures accessibility while preventing clutter in dense UI areas (like chat bubbles).

## 2. Visual System

- **Framework:** **Pico.css** is the foundation.
- **Color Palette:**
  - **Background:** Dark gradient (`#181c2f` to `#2a1a3a`).
  - **Accents:** **Signature Colors** (Generated Palette).
- **Typography:** System font stack (inherited from Pico).

## 3. Layout Physics (CRITICAL)

- **The Universal Stage:**
  - **Structure:** 10-Column CSS Grid (`1fr 2fr 4fr 2fr 1fr`).
  - **Specs:** `10%` Margin | `20%` AI | `40%` Stage | `20%` User | `10%` Margin.
  - **Height:** `100vh` (No body scroll).
  - **Overflow:** `hidden` (Prevent layout breaking).
- **The "Flexbox Jail" (Chat Feed):**
  - **Problem:** Preventing chat scrolling from breaking the fixed layout.
  - **Solution:** Container must use `flex: 1; min-height: 0; overflow-y: auto;`.
- **Mobile Physics (Smartphone Mode):**
  - **Grid Collapse:** The 10-column stage collapses to a **Single Column (`1fr`)**.
  - **The Bezel:** The main container simulates a physical device frame (`border: 14px solid`, `border-radius: 36px`).
  - **Hidden Elements:** Side columns and desktop portraits are removed from the flow.

## 4. Component Standards

- **Message Bubbles (`.story-message`):**
  - **Typography:** `white-space: pre-wrap` (Preserve AI formatting).
  - **Narrator:** Center aligned, Italic, Grey text.
  - **AI:** Left aligned, Tail points Left.
  - **User:** Right aligned, Tail points Right.
  - **Dynamic Coloring:** Chat bubbles must inherit the **Signature Color** of the speaking entity (e.g., specific HEX background) when applicable. Default to system grey only if no signature is present.
- **Nameplates (`.character-name-overlay`):**
  - **Style:** Floating Glass Overlay (`rgb(24 28 37 / 95%)`).
  - **Typography:** Uppercase, Bold, Letter-spacing `0.05em`.
  - **Border:** `2px solid` (Signature Color).
- **Entity Cards (`.entity-card`):**
  - **Structure:** `2/3` Media (Top), `1/3` Info (Bottom).
  - **Material:** `@extend %material-glass` (Frosted Glass).
  - **Interaction:** Hover scales image `1.05x`.
- **The Drawer (`.entity-drawer`):**
  - **Physics:** Bottom Sheet, Fixed Position, Slide-up Animation.
  - **Material:** `@extend %material-glass-heavy` (Opaque Blur).
  - **Grid:** Responsive Grid (`minmax(120px, 1fr)`).

## 5. CSS Architecture

- **Format:** SCSS (`.scss`).
- **Structure:** 7-1 Pattern (Abstracts, Base, Components, Layout).
- **Constraint:** Do not nest selectors more than **3 levels deep**.

## 6. UI Polish & Standardization

- **Glassmorphism:**
  - **Standard:** `%material-glass` (Blur 16px, 60% Opacity).
  - **Heavy:** `%material-glass-heavy` (Blur 20px, 85% Opacity).
- **Pills:** `%glass-pill` (`border-radius: 50px`) for inputs and button groups.
- **Input Deep Fields (`%input-deep`):**
  - **Style:** Translucent Dark Background (`rgba(0, 0, 0, 30%)`).
  - **Border:** `1px solid` (Muted), deepens on focus.
- **The "Chin" (Mobile Drawer):**
  - Replaces side columns on screens `< 768px`.
  - Must be dismissible via `ESC` key or backdrop click.
