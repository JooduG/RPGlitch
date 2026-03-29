---
name: deploy
description: Solo Deployment. Ships the bundle to Perchance.
risk: low
source: AI
date_added: 2024-03-29
---

# [Deploy](./05-deploy.md) - Solo Deployment

## Objectives: Shipment

- Build a production-ready single-file bundle for Perchance.
- Verify the bundle in the target environment.

## Context-Injection: Production Environment

- [Infrastructure](../rules/03-infrastructure.md)
- [DevOps](../skills/devops/)
- [Vite Plugin Singlefile](../../package.json)

## Capabilities: Deployment Chain

- **Build Pipeline**: Vite logic with inline assets.
- **Environment Sync**: [Perchance Bridge](../../src/core/security.js).
- **Quality Gate**: `npm run build`

## Procedure

### Phase 1: Pre-Flight (Step 3: Research)

1. **Hygiene Audit**: Run `npm run lint` and `npm run test` to ensure zero regressions exist in the build candidate. [[Invoke: Warden]](../skills/warden/)
2. **Version Control**: Ensure all changes are committed and the [Log Book](../project-management/log.md) reflects the deployment milestone.

### Phase 2: Fabrication (Step 5: Execution)

1. **Production Build**: Execute `npm run build`. Verify that the output is a single `index.html` file (via vite-plugin-singlefile). [[Invoke: DevOps]](../skills/devops/)
2. **Bundle Verification**: Inspect the build for oversized assets or broken resource links.

### Phase 3: Deployment (Step 8: Handoff)

1. **Shipment**: Upload the `dist/index.html` payload to the Perchance code panel. [[Invoke: DevOps]](../skills/devops/)
2. **Runtime Verification**: Test the simulation live on Perchance. Verify reactivity and persistence.

## Anti-Patterns

- **Dirty Builds**: Deploying with uncommitted local changes.
- **Oversized Assets**: Failing to compress media before bundling.
- **Zero Testing**: Shipping the bundle without a final manual verification.
