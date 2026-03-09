---
description: Deployment Protocol. Safe dispatch to production.
disable-model-invocation: true
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
    - **Result**: Must be error-free. **Evidence Gate:** You must read the fresh terminal output to confirm 0 compilation errors.
    - **Size**: Explicitly verify the final bundle size constraints (< 350KB) from the build output. No estimations allowed.

### Phase 2: Ignition

1.  **Deploy**: Execute platform deployment (e.g., `git push`, `fly deploy`, etc). **Evidence Gate:** Do not assume the push worked; read the exit status from the deployment CLI.
2.  **Verify**: Open production URL.
3.  **Smoke Test**: Click the main buttons. Does it crash? You must explicitly confirm functional UI rendering in the live environment before declaring success.

### Phase 3: Log

1.  **Update Tracks**: Add `[x] 🚀 Deployed: <Date>`.
2.  **Tag**: `git tag v<version>`.

## 4. Anti-Patterns

- **YOLO Deploy**: Shipping without building locally first.
- **Friday Deploy**: Deploying at 5pm on Friday.
- **Blind Deploy**: Not checking the live site.
- **Premature Celebration**: Claiming the deployment was successful just because the `git push` command was fired, without verifying the live production environment.

## 5. Tools

- `run_command` (Build/Deploy)
