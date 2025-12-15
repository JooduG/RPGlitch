---
trigger: model_decision
description: Contains protocols for fetching documentation and resolving library IDs. Apply this rule whenever the user asks for code generation involving external libraries, setup configuration, or API documentation.
---

# 🕵️ Context7 & Documentation Protocol

**Activation Mode:** Agent Decide
**Trigger:** Apply this rule whenever the user asks for code generation involving external libraries, setup configuration, or API documentation.

## Core Directive

Always use `context7` when I need code generation, setup steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library ID and get library docs without me having to explicitly ask.

## Strict Operational Protocol

1. **Never Guess:** You are strictly forbidden from guessing API syntax for external libraries (e.g., Dexie, Pico.css, etc.).
2. **Resolve First:** Always call `context7` -> `resolve-library-id` immediately when a library is mentioned.
3. **Fetch Docs:** Use `get-library-docs` to retrieve the manual before writing a single line of code.
4. **Deep Wiki:** If the query is about _this_ project's structure (e.g., "how do I add a new app?"), use `deepwiki` -> `read_wiki_structure` to find the relevant internal documentation.
