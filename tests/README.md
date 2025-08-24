---
description: How to run and interpret tests, including MCP tests
tags: [tests, jest, mcp]
globs: [tests/**/*]
---

## Tests Overview

- Test runner: Jest for unit/integration tests in `tests/**/*.test.js`.
- MCP tests: Node-based harness under `tests/mcp/` for stdio MCP servers.

## Commands

- Run unit tests: `npm test`
- Run all MCP tests: `npm run mcp:test`
  - Filter servers: `npm run mcp:test -- --only time,basic-memory` or `--skip playwright`
  - Adjust timeout: `npm run mcp:test -- --maxMs 15000`
- Run basic/core MCP tests: `npm run mcp:basic`

## MCP Tests

- Reads `build/config/mcp.master.json` and starts stdio-capable servers.
- Performs JSON-RPC handshake: `initialize` then `tools/list` (fallbacks supported).
- Attempts a safe tool call (`list_dir` with `{ path: '.' }`) when available.
- URL-only servers are skipped automatically.

## Logs & Artifacts

- Per-run logs and metadata are saved under `memory-bank/past/mcp-tests/<ISO-timestamp>/`.
- Files include `<server>.stdout.log`, `<server>.stderr.log`, `<server>.json`, and `summary.json`.

## Environment

- Set required variables in `.env` (export format):
  - `SMITHERY_API_KEY`, `SMITHERY_PROFILE` for Smithery stdio servers.
  - `CONTEXT7_API_KEY` for the Context7 server (optional).
  - Python and `uvx` may be required by some servers.
