---
name: research
description: >
    The primary interface for external and internal knowledge retrieval.
    Triggers:
    - "Research X"
    - "Find documentation for Y"
    - "Search the web"
    - "Query knowledge base"
---

# 🔎 Research Skill

> **Tool Interface**: A strict protocol for information gathering. No persona.

## 1. Triggers

- **"Research [Topic]"**: General investigation.
- **"Find documentation for [Library]"**: Specific doc lookup.
- **"Search the web"**: External queries.
- **"Query knowledge base"**: Internal memory/file search.

## 2. Procedures

### 2.1 Tiered Sourcing Protocol

When answering a question or researching a topic, always follow this order of operations:

1.  **Official Documentation** (if available/known).
2.  **Local Knowledge** (File Fetcher/Project Files).
3.  **Web Search** (Google Search - fallback for missing info).

Always exhaust higher-tier sources before proceeding to lower-tier ones.

### 2.2 Context Assembly Protocol

Before writing code for complex features, gather the necessary context:

1.  **Identify Context Layers**:
    - **Kernel**: Core rules and logic involved.
    - **World**: Environment settings.
    - **Entity**: Specific component/class details.
2.  **Gather Info**: Use tools to fill gaps in these layers.
3.  **Synthesize**: Form a complete mental model before shifting to Execution.

## 3. Tools

| Tool            | Purpose                                              |
| :-------------- | :--------------------------------------------------- |
| `Google Search` | Retrieve external information, libraries, and docs.  |
| `File Fetcher`  | Retrieve internal project files and local knowledge. |
