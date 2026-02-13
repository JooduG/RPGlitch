---
description: Deployment Protocol.
---

# 10-deploy (The Launch)

> **Goal:** Safe, tested dispatch of the codebase to production.

## 1. Triggers

- **User Request**: "Deploy", "Ship it".
- **Milestone Complete**: All tracks done.
- **Slash Command**: `/10-deploy` (or legacy `/ship`)

## 2. Brain (Context Injection)

- **Tracks**: `.agent/tasks/tracks.md`
- **Package**: `package.json`

## 3. Capabilities

- **Auditor**: Final Gatekeeper.
- **Builder**: Build & Deploy.

## 4. Procedures

### Phase 1: The Gatekeeper (Auditor)

1.  **Test**: Run `npm test`.
    - **CRITICAL**: If this fails, **ABORT**.

### Phase 2: The Build (Builder)

1.  **Clean**: Run `07-hygiene` (optional but recommended).
2.  **Build**: Run `npm run build`.
    - Verify strict/production mode is enabled.

### Phase 3: The Launch (Builder)

1.  **Deploy**: Execute deployment command (platform specific).
2.  **Log**: Update `tracks.md` with:
    - `[x] 🚀 Deployed: [YYYY-MM-DD HH:MM]`

## 5. Anti-Patterns

- **YOLO Deploy**: Skipping tests.
- **Dirty Deploy**: Deploying uncommitted changes.

## 6. Tools

- `run_command`
