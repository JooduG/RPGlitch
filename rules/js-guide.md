# JavaScript Guide: The Complete Reference

**Core Principle:** This document is the single source of truth for all JavaScript written in this project. It covers everything from code style and syntax to architectural patterns and interaction with the browser.

---

## 1. Modern Language Features (ES6+)

The following features must be used consistently to ensure code is clean, efficient, and maintainable.

### `const` and `let`
- **Rule:** Use `const` by default. Only use `let` if a variable's value must be reassigned. `var` is strictly forbidden.

### Arrow Functions
- **Rule:** Use arrow functions for all anonymous functions and callbacks. They provide a concise syntax and handle `this` lexically.

### Template Literals
- **Rule:** Use template literals (`` ` ``) for all string concatenation, especially when embedding variables.

### Destructuring
- **Rule:** Use destructuring to access properties from objects and elements from arrays.

### Promises and `async/await`
- **Rule:** All asynchronous operations must use Promises. For consuming promises, `async/await` syntax is strongly preferred.

---

## 2. Architectural Patterns

### The Module Pattern (IIFE)
- **Rule:** To avoid polluting the global namespace, all JavaScript files must be wrapped in an Immediately Invoked Function Expression (IIFE).
- **Structure:**
  ```javascript
  (function() {
    'use strict';

    // Private code

    const publicModule = { /* ... */ };
    window.AppName.moduleName = publicModule; // Expose public API
  })();
  ```

### State Management
- **Single Source of Truth:** The IndexedDB database is the single source of truth for all application state. The UI is a reflection of this data.
- **One-Way Data Flow:** User interaction modifies data in the database, which then triggers a re-render of the UI.

---

## 3. DOM Manipulation with `cash`

- **Core Principle:** All direct DOM manipulation must be performed using the `cash` library (`$`).

### Selecting and Manipulating Elements
- **Selection:** Use CSS selectors: `$('#id')`, `$('.class')`.
- **Manipulation:** Use `cash` methods like `.addClass()`, `.removeClass()`, `.attr()`, etc.

### Creating and Inserting Elements
- **Rule:** Build elements in memory with `cash` before appending them to the live DOM to improve performance. Avoid using `innerHTML` with dynamic content.
  ```javascript
  // Correct Way
  const newEl = $('<p>Hello</p>');
  $('#container').append(newEl);
  ```

### Event Handling
- **Rule:** Use the `.on()` method for attaching event listeners. For lists, use event delegation.
  ```javascript
  // Event delegation
  $('#profile-list').on('click', '.delete-btn', function() {
    $(this).closest('.profile-card').remove();
  });
  ```

---

## 4. Client-Side Storage with `Dexie.js`

- **Core Principle:** All client-side storage must use IndexedDB via the `Dexie.js` wrapper. `localStorage` is forbidden for application state.

### Schema Definition
- Define the database schema in a central initialization file.
  ```javascript
  const db = new Dexie('MyDatabase');
  db.version(1).stores({
    friends: '++id, name'
  });
  ```

### CRUD Operations
- Use `async/await` with Dexie's promise-based API for all database operations.
  ```javascript
  async function addFriend(friend) {
    try {
      await db.friends.add(friend);
    } catch (error) {
      console.error('Failed to add friend:', error);
    }
  }
  ```

---

## 5. Ecosystem & Core Libraries

This project utilizes a specific set of libraries for key tasks.

- **`cash`:** For all DOM manipulation.
- **`Dexie.js`:** For all IndexedDB interactions.
- **`_hyperscript`:** For simple, declarative event handling directly in HTML. See `html-best-practises.md` for usage.
- **`DOMPurify`:** For sanitizing any user-generated content before rendering it as HTML to prevent XSS attacks. This is a mandatory security step.

---

## 6. General Best Practices

- **`'use strict';`**: Every IIFE must begin with `'use strict';`.
- **Single Responsibility:** Each module (file) should have a single, clear purpose.
- **Naming Conventions:** Use `camelCase` for variables and functions, and `UPPER_SNAKE_CASE` for constants.
- **JSDoc Comments:** All public functions must have JSDoc comment blocks.
- **Error Handling:** Use `try...catch` blocks for all asynchronous operations that might fail, such as database access or network requests.
