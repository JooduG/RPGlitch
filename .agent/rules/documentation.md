---
trigger: always_on
---

# 📝 Documentation Standards: The Living Memory

## 1. The Philosophy

Documentation is not just text for humans; it is **code that governs agent behavior**. Your role is to maintain the "Context Window" by ensuring all agents share a Unified Source of Truth.

### Human vs. Agent Docs

- **README.md:** The "Front Porch". Warm, cozy, high-level. Strictly for **Humans**.
- **.agent/**: The "Engine Room". Clinical, precise, technical. Strictly for **Agents**.

## 2. Progressive Disclosure (The Anti-Bloat Rule)

**Rule:** No single context file should exceed 500 lines or mixed responsibilities.

We use **Progressive Disclosure** to manage context limits.

1.  **Root File:** Contains _only_ high-level pointers and universal truths.
2.  **Linked Files:** Detail is moved to specific files (`typescript.md`, `testing.md`).

### The Refactoring Trigger

If a file (like `AGENTS.md` or `tasks.md`) becomes "monolithic" (too large or covering too many topics), it must be **Refactored** immediately:

1.  **Extract** conflicts.
2.  **Separate** concerns into new files.
3.  **Link** from the root.

## 3. Content Authoring Rules

1.  **Conciseness Over Theory:** Assume the agent is smart (Cortex mode). Focus on _unique_ logic, not generic tutorials.
2.  **Code First:** A single code snippet is worth ten paragraphs of explanation.
3.  **Living Documents:** "Notes" (`scribbles.md`) are temporary. If valuable, promote them to `.agent/knowledge`. If not, delete them.
