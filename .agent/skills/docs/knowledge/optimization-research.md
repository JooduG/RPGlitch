# 🛸 Optimizing Agent Efficiency: A Unified Strategy

> **Context:** This research synthesizes the "Antigravity" Agent-First methodology with best practices for multi-agent orchestration (Gemini CLI, Jules, Code Assist).

## 1. The Core Philosophy: From "Typist" to "Manager"

Efficiency isn't about the AI typing faster; it's about **concurrency**. The "Antigravity" paradigm shifts your role from _Individual Contributor_ to _Engineering Manager_.

- **Old Way (Copilot):** You type, AI suggests. (Single-threaded)
- **New Way (Agent-First):** You define the "What" and "Why", agents execute the "How". (Multi-threaded)

### ⚡ The Two-Speed Efficiency Model

To optimize efficiency, you must assign the right "gear" to the right task:

| Mode              | Model            | Best For                                     | Metric       |
| :---------------- | :--------------- | :------------------------------------------- | :----------- |
| **Reflex (Fast)** | Gemini 2.x Flash | "Fix CSS", "Rename var", "Add comments"      | **Velocity** |
| **Cortex (Plan)** | Gemini 3.0 Pro   | "Refactor Auth", "Migrate DB", "New Feature" | **Accuracy** |

**Efficiency Hack:** Never use Cortex for Reflex tasks (waste of money/time). Never use Reflex for Cortex tasks (guaranteed hallucination).

---

## 2. Rules vs. Skills vs. Workflows

Understanding this triad is the key to a self-regulating agent system.

### 📜 Rules (Passive Governance)

- **Definition:** "Always do X" or "Never do Y". Constraints that exist in the background.
- **Efficiency Gain:** Prevents "lint-fixing loops" and architectural drift.
- **Example:** "All UI components must use SCSS modules."
- **Location:** `.agent/rules/`.

### 🧠 Skills (Capabilities)

- **Definition:** "How to do X". specialized knowledge or tool usage.
- **Efficiency Gain:** Packages expertise so the agent doesn't have to "derive" it from first principles every time.
- **Example:** "How to deploy to Cloud Run" or "How to use the internal component library."
- **Location:** `.agent/skills/`.

### ⚡ Workflows (Active Procedures)

- **Definition:** "Do X, then Y, then Z". A saved sequence of prompts.
- **Efficiency Gain:** Automates repetitive multi-step processes (e.g., "Analyze -> Plan -> Code -> Verify").
- **Example:** `/modernize` (Refactor legacy code) or `/test-ui` (Run E2E tests).
- **Location:** `.agent/workflows/`.

---

## 3. Centralizing Agent Understanding (The `.agent` Monolith)

To ensure **Antigravity**, **Gemini Code Assist**, **Jules**, and **Gemini CLI** all share the same brain, you need a Unified Source of Truth.

**The Strategy:** Treat `.agent/` as the "Operating System" for your repository. All agents must be configured to read from this root.

### 📂 Recommended Folder Structure

```text
.agent/
├── index.md             # 🧭 Entry Point (The Index)
├── product.md           # 🎯 Product Vision (What are we building?)
├── roadmap.md           # 🗺️ Strategy (Where are we going?)
├── tasks.md             # ✅ Execution (What are we doing now?)
│
├── rules/               # 📜 The "Constitution" (Passive Constraints)
│   ├── architecture.md  # "Business logic goes in /core"
│   ├── tech-stack.md    # "Use Svelte 5 runes, no Tailwind"
│   └── workflow.md      # "Always use TDD"
│
├── skills/              # 🛠️ The "Toolbelt" (How-to Guides)
│   ├── svelte/          # Specific framework skills
│   └── tasks/           # Task management and lifecycle
│
├── workflows/           # ⚡ The "Playbook" (Saved Prompts)
│   ├── deploy.md
│   └── refactor.md
│
└── knowledge/           # 📚 The "Library" (Long-term Memory)
    └── legacy-patterns.md # "How we did things in 2023"
```

### 🔗 How They Connect

1. **Antigravity (The Orchestrator):** Natively looks for `.agent/rules` and `.agent/workflows`. It is the primary consumer of this structure.
2. **Gemini CLI:** Configured to read context from `.agent/index.md` and `.agent/product.md`. It acts as the "manual override" interface.
3. **Jules (The Task Runner):** Should be pointed to `.agent/rules/tech-stack.md` as its primary context file. It stores its execution state in `.agent/tasks.md`.
4. **Gemini Code Assist (The IDE Plugin):** Should be configured (via `.vscode/settings.json` or similar) to index `.agent/rules` as high-priority context.

## 4. Summary Checklist for Optimization

1. ✅ **Consolidate:** Move all "docs" that aren't for end-users into `.agent/`.
2. ✅ **Define:** Write a `tech-stack.md` that explicitly bans patterns you hate (e.g., "No Tailwind").
3. ✅ **Automate:** Turn your most frequent prompts into `.agent/workflows/`.
4. ✅ **Differentiate:** Use Flash for easy stuff, Pro for hard stuff.
