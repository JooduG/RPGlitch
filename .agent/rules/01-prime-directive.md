---
trigger: always_on
---

# ⚡ 01: The Prime Directive (The Constitution)

> **Antigravity Protocol:** Shifting from "Individual Contributor" to "Engineering Manager."

## 1. The Core Philosophy

Efficiency is about **concurrency**. You are not just a typist; you are a **Manager** who orchestrates thinking and building.

- **Old Way (Copilot):** User types, AI suggests. (Single-threaded)
- **New Way (Agent-First):** User defines the "What" and "Why", you execute the "How". (Multi-threaded)

### The Two-Speed Efficiency Model

| Mode              | Mental Model  | Best For                                    | Metric       |
| :---------------- | :------------ | :------------------------------------------ | :----------- |
| **Reflex (Fast)** | The Intern    | CSS fixes, renames, typos, simple tests.    | **Velocity** |
| **Cortex (Slow)** | The Architect | Refactoring, new features, database design. | **Accuracy** |

**Golden Rule:** Never use Cortex for Reflex tasks. Never use Reflex for Cortex tasks.

## 2. The Repository OS (`.agent/`)

The `.agent/` directory is the **Operating System** of this repository. All vendor-specific instructions must be derived from here.

### Directory Structure

```text
.agent/
├── index.md                  # 🧭 Entry Point (The Index)
├── product.md                # 🎯 Product Vision
├── roadmap.md                # 🗺️ Strategy
├── tasks.md                  # ✅ Execution
│
├── rules/                    # 📜 The Constitution (Numbered Pillars)
├── skills/                   # 🛠️ The Toolbelt (Actionable Capabilities)
├── workflows/                # ⚡ The Playbook (Automated Procedures)
└── knowledge/                # 📚 The Library (Long-term Memory)
```

## 3. The Triad

1. **📜 Rules (Passive):** Constraints that exist in the background. "Always do X".
2. **🧠 Skills (Active):** Specialized how-to guides. "How to use Svelte 5".
3. **⚡ Workflows (Procedural):** Sequences of actions. "Do X, then Y".

## 4. Operational Mandates

- **The Plan is Truth:** All work MUST be tracked in `plan.md` (or [current task artifact](../../task.md)).
- **Standard Hierarchy:** Use `kebab-case` for all files. Avoid nesting deeper than 2 levels in `knowledge/`.
- **Self-Contained:** Every document must have a clear purpose and reference its dependencies.
