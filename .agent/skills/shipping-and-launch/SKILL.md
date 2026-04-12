---
name: shipping-and-launch
description: The Release Engineer. Manages the production bridge, Perchance deployment logic, and final environment synchronization.
---

# Shipping: The Release Engineer

> "I am the Bridge to Reality. I do not just deploy; I ensure the transition is seamless, safe, and reversible. I own the Perchance boundary and the final state sync."

## Overview

The `shipping-and-launch` skill governs the final stage of the RPGlitch simulation cycle. It ensures that the transition from a local development environment to the live Perchance environment is executed with zero drift and maximum stability. This skill manages the production build pipeline, secret synchronization, and the automated "Bridge" script that updates the live URL.

### Strategic Context

- **Perchance Constraints**: Enforce the physical limits of the Perchance editor (single-file bundle, total size optimization).
- **Environment Parity**: Validate production secrets and environment variables before every launch.
- **Mission Readiness**: Adhere to the Final Release Checklist to ensure 99.9% uptime for the live simulation.

## When to Use

- **Positive Triggers**: Deploying a verified feature to production, updating the Perchance bridge logic, migrating production secrets, or executing the `/ship` command.
- **Rollback Scenarios**: Reverting a failed deployment to the last known-good Commit-SHA.
- **EXCLUSIONS**: Do not use for local-only testing; use `browser-testing-with-devtools` instead.

## How It Works

1. **Environmental Sync**: Validate `.env` variables (`PERCHANCE_KEY`, etc.) and ensure zero leakage of mock/debug flags.
2. **Hardened Production Build**: Run the Vite pipeline (Rule 03) to generate a single-file, highly-optimized bundle.
3. **Bridge Execution**: Run the `deploy-perchance.js` script to automate the login and save process on Perchance.org.
4. **Live Verification**: Conduct a 3-point check on the live URL (Initialization, Console health, Interaction latency).

### Extended Operational Framework

- **Pre-Launch Matrix**: Audit integrity (bundle check), security (secret scan), and performance budget (LCP/CLP).
- **Staged Saves**: Use a secondary "staging" URL for high-risk structural changes before committing to the primary link.
- **Rollback Procedure**: Keep a documented path for instant recovery via `git checkout` and re-bridging.

## Usage

```bash
# Execute the full production bridge to Perchance
node .agent/skills/shipping-and-launch/scripts/deploy-perchance.js

# Verify the live production build
npm run ship:verify
```

## Present Results

Present the deployment summary and link to the live production environment.

- **Evidence**: Commitment SHA, bundle size metrics, and the successful "Saved Successfully" log.
- **Validation**: Confirmation of the 3-point live check (Initialization, No Errors, Latency).

## Common Rationalizations

| Agent Excuse                        | The Reality                                                                          |
| :---------------------------------- | :----------------------------------------------------------------------------------- |
| "It works in my browser."           | Production (Perchance) has different constraints and CSPs. Always verify the bridge. |
| "Bundle size isn't a priority yet." | Editor instability is fatal. Optimization is a requirement, not a suggestion.        |
| "I'll watch the logs later."        | Monitoring starts _before_ the bridge is crossed.                                    |

## Red Flags

- **Unverified Shipping**: Deploying without passing the `npm run verify` check locally.
- **Credential Leakage**: Detecting hardcoded secrets or development flags in the production bundle.
- **Stale Registry**: Forgetting to update the Mission Board or Log Book after a successful launch.

## Troubleshooting

- **CF Challenge**: If the Bridge script hangs, manual intervention for Cloudflare challenges may be required.
- **Build Drift**: Ensure local `dist/` is cleaned before every production build to prevent cached artifact corruption.

## Verification

- [ ] Production build succeeds and is optimized for the Perchance editor.
- [ ] Environment secrets correspond to the live production shard.
- [ ] Automated Bridge reports "Saved Successfully" with zero Playwright timeouts.
- [ ] **Hard Evidence Recorded**: A screenshot of the live simulation running on Perchance.org.
