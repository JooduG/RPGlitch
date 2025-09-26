# **AI Documentation & Rule Writing Protocol**

Version 2.0.0 · Updated 2025-09-26

**RULE:** This guide provides the principles and best practices for writing all documentation within this repository, including user guides, technical manuals, and the /rules/ themselves.

**CORE PRINCIPLE:** All documentation is written for an AI agent first, and a human second. This means clarity, consistency, structure, and machine-readability are paramount.

## **1\. The Philosophy of "AI-First" Documentation**

**RULE:** Writing for an AI means:

* **DIRECTIVE:** Be Explicit: AVOID ambiguity. State rules and instructions DIRECTLY.  
* **DIRECTIVE:** Be Consistent: Use the SAME terminology across ALL documents. Refer to the docs/GLOSSARY.md.  
* **DIRECTIVE:** Use Structure: Utilize Markdown headings (\#, \#\#), lists (-, \*, 1.), and code blocks to create a clear, parsable hierarchy.  
* **DIRECTIVE:** Link Extensively: When referencing another concept, file, or rule, provide a DIRECT and correct link or file path.

## **2\. The Anatomy of a Good Rule**

**RULE:** The files in the /rules directory are the "source code" for the agent's behavior. They MUST be written with extreme care. A good rule file MUST contain:

1. **A Title & Version:** A clear \<h1\> and version number.  
2. **A Core Principle:** A single, bolded sentence summarizing the rule's most important takeaway.  
3. **Clear Sections:** Use \<h2\> and \<h3\> headings to break the rule down into logical parts.  
4. **Actionable Directives:** Use bolded keywords like **RULE:** or **DIRECTIVE:** to signal a command.  
5. **Code Examples (If Applicable):** Provide clear examples, especially using a "Correct" vs. "Incorrect" pattern.  
6. **Rationale:** Briefly explain *why* a rule exists to provide context.

### **The Gold Standard: AGENTS.md**

**DIRECTIVE:** The Universal Agent Protocol, AGENTS.md, serves as the primary example of a well-structured rule document. It embodies all the principles listed above and should be used as a template for creating new rule files.

## **3\. General Documentation Directives**

* **DIRECTIVE:** Know Your Audience: A user guide (/docs/guides/user-unified-system-guide.md) SHOULD be written differently from a developer guide. AVOID jargon in user-facing docs.  
* **DIRECTIVE:** Use Checklists: For complex processes, convert paragraphs into a numbered or bulleted checklist.  
* **DIRECTIVE:** Keep it Updated: Documentation is only useful if it's accurate. When code changes affect a documented process, UPDATE the documentation in the SAME commit.

## **Changelog**

* **2.0.0 (2025-09-26)** — Overhauled the guide to align with the AGENTS.md refactor. Added a new section, "The Gold Standard," which points to AGENTS.md as the canonical example of a rule document. Clarified titles and directives for better machine readability.  
* **1.0.0 (Initial Version)** — Initial creation of the documentation guide.
