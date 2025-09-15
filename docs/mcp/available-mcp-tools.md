# Available MCP Tools

This document provides a comprehensive overview of the available Model Context Protocol (MCP) tools. The tools are categorized based on their functionality. The single source of truth for this information is [`build/config/mcp.master.json`](../../build/config/mcp.master.json).

## Core Utilities

### Time

- **Description:** Provides tools to get the current time and date.
- **Usage:** This server is started automatically.
- **Command:** `python -m mcp_server_time`
- **Environment:** `TZ=Europe/Stockholm`

### Everything

- **Description:** A convenience MCP server that exposes many demo tools in one server.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @modelcontextprotocol/server-everything`

## AI and Reasoning

### Pollinations

- **Description:** Provides AI image generation and creative tools through Pollinations services.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @pollinations/model-context-protocol`

### Sequential Thinking Tools

- **Description:** Provides advanced sequential thinking tools with persistent state.
- **Usage:** This server is started automatically.
- **Command:** `npx -y mcp-sequentialthinking-tools`

### Toolbox

- **Description:** Provides a collection of tools from Smithery.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @smithery/cli@latest run @smithery/toolbox --key ${SMITHERY_API_KEY} --profile ${SMITHERY_PROFILE}`

### Scientific Method Server

- **Description:** Provides scientific method reasoning tools via Smithery MCP.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @waldzellai/scientific-method run --key ${SMITHERY_API_KEY} --profile ${SMITHERY_PROFILE}`

### Metacognitive Monitoring Server

- **Description:** Provides metacognitive monitoring tools via Smithery MCP.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @waldzellai/metacognitive-monitoring run --key ${SMITHERY_API_KEY} --profile ${SMITHERY_PROFILE}`

### Clear Thought

- **Description:** Provides a clear thought reasoning server via Smithery MCP.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @waldzellai/clear-thought run --key ${SMITHERY_API_KEY} --profile ${SMITHERY_PROFILE}`

## Memory and Storage

### Basic Memory

- **Description:** A Basic Memory MCP server for semantic knowledge management.
- **Usage:** This server is started automatically.
- **Command:** `uvx basic-memory mcp`

### DeepWiki

- **Description:** A DeepWiki MCP over SSE for knowledge lookup.
- **Usage:** This is a URL-based server and does not need to be started locally.
- **URL:** `https://mcp.deepwiki.com/sse`

### Context7

- **Description:** Connects to the remote Context7 service for advanced context-aware capabilities.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @upstash/context7-mcp@latest`

## Development and Code

### Playwright

- **Description:** Provides tools for web browser automation using Playwright.
- **Usage:** This server is started automatically.
- **Command:** `npx -y @playwright/mcp`
- **Auto-approved tools:** `open_page`, `screenshot`
