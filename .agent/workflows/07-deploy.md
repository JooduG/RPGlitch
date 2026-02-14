---
description: Deployment Protocol. Safe, tested dispatch to production.
---

# 07-deploy (The Launch)

> **Goal:** Safe, tested dispatch of the codebase to production.

## 1. Triggers

- **User Request**: "Deploy", "Ship it".
- **Milestone Complete**: All tracks done, review passed.
- **Slash Command**: `/07-deploy`

## 2. Brain (Context Injection)

- **Tracks**: `.agent/tasks/tracks.md`
- **Package**: `package.json`
- **Stack**: `.agent/rules/stack.md` (Platform constraints)

## 3. Procedures

### Phase 1: Pre-Deploy Checklist

- [ ] All tests passing (`npm test`).
- [ ] No linting errors (`npm run lint`).
- [ ] `08-hygiene` scan completed (no `console.log`, no secrets).
- [ ] Build completes without error (`npm run build`).
- [ ] Bundle size within constraints (< 350KB for Perchance).
- [ ] All tracks in `tracks.md` marked `[x]`.

> **CRITICAL**: If any item fails, **ABORT**. Fix before deploying.

### Phase 2: The Build

1. **Clean**: Clear `dist/`, `.cache/`, or build artifacts.
2. **Build**: Run `npm run build`.
    - Verify production mode is enabled.
    - Verify single-file output (Perchance constraint).

### Phase 3: The Launch

1. **Deploy**: Execute platform-specific deployment.
2. **Log**: Update `tracks.md` with:
    - `[x] 🚀 Deployed: [YYYY-MM-DD HH:MM]`

### Phase 4: Post-Deploy

1. **Verify**: Test critical user flows on the live deployment.
2. **Monitor**: Check for errors in the first 15 minutes.
3. **Commit**: `gamemaster(deploy): Ship v<version>`.

## 4. Anti-Patterns

- **YOLO Deploy**: Skipping tests.
- **Dirty Deploy**: Deploying uncommitted changes.
- **No Monitoring**: Walking away after deploy.

## 5. Tools

- `run_command` (npm run build, deploy)
