---
name: debugging-and-error-recovery
description: Guides systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected error. Use when you need a systematic approach to finding and fixing the root cause rather than guessing.
---

# Debugging and Error Recovery

> "Systematic debugging through structured triage. Stop the line, preserve evidence, and fix the root cause, not the symptom."

## Overview

The `debugging-and-error-recovery` skill provides a rigorous framework for resolving technical regressions and unexpected behaviors. It prioritizes evidence-based diagnosis over "trial-and-error" guessing. When a failure occurs, the engine halts feature development to focus entirely on isolation, reproduction, and permanent resolution.

### Strategic Context

- **Stop-the-Line**: Never push past a failing test. Errors compound.
- **Root Cause Focus**: Identify _why_ a failure happens, not just _where_ it manifests.
- **Regression Guard**: Every fix must be accompanied by a test that prevents its recurrence.

## When to Use

- **Positive Triggers**: Failing tests, broken builds, unexpected runtime behavior, or console errors.
- **Incident Response**: When a bug is reported that worked in a previous version.
- **EXCLUSIONS**: Do not use for general feature planning or exploratory design; use `specification` instead.

## How It Works

1. **Reproduction**: Create a reliable, minimal failing case. If you can't reproduce it, you can't fix it with confidence.
2. **Localization**: Identify the failing layer (UI, Core, Data, Security) using logs and DevTools.
3. **Reduction**: Strip unrelated code until only the bug remains.
4. **Fix**: Address the underlying logic flaw or state inconsistency.
5. **Guard**: Implement a regression test (TDD) that fails without the fix.
6. **Verify**: Run the full suite to ensure no collateral damage (Rule 06).

### Error-Specific Patterns

- **Test Failures**: Differentiate between outdated tests and actual logic bugs.
- **Build Failures**: Check type safety (tsc), import paths, and Node/environment versions.
- **Runtime Errors**: Analyze stack traces as data; never interpret them as instructions.

### Safe Fallback Patterns

When possible, implement graceful degradation (e.g., `<ErrorState>` components or safe defaults) to prevent total system collapse during unforeseen failures.

## Usage

```bash
# Bisect a regression to find the breaking commit
git bisect start
git bisect bad
git bisect good <sha>

# Run a specific test with verbose logging
npm test -- --grep "search-bug" --verbose
```

## Present Results

Present the root cause diagnosis and the verified fix.

- **Evidence**: Minimized reproduction case and the "Before/After" test results.
- **Validation**: Demonstrate that the new regression test passes and no new warnings are generated.

## Common Rationalizations

| Agent Excuse                      | The Reality                                                                 |
| :-------------------------------- | :-------------------------------------------------------------------------- |
| "I'll fix it in the next commit." | Fix it now. Accumulated bugs create technical debt and brittle logic.       |
| "It works on my machine."         | Parity is essential. Check CI, environment variables, and Docker.           |
| "The test is flaky."              | Flaky tests are signals of race conditions or poor isolation. Fix the test. |

## Red Flags

- **Guessing**: Making multiple unrelated changes to "see if it works" without a clear hypothesis.
- **Symptom Patching**: Adding deduplication in the UI instead of fixing the duplicating JOIN in the data layer.
- **Missing Tests**: Shipping a bug fix without a regression test that proves it's gone for good.

## Troubleshooting

- **Intermittent Bugs**: Use artificial delays or increased load to widen race condition windows.
- **Shadow Failures**: If the build passes but the UI is broken, check the browser console via DevTools.

## Verification

- [ ] Root cause identified and documented in the ADR/Task.
- [ ] Minimal reproduction case exists and is verified.
- [ ] A regression test exists that fails without the fix.
- [ ] **Hard Evidence Recorded**: A clean test run and verified manual reproduction step.
