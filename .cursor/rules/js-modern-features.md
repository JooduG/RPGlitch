---
description: Modern JavaScript features (ES2023+) including template literals, destructuring, arrow functions, and modern syntax patterns.
globs: **/*.js
alwaysApply: false
---

# Modern JavaScript Features (ES2023+)

## Template Literals and String Manipulation

```javascript
// Multi-line strings with template literals
const str = `
  ECMA International's TC39 is a group of JavaScript developers,
  implementers, academics, and more, collaborating with the community
  to maintain and evolve the definition of JavaScript.
`;

// Expression interpolation
function sum(a, b) {
  return a + b;
}
console.log(`1 + 2 = ${sum(1, 2)}.`); // "1 + 2 = 3."

// Tagged templates
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ? `<mark>${values[i]}</mark>` : '');
  }, '');
}
const message = highlight`Hello ${name}, welcome to ${site}!`;
```

## Modern Array Methods

```javascript
// Array iteration with for...of (preferred over for...in for arrays)
const fruits = ["Apple", "Orange", "Plum"];
for (const fruit of fruits) {
  console.log(fruit);
}

// Modern array methods
const numbers = [1, 2, 3, 4, 5];

// Array.from with mapping
const doubled = Array.from(numbers, x => x * 2);

// Array destructuring
const [first, second, ...rest] = numbers;

// Array spreading
const combined = [...numbers, 6, 7, 8];

// Array methods with arrow functions
const evens = numbers.filter(n => n % 2 === 0);
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

## Object Features

```javascript
// Object destructuring
const user = {
  name: "John",
  age: 30,
  preferences: {
    theme: "dark",
    language: "en"
  }
};

const { name, age, preferences: { theme } } = user;

// Dynamic property access
const key = "likes birds";
user[key] = true;

// Object spreading
const userWithDefaults = {
  role: "user",
  active: true,
  ...user
};

// Object shorthand
const name = "John";
const age = 30;
const person = { name, age }; // { name: "John", age: 30 }

// Optional chaining
const theme = user?.preferences?.theme;
const result = api?.getData?.()?.items;

// Nullish coalescing
function showCount(count) {
  console.log(count ?? "unknown");
}
showCount(0); // 0
showCount(null); // "unknown"
showCount(); // "unknown"
```

## Modern Functions

```javascript
// Arrow functions
const sum = (a, b) => a + b;
const double = n => n * 2;
const sayHi = () => console.log("Hello");

// Arrow functions with implicit return
const numbers = [1, 2, 3, 4];
const doubled = numbers.map(n => n * 2);

// Arrow functions for context binding
const user = {
  name: "John",
  sayHi() {
    setTimeout(() => console.log(`Hello, ${this.name}!`), 1000);
  }
};

// Default parameters
function showMessage(from, text = "no text given") {
  console.log(`${from}: ${text}`);
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

// Function name inference
const sayHi = function() {
  console.log("Hi");
};
console.log(sayHi.name); // "sayHi"
```

## Promise and Async/Await

```javascript
// Modern async/await syntax
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Top-level await (in modules)
const response = await fetch('/api/data');
const data = await response.json();

// Promise.all for parallel requests
async function fetchMultipleUsers(userIds) {
  const promises = userIds.map(id => fetchUserData(id));
  const users = await Promise.all(promises);
  return users;
}

// Promise.race for timeout
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

## Module Pattern

```javascript
// ES6 Modules
// utils.js
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default class Utils {
  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }
}

// main.js
import Utils, { formatDate, debounce } from './utils.js';

// Dynamic imports
const loadModule = async () => {
  const module = await import('./dynamic-module.js');
  module.default();
};
```

## Class Patterns

```javascript
// Modern class syntax
class User {
  #privateField = 'private';
  
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  
  // Getter
  get displayName() {
    return `${this.name} (${this.email})`;
  }
  
  // Setter
  set displayName(value) {
    const [name, email] = value.split(' (');
    this.name = name;
    this.email = email.replace(')', '');
  }
  
  // Static method
  static createFromJSON(json) {
    return new User(json.name, json.email);
  }
  
  // Instance method
  sayHello() {
    console.log(`Hello, I'm ${this.name}`);
  }
}

// Class inheritance
class AdminUser extends User {
  constructor(name, email, permissions = []) {
    super(name, email);
    this.permissions = permissions;
  }
  
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }
}
```

## Error Handling

```javascript
// Modern error handling
class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
  }
}

// Try-catch with async/await
async function handleAsyncOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    if (error instanceof CustomError) {
      console.error(`Custom error: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  } finally {
    // Cleanup code
    cleanup();
  }
}

// Error boundaries
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error reporting service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
```

---

## References

- [JavaScript Development](./js-development.mdc) - Comprehensive JavaScript guide
- [DOM Manipulation](./js-dom-manipulation.mdc) - Modern DOM APIs
- [Storage Strategy](./js-storage-strategy.mdc) - Client-side storage approaches
