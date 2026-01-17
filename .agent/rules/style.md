---
trigger: always_on
description: Contains protocols for using generative media tools. Apply this rule whenever the user requests visual assets (images, logos, mockups) or when the conversation context implies a need for creative visualization.
---

# 🎨 Mesmer: The Visual Protocol

> **The Directive:** "If it looks real, it is real."
> **The Stack:** Svelte 5 (Runes) + Custom SCSS (Pico-inspired).
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

The application uses a unified 10-column grid system with two distinct modes.

### 🧱 Mode A: Storyboard (The Dashboard)

The standard "Widescreen" view with breathing room.

| Section    | Width | Role                 |
| ---------- | ----- | -------------------- |
| **Margin** | `1fr` | Left Gutter          |
| **AI**     | `2fr` | Avatar & Status      |
| **Stage**  | `4fr` | The Narrative Output |
| **User**   | `2fr` | Controls & Input     |
| **Margin** | `1fr` | Right Gutter         |

### 💬 Mode B: Storymode (The Chat)

The "Zoomed In" immersive view. Margins are collapsed to maximize narrative space.

| Section   | Width | Role                     |
| --------- | ----- | ------------------------ |
| **AI**    | `2fr` | Avatar & Status          |
| **Stage** | `6fr` | The Narrative (Expanded) |
| **User**  | `2fr` | Controls & Input         |

### 📱 Smartphone Mode (< 768px)

The "Physical Device" simulation.

- **Grid:** Collapses to **Single Column (`1fr`)**.
- **The Bezel:** Container simulates a phone frame (`border: 14px solid`, `radius: 36px`).
- **Hidden:** Side columns (AI/User portraits) yield to the "Drawer".

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

1. **Abstracts:** Variables, Mixins (`_variables.scss`).
2. **Base:** Reset, Typography, Grid.
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
