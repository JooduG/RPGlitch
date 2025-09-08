# MCP Master Reference

This document serves as the central reference for the Metacognitive Process (MCP) agent's rule system. It outlines the different categories of rules that govern the agent's behavior, thinking, and interaction with the repository.

**Core Principle:** This is the primary entry point for understanding the agent's capabilities and constraints. The agent should reference this document to understand the scope of its own knowledge base.

---

## 1. Rule System Overview

The agent's "mind" is defined by a collection of Markdown files located in the `/rules/` directory. These files are organized by category to provide a structured knowledge base. The system is designed to be read and understood by the agent itself to guide its operations.

The `build/scripts/sync-configs.js` script is responsible for reading these rules and compiling them into a machine-readable format (`build/config/mcp.master.json`), which is then consumed by the agent at runtime.

## 2. Categories of Rules

### `html-*.md`

- **Purpose:** Governs the structure, semantics, and best practices for all HTML code.
- **Key Files:**
  - `html-best-practices.md`: Foundational rules for valid, semantic, and accessible HTML.
  - `html-hyperscript-guide.md`: Rules for using the `_hyperscript` library for simple UI interactions.

### `js-*.md`

- **Purpose:** Defines the complete set of rules for JavaScript development, from style to architecture.
- **Key Files:**
  - `js-dom-guide.md`: Rules for DOM manipulation using `cash`.
  - `js-storage-guide.md`: Rules for client-side storage using `Dexie.js`.
  - `js-modern-guide.md`: Mandates the use of modern ES6+ features and APIs.
  - `js-ecosystem-overview.md`: An overview of the libraries used in the project.
  - `js-patters-practices.md`: Defines architectural patterns like IIFE and data flow.

### `mcp-*.md`

- **Purpose:** These are meta-rules that define the agent's own cognitive processes and core functions.
- **Key Files:**
  - `mcp-basic-memory.md`: Defines how the agent interacts with its long-term memory system (`/memory-bank/`).
  - `mcp-pre-task-protocol.md`: Specifies the mandatory checklist for gathering context before starting a task.
  - `mcp-time.md`: Rules for how the agent handles dates and times.

### `scss-*.md`

- **Purpose:** Defines the standards for writing styles.
- **Key Files:**
  - `scss-style-guide.md`: The single source of truth for SCSS architecture, patterns, and best practices.

### `system-*.md`

- **Purpose:** High-level rules that govern the entire repository's architecture and documentation standards.
- **Key Files:**
  - `system-architecture.md`: The architectural blueprint for the whole project.
  - `system-documentation-guide.md`: Rules and guidelines for writing any documentation.
  - `system-orchestration-mode.md`: Defines the agent's main operational modes.
  - `system-rule-interactions.md`: Explains how rules are prioritized and combined.

### `thinking-*.md`

- **Purpose:** Defines the agent's cognitive framework and problem-solving approach.
- **Key Files:**
  - `thinking-framework.md`: The core model for how the agent "thinks" through a problem.
