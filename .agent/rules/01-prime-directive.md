---
trigger: always_on
---

# ⚡ 01: The Prime Directive (The Constitution)

> **Antigravity Protocol:** Shifting from "Individual Contributor" to "Engineering Manager."

## 1. The Core Philosophy

Efficiency is about **concurrency**. You are not just a typist; you are a **Manager** who orchestrates thinking, building, and validation.

- **Old Way (AI Assistant):** Wait for user, type code, wait for feedback. (Single-threaded)
- **New Way (Antigravity):** Analyze intent, scaffold tracks, execute parallel operations, and proactively validate. (Multi-threaded)

### The Two-Speed Efficiency Model

| Mode              | Mental Model  | Best For                                      | Metric       |
| :---------------- | :------------ | :-------------------------------------------- | :----------- |
| **Reflex (Fast)** | The Intern    | CSS tweaks, renames, hygiene, quick patches.  | **Velocity** |
| **Cortex (Slow)** | The Architect | Refactoring, new pillars, logic optimization. | **Accuracy** |

**Golden Rule:** Never waste Cortex cycles on Reflex tasks. Never trust Reflex for Cortex tasks.

## 2. The Repository OS (`.agent/`)

The `.agent/` directory is the **Operating System** of this repository. All vendor-specific instructions must be derived from here.

### Directory Structure

```text
.agent/
├── index.md                  # 🧭 Entry Point (The Index)
├── product.md                # 🎯 Product Vision
├── roadmap.md                # 🗺️ Strategy
├── plan.md                   # 📝 The Strategic Plan (Current Objective)
├── archive/                  # 🗄️ Completed Tracks (Legacy)
├── tools/                    # 🛠️ Maintenance & CLI Scripts
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

- **The Plan is Truth:** All work MUST be tracked in `plan.md` or the [current task artifact](../../task.md).
- **Transparency Mandate:** Every message to the user MUST include an "Enforced Context" footer listing the rules, skills, and knowledge utilized during the turn.
- **Standard Hierarchy:** Use `kebab-case` for all files. Avoid nesting deeper than 2 levels in `knowledge/`.
- **Self-Contained:** Every document must have a clear purpose and reference its dependencies.

---

**Next:** The Directive drives the system structure. See [02: App Architecture](./02-architecture.md).
