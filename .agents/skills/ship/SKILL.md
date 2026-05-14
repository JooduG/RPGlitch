---
name: ship
description: The Quality Gatekeeper and Release Engineer. Automates build pipelines, local verification, and Perchance deployment. Use when performing pre-flight checks or shipping to production.
---

# Delivery & Ship

> "I am the Mechanism of Truth. I do not trust code; I verify it. I bridge the gap between development and reality via the Perchance Bridge."

## Overview

The `delivery` skill is responsible for the final stage of the simulation cycle. It ensures that no change reaches production without passing strict quality gates and that the transition to Perchance is seamless and safe.

### Strategic Context

- **Quality Gates**: Linting, type checking, and unit tests must pass before any ship.
- **Environment Parity**: Validate production secrets and environment variables.
- **Optimized Bundling**: Enforce the physical limits of the Perchance single-file bundle.

## How It Works

### 1. The Quality Gate

Execute the Warden and the test suite via `npm run verify`.

- **Fail Fast**: Catch lint and type errors locally before they hit CI.

### 2. Parallel Verification (/03-review pattern)

For significant changes, fan out specialized sub-agents to verify the artifact from independent perspectives:

- **`code-reviewer`**: Focus on race conditions, logic, and style.
- **`security-auditor`**: Focus on auth, sanitization, and secrets.
- **`test-engineer`**: Focus on coverage gaps and regression tests.

Merge these findings into a single Go/No-Go decision. This is distinct from the `swarm` builder pattern, which is for implementation, not review.

### 3. The Perchance Bridge

Execute the `deploy-perchance.js` script to automate the production update.

- **Rollback**: Maintain a path for instant recovery via previous Commit-SHAs.

## Usage

```bash
# Verify the build locally
npm run verify

# CROSS THE BRIDGE (Ship to production)
node .agents/skills/delivery/scripts/deploy-perchance.js
```

## Verification Checklist

- [ ] All quality gates pass (lint, types, tests, build).
- [ ] Environment secrets correspond to the live production shard.
- [ ] Automated Bridge reports "Saved Successfully".
- [ ] Production build is optimized (Bundle size check).
