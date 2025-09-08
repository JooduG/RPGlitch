# JavaScript Guide: Modern Features & APIs

This guide mandates the use of modern JavaScript (ES6+) features and browser APIs to ensure code is clean, efficient, and maintainable.

---

## 1. Core Language Features (ES6+)

The following features should be used consistently across the codebase.

### Variable Declarations: `const` and `let`

- **Rule:** Use `const` by default for all variables. Only use `let` if the variable's value needs to be reassigned. `var` is strictly forbidden to avoid scope-related issues.

```javascript
const name = 'Aragorn'; // Value does not change
let level = 1;         // Value will be reassigned
level = 2;
```

### Arrow Functions

- **Rule:** Use arrow functions for all anonymous functions and callbacks, especially in array methods. They provide a more concise syntax and handle the `this` context lexically, which is less error-prone.

```javascript
// Good
const names = characters.map(char => char.name);

// Bad
const names = characters.map(function(char) { return char.name; });
```

### Template Literals

- **Rule:** Use template literals (backticks `` ` ``) for string concatenation, especially when embedding variables or creating multi-line strings.

```javascript
const message = `Welcome, ${character.name}! You are level ${character.level}.`;
```

### Destructuring

- **Rule:** Use destructuring for easily accessing properties from objects and elements from arrays.

```javascript
// Object Destructuring
const { name, level } = character;

// Array Destructuring
const [first, second] = someArray;
```

### Promises and `async/await`

- **Rule:** All asynchronous operations (like database access with Dexie or network requests) must use Promises. For consuming promises, `async/await` syntax is strongly preferred over `.then().catch()` chains as it leads to more readable, synchronous-looking code.

```javascript
// Preferred async/await syntax
async function getCharacter(id) {
  try {
    const character = await db.characters.get(id);
    console.log(character.name);
  } catch (error) {
    console.error('Failed to fetch character:', error);
  }
}
```

---

## 2. Modern Browser APIs

Leverage modern browser APIs for common tasks instead of relying on older methods or oversized libraries.

### Fetch API

- **Rule:** Use the `fetch()` API for all network requests to external resources. It is a modern, promise-based replacement for `XMLHttpRequest`.

```javascript
async function getExternalData() {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
```

### Other Recommended APIs

- **`Intl`:** Use the `Intl` object for formatting dates, times, and numbers in a locale-sensitive way.
- **`URLSearchParams`:** Use for easily parsing and building URL query strings.
