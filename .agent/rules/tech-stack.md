---
trigger: always_on
---

# 🛠️ Tech Stack & Coding Standards

This document defines the **Mandatory Technology Stack** and coding standards for the JooduG monorepo.

## 1. Core Stack

* **Runtime:** Node.js 22 (Managed via `.nvmrc`).
* **Package Manager:** `npm` ONLY.
  * **Install:** Always use `npm ci` (Reproducible builds).
  * **Add/Update:** Use `npm install`.
* **Build System:** Custom `esbuild` + `sass` pipeline (located in `scripts/build-app.js`).

---

## 2. JavaScript Standards

* **Module System:** ES Modules (`import` / `export`) ONLY.
  * **Forbidden:** `require()`, IIFEs (Immediately Invoked Function Expressions) in source code.
  * *Note:* The build system wraps code in an IIFE automatically; do not write them manually.
* **Variable Declaration:**
  * **Default:** `const`
  * **Mutation:** `let`
  * **Forbidden:** `var` (Strictly prohibited).
* **Type Safety:** 
  * Use JSDoc + `types.d.ts` for type checking.
  * **Mandate:** All data structures MUST adhere to definitions in `types.d.ts`.
  * Do not use TypeScript syntax (`.ts` files) in the `apps/` logic, as the build pipeline expects vanilla JS.

---

## 3. Data & Storage (CRITICAL)

* **Single Source of Truth:** **Dexie.js** (IndexedDB wrapper).
* **Forbidden Storage:**
  * `localStorage` (Except for specific "Freedom Protocol" flags).
  * `sessionStorage`
  * Cookies
* **Pattern:** All application state (Game state, User settings) MUST be persisted to Dexie. The UI should react to database changes, not internal variable state.

---

## 4. UI Framework

* **CSS Framework:** **Pico.css** (Semantic HTML).
* **Styling:** SCSS (`.scss`).
* **Icons:** **SVG Only**. No icon fonts. (See "Icon-Free Mandate" in `style.md`).
* **Interactivity:** Vanilla JS + Event Listeners. No React/Vue/Angular.

---

## 5. Testing & Verification

* **Test Runner:** Jest (`npm test`).
* **Environment:** `jsdom` (Simulated DOM).
* **Location:** All tests MUST reside in `tests/`.
* **Naming Convention:** `<feature>.test.js`.
* **Mocking Protocol (CRITICAL):**
  * **Database:** Dexie.js MUST be mocked using `fake-indexeddb`. Never attempt to open a real IndexedDB in the test environment.
  * **DOM:** Use `jsdom` queries and event simulation.
* **Philosophy:** Prioritize testing pure functions. Verify DOM updates via state changes, not just HTML strings.

