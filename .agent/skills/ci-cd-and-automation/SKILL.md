---
name: ci-cd-and-automation
description: The Quality Gatekeeper. Automates build pipelines, local verification, and enforcement of Rule 03 (Infrastructure) safety gates.
---

# 🛡️ CI/CD: The Quality Gatekeeper

> "I am the Mechanism of Truth. I do not trust code; I verify it. I shift left to catch entropy at the boundary. If a change fails the gate, it does not exist in our reality."

## 🔬 Anatomy (Sovereign)

```text
skills/ci-cd-and-automation/
├── SKILL.md                 # The Gatekeeper's Directive
├── resources/
│   └── troubleshooting-act.md # Local CI forensics
└── scripts/
    └── act/                 # Local Action Verification
        ├── install-act.sh   # Act bootstrap
        └── run-act.sh       # Background runner
```

## 🎯 Overview

CI/CD is the enforcement mechanism for every other skill. It ensures that no change reaches production without passing tests, lint, type checking, and build budgets. We prioritize **Shift Left** logic: catching problems as early as possible in the pipeline using local emulation of GitHub Actions before reaching the remote repository.

## 🎯 When to Use

- Setting up or modifying automated build pipelines.
- Configuring quality gates (lint, types, tests).
- When a change requires local verification before push.
- Debugging CI failure loops or logic regressions.
- Optimizing CI performance and resource utilization.
- Managing environmental secret rotation at the pipeline level.

## ⚙️ Core Process: The Quality Gate Pipeline

### 1. Local CI Bootstrap (Setup)
Before pushing to the remote repository, verify the logic locally using **`act`** (Project Standard).
1. **Prerequisites**: Ensure Docker is running.
2. **Environment**: Standardize on `.env` (strictly ignored by git).
3. **Bootstrap**: Run `bash .agent/skills/ci-cd-and-automation/scripts/act/install-act.sh`.
4. **Governance**: Ensure `act_output.log` and `.env` are in `.gitignore`.

### 2. Mandatory Verification Gates
Every single commit must survive this sequence:
- **Lint**: `npm run lint` (Zero tolerance for Prettier/ESLint warnings).
- **Type Check**: `npx tsc --noEmit` (Crucial for Svelte 5 Rune safety).
- **Unit Tests**: `npm test` (Verify engine mutations and state logic).
- **Build Verification**: `npm run build` (Ensuring the Bridge can be crossed).
- **Security Audit**: `npm audit --audit-level=high` (Mandatory before every commit).

### 3. Pre-Flight Verification
Always execute `bash .agent/skills/ci-cd-and-automation/scripts/act/run-act.sh` before finalizing a PR.
- Audit the bundle size for Perchance editor stability.
- Ensure all logic is correctly transpiled for the simulation environment.
- If any gate fails, **HALT** and resolve the root cause.

---

## 🏛️ Extended Operational Framework

### CI Pipeline Design Principles

- **Speed is a Feature**: Pipelines should provide feedback within 5 minutes. Use caching for `node_modules` and test results.
- **Fail Fast**: Run the most likely and fastest failure points (lint, unit tests) before expensive ones (E2E, integration).
- **Idempotency**: Retrying a failed pipeline without changes should produce the same failure.
- **Environment Parity**: CI should mirror production (or the closest local approximation via `act`) exactly.

### Testing Strategy & Patterns

```bash
# Run tests with coverage to identify gaps
npm test -- --coverage
```

#### Selection Matrix

| Test Type | Target | Tool | Frequency |
|-----------|--------|------|-----------|
| Unit | Pure IO / Core Logic | Vitest | Every Commit |
| Integration | State Mutations / Dexie.js | Vitest | Every Commit |
| Visual | Styles / Nordic Collection | Playwright | On UI Change |
| E2E | Critical User Paths | Playwright | Before Release |

### Security & Sanitization Gates

Always perform a manual audit pass alongside automated `npm audit` calls:

- [ ] **Sanitization Audit**: Verify all user-provided HTML passes through `DOMPurify.sanitize()` before `{ @html }` rendering.
- [ ] **Rune Safety**: Ensure `$state()` and `$derived()` are not leaked into global scope or non-reactive boundaries.
- [ ] **Dependencies**: Audit `package.json` for high-risk or unneeded packages.
- [ ] **Secret Injection**: Ensure secrets are NEVER hardcoded, even in test mocks.

### CI Optimization Strategies

- **Parallelization**: Run independent tasks (lint, unit tests, style checks) in parallel.
- **Selective Execution**: Only run tests related to changed files (e.g., using `vitest --related`).
- **Dependency Caching**: Cache `~/.npm` and `node_modules` across `act` runs when possible.

## 📋 Common Rationalizations

- *"CI is too slow"* → Optimize the pipeline; never skip it. A 5-minute gate saves hours of production debugging.
- *"This change is trivial"* → Trivial changes break builds. The gate applies to every byte.
- *"The test is flaky"* → Flaky tests mask real regressions. Fix the test; do not ignore it.

## 🚩 Red Flags

- No CI pipeline or local verification configured.
- CI failures marked as "known issues" without a fix.
- Tests disabled or bypassed in CI.
- Secrets stored in CI configuration files instead of `.env`.

## ✅ Final Gate Verification Checklist

- [ ] All quality gates pass (lint, types, tests, build).
- [ ] `act` successfully emulates GitHub Actions locally.
- [ ] Bundle size is optimized for the Perchance environment.
- [ ] Security audit returns zero high/critical vulnerabilities.
- [ ] Pipeline completes in under 10 minutes.
