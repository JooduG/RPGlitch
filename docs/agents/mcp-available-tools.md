# Available MCP Tools

This document provides a comprehensive overview of the available Model Context Protocol (MCP) tools, optimized for agent understanding and usage. The tools are categorized based on their functionality.

The single source of truth for the server configurations is [`build/config/mcp.master.json`](../build/config/mcp.master.json).

## Core Utilities

| Server | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Time** | Provides tools to get the current time and convert between timezones. Essential for scheduling and time-sensitive tasks. | `get_current_time`, `convert_time` |
| **Everything** | A demonstration server that includes a variety of sample tools for testing and exploration. | `echo`, `add`, `longRunningOperation` |

## AI and Reasoning

| Server | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Pollinations** | Connects to Pollinations AI for creative tasks. I can use this to generate images and text. | `generateImageUrl`, `generateText`, `listImageModels` |
| **Sequential Thinking** | Enables structured, multi-step problem-solving. I can use this to break down complex tasks into a series of thoughts. | `sequentialthinking_tools`, `sequentialthinking` |
| **Toolbox** | Provides a general-purpose set of tools from Smithery for various tasks. | `search_servers`, `use_tool` |
| **Scientific Method** | Allows me to apply a formal, step-by-step scientific process to investigate questions and test hypotheses. | `scientificMethod` |
| **Metacognitive Monitoring** | A tool for self-reflection and reasoning analysis. I can use it to assess my own knowledge and confidence. | `metacognitiveMonitoring` |
| **Clear Thought** | A reasoning framework that combines several structured thinking tools for comprehensive problem analysis. | `decisionframework`, `structuredargumentation`, `visualreasoning` |

## Memory and Storage

| Server | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Basic Memory** | My primary tool for long-term semantic knowledge storage and retrieval. I can read, write, and search notes. | `read_note`, `write_note`, `search_notes`, `edit_note` |
| **DeepWiki** | A remote knowledge lookup service. I can use this to query the DeepWiki knowledge base. | `read_wiki_structure`, `read_wiki_contents`, `ask_question` |
| **Context7** | Provides access to up-to-date external documentation for libraries and packages. | `resolve_library_id`, `get_library_docs` |

## Development and Code

| Server | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Playwright** | Enables browser automation. I can use this to navigate web pages, interact with elements, and take screenshots. | `browser_navigate`, `browser_click`, `browser_snapshot`, `browser_type` |
