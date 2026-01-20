---
name: docs
description: Triggers on **/*.md, .agent/**, or where otherwise relevant.
---

# Docs: Living Memory & Skill Architecture

This skill synthesizes the "Antigravity" Agent-First methodology with best practices for documentation and modular skill management.

## When to use this skill

- Creating or modifying any `.md` file in the repository.
- Updating or auditing the `.agent/` directory (the "Brain" of the repo).
- Crafting new behavioral modules (skills) in `.agent/skills/`.
- Managing messy notes or brain-dumps.

## The Documentation Philosophy

### 🏗️ From "Typist" to "Manager"

Documentation isn't just text; it's the code that governs agent behavior. Your role is to manage the **Concurrency** of the system by ensuring all agents share a **Unified Source of Truth**.

### ⚡ The Two-Speed Model

- **Reflex (Fast):** Use for small tweaks (CSS, variable renames, comments).
- **Cortex (Plan):** Use for deep architectural documentation and complex refactoring plans.

---

## The Sacred Notebooks

### 🏠 README.md: The Human Love Letter

The `README.md` is the project's front porch—a warm, welcoming hug for the human developer.

- Keep it cozy, clear, and focused on **Human Understanding**.
- It is the anchor for human-agent trust.
- Save the clinical technicalities for the internal `.agent/` guides.

### 🍳 The Messy Kitchen: scribbles.md & scrubbles.md

These files are the project's scratchpads—brain-dumps for the **right here, right now**.

- **No polish required.** They are meant to be messy, immediate, and raw.
- They stay in the kitchen unless they are promoted to a permanent recipe (WOP or official doc).

---

## Workflow: Skill Content & Standardization

### ✍️ Content Authoring

- **Metadata Definition**: Add YAML frontmatter with `name` (folder name) and a concise `description`.
- **Logic**: Write brief instructions using bullet points and code blocks.
- **Knowledge Linkage**: Place specific reference objects in a nested `knowledge/` subfolder.

---

## Implementation Rules

- **Conciseness Over Theory**: Assume agent competence; focus only on unique logic and "How-to".
- **Living Documents**: Specifications must be updated iteratively as new patterns are discovered.
- **Code First**: A single code snippet is often worth ten paragraphs of explanation.
- **Path Standards**: Always use forward slashes `/` for paths.
- **Hierarchical Loading**: Provide only the context immediately needed; point to deeper docs for detail.

## Resources

- **Core Logic Hierarchy**:
    - `.agent/`: Entry point, product vision, roadmap, and tasks.
    - `.agent/rules/`: Passive governance, constraints, and architecture.
    - `.agent/skills/`: Specialized capabilities (like this one!).
    - `.agent/workflows/`: Saved multi-step procedures.
