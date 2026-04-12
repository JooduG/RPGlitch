---
name: ci-cd-and-automation
description: The Quality Gatekeeper. Automates build pipelines, local verification, and enforcement of Rule 03 (Infrastructure) safety gates.
---

# CI/CD: The Quality Gatekeeper

> "I am the Mechanism of Truth. I do not trust code; I verify it. If a change fails the gate, it does not exist in our reality."

## Overview

The `ci-cd-and-automation` skill is the enforcement mechanism for technical quality in the RPGlitch Engine. It ensures that no change reaches production without passing strict gates for testing, linting, type checking, and security audits. We prioritize a "Shift Left" approach, using local emulation of GitHub Actions (via `act`) to catch issues before they reach the remote repository.

### Strategic Context

- **Automated Verification**: Zero tolerance for unverified code.
- **Fail Fast**: Prioritize faster checks (lint, unit tests) before expensive integration or E2E tests.
- **Local Emulation**: Mandatory use of `act` for pre-push verification.

## When to Use

- **Positive Triggers**: Setting up or modifying build pipelines, configuring quality gates, or performing local pre-flight checks before a PR.
- **Deployment Triggers**: Before finalising a release or switching from dev to production environments.
- **EXCLUSIONS**: Do not use for pure feature development; use domain-specific skills instead.

## How It Works

1. **Bootstrap**: Install and configure local CI tools (`act`, Docker).
2. **Verification Gate Service**: Execute linting, type checking, unit tests, and build verification.
3. **Pre-Flight**: Run the full local action suite using `bash .agent/skills/ci-cd-and-automation/scripts/act/run-act.sh`.
4. **Remote Watch**: Monitor and audit the remote GitHub Actions results via `gh run watch`.

### Quality Gate Hierarchy

| Gate      | Target           | Tool            | Priority |
| :-------- | :--------------- | :-------------- | :------- |
| **Lint**  | Coding Standards | ESLint/Prettier | High     |
| **Types** | Logic Safety     | tsc --noEmit    | High     |
| **Unit**  | Core Mechanics   | Vitest          | High     |
| **Build** | Integration      | Vite Build      | Critical |
| **Audit** | Security         | npm audit       | Critical |

### Operational Framework

Maintain a clean, fast pipeline (ideally under 10 minutes). Parallelize independent tasks and use selective execution (e.g., `vitest --related`) to keep feedback loops tight.

## Usage

```bash
# Run the local CI emulation
bash .agent/skills/ci-cd-and-automation/scripts/act/run-act.sh

# Check the status of remote workflow runs
gh run list --limit 5
```

## Present Results

Present the pipeline logs and verification status.

- **Evidence**: Links to `act_output.log` and remote GitHub Action run summaries.
- **Validation**: Demonstrate that all quality gates passed and the security audit reported zero high/critical vulnerabilities.

## Common Rationalizations

| Agent Excuse                                   | The Reality                                                        |
| :--------------------------------------------- | :----------------------------------------------------------------- |
| "A trivial change doesn't need a full CI run." | Trivial changes break builds. The gate applies to every commit.    |
| "The test is flaky; I'll ignore it."           | Flaky tests mask real regressions. Fix the test, never ignore it.  |
| "I'll check it on the remote."                 | Shift Left. Catch errors localy to save remote resources and time. |

## Red Flags

- **Bypassed Gates**: Disabling tests or linters in CI to force a build to pass.
- **Leaked Secrets**: Hardcoding API keys or project tokens in pipeline configuration files.
- **Silent Failures**: CI passing despite lint errors or failing non-critical tests.

## Troubleshooting

- **Docker Connection**: Ensure the Docker daemon is running and the `act` container has permission.
- **Environment Mismatch**: Compare `.env` local settings with the CI environment variables.

## Verification

- [ ] All quality gates pass (lint, types, tests, build).
- [ ] `act` successfully emulates GitHub Actions locally.
- [ ] Security audit returns zero high/critical vulnerabilities.
- [ ] **Hard Evidence Recorded**: Final pipeline log showing 100% success across all gates.
