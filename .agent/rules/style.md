---
trigger: always_on
description: Contains protocols for using generative media tools. Apply this rule whenever the user requests visual assets (images, logos, mockups) or when the conversation context implies a need for creative visualization.
---

# 🎨 Mesmer: The Visual Protocol

The "Super Mega Awesome" Style Guide. Apply this whenever generating UI, CSS, or designing components.

> **The Directive:** "If it looks real, it is real."
> **The Stack:** Svelte 5 (Runes) + Pico.css + SCSS.
> **The Architecture:** Single HTML Monolith (No external requests).

---

## 1. The Icon Mandate (Interaction Design)

**Core Principle:** Clarity > Decoration.

- **Primary Actions:** MUST use **Text Labels** (e.g., `<button>Save</button>`).
- **Icon-Only Buttons:**
  - 🛑 **FORBIDDEN:** Naked icons `<button><svg>...</svg></button>`
  - ✅ **REQUIRED:** Descriptive attributes:

    ```html
    <button aria-label="Settings" title="Settings">
      <svg class="icon">...</svg>
    </button>
    ```

- **Reason:** Accessibility and "Chat Bubble" density management.

---

## 2. Visual Physics (Layout Engine)

### 🌉 The Universal Stage (Desktop)

A rigid 10-column grid derived from `src/scss/base/_grid.scss`.

| Section    | Width | Role                 |
| :--------- | :---- | :------------------- |
| **Margin** | `1fr` | Left Gutter          |
| **AI**     | `2fr` | Avatar & Status      |
| **Stage**  | `4fr` | The Narrative (Chat) |
| **User**   | `2fr` | Controls & Input     |
| **Margin** | `1fr` | Right Gutter         |

- **Height:** `100vh` (Fixed).
- **Overflow:** `hidden` (No body scroll).

### 📱 Smartphone Mode (`< 768px`)

The "Physical Device" simulation for mobile contexts.

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

---

## 3. Style Architecture (SCSS)

### 🧱 The 7-1 Pattern

- `abstracts/`: Variables, Mixins (`_variables.scss`).
- `base/`: Reset, Typography, Grid.
- `components/`: Cards, Buttons, Inputs.
- `layout/`: The 10-col grid system.

### 🎨 The Palette

- **Backgrounds:** Dark Gradient (`#181c2f` -> `#2a1a3a`).
- **Accents:** **Signature Colors** (Dynamic per entity).
- **System:** Pico.css defaults.

### 🚫 Prohibitions

1. **NO Tailwind.** (We use semantic CSS).
2. **NO External Fonts.** (System fonts or Inline Base64 only).
3. **NO Generic Names.** (Use BEM-lite or component-scoped identifiers).

---

## 4. UI Polish Standards

### 💎 Glassmorphism

Use the SCSS placeholders from `_mixins.scss`:

- **Standard:** `@extend %material-glass;` (Blur 16px, 60% Opacity).
- **Heavy:** `@extend %material-glass-heavy;` (Blur 20px, 85% Opacity).
- **Usage:** Nameplates, Modals, Toasts.

### 🫧 Message Bubbles (`.story-message`)

- **Typography:** `white-space: pre-wrap` (Respect AI formatting).
- **Tail Physics:**
  - **AI:** Points Left (Incoming).
  - **User:** Points Right (Outgoing).
  - **Narrator:** Centered, Italic, No Tail.
- **Coloring:** MUST inherit `Signature Color` if available.

### 🦶 The Mobile Drawer ("The Chin")

replaces sidebars on mobile.

- **Behavior:** Slide-up bottom sheet.
- **Dismiss:** Click outside or `ESC`.
- **Z-Index:** `2000` (Above everything except Toasts).

---

## 5. Component Development Checklist

1. **Structure:** Use HTML5 Semantic Tags (`<header>`, `<main>`, `<footer>`).
2. **Style:** Write SCSS in the `<style lang="scss">` block.
3. **Logic:** Use Svelte 5 Runes (`$state`, `$derived`).
4. **Icons:** Copy raw SVG path into `<svg class="icon">`.

---

## 6. Z-Index Scale (Source of Truth)

| Layer     | Value   | Context          |
| :-------- | :------ | :--------------- |
| `base`    | `10`    | Standard Content |
| `ui`      | `50`    | Controls, HUD    |
| `overlay` | `100`   | Dimmed Backdrops |
| `modal`   | `150`   | Popups           |
| `drawer`  | `2000`  | Mobile Sheet     |
| `toast`   | `10000` | Notifications    |
