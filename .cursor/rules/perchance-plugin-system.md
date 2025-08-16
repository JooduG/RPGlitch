---
description: Guidelines and protocols for developing and integrating plugins within Perchance applications, with a focus on API patterns, extensibility, and platform constraints.
tags: "perchance", "plugins", "extensibility", "best-practices"
globs: **/apps/**
alwaysApply: false
---

# Perchance Plugin System

## Scope

- Covers the architecture and integration of plugins in Perchance apps.
- Outlines best practices for plugin APIs, isolation, and extensibility.
- References official plugin docs and advanced examples.

---

## Core Principles

- **API-Driven:** Plugins interact with the app via a defined API (usually exposed on a global object).
- **Isolation:** Plugins should not interfere with core app logic or other plugins.
- **Extensibility:** Design plugin hooks and events for future expansion.
- **Minimal Dependencies:** Plugins should be self-contained and not require external build steps.

---

## Plugin Integration Pattern

1. **Expose a Global API:**  
   The main app exposes a global object (e.g., `window.App`) with methods/plugins can call.
2. **Plugin Registration:**  
   Plugins register themselves by calling a method or pushing to a registry on the global object.
3. **Event Hooks:**  
   The app provides hooks (e.g., `onInit`, `onDataLoaded`) that plugins can subscribe to.
4. **Plugin Isolation:**  
   Plugins should not modify global state except through the provided API.

---

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

---

## Best Practices

- Document the plugin API and expected lifecycle events.
- Avoid naming collisions by using unique plugin names.
- Test plugins in isolation and with other plugins enabled.

---

## Related Rules

- [Perchance Architecture](./perchance-architecture.mdc)
- [Perchance Development Lifecycle](./perchance-development-lifecycle.mdc)
- [JavaScript Development](./js-development.mdc)
- [Perchance Build & Deployment](./perchance-build-deployment.mdc)

---

## References & Inspiration

- [Perchance Plugins](https://perchance.org/plugins)
- [Perchance Upload Plugin](https://perchance.org/upload-plugin)
- [Perchance Super Fetch Plugin](https://perchance.org/super-fetch-plugin)
- [Perchance AI Text Plugin](https://perchance.org/ai-text-plugin)
- [Perchance Remember Plugin](https://perchance.org/remember-plugin)
- [Perchance AI Character Chat Dependencies](https://perchance.org/ai-character-chat-dependencies-v1)
- [Perchance AI Character Chat](https://perchance.org/ai-character-chat)
- [Perchance Snippets](https://perchance.org/perchance-snippets)
