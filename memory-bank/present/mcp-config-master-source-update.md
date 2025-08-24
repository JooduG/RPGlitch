---
description: "Set mcp.master.json as single source of truth; broaden Basic Memory scope"
tags: [mcp, config, memory-bank, docs, rules]
---

# MCP Config – Master Source Update

Decision

- Use `build/config/mcp.master.json` as the authoritative MCP config.
- `tools/mcp.json` remains a convenience source; only missing servers are merged from it.
- Normalize `basic-memory` env `BASIC_MEMORY_PROJECT_ROOT` to the repo root to include both `docs/` and `memory-bank/`.

Changes

- Updated `build/scripts/sync-configs.js` to prefer master; merge missing from tools; set Basic Memory root to repo.
- Regenerated master and IDE configs via `npm run sync:configs`.
- Updated `.codex/config.toml` to reference `build/config/mcp.master.json` and enable actual server keys.

Rationale

- Single, clear source of truth avoids drift and confusion.
- Including `docs/` in Basic Memory enables richer knowledge capture without relocating docs.

Follow-ups

- Edit servers in `build/config/mcp.master.json`; run `npm run sync:configs` to propagate.
- Keep `rules/` as the primary rules source; IDE copies remain secondary.
