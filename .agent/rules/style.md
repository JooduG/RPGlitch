---
trigger: manual
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

## 3. Component Standards

* **The "Chin" (Mobile Drawer):**
  * Used in RPGlitch for entity management.
  * Must be dismissible via `ESC` key or backdrop click.
* **Chat Interface:**
  * **Role="user":** Right-aligned (or distinct color).
  * **Role="assistant":** Left-aligned.
  * **Avatars:** Required for both parties.

## 4. CSS Architecture

* **Format:** SCSS (`.scss`).
* **Structure:** 7-1 Pattern (ish).
* **Constraint:** Do not nest selectors more than **3 levels deep**.
