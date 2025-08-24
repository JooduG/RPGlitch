---
description: Proposal to consolidate MCP + memory bank documentation for clarity and single sources of truth
tags: [mcp, documentation, basic-memory]
---

# MCP + Memory Bank Docs Consolidation (Proposal)

## Targets

- rules/mcp-basic-memory.md
- rules/mcp-ecosystem.md
- rules/memory-bank-overview.md
- rules/memory-bank-workflow.md
- memory-bank/forever/mcp-server-configuration.md
- memory-bank/forever/mcp-reference.md

## Issues Observed

- Duplicated setup content across mcp-ecosystem and mcp-server-configuration.
- Mixed config targets (`mcp.json` vs `build/config/mcp.master.json`).
- Time server variants: Node (`@modelcontextprotocol/server-time`) vs Python (`mcp_server_time`).
- Inconsistent naming (`Context7` vs `context7`), tool names vs actual server-reported names.
- 3-mode integration guidance duplicated across multiple docs.

## Proposed Changes

- Single source of truth: make `build/config/mcp.master.json` authoritative for configs and reference it in all guides.
- Unify time server guidance on one implementation (prefer Node server for consistency), and mention alt Python option in a note.
- Move general references from `memory-bank/forever/*` to `rules/` as rules with YAML front matter; keep `forever` copies as historical or link-only stubs.
- Merge overlapping content:
  - Fold installation/config from `mcp-server-configuration.md` into `rules/mcp-ecosystem.md` under a “Setup” section.
  - Keep `rules/mcp-basic-memory.md` focused on Basic Memory specifics (projects, ops, troubleshooting).
  - Trim 3-mode duplication: centralize in `rules/memory-bank-workflow.md`, link from others.
- Standardize naming: use `context7` (lowercase) in examples; align tool names with what `tools/list` returns.

## Quick Wins

- Update `mcp.master.json` Basic Memory root to `.../memory-bank` (done).
- Add front matter to `memory-bank/forever/*` files or add pointers to `rules/*` where appropriate.
- Add a short “Where to configure MCP” section in all relevant docs pointing to the master config.

## Next Actions (if approved)

- Implement doc merges/moves per above, preserving backlinks and changelog entries.
- Add a compact Basic Memory “task cookbook” to `rules/mcp-basic-memory.md` with example MCP calls.
- Extend MCP test harness to validate Basic Memory read/write on a sample file under a temp project.
