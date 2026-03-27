---
description: Solo Deployment. Ships the bundle to Perchance.
---

# [/05-deploy](./05-deploy.md) - The Gateway

> **Goal:** Deliver the monolithic reactive payload to production (AGENTS.md Step 5).

## 1. Triggers

- **Command**: "Deploy", "Ship it", "Update Perchance".
- **Slash Command**: [/05-deploy](./05-deploy.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Infrastructure](../rules/03-infrastructure.md).
- **Rules**: [Aesthetics](../rules/04-aesthetics.md).
- **State**: [.agent/project-management/log.md](../project-management/log.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Pre-flight)

1. **Verification**: Run full verification suite (`npm run verify`). Never ship broken physics. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Fabricate**: Run `npm run build`. Confirm 0 errors. [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 2: Launch

1. **Smoke Test**: Smoke test the `index.html` locally via the browser tool. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Push**: Execute `npm run deploy:perchance` (Playwright automation). [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 3: expression (Verification)

1. **Live Check**: Confirm the deployment reflects the **Chalk Regime** aesthetics and **Svelte 5** reactive state.
2. **Log**: Final deployment statistics (Version ID, Size, timestamp) in `log.md`.

## 4. Anti-Patterns

- **Blind Shipping**: Deploying without passing the latest tests or local visual check.
- **Leakage**: Deploying with hardcoded API keys or debug flags active.

### 🕹️ Operational Heartbeat

- **🤖 AGENTS.md**: Step 5 (Execution - Deployment active)
- **📜 Rules**: Rule 01 (Foundation), Rule 03 (Infrastructure)
- **🧠 Capabilities**: devops (Build), warden (Verify)
- **💾 State**: .agent/project-management/log.md
