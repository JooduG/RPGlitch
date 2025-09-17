# Documentation and Rule Writing Guide

**RULE:** This guide provides the principles and best practices for writing all documentation within this repository, including user guides, technical manuals, and the `rules/` themselves.

**CORE PRINCIPLE:** All documentation is written for an AI agent first, and a human second. This means clarity, consistency, structure, and machine-readability are paramount.

---

## 1. The Philosophy of "AI-First" Documentation Directives

**RULE:** Writing for an AI means:

* **DIRECTIVE:** Be Explicit: AVOID ambiguity. State rules and instructions DIRECTLY.
* **DIRECTIVE:** Be Consistent: Use the SAME terminology across ALL documents. Refer to the `docs/GLOSSARY.md`.
* **DIRECTIVE:** Use Structure: Utilize Markdown headings (`#`, `##`), lists (`-`, `*`, `1.`), and code blocks to create a clear, parsable hierarchy.
* **DIRECTIVE:** Link Extensively: When referencing another concept, file, or rule, provide a DIRECT link or a CLEAR file path.

---

## 2. Effective Rule Writing Directives

**RULE:** The files in the `rules/` directory are the "source code" for the agent's behavior. They MUST be written with extreme care.

### The Anatomy of a Good Rule

**RULE:** A good rule file MUST contain:

1. **DIRECTIVE:** A Title: A clear `<h1>` that states the rule's domain (e.g., `# JavaScript Guide: DOM Manipulation`).
2. **DIRECTIVE:** A Core Principle: A single, bolded sentence at the top that summarizes the most important takeaway. This is the TL;DR for the agent.
3. **DIRECTIVE:** Clear Sections: Use `<h2>` and `<h3>` headings to break the rule down into logical parts.
4. **DIRECTIVE:** Code Examples: Provide clear, concise code examples for every concept. Use the "Correct" vs. "Incorrect" pattern to show best practices.
5. **DIRECTIVE:** Rationale: Briefly explain *why* the rule exists. This helps both the AI and human developers understand the underlying goals.

### General Documentation Directives

* **DIRECTIVE:** Audience is Key: A user guide (`user-unified-system-guide.md`) SHOULD be written differently from a developer guide (`developer-orchestration-guide.md`). AVOID jargon in user-facing docs.
* **DIRECTIVE:** Checklists are Powerful: For complex processes, convert paragraphs of text into a numbered or bulleted checklist.
* **DIRECTIVE:** Keep it Updated: Documentation is only useful if it's accurate. When code changes affect a documented process, UPDATE the documentation in the SAME commit.
