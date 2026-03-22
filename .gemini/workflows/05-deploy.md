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

- **Rules**: [.agent/rules/03-technetium.md](../rules/03-technetium.md).
- **Config**: `vite-plugin-singlefile` configuration.
- **Target**: Perchance production environment.

## 3. Procedures

### Phase 1: The Clarity Gate (Pre-flight)

1. **Verification**: Run full verification suite (`npm run verify`). [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Fabricate**: Run `npm run build`. Confirm 0 errors and check bundle size (Goal < 350KB). [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 2: Launch

1. **Smoke Test**: Smoke test the `index.html` locally via the browser tool. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Push**: Execute `npm run deploy:perchance` (Playwright automation). [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 3: The Quality Gate (Verification)

1. **Live Check**: Navigate to the live URL and confirm core functionality. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Report**: Final deployment statistics (Version ID, Size, timestamp).

## 4. Anti-Patterns

- **Dirty Build**: Deploying without passing the latest tests or linting.
- **Blind Deploy**: Shipping without a local visual check of the build artifact.
- **Leakage**: Deploying with hardcoded API keys or debug flags active.
