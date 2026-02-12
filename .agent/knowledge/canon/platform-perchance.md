# 🧩 Platform Canon: Perchance (The Generator Engine)

Perchance is the core generator engine for RPGlitch. It is treated as a **Headless API** for complex state simulation and a hosting platform for the single-file web application.

## 📝 1. Core Syntax (Atoms)

- **Lists:** `[character]` picks a random item. `[character.state]` picks a sub-property.
- **Weights:** `item ^2` doubles probability. `item ^0.5` halves it.
- **Identifiers:** `c = {name:"John"}` defines a persistent object. Access via `[c.name]`.
- **Logic:** `[if (age > 18) {"Adult"} else {"Minor"}]`.

## 🏗️ 2. Architectural Paradigm: Two-Panel Mode

Perchance operates using a strict separation of concerns known as the **Two-Panel Architecture**.

### The Left Panel (The "Code" / Logic)

- contains all Perchance-specific logic, lists, and variables.
- The "Backend" of the application.
- Source files: `*-left-panel.txt`.

### The Right Panel (The "Interface" / UI)

- Contains HTML, CSS, and JS.
- The "Frontend" of the application.
- Built as a single, standalone HTML block for deployment.

## 🛠️ 3. Essential Plugins

| Plugin             | Purpose                                              | Usage                      |
| :----------------- | :--------------------------------------------------- | :------------------------- |
| **ai-text-plugin** | Primary LLM engine for story generation.             | `ai({ prompt: "..." })`    |
| **text-to-image**  | Image generation bridge.                             | `image({ prompt: "..." })` |
| **save-plugin**    | LocalStorage backup (Legacy; use Scholar/IndexedDB). | `save(data)`               |

## 🔌 4. Scripting API (`oc`)

RPGlitch hooks into the Perchance `oc` object for data ingestion and evaluation.

- **`oc.get_all_items()`:** Retrieves the full scope of a list.
- **`oc.evaluate()`:** Forces a re-roll of a specific node.

## 🧪 5. The Pattern C Pattern

RPGlitch bypasses the default `oc` object for core logic in favor of **Pattern C**: a system where a single "Director" object manages complex branching and state without relying on the platform's global shuffle state.
