# Modern JavaScript Patterns Implementation Playbook

This file contains detailed patterns, checklists, and code samples for the `javascript` skill.

## ES6+ Core Features

### 1. Arrow Functions

```javascript
// Syntax and Use Cases
const add = (a, b) => a + b;
const double = x => x * 2;
const getRandom = () => Math.random();

// Lexical 'this' Binding
class Counter {
  count = 0;
  increment = () => this.count++;
}
```

### 2. Destructuring

```javascript
// Object Destructuring
const { name, email, address: { city } } = user;
const { name: userName, age = 25 } = user;

// Array Destructuring
const [first, second, ...rest] = numbers;
[a, b] = [b, a]; // Swap
```

### 3. Spread and Rest Operators

```javascript
// Spread (Clone/Combine)
const combined = [...arr1, ...arr2];
const settings = { ...defaults, ...userPrefs };

// Rest (Collect)
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}
```

### 4. Template Literals

```javascript
const greeting = `Hello, ${name}!`;
const html = `
  <div>
    <h1>${title}</h1>
  </div>
`;
```

## Asynchronous Patterns

### 1. Promises

```javascript
fetchUser(1)
  .then(user => console.log(user))
  .catch(error => console.error(error))
  .finally(() => console.log('Done'));

// Combinators
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);
```

### 2. Async/Await

```javascript
async function getUserData(id) {
  try {
    const user = await fetchUser(id);
    return user;
  } catch (error) {
    console.error(error);
  }
}

// Retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url); }
    catch (e) { if (i === retries - 1) throw e; }
  }
}
```

## Functional Programming Patterns

### 1. Array Methods

```javascript
const activeNames = users
  .filter(u => u.active)
  .map(u => u.name)
  .sort();

const totalAge = users.reduce((sum, u) => sum + u.age, 0);
```

### 2. Composition and Piping

```javascript
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const processUser = pipe(
  u => ({ ...u, name: u.name.trim() }),
  u => ({ ...u, age: parseInt(u.age) })
);
```

## Best Practices Checklist
- [ ] Use `const` by default.
- [ ] Prefer arrow functions for callbacks.
- [ ] Use template literals for strings.
- [ ] Destructure for clarity.
- [ ] Use `async/await` with `try/catch`.
- [ ] Avoid mutating data; use spread/array methods.
- [ ] Use optional chaining (`?.`) and nullish coalescing (`??`).

## Common Pitfalls
1. **this binding confusion**: Ensure arrow functions are used in classes for callbacks.
2. **Missing await**: Remember that async functions return Promises.
3. **Blocking the event loop**: Keep heavy computations off the main thread.
4. **Shallow copies**: Spread operator only clones the first level of an object.
