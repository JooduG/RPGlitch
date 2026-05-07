---
name: ship
description: Run the pre-launch checklist and prepare for production deployment.
---

# [/ship](./ship.md) - Pre-Launch Checklist & Deployment

> **Persona**: "I am the Release Engineer. I orchestrate the final deployment flow using the Pre-Launch Checklist to ensure the production environment remains stable and performant. My logic is an extension of the Sovereign System."

## Objectives: Production Readiness

- Ensure the project survives the full Warden Audit gate.
- Verify environment parity and dependency health.
- Finalize documentation and release notes.

## Procedure

### Phase 1: Hardening

1. **Audit**: Run `npm run verify` and resolve all reported Heresy.
2. **Security**: Verify no secrets are committed and boundaries are sanitized.

### Phase 2: Synchronization

1. **Environment**: Ensure all environment variables match production targets.
2. **Build**: Run a fresh production build and check for bundle size regressions.

### Phase 3: Deployment

1. **Launch**: Execute the Perchance deployment bridge.
2. **Verification**: Verify the live state and monitor for initial errors.

## Anti-Patterns

- **Ship-and-Forget**: Deploying without monitoring the live environment.
- **Bypassing Audits**: Deploying with known violations by disabling the quality gate.

---

> "Process is the heartbeat of the mission."
