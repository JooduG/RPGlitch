# JavaScript Best Practices

**RULE:** This document is the single source of truth for all JavaScript written in this project. Adhere to these guidelines for code style, syntax, architectural patterns, and browser interaction.

---

## 1. Modern Language Features (ES6+)

**RULE:** Use the following features consistently for clean, efficient, and maintainable code.

### `const` and `let`

* **DIRECTIVE:** Use `const` by default.
* **DIRECTIVE:** Use `let` ONLY if a variable's value MUST be reassigned.
* **DIRECTIVE:** `var` is STRICTLY FORBIDDEN.

### Arrow Functions

* **DIRECTIVE:** Use arrow functions for ALL anonymous functions and callbacks.

### Template Literals

* **DIRECTIVE:** Use template literals (`` ` ``) for ALL string concatenation, especially when embedding variables.

### Destructuring

* **DIRECTIVE:** Use destructuring to access properties from objects and elements from arrays.

### Promises and `async/await`

* **DIRECTIVE:** ALL asynchronous operations MUST use Promises.
* **DIRECTIVE:** For consuming promises, `async/await` syntax is STRONGLY PREFERRED.

---

## 2. Architectural Patterns

### The Module Pattern (IIFE)

* **DIRECTIVE:** ALL JavaScript files MUST be wrapped in an Immediately Invoked Function Expression (IIFE) to avoid polluting the global namespace.
* **STRUCTURE:**

    ```javascript
    (function() {
      'use strict';

      // Private code

      const publicModule = { /* ... */ };
      window.AppName.moduleName = publicModule; // Expose public API
    })();
    ```

### State Management

* **DIRECTIVE:** The IndexedDB database is the SINGLE SOURCE OF TRUTH for all application state.
* **DIRECTIVE:** The UI is a reflection of the IndexedDB data.
* **DIRECTIVE:** Implement One-Way Data Flow: User interaction modifies data in the database, which then triggers a re-render of the UI.

---

## 3. DOM Manipulation with `cash`

**RULE:** ALL direct DOM manipulation MUST be performed using the `cash` library (`$`).

### Selecting and Manipulating Elements

* **DIRECTIVE:** Use CSS selectors for selection: `$('#id')`, `$('.class')`.
* **DIRECTIVE:** Use `cash` methods like `.addClass()`, `.removeClass()`, `.attr()`, etc., for manipulation.

### Creating and Inserting Elements

* **DIRECTIVE:** Build elements in memory with `cash` before appending them to the live DOM to improve performance.
* **DIRECTIVE:** AVOID using `innerHTML` with dynamic content.

### Event Handling

* **DIRECTIVE:** Use the `.on()` method for attaching event listeners.
* **DIRECTIVE:** For lists, use event delegation.

---

## 4. Client-Side Storage with `Dexie.js`

**RULE:** ALL client-side storage MUST use IndexedDB via the `Dexie.js` wrapper. `localStorage` is FORBIDDEN for application state.

### Schema Definition

* **DIRECTIVE:** Define the database schema in a central initialization file.

### CRUD Operations

* **DIRECTIVE:** Use `async/await` with Dexie's promise-based API for ALL database operations.

---

## 5. Ecosystem & Core Libraries

**RULE:** Utilize the following specific set of libraries for key tasks.

* **`cash`:** Use for ALL DOM manipulation.
* **`Dexie.js`:** Use for ALL IndexedDB interactions.
* **`_hyperscript`:** Use for simple, declarative event handling directly in HTML. Refer to `html-best-practises.md` for usage.
* **`DOMPurify`:** Use for sanitizing ANY user-generated content before rendering it as HTML to prevent XSS attacks. This is a MANDATORY security step.

---

## 6. General Best Practices

* **DIRECTIVE:** Every IIFE MUST begin with `'use strict';`.
* **DIRECTIVE:** Each module (file) SHOULD have a single, clear purpose.
* **DIRECTIVE:** Use `camelCase` for variables and functions.
* **DIRECTIVE:** Use `UPPER_SNAKE_CASE` for constants.
* **DIRECTIVE:** ALL public functions MUST have JSDoc comment blocks.
* **DIRECTIVE:** Use `try...catch` blocks for ALL asynchronous operations that might fail (e.g., database access, network requests).
