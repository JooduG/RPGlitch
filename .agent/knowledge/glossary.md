# 📖 Project Glossary & Domain Language

This document defines the specialized terminology, UI patterns, and architectural concepts used within the JooduG monorepo (RPGlitch & ImageGlitch).

## 1. UI Patterns (The Visual Language)

* **The Universal Stage:**
  * The fundamental 3-column CSS Grid layout used in RPGlitch.
  * **Specs:** `25vw` (AI Panel) | `1fr` (Main Stage) | `25vw` (User Panel).
  * **Behavior:** Fixed `100vh` height with `overflow: hidden`. Prevents the "page scroll" feel of typical websites.

* **The Chin:**
  * The mobile-specific drawer that replaces the side columns on screens `< 768px`.
  * **Behavior:** Slides up from the bottom. Must be dismissible via `ESC` key or backdrop click.
  * **Usage:** Hosts entity selection (Characters/Worlds) on mobile.

* **Flexbox Jail:**
  * A CSS pattern used to force the Chat Feed to scroll *internally* without breaking the fixed layout.
  * **Code:** `flex: 1; min-height: 0; overflow-y: auto;`.
  * **Constraint:** Without `min-height: 0`, the flex child would expand infinitely and break the scroll.

* **Storyboard:**
  * The grid-based selection interface for choosing Stories, Characters, or Worlds.
  * **Visuals:** Uses 1:1 aspect ratio cards (or 16:9 for Worlds).

## 2. Architecture & Logic

* **Two-Panel Architecture:**
  * The strict separation required by the Perchance platform.
  * **Left Panel:** The "Engine" (Perchance Lists, Plugin Imports). Stateless.
  * **Right Panel:** The "Stage" (HTML/JS Application). Stateful.

* **Simulation Engine (Pattern C):**
  * The architectural pattern for RPGlitch.
  * **Triad:**
    1. **Actor:** The AI generating narrative text.
    2. **Physicist:** The background WebWorker calculating entropy/stats.
    3. **Manager:** The orchestration layer handling the loop.

* **Watchdog:**
  * A self-healing polling mechanism in the frontend code.
  * **Role:** Detects if the UI is "stuck" (e.g., a spinner that never stops) and force-resets the state to `idle`.

* **Overlay Guard:**
  * A security function that force-closes lingering UI blockers (like modals) if they get detached from their state.

## 3. Data & State

* **Entity:**
  * The canonical term for a core data object (Story, Character, or World).
  * *Note:* Often referred to as "Item" in legacy code, but "Entity" is the preferred domain term.

* **Single Source of Truth (SSOT):**
  * **Dexie.js (IndexedDB).**
  * The UI is merely a reflection of the database state. We do not store state in the DOM.
  