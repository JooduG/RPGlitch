---
description: Deployment Protocol. Safe dispatch to production.
---

# 05-deploy (The Launch)

> **Goal:** Deliver the payload. Safe, tested, and monitored.

## 1. Triggers

- **User Request**: "Deploy", "Ship it".
- **Milestone Reached**: Feature complete and Reviewed.
- **Slash Command**: `/05-deploy`

## 2. Brain (Context Injection)

- **Package**: `package.json`
- **Output**: `dist/`

## 3. Procedures

### Phase 1: Pre-Flight

1.  **Audit**: Ensure `/04-review` was run.
2.  **Build**: `npm run build`.
    - **Result**: Must be error-free.
    - **Size**: Check bundle constraints (< 350KB).

### Phase 2: Ignition

1.  **Deploy**: Execute platform deployment (e.g., `git push`, `fly deploy`, etc).
2.  **Verify**: Open production URL.
3.  **Smoke Test**: Click the main buttons. Does it crash?

### Phase 3: Log

1.  **Update Tracks**: Add `[x] 🚀 Deployed: <Date>`.
2.  **Tag**: `git tag v<version>`.

## 4. Anti-Patterns

- **YOLO Deploy**: Shipping without building locally first.
- **Friday Deploy**: Deploying at 5pm on Friday.
- **Blind Deploy**: Not checking the live site.

## 5. Tools

- `run_command` (Build/Deploy)
