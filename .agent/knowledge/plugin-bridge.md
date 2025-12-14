# 🧠 Knowledge: The Perchance Plugin Bridge

**Context:** Use this pattern when the user needs to use Perchance Plugins (AI, Text-to-Image, etc.) in the Right Panel (JS).

## The Problem

Perchance runs the "Lists" (Left Panel) and "HTML" (Right Panel) in separate iframes.
Standard `window.pluginName` calls from the Right Panel will fail because the plugin is initialized in the Left Panel.

## The Solution: 4-Step Bridge Protocol

### Step 1: Import (Left Panel)

*File: `apps/*/*-left-panel.txt`*

```text
// 1. Import
ai = {import:ai-text-plugin}

// 2. Expose to global scope with unique name
pluginAi = ai
```

### Step 2: Expose (HTML)

*File: `apps/*/html/index.html` (Before your main script)*

```html
<script>
  // Bridge the iframe gap
  if (typeof ai !== 'undefined') window.pluginAi = ai;
</script>
<script type="module" src="js/index.js"></script>
```

### Step 3: Map (JavaScript)

*File: `apps/*/js/index.js`*

```javascript
// Map back to standard names for developer sanity
// This ensures you can use 'window.ai' comfortably in your code
const map = {
  pluginAi: "ai",
  pluginTextToImage: "textToImage"
};
for (const [k, v] of Object.entries(map)) {
  if (window[k]) window[v] = window[k];
}
```

### Step 4: Wait (Async)

Plugins load asynchronously. You must wait for them before starting the app.

```javascript
async function waitForPlugins(names) {
  const start = Date.now();
  while (names.some(n => !window[n])) {
    if (Date.now() - start > 10000) throw new Error("Plugin Timeout");
    await new Promise(r => setTimeout(r, 100));
  }
}

// Usage
await waitForPlugins(['pluginAi']);
App.start();
```
