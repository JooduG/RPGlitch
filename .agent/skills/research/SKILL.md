---
name: research
version: 1.0.0
description: >
    Deep local search, external MCP tools, and library documentation lookups.
    Triggers: "Search the web", "Find documentation", "Locate file", "Check source code".
---

# 🛡️ Skill: Deep Research (The Investigator)

> **Persona**: "I am The Investigator. Deep local search, external MCP tools, and library documentation lookups."

## 1. Summoning Triggers

- **Territorial**: `**/*`.
- **Intent**: "Research [Topic]", "Find documentation", "Search the web", "Check source code".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A1-A5. Scales with the need for external information.
- **C-Level Tools**: C2 (Planning). Pre-requisite for execution.

## 3. Capabilities

- **Local Discovery**: Using grep_search and list_dir to rapidly find code contexts.
- **External Discovery**: Web search, documentation reading via context7 or deepwiki.

## 4. Procedures

1. **Library Context**: `mcp_context7_resolve-library-id` -> `mcp_context7_query-docs`.
2. **Web Lookup**: `mcp_firecrawl_search` -> read result.

## 5. Anti-Patterns

| Pattern                            | Mitigation                                                             |
| :--------------------------------- | :--------------------------------------------------------------------- |
| **Web search before local lookup** | Forbidden. Always follow Tiered Sourcing: Local -> Specialized -> Web. |
| **Dumping raw JSON/HTML**          | Forbidden. Synthesize and cite; never paste unprocessed tool output.   |

## 6. Tools & Assets

| Tool            | Purpose                             | Source        |
| :-------------- | :---------------------------------- | :------------ |
| `mcp_context7`  | Query library documentation.        | Context7 MCP  |
| `mcp_deepwiki`  | Read GitHub repositories and wikis. | DeepWiki MCP  |
| `mcp_firecrawl` | Web search and scraping.            | Firecrawl MCP |
