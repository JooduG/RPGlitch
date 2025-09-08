# HTML Guide: Hyperscript Usage

This guide defines how to use `_hyperscript`, a library that allows for expressive, natural-language event handling directly within HTML attributes.

**Core Principle:** Use `_hyperscript` for simple, declarative UI interactions. For complex logic involving state or multiple steps, use a dedicated JavaScript file.

---

## 1. Basic Syntax

The `_hyperscript` library is included from `/build/local_libs/` and looks for the `_` attribute on HTML elements.

- **`on click`**: The most common trigger.
- **`toggle`**: Toggles a class on an element.
- **`call`**: Calls a global JavaScript function.

```html
<!-- Toggle a class on the #chin element when this button is clicked -->
<button _="on click toggle .is-active on #chin">
  Toggle Settings
</button>

<!-- Call a javascript function -->
<button _="on click call handleCreateNew()">
  Create New
</button>
```

---

## 2. When to Use Hyperscript

`_hyperscript` is ideal for:

- **Toggling classes:** Showing/hiding elements, applying active states.
- **Simple function calls:** Triggering a single, predefined JavaScript function without needing to pass complex data.
- **Adding/removing elements** in a simple, direct way.

It keeps the HTML readable and connects an element's behavior directly to its definition, which is great for simple components.

---

## 3. When **NOT** to Use Hyperscript

While powerful, `_hyperscript` is not the right tool for every job. **Move logic to a dedicated `.js` file when:**

- **The logic is complex:** If an action requires multiple steps, conditional checks (`if/else`), or loops, it belongs in JavaScript. Trying to write this in a `_` attribute becomes unreadable and hard to debug.
- **State needs to be managed:** If the action needs to read from or write to the application's state (e.g., the Dexie database), that logic should be handled by the main JavaScript modules.
- **Data needs to be passed:** If a function needs to be called with dynamic data from a form input or another element, it's cleaner to handle this with a proper event listener in JavaScript.
- **The script is long:** If your `_` attribute script is longer than a single, simple command, it's a strong sign it should be refactored into a `.js` file.

**Example:**

```html
<!-- GOOD: Simple, declarative class toggle -->
<button _="on click toggle .hidden on #settings-panel">Show Settings</button>

<!-- BAD: Complex logic in HTML. Move this to JavaScript! -->
<button _="on click
           get the value of <input[name='entityName']/>
           if it is empty
             alert('Name cannot be empty!')
           else
             call createEntity(it)
           end">
  Save
</button>
```
