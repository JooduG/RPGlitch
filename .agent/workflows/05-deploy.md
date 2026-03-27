---
name: 05-deploy
description: Solo Deployment. Ships the bundle to Perchance.
---

# 05-deploy (The Ship)

> **Goal:** Deliver the monolithic reactive payload to production.

## 1. Triggers

- **Command**: "Deploy", "Ship it".
- **Slash Command**: [/05-deploy](./05-deploy.md)

## 2. Brain (Context Injection)

- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **Config**: `vite-plugin-singlefile` configuration.
- **Target**: Perchance production environment.

## 3. Procedures

### Phase 1: The Clarity Gate (Pre-flight)

1. **Verification**: Run full verification suite (`npm run verify`). [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Fabricate**: Run `npm run build`. Confirm 0 errors. [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 2: Launch

1. **Smoke Test**: Smoke test the `index.html` locally via the browser tool. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Push**: Execute `npm run deploy:perchance` (Playwright automation). [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 3: The Quality Gate (Verification)

1. **Live Check**: Navigate to the live URL and confirm core functionality. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Report**: Final deployment statistics (Version ID, Size, timestamp).

## 4. Anti-Patterns

- **Dirty Build**: Deploying without passing the latest tests or linting.
- **Blind Deploy**: Shipping without a local visual check of the build artifact.
- **Leakage**: Deploying with hardcoded API keys or debug flags active.
