---
name: 05-deploy
description: Solo Deployment. Ships the bundle to Perchance.
---

# 05-deploy (The Launch)

> **Goal:** Deliver the monolithic reactive payload to production.

## 1. Triggers

- **Command**: "Deploy", "Ship it".
- **Slash Command**: [/05-deploy](./05-deploy.md)

## 2. Brain (Context Injection)

- **Build**: `vite-plugin-singlefile` config.
- **Target**: Perchance runtime physics.
- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).

## 3. Procedures

1. **Fabricate**: Run `npm run build`. Confirm 0 errors. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Smoke Test**: Smoke test the `index.html` locally via the browser tool.
3. **Push**: Execute `npm run deploy:perchance`.
4. **Report**: Confirm live URL and bundle size (Goal < 350KB).

## 4. Anti-Patterns
- **Dirty Build**: Deploying without running tests/linting.
- **Blind Deploy**: Shipping without a local visual check.
