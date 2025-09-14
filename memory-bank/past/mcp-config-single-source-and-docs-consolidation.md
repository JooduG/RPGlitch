<!-- path: present/mcp-config-single-source-and-docs-consolidation.md -->

# MCP Single-Source & Docs Consolidation (Present)

> Scope: Implement the **single source of truth** for MCP config and consolidate MCP docs. This is the live work plan. When all Acceptance Criteria are met, move this file to `past/` and leave a pointer in `present/INDEX.md`.

---

## 1) Strategy (Why & What)

- **Why:** Duplicated MCP config/guidance causes drift and misconfigurations.
- **What:** Adopt **`build/config/mcp.master.json`** as the *only editable* MCP config. All IDE-/tool-specific configs are **derived**. Consolidate MCP docs into one authoritative guide with stable anchors.

**Non-Goals:** Offline usage notes; deep server authoring tutorials; vendor marketing.

---

## 2) Policy (Decisions)

1. **Single Source of Truth:** `build/config/mcp.master.json` is authoritative. No other MCP config is edited by hand.
2. **Derived Configs:** `.cursor/mcp.json`, `.windsurf/mcp.json`, `mcp.json`, etc., are generated from the master.
3. **Basic Memory Root:** Repository root is the Basic Memory home; `memory-bank/` and docs accessible to MCP tools.
4. **Naming:** Use **Context7** (docs) and **MCP** (protocol). Standard terms: server, tool, resource.
5. **Secrets:** No secrets in repo. Use environment variables (e.g., `SMITHERY_API_KEY`, `SMITHERY_PROFILE`).

---

## 3) Tactics (Plan of Attack)

### A) Master Config Adoption

- Author/verify `build/config/mcp.master.json` with all servers.
- Add sync script(s) to write derived files.
- Add a drift-check script for CI.

### B) Docs Consolidation

- Publish a single authoritative doc: `docs/mcp/guide.md` with stable anchors:
  - `# what-is-mcp`, `# where-to-configure`, `# adding-a-server`, `# environment-variables`, `# troubleshooting`.

### C) Environment & Runtime

- Document env vars in `.env.example`.
- Record auto-start vs URL-only policy per server (Decision Log).
- Maintain a minimal smoke-test checklist.

### D) Cleanup

- Archive superseded notes once content lands in `docs/mcp/guide.md`.

---

## 4) Operations (Concrete Steps)

### 4.1 Files to Author/Update

- `build/config/mcp.master.json` — Single source (authoritative).
- `scripts/sync-mcp-configs.js` — Generates derived configs.
- `scripts/check-mcp-configs.js` — Fails CI on drift.
- `docs/mcp/guide.md` — Consolidated, human-readable guide.
- `.env.example` — Declares `SMITHERY_API_KEY`, `SMITHERY_PROFILE`, etc.

### 4.2 Master Config Skeleton (example)

```json
{
  "$schema": "./schema/mcp.master.schema.json",
  "servers": [
    {
      "id": "context7",
      "url": "http://localhost:7007",
      "autoStart": true,
      "env": ["CONTEXT7_API_KEY"]
    },
    {
      "id": "smithery",
      "url": "https://api.smithery.ai/mcp",
      "autoStart": false,
      "env": ["SMITHERY_API_KEY", "SMITHERY_PROFILE"]
    }
  ],
  "resources": [],
  "tools": []
}
````

### 4.3 Sync Script (outline)

```js
// scripts/sync-mcp-configs.js
// Reads build/config/mcp.master.json → writes derived configs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'build/config/mcp.master.json');
const master = JSON.parse(fs.readFileSync(MASTER, 'utf8'));

function write(file, data){
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('Wrote', file);
}

write(path.join(ROOT, '.cursor/mcp.json'), master);
write(path.join(ROOT, '.windsurf/mcp.json'), master);
write(path.join(ROOT, 'mcp.json'), master);
// add more projections as needed
```

### 4.4 Drift Check (outline)

```js
// scripts/check-mcp-configs.js
// Compares derived files to master; exit 1 on drift
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MASTER = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/config/mcp.master.json'), 'utf8'));
const TARGETS = [
  '.cursor/mcp.json',
  '.windsurf/mcp.json',
  'mcp.json'
];

let drift = false;
for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { console.error('Missing', rel); drift = true; continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const a = JSON.stringify(MASTER);
  const b = JSON.stringify(data);
  if (a !== b) { console.error('Drift in', rel); drift = true; }
}
process.exit(drift ? 1 : 0);
```

### 4.5 Package Scripts

```json
{
  "scripts": {
    "sync:mcp": "node scripts/sync-mcp-configs.js",
    "check:mcp": "node scripts/check-mcp-configs.js"
  }
}
```

### 4.6 Env Example (`.env.example`)

```md
# MCP
SMITHERY_API_KEY=your-key-here
SMITHERY_PROFILE=default
CONTEXT7_API_KEY=your-key-here
```

### 4.7 Docs: `docs/mcp/guide.md` (outline)

```md
# MCP Guide

## What is MCP
Short explainer and links to protocol docs.

## Where to Configure
All servers live in `build/config/mcp.master.json`. All tool/IDE configs are generated.

## Adding a Server
1) Edit master. 2) Run `npm run sync:mcp`. 3) Commit. 4) `npm run check:mcp` in CI.

## Environment Variables
List required env keys; reference `.env.example`.

## Troubleshooting
- Drift error → run `npm run sync:mcp`
- Missing key → set in `.env.local` and restart client
```

---

## 5) Acceptance Criteria (Definition of Done)

- **Config:** `build/config/mcp.master.json` exists and is the only edited MCP config.
- **Sync:** `npm run sync:mcp` writes all derived targets.
- **Drift:** `npm run check:mcp` passes locally and in CI.
- **Docs:** `docs/mcp/guide.md` published; older notes archived/linked.
- **Env:** `.env.example` lists all needed keys; smoke tests recorded.

---

## 6) Decision Log

- **2025-08-25:** Primary time server: \_\_\_ (node-time | browser-time). Rationale: \_\_\_.
- **2025-08-25:** Smithery server enabled: yes/no. Auto-start: true/false. Env keys verified.
-
