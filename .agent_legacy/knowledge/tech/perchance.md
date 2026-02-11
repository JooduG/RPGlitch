# 🧩 Gamemaster: Perchance (The Generator Engine)

Perchance is the core generator engine. RPGlitch treats it as a **Headless API** for complex state simulation.

## 📝 1. Core Syntax (Atoms)

- **Lists:** `[character]` picks random item. `[character.state]` picks sub-property.
- **Weights:** `item ^2` doubles probability. `item ^0.5` halves it.
- **Identifiers:** `c = {name:"John"}` defines a persistent object. Access via `[c.name]`.
- **Logic:** `[if (age > 18) {"Adult"} else {"Minor"}]`.

## 🧠 2. LLM Theory & Context

AI generation is vulnerable to **Contextual Drift**.

- **Semantic Degeneracy:** The tendency for AI to drift towards generic "polite assistant" behavior.
- **The Solution:** **Context Consolidation**. We inject the `Truth Hub` and `Episodic Memory` at every turn to force "Authoritative Focus."
- **Lost in Conversation:** Important data is often lost in the middle of a large prompt. We place **High Authority** rules (Boundary Enforcement) at the very start and **Execution** rules (Physic, Entropy) at the very end.

## 🛠️ 3. Essential Plugins

| Plugin             | Purpose                 | Usage                               |
| :----------------- | :---------------------- | :---------------------------------- |
| **ai-text-plugin** | Primary LLM engine.     | `ai({ prompt: "..." })`             |
| **text-to-image**  | Pollinations.ai bridge. | `image({ prompt: "..." })`          |
| **save-plugin**    | LocalStorage backup.    | `save(data)` (Legacy; use Scholar). |

## 🔌 4. Scripting API (`oc`)

While RPGlitch uses a custom Svelte-driven state machine, we occasionally hook into the Perchance `oc` object for data ingestion.

- **`oc.get_all_items()`:** Retrieves the full scope of a list.
- **`oc.evaluate()`:** Forces a re-roll of a specific node.

## 🧪 5. The Pattern C Pattern

We bypass the default `oc` object for core logic. We use **Pattern C**: a system where a single "Director" object manages complex branching without relying on the platform's global shuffle state.
