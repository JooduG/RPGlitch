# System Guide: Documentation & Rule Writing

This guide provides the principles and best practices for writing all documentation within this repository, including user guides, technical manuals, and the `rules/` themselves.

**Core Principle:** All documentation is written for an AI agent first, and a human second. This means clarity, consistency, structure, and machine-readability are paramount.

---

## 1. The Philosophy of "AI-First" Documentation

Writing for an AI means:

- **Be Explicit:** Avoid ambiguity. State rules and instructions directly.
- **Be Consistent:** Use the same terminology across all documents. Refer to the `docs/GLOSSARY.md`.
- **Use Structure:** Utilize Markdown headings (`#`, `##`), lists (`-`, `*`, `1.`), and code blocks to create a clear, parsable hierarchy.
- **Link Extensively:** When referencing another concept, file, or rule, provide a direct link or a clear file path.

---

## 2. Effective Rule Writing

The files in the `rules/` directory are the "source code" for the agent's behavior. They must be written with extreme care.

### The Anatomy of a Good Rule

A good rule file should contain:

1. **A Title:** A clear `<h1>` that states the rule's domain (e.g., `# JavaScript Guide: DOM Manipulation`).
2. **A Core Principle:** A single, bolded sentence at the top that summarizes the most important takeaway. This is the TL;DR for the agent.
3. **Clear Sections:** Use `<h2>` and `<h3>` headings to break the rule down into logical parts.
4. **Code Examples:** Provide clear, concise code examples for every concept. Use the "Correct" vs. "Incorrect" pattern to show best practices.
5. **Rationale:** Briefly explain *why* the rule exists. This helps both the AI and human developers understand the underlying goals.

### Example Rule Structure

```markdown
# My Awesome Rule

**Core Principle:** Always do the thing in this specific way.

---

## 1. How to Do The Thing

Here are the step-by-step instructions for doing the thing.

```javascript
// Correct Way
doTheThing();
```

## 2. How Not to Do The Thing

This is an example of what to avoid.

```javascript
// Incorrect Way
dontDoTheThing();
```

## 3. Rationale

We follow this rule because it improves performance and reduces errors.

```

---

## 3. General Documentation Tips (For `docs/`)

- **Audience is Key:** A user guide (`user-unified-system-guide.md`) should be written differently from a developer guide (`developer-orchestration-guide.md`). Avoid jargon in user-facing docs.
- **Checklists are Powerful:** For complex processes, convert paragraphs of text into a numbered or bulleted checklist. They are easier to follow for both humans and AI.
- **Keep it Updated:** Documentation is only useful if it's accurate. When you change code that affects a documented process, update the documentation in the same commit.
