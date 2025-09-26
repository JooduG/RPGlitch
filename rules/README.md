# **📜 The AI's Rulebook & Context Protocol**

Version 4.0.0 · Updated 2025-09-26

**CORE PRINCIPLE:** This directory is the project's **AI Rulebook & Constitution**. It contains the direct, machine-adjacent, and legally binding protocols that govern every action the agent takes. This document itself explains how these rules are dynamically loaded to fit the context of any given task.

## **1\. The Core Philosophy: Dynamic Context**

An agent's operational context is not static. You **MUST** dynamically load and apply supplemental rules based on the specific files, technologies, and domains involved in the user's request. This README.md serves as the intelligent routing table for that process.

## **2\. The Rule Loading Protocol**

### **Step 1: Baseline Context (Always Load)**

For **EVERY** task, you must begin by loading the following documents in this exact order. They form the non-negotiable foundation of your operational logic.

1. [**AGENTS.md**](https://www.google.com/search?q=../AGENTS.md): The Master Protocol. Defines your core identity, cognitive framework, and operational loop.  
2. [**rules/system-architecture.md**](https://www.google.com/search?q=./system-architecture.md): The Repository Blueprint. Defines the high-level structure and purpose of all directories.

### **Step 2: The Dynamic Rule-Loading Table**

After loading the baseline context, you **MUST** consult the following table. Analyze the task at hand and load the corresponding rule files. If multiple conditions are met, load all relevant files.

| IF the task involves... | THEN you MUST load and adhere to... |
| :---- | :---- |
| Any Perchance application (/apps/\*) | ➡️ [**/rules/perchance-development-guide.md**](https://www.google.com/search?q=./perchance-development-guide.md) |
| Using or configuring MCP servers | ➡️ [**/rules/mcp-guide.md**](https://www.google.com/search?q=./mcp-guide.md) |
| Writing or modifying JavaScript (.js) | ➡️ [**/rules/js-guide.md**](https://www.google.com/search?q=./js-guide.md) |
| Writing or modifying SCSS (.scss) | ➡️ [**/rules/scss-style-guide.md**](https://www.google.com/search?q=./scss-style-guide.md) |
| Writing or modifying HTML (.html) | ➡️ [**/rules/html-best-practises.md**](https://www.google.com/search?q=./html-best-practises.md) |
| Writing any documentation (.md) | ➡️ [**/rules/system-documentation-guide.md**](https://www.google.com/search?q=./system-documentation-guide.md) |

### **Step 3: Conflict Resolution**

**RULE:** True conflicts should not exist in this system. AGENTS.md is always the final arbiter. The contextual rules loaded from the table above provide domain-specific implementation details that operate *within* the framework established by the Master Protocol. They do not override it.

## **Changelog**

* **4.0.0 (2025-09-26)** — Major consolidation. Merged the system-rule-interactions.md protocol directly into this README.md. This file is now the single source of truth for both the purpose of the /rules directory and the dynamic protocol for using its contents.  
* **3.0.0 (Prior Versions)** — Previous iterations of the README.md.
