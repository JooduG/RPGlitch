---
name: 06-nexus
description: Orchestration & Deployment. Shipping code and syncing the fleet.
---

# 06-nexus (The Launch)

> **Goal:** Deliver the payload to the world and synchronize the autonomous fleet.

## 1. Triggers
- **Deploy**: "Ship it", "Deploy to Perchance".
- **Fleet Sync**: Core engine changes that affect other repos.
- **Slash Command**: `/06-nexus`

## 2. Brain (Context Injection)
- **Perchance**: `src/RPGlitch-left-panel.txt` and `dist/index.html`.
- **Fleet**: `.github/workflows/ai-fleet-dispatch.yml`.

## 3. Procedures

### Phase 1: Production Build
1. **Compile**: `npm run build`. Confirm 0 errors and size < 350KB.
2. **Evidence**: Read terminal output and report the bundle size.

### Phase 2: Deployment (Perchance)
1. **Push**: `npm run deploy:perchance`. 
2. **Verify**: Open the live site and confirm rendering.

### Phase 3: Fleet Orchestration
1. **Dispatch**: For core changes, trigger `/07-dispatch` or the Fleet Commander protocol to update child repos.
2. **Draft PR**: Ensure all external changes are tracked via Draft PRs with the `fleet-dispatch` label.

## 4. Anti-Patterns
- **Friday Deploy**: Shipping large changes before a shutdown.
- **Blind Push**: Deploying without a local build or smoke test.
- **Broken Fleet**: Propagating core changes that break child repository invariants.
