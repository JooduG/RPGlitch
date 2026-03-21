# 🧩 Perchance: The Generator Engine

> **Skill:** devops
> **Red Thread:** Headless API usage for complex state simulation and generator logic.

## 📝 1. Core Syntax (Atoms)

- **Lists:** `[character]` picks random item. `[character.state]` picks sub-property.
- **Weights:** `item ^2` doubles probability. `item ^0.5` halves it.
- **Identifiers:** `c = {name:"John"}` defines a persistent object. Access via `[c.name]`.
- **Logic:** `[if (age > 18) {"Adult"} else {"Minor"}]`.

## 🧠 2. LLM Theory & Context

AI generation is vulnerable to **Contextual Drift**.

- **Context Consolidation:** Inject the `Truth Hub` and `Episodic Memory` at every turn to force "Authoritative Focus."
- **Positioning:** Place **High Authority** rules at the start and **Execution** rules at the end of the prompt to avoid data loss in long contexts.

## 🧪 3. The Pattern C Pattern

RPGlitch bypasses the default `oc` object for core logic. We use **Pattern C**: a system where a single "Director" object manages complex branching without relying on the platform's global shuffle state.

## 🔌 4. Essential Plugins

- **ai-text-plugin**: Primary LLM engine.
- **text-to-image**: Visual generation.
- **Memory Interface**: Bypasses legacy `save-plugin` for robust IndexedDB persistence.
