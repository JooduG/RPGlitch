---
description: Added MCP servers from scribbles to master config, sanitized secrets
tags: mcp, tooling, config
permalink: past-mcp-master-update-2025-08-22
---

# MCP Master Config Update (2025-08-22)

- Source: `memory-bank/scribbles.md`
- Target: `build/config/mcp.master.json`
- Change: Added entries for Microsoft Docs, DeepWiki, and several Smithery-hosted MCPs (Multi-Agent Debate, NPM Sentinel, HuggingFace, PapersWithCode, Scientific Method, Metacognitive Monitoring, Clear Thought, Sourcebot Code Search, Codebase Context Dumper, Markdown Rules), plus `server-everything` via `npx`.
- Security: Replaced raw `api_key` and `profile` query params with placeholders `${SMITHERY_API_KEY}` and `${SMITHERY_PROFILE}` to avoid committing secrets.
- Validation: JSON parsed successfully after update.

## Follow-ups

- Set environment variables `SMITHERY_API_KEY` and `SMITHERY_PROFILE` for runtime.
- Confirm which servers should auto-start vs. remain URL-only.
