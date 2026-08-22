# Suggestion: Perchance Runtime Sandbox & Exposure Bridge

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Platform Architecture, Sandboxing & Module Exposure  
> **Scope:** Two-Panel Sandbox, Three-Step Exposure Pattern, Declarative DSL, `oc` Event Pipeline  

---

## 1. Executive Summary

RPGlitch operates as a local-first PWA within the Perchance sandbox. This document formalizes the platform boundaries:
1. **The Two-Panel Sandbox Architecture:** Isolating procedural generator logic (Left Panel) from the modern UI/Svelte runtime (Right Panel).
2. **The Three-Step Exposure Pattern:** Reliable plugin bridging and asynchronous loading fail-safes.
3. **Declarative Logic DSL:** Native list probabilities (`^`) and stateful consumable inventories.
4. **The `oc` Object API:** Event-driven message interception and UI action dispatching.

---

## 2. The Two-Panel Sandbox Architecture

```text
LEFT PANEL (Engine Sandbox)                RIGHT PANEL (Stage Sandbox)
┌─────────────────────────────────────┐    ┌─────────────────────────────────────┐
│ • Declarative Lists & Logic         │    │ • Standard HTML5 / CSS3 / JS Runtime│
│ • Plugin Imports ({import:...})     │    │ • Svelte 5 Reactive Framework       │
│ • "Single Source of Truth" State    │    │ • UI Components & Dynamic DOM       │
│ • Declarative Probabilities (^)     │    │ • DOMPurify Security Sanitization   │
└──────────────────┬──────────────────┘    └──────────────────▲──────────────────┘
                   │                                          │
                   └───────────► [Exposure Bridge] ───────────┘
```

---

## 3. The Three-Step Exposure Pattern

```javascript
// Step 1: Assign imported plugins to variables in the Left Panel (No 'window.' dots allowed)
pluginAi = {import:ai-text-plugin}
pluginImage = {import:text-to-image-plugin}

// Step 2: Attach to global window scope inside the Right Panel HTML (before module scripts)
<script>
  window.pluginAi = pluginAi;
  window.pluginImage = pluginImage;
</script>

// Step 3: Map variables to standard functional names in main JavaScript module
export async function initializeRuntime() {
  await waitForPlugins();
  const ai = window.pluginAi;
  const image = window.pluginImage;
  return { ai, image };
}

// Asynchronous loading fail-safe to prevent race conditions during engine startup
function waitForPlugins(timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.pluginAi && window.pluginImage) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("Plugin loading timed out"));
      setTimeout(check, 50);
    };
    check();
  });
}
```

---

## 4. Declarative Logic DSL & Consumable Lists

Use native Left-Panel syntax to handle initial probability states:

```yaml
# Master NPC Encounter Selector
npc_encounter
  veteran_scout ^2.5
  corrupted_alchemist ^1.0
  wandering_merchant ^0.5

# Stateful Consumable Inventory (No duplicate selections in a single pass)
loot_pool
  consumableList = true
  damaged_gas_mask
  oxidized_scalpel
  empty_canteen
  field_dressing
```

---

## 5. The `oc` API & Event-Driven Message Pipeline

```javascript
// 1. Thread Event Interception (Runs after an AI message completes generation)
oc.thread.on("MessageAdded", async ({ message }) => {
  if (message.author === "ai" && message.content.includes("STATE: Hyper-Vigilant")) {
    oc.character.customData.stressLevel = Math.min(100, (oc.character.customData.stressLevel || 0) + 15);
  }
});

// 2. The Message Rendering Pipeline (Converts raw context into interactive UI)
oc.thread.messageRenderingPipeline.push(({ message, reader }) => {
  if (reader === "user") {
    return DOMPurify.sanitize(
      message.content.replace(/\[\[(.*?)\]\]/g, (match, action) => {
        return `<button class="action-btn" onclick="executeUIAction('${encodeURIComponent(action)}')">${action}</button>`;
      }),
    );
  }
  return message.content;
});

// UI Action Dispatcher
window.executeUIAction = function (encodedAction) {
  const action = decodeURIComponent(encodedAction);
  oc.thread.messages.push({
    author: "user",
    content: `[ACTION TAKEN: ${action}]`,
  });
};
```
