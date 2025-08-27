MCP configuration refresh (2025-08-26)

Changes:

- Updated build/config/mcp.master.json to remove hardcoded API key; now uses ${SMITHERY_API_KEY}.
- Ran npm run sync:configs to propagate to .cursor/.windsurf/root mcp.json and update IDE rules/ignores.
- Preflight check run: node/npx/python OK; uvx missing; env vars not exported in shell.

Next:

- Export SMITHERY_API_KEY (and CONTEXT7_API_KEY if needed) in shell, or run MCP scripts that load .env directly (tests/mcp/run-all-mcp-tests.js).
