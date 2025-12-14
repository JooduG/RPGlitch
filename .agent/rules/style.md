---
trigger: model_decision
---

# 🎨 UI/UX & Design System

This document defines the **Visual Language** and component standards for RPGlitch and ImageGlitch.

## 1. The "Icon-Free" Mandate

* **Core Principle:** Clarity over decoration.
* **Rule:** All interactive elements (Buttons, Links, Nav) **MUST** primarily convey meaning through **Text Labels**.
  * ❌ *Bad:* A button with just a "Floppy Disk" icon.
  * ✅ *Good:* `<button>Save Game</button>`
  * ✅ *Allowed:* `<button>Save Game 💾</button>` (Emoji/Icon as embellishment only).
* **Reason:** Ensures accessibility and prevents ambiguity.

## 2. Visual System

* **Framework:** **Pico.css** is the foundation. Do not override it unless necessary.
* **Color Palette:**
  * **Background:** Dark gradient (`#181c2f` to `#2a1a3a`).
  * **Accents:** Pink (`#ec4899`), Cyan (`#06b6d4`), Emerald (`#10b981`).
* **Typography:** System font stack (inherited from Pico).

## 3. Layout Physics (CRITICAL)

* **The Universal Stage:**
  * **Structure:** 3-Column CSS Grid.
  * **Specs:** `25vw` (AI) | `1fr` (Stage) | `25vw` (User).
  * **Height:** `100vh` (No body scroll).
  * **Overflow:** `hidden` (Prevent layout breaking).
* **The "Flexbox Jail" (Chat Feed):**
  * **Problem:** Preventing chat scrolling from breaking the fixed layout.
  * **Solution:** Container must use `flex: 1; min-height: 0; overflow-y: auto;`.

## 4. Component Standards

* **Message Bubbles (`.story-message`):**
  * **Typography:** `white-space: pre-wrap` (Preserve AI formatting).
  * **Narrator:** Center aligned, Italic, Grey text.
  * **AI:** Left aligned, Tail points Left.
  * **User:** Right aligned, Tail points Right.
* **Nameplates:**
  * **Style:** Solid Background (`#181c25`), 2px Border (Signature Color).
  * **Text:** Uppercase, Bold.
* **The "Chin" (Mobile Drawer):**
  * Replaces side columns on screens `< 768px`.
  * Must be dismissible via `ESC` key or backdrop click.

## 5. CSS Architecture

* **Format:** SCSS (`.scss`).
* **Structure:** 7-1 Pattern (ish).
* **Constraint:** Do not nest selectors more than **3 levels deep**.
