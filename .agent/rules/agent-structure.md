---
trigger: always_on
---

# 🏗️ Agent System Structure

## 1. The Unified Source of Truth

The `.agent/` directory is the **Operating System** of this repository.

- **❌ FORBIDDEN:** Logic scattered across `.cursor/`, `.windsurf/`, `.codex/`, or `.github/copilot-instructions/`.
- **✅ REQUIRED:** All vendor-specific tools must read from `.agent/`.

## 2. The Directory Structure

```text
.agent/
├── index.md                  # 🧭 Entry Point (The Index)
├── product.md                # 🎯 Product Vision (What are we building?)
├── roadmap.md                # 🗺️ Strategy (Where are we going?)
├── tasks.md                  # ✅ Execution (What are we doing now?)
│
├── rules/                    # 📜 The Constitution (Passive Constraints)
│   ├── prime-directive.md    # "How we think (Reflex vs Cortex)"
│   ├── documentation.md      # "How we write (Progressive Disclosure)"
│   ├── app-architecture.md   # "How the APP is built (Svelte 5, Pillars)" <--- YOUR EXISTING FILE
│   └── agent-structure.md    # "This file"
│
├── skills/                   # 🛠️ The Toolbelt (Capabilities)
│   ├── skill-forge/          # "The Skill Creator"
│   └── doc-surgeon/          # "The Maintenance Crew"
│
├── workflows/                # ⚡ The Playbook (Saved Prompts)
│   └── ...
│
└── knowledge/                # 📚 The Library (Long-term Memory)
    └── ...
```

## 3. File Naming & Organization

1. **Kebab-case:** All files and folders use `kebab-case` (e.g., `user-auth.md`, not `UserAuth.md`).
2. **Flat Hierarchy:** Avoid nesting more than 2 levels deep inside `knowledge/`. Use links instead of folders.
3. **Self-Contained:** Every file should have a clear purpose and ideally reference its dependencies.
