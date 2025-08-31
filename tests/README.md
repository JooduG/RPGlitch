# Agent Rules

This directory is the "constitution" for the AI agent. It contains a comprehensive set of machine-readable Markdown files that define the agent's behavior, knowledge, and constraints.

## Purpose

These files are not just documentation; they are the functional source code for the agent's "thinking" process. The agent is required to read and adhere to these rules for every task it performs. The `build/scripts/sync-configs.js` script processes these files into a format the agent can consume directly.

## Contents

The rules are organized by prefixes into several categories:

- **`html-*.md`**: Rules for writing HTML.
- **`js-*.md`**: A comprehensive set of guides for writing JavaScript.
- **`mcp-*.md`**: Meta-rules that govern the agent's core cognitive functions.
- **`scss-*.md`**: The style guide for writing SCSS.
- **`system-*.md`**: High-level rules for the repository architecture and documentation.
- **`thinking-*.md`**: Defines the agent's problem-solving framework.
- **`/templates`**: Contains templates for generating common documents.

## How to Use This Folder

- **For the Agent:** Before any task, the agent must identify and read all relevant rule files based on the task description, as defined in the Pre-Task Protocol.
- **For Developers:** When modifying the agent's behavior or updating a coding standard, the corresponding rule file in this directory must be updated. This is the single source of truth.
