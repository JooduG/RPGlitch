---
description: Plugin development and integration guidelines for Perchance applications.
tags:
  - perchance
  - plugins
  - extensibility
  - best-practices
globs:
  - "**/*.js"
alwaysApply: false
---

# Perchance Plugin System

## Core Principles

- **API-Driven:** Plugins interact with the app via a defined API (usually exposed on a global object).
- **Isolation:** Plugins should not interfere with core app logic or other plugins.
- **Extensibility:** Design plugin hooks and events for future expansion.
- **Minimal Dependencies:** Plugins should be self-contained and not require external build steps.

## Plugin Integration Pattern

1. **Expose a Global API:** The main app exposes a global object (e.g., `window.App`) with methods plugins can call.
2. **Plugin Registration:** Plugins register themselves by calling a method or pushing to a registry on the global object.
3. **Event Hooks:** The app provides hooks (e.g., `onInit`, `onDataLoaded`) that plugins can subscribe to.
4. **Plugin Isolation:** Plugins should not modify global state except through the provided API.

## Example

```js
// In main app
window.App = {
  plugins: [],
  registerPlugin(plugin) {
    this.plugins.push(plugin);
    if (plugin.onInit) plugin.onInit();
  },
  // ...other API methods
};

// In plugin
window.App.registerPlugin({
  name: "MyPlugin",
  onInit() {
    // Plugin initialization code
  }
});
```

## Best Practices

- Document the plugin API and expected lifecycle events.
- Avoid naming collisions by using unique plugin names.
- Test plugins in isolation and with other plugins enabled.

### Plugin API Surface Checklist

- Named plugin (unique id)
- Registration method and lifecycle hooks (`onInit`, `onReady`, `onDispose`)
- Error boundaries and graceful failure behavior
- Strict interaction via app’s public API (no direct global state mutation)

## References

- [Perchance Plugins](https://perchance.org/plugins)
- [Perchance Upload Plugin](https://perchance.org/upload-plugin)
- [Perchance Super Fetch Plugin](https://perchance.org/super-fetch-plugin)
- [Perchance AI Text Plugin](https://perchance.org/ai-text-plugin)
- [Perchance Remember Plugin](https://perchance.org/remember-plugin)
