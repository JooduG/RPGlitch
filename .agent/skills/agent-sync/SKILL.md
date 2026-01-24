---
name: agent-sync
description: Triggers on AGENTS.md, .agent/config.yaml, .agent/tooling.json, .agent/index.md, or @types.d.ts. Governs bidirectional state synchronization and skill lifecycle management.
---

# Agent Sync: State & Reality Synchronization Skill

## When to use this skill

- Modifying `AGENTS.md`, `.agent/config.yaml`, `.agent/tooling.json`, or `.agent/index.md`.
- Updating global types in `types.d.ts`.
- Adding or removing behavioral modules (skills).

## The Synchronization Philosophy

Agents and the codebase must exist in a **Bi-directional Mirror State**.

- If the project's infrastructure changes, the agent's `tooling.json` must update.
- If the folder structure changes, `.agent/index.md` (Repo Overview) must reflect it.
- If logic changes, `types.d.ts` MUST be updated.

### 🔄 Bidirectional Sync Workflow

1. **Code -> Agent/Index**: After an architectural change, update `.agent/index.md` and audit `.agent/config.yaml`.

2. **Infrastructure Sync**: Execute `npm run sync` to synchronize libraries (`libs/`), ignore files, and MCP configurations via `tools/ops/sync.js`.

3. **Agent -> Code**: If an agent rule is added, ensure the codebase or types reflect it.

4. **Verification**: Run `npx svelte-check` after every sync.

---

## Skill Lifecycle Management

1. **Creation**: Create folder + `SKILL.md`. Include trigger patterns in the description.

2. **Installation**: Run `gemini skills install .agent/skills/<name>/`.

3. **Removal**: Run `gemini skills uninstall <name>` before deleting the folder.

## Instructions

- **Dependency Integrity**: Always verify the hash of downloaded libraries in `sync.js`.

- **MCP Security**: Ensure `${VARIABLE}` syntax is used in `mcp.master.json` to prevent local secret leakage into synced configs.

- **Color Sync**: Run the color sync phase of `sync.js` whenever `config.js` palette values change.

## Resources

- **Central Config**: `.agent/config.yaml`

- **Tooling Manifest**: `.agent/tooling.json`

- **Sync Engine**: `tools/ops/sync.js`

- **Ignore Source**: `ignores.master.json`

- **MCP Source**: `mcp.master.json`

- **Repo Overview**: `.agent/index.md`

- **Global Types**: `types.d.ts`

- **Prime Directive**: `AGENTS.md`
