---
trigger: glob
description: Contains protocols for using generative media tools. Apply this rule whenever the user requests visual assets (images, logos, mockups) or when the conversation context implies a need for creative visualization.
globs: **/*.scss, **/*.svelte
---

# 🎨 Mesmer: The Visual Protocol

> **The Directive:** "If it looks real, it is real."
> **The Stack:** Svelte 5 (Runes) + Custom SCSS (Standardized).
> **The Architecture:** Single HTML Monolith (No external requests).

## 1. The Icon Mandate (Interaction Design)

**Core Principle:** Clarity > Decoration. Naked icons are toxic.

- **Primary Actions:** MUST use **Text Labels** (e.g., `<button>Save</button>`).
- **Icon-Only Buttons:**
  - 🛑 **FORBIDDEN:** Naked icons `<button><svg>...</svg></button>`.
  - ✅ **REQUIRED:** Descriptive attributes:

```html
<button aria-label="Settings" title="Settings">
  <svg class="icon">...</svg>
</button>
```

## 2. Visual Physics (Layout Engine)

The application uses a unified 10-column grid system (`src/scss/layouts/_grid.scss`).

### Modes

- **Mode A (Storyboard):** 1-2-4-2-1 Grid.
- **Mode B (Storymode):** 2-6-2 Grid (Immersive).
- **Mobile:** Single column with Drawer system.

### ⛓️ The Flexbox Jail (Scroll Containment)

Prevent chat logs from breaking the fixed layout.

```css
.scroll-container {
  flex: 1;
  min-height: 0; /* CRITICAL */
  overflow-y: auto;
}
```

## 3. Style Architecture (SCSS)

The `src/scss/` directory is the single source of truth.

1. **Abstracts:** Variables (`--app-*`), Mixins.
2. **Base:** Reset, Typography (`_typography.scss`), Grid.
3. **Components:** Cards, Buttons, Inputs (Atomic blocks).
4. **Layouts:** The 10-col Grid logic.

## 4. UI Polish Standards

### 💎 Glassmorphism

Use the SCSS placeholders from `_mixins.scss`:

- **Standard:** `@extend %material-glass;` (Blur 16px, 60% Opacity).
- **Heavy:** `@extend %material-glass-heavy;` (Blur 20px, 85% Opacity).
- **Usage:** Nameplates, Modals, Toasts.

### 🫧 Message Bubbles (.story-message)

- **Typography:** `white-space: pre-wrap` (Respect AI formatting).
- **Tail Physics:**
  - **AI:** Points Left (Incoming).
  - **User:** Points Right (Outgoing).
  - **Narrator:** Centered, Italic, No Tail.

### 🦶 The Mobile Drawer ("The Chin")

Replaces sidebars on mobile.

- **Behavior:** Slide-up bottom sheet.
- **Z-Index:** `2000` (Above everything except Toasts).

## 5. Z-Index Scale (Source of Truth)

| Layer     | Value   | Context          |
| --------- | ------- | ---------------- |
| `base`    | `10`    | Standard Content |
| `ui`      | `50`    | Controls, HUD    |
| `overlay` | `100`   | Dimmed Backdrops |
| `modal`   | `150`   | Popups           |
| `drawer`  | `2000`  | Mobile Sheet     |
| `toast`   | `10000` | Notifications    |
