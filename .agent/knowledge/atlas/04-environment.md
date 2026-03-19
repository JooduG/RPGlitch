---
trigger: always_on
description: The Perchance Platform. Headless API logic and Mono-file constraints.
---

# 🧩 Environment (The Sandbox)

Perchance is the core generator engine for RPGlitch. It is treated as a **Headless API** for state simulation and a hosting platform for the single-file web application.

## 🏗️ 1. Two-Panel Architecture

RPGlitch adheres to a strict separation of concerns within Perchance:

### Left Panel (Logic)

- Contains all platform-specific lists, logic, and variables.
- The "Backend" of the application.
- Source files: `*-left-panel.txt`.

### Right Panel (UI)

- Contains HTML, CSS, and JS (the Vite build).
- The "Frontend" of the application.
- Build Target: A single `index.html` block.

## 🛠️ 2. Essential Plugins

| Plugin             | Purpose                                           |
| :----------------- | :------------------------------------------------ |
| **ai-text-plugin** | Primary LLM engine for story generation.          |
| **text-to-image**  | Image generation bridge (Pollinations).           |
| **save-plugin**    | LocalStorage backup (Legacy; use **Data** skill). |

## 🔌 3. Scripting API (`oc`)

RPGlitch hooks into the Perchance `oc` object for data evaluation:

- **`oc.get_all_items()`**: Retrieves list scope.
- **`oc.evaluate()`**: Forces node rero-rolling.

## 🧪 4. The Director Pattern (Pattern C)

RPGlitch bypasses default global shuffle state in favor of a single **Director** object. This ensures complex branching and state consistency across the simulation tick.
