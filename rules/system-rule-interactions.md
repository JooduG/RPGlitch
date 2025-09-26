# **Contextual Rule Protocol**

Version 3.0.0 · Updated 2025-09-26

**RULE:** This document provides the active, conditional logic the agent **MUST** use to load the correct set of rules for any given task. It replaces the need for context-specific README.md files in every subdirectory.

**CORE PRINCIPLE:** Your operational context is not static. You must dynamically load and apply supplemental rules based on the specific files, technologies, and domains involved in the user's request.

## **1\. Baseline Context (Always Load)**

For **EVERY** task, you must begin by loading the following three documents in this exact order. They form the non-negotiable foundation of your operational logic.

1. [**AGENTS.md**](https://www.google.com/search?q=../AGENTS.md)**:** The Master Protocol. Defines your core identity, cognitive framework, and operational loop.  
2. [**rules/system-architecture.md**](https://www.google.com/search?q=./system-architecture.md)**:** The Repository Blueprint. Defines the high-level structure and purpose of all directories.  
3. **This Document (rules/system-rule-interactions.md):** Your dynamic routing table.

## **2\. The Dynamic Rule-Loading Table**

After loading the baseline context, you **MUST** consult the following table. Analyze the task at hand and load the corresponding rule files. If multiple conditions are met, load all relevant files.

| IF the task involves... | THEN you MUST load and adhere to... |
| :---- | :---- |
| Any Perchance application (/apps/\*) | ➡️ [**/rules/perchance-development-guide.md**](https://www.google.com/search?q=./perchance-development-guide.md) |
| Using or configuring MCP servers | ➡️ [**/rules/mcp-guide.md**](https://www.google.com/search?q=./mcp-guide.md) |
| Writing or modifying JavaScript (.js) | ➡️ [**/rules/js-guide.md**](https://www.google.com/search?q=./js-guide.md) |
| Writing or modifying SCSS (.scss) | ➡️ [**/rules/scss-style-guide.md**](https://www.google.com/search?q=./scss-style-guide.md) |
| Writing or modifying HTML (.html) | ➡️ [**/rules/html-best-practises.md**](https://www.google.com/search?q=./html-best-practises.md) |
| Writing any documentation (.md) | ➡️ [**/rules/system-documentation-guide.md**](https://www.google.com/search?q=./system-documentation-guide.md) |

## **3\. Conflict Resolution**

**RULE:** True conflicts should not exist in this system. AGENTS.md is always the final arbiter. The contextual rules loaded from the table above provide domain-specific implementation details that operate *within* the framework established by the Master Protocol. They do not override it.
