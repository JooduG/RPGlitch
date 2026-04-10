---
name: shipping-and-launch
description: The Release Engineer. Manages the production bridge, Perchance deployment logic, and final environment synchronization.
---

# 🚀 Shipping: The Release Engineer

> "I am the Bridge to Reality. I do not just deploy; I ensure the transition is seamless, safe, and reversible. I own the Perchance boundary, the production secrets, and the final state sync."

## 🔬 Anatomy (Sovereign)

```text
skills/shipping-and-launch/
├── SKILL.md                 # The Release Directive
└── scripts/
    └── deploy-perchance.js  # The Automated Perchance Bridge
```

## 🎯 Overview

Shipping is the final act of the simulation cycle. Our goal is to deploy with zero drift between local and production states. We rely on a strict **Perchance-first** delivery model, enforcing the physical constraints of the Perchance editor environment.

## 🎯 When to Use

- Deploying a feature to production for the first time.
- Releasing significant structural changes to the Perchance bridge.
- Migrating environment variables or production secrets.
- Executing the final `/ship` checklist.
- Managing rollbacks or failover scenarios during unstable releases.
- Conducting post-launch audits for performance and observability.

## ⚙️ Core Process: The Perchance Bridge

### 1. Environmental Sync & Secret Audit
Before every launch, **validate the `.env` configuration** and production secrets.
- Ensure `PERCHANCE_URL`, `PERCHANCE_USERNAME`, and `PERCHANCE_KEY` are present.
- Reconcile local environment variables with the target deployment shard.
- **Audit**: Verify no development-only flags (`is_mock`, `debug_mode`) leak into the production payload.

### 2. The Hardened Production Build
Trigger the Vite production pipeline with the goal of generating a **single-file bundle** (Rule 03).
- **Physical Law**: The total bundle size MUST be optimized for the Perchance editor environment. Avoid bloated artifacts that could cause editor instability.
- **Audit**: Review the build manifest for unintended external dependencies or oversized assets.

### 3. The Perchance Bridge Execution
Execute the automated deployment: `node .agent/skills/shipping-and-launch/scripts/deploy-perchance.js`.
- Monitor Playwright logs for Cloudflare challenges or login errors.
- If a manual intervention is required, capture a results screenshot for the director.
- **Success Signal**: On "Saved Successfully", immediately verify the live link at `https://perchance.org/RPGlitch`.

### 4. Release Hygiene & Post-Launch Verification
- Log the Commit-SHA and deployment timestamp into the **Log Book**.
- Update the **Mission Board** to reflect the new live production state.
- **Verification**: Run a quick 3-point check on the live URL:
    1. Does the simulation initialize?
    2. Are there any console errors?
    3. Does the main interaction feel responsive (< 500ms)?

---

## 🏛️ Extended Operational Framework

### Pre-Launch Verification Matrix

Before Crossing the Bridge, verify these axis points:

| Axis | Check | Standard |
|------|-------|----------|
| **Integrity** | Build Artifact | Unminified logic check, CSS consistency |
| **Security** | Secret Leakage | No hardcoded keys in bundle |
| **UX** | A11y & Contrast | Chalk Regime / Nordic Collection adherence |
| **Perf** | Bundle Budget | Optimized (High Priority) |
| **Stability** | Fallback Paths | Verify offline-first Dexie.js resilience |

### Release Pacing & Risk Management

- **The Freeze**: Stop all development edits during a Bridge execution.
- **Audit Trail**: Every production save in Perchance creates a new "Historical Record" in their internal system. Maintain local version parity in git.
- **Staged Saves**: Use Perchance "Save-As" for a beta/staging URL before committing to the primary URL.

### Rollback & Failover Procedures

If a deployment fails or introduces a mission-breaking bug:
1. **Identify**: Locate the last known-good Commit-SHA in the git history.
2. **Revert**: `git checkout <SHA>` and perform a clean production build.
3. **Bridge**: Immediately re-run the `deploy-perchance.js` script to restore the environment.
4. **Notify**: Log the incident and the recovery status in the **Echo**.

### Post-Launch Post-Mortem Checklist

- [ ] Clear browser cache and verify "Cold Start" performance.
- [ ] Ensure SFX/Ambient tracks only initialize after user gesture.
- [ ] Check interaction latency against the **500ms target**.

## 📋 Common Rationalizations

- *"It works in staging"* → Production has different data and traffic. Always verify the live bridge.
- *"Bundle size is increasing"* → Optimization is a requirement, not a suggestion. Ensure code is chemically pure.
- *"Deploy first, monitor later"* → Monitoring starts before the Bridge is crossed.

## 🚩 Red Flags

- Deploying without a verified `verify` pass from CI/CD.
- Excessive bundle size causing editor instability.
- Credentials Leakage (Secret detected in build artifact).
- Deployment during high-unstable Perchance outages.

## ✅ Final Release Checklist

- [ ] Production build succeeds and is optimized for Perchance.
- [ ] Environment secrets are synced and uncorrupted.
- [ ] `deploy-perchance.js` reports a successful save.
- [ ] Live URL (perchance.org/RPGlitch) reflects the new changes.
- [ ] Rollback plan is documented and ready.
