---
trigger: manual
---

# 🏛️ Architecture & Core Directives

This document defines the **Non-Negotiable Architectural Laws** for the JooduG monorepo.
Any code generated must strictly adhere to these patterns.

## 1. The "Two-Panel" Law

We operate on the **Perchance Platform**, which requires a strict separation of concerns.

### 🔴 Left Panel (The Engine)

* **File:** `apps/*/*-left-panel.txt`
* **Role:** Declarative Data & Config ONLY.
* **Allowed Syntax:** Perchance Lists (`[list]`), Plugin Imports (`{import:x}`), Variables (`x = 1`).
* **FORBIDDEN:** Complex JavaScript logic, UI rendering, or State Management.
* **Deployment:** Manual Copy-Paste to Perchance "Lists" panel.

### 🟢 Right Panel (The Stage)

* **File:** `apps/*/html/index.html` (and associated `js/`, `scss/`).
* **Role:** The Application Logic & UI.
* **Allowed Syntax:** Standard ES6+ JavaScript, SCSS, HTML5.
* **Deployment:** Auto-compiled to `build/output/`. Manual Copy-Paste to Perchance "HTML" panel.

---

## 2. Pattern C: The Simulation Engine

Applies to: RPGlitch

We do **NOT** use the standard Perchance `oc` object for game state. We use a **Simulation Loop**:

1. **The Kernel (`engine-prompt-builder.js`):** Assembles context (System, World, Entity Snapshot) for the AI.
2. **The Actor (AI):** Generates raw text/narrative only.
3. **The Physicist (`worker.js`):** A background WebWorker that calculates numerical state (Entropy, Velocity) and ensures thread safety.
4. **The Manager (`manager-turns.js`):** Orchestrates the loop and handles DB persistence.

> **Rule:** logic that touches `Entropy`, `Velocity`, or `Permeability` MUST live in the Worker or `engine-physics.js`.

---

## 3. Storage & State

* **Single Source of Truth:** `Dexie.js` (IndexedDB).
* **Forbidden:** `localStorage` (except for "Freedom Protocol" flags), `sessionStorage`, cookies.
* **Flow:** UI components must subscribe to DB changes (Reactivity) rather than storing local state.

---

## 4. File System Constraints

* **❌ DO NOT EDIT:**
  * `apps/*/RPGlitch.html` (Auto-generated build artifact)
  * `apps/*/imageglitch.html` (Auto-generated build artifact)
  * `build/output/` (Anything inside here)
* **✅ EDIT INSTEAD:**
  * `apps/*/html/index.html`
  * `apps/*/js/*.js`
  * `apps/*/scss/*.scss`

---

## 5. Security & Safety

* **DOMPurify:** MUST be used on `innerHTML` assignments.
  * *Bad:* `div.innerHTML = content;`
  * *Good:* `div.innerHTML = DOMPurify.sanitize(content);`
* **Freedom Protocol:** Do NOT remove the `localStorage` override in `index.js`. This protects the app from platform-side filters.
