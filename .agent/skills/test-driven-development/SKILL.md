---
name: test-driven-development
description: Drives development with tests. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# 🧪 TDD & The Proving Grounds

> "I am the Witness of Truth. I do not accept 'it works' as a final state. I demand proof via the Red-Green-Refactor cycle and ensure every behavior is anchored in the Proving Grounds."

## 🔬 Anatomy (Sovereign)

```text
skills/test-driven-development/
├── SKILL.md                 # The Witness's Directive
├── references/
│   ├── testing-patterns.md
│   └── audits/              # (Migrated from Warden)
└── templates/               # (Migrated from Warden)
    ├── bug-report.template.md
    ├── debug-protocol.template.md
    └── test-plan.template.md
```

## 🎯 Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done. A codebase with good tests is an AI agent's superpower; a codebase without tests is a liability. For RPGlitch, we expand this to **The Proving Grounds**, where automated logic verification meets **Behavioral Probing** for narrative consistency.

## 🎯 When to Use

- Implementing any new engine logic or behavior (DynamicsEngine, Kernel).
- Fixing any bug (the **Prove-It Pattern**).
- Modifying existing character or fractal entity behavior.
- Adding edge case handling to state mutations.
- Verifying UI interactions and sensory bridges via Chrome DevTools.
- Ensuring narrative consistency after an intelligence kernel update (Behavioral Probing).

---

## ⚙️ Core Process: The Witness Cycle

### 1. The RED-GREEN-REFACTOR Protocol

- **RED**: Write a failing test in Vitest that describes the desired state.
- **GREEN**: Write the minimal Svelte 5 logic to satisfy the test. Avoid over-engineering.
- **REFACTOR**: Polish the implementation while ensuring the tests remain green.

### 2. The Prove-It Pattern (Bug Fixes)

When a bug is reported, **do not start by trying to fix it.** Start by writing a test that reproduces it.

- Bug report arrives.
- Write a test that demonstrates the bug.
- Test FAILS (confirming the bug exists).
- Implement the fix.
- Test PASSES (proving the fix works).
- Run full test suite (confirming no regressions).

### 3. Behavioral Probing (Narrative TDD)

Beyond unit tests, use "Behavioral Probes" to test for narrative drift.

- Define expected entity reactions and verify they align with the current state kernel.
- Use `debug-protocol.template.md` to document complex state/narrative intersections.

### 4. The Proving Grounds (Definition of Done)

A task is NOT complete until it survives the Proving Grounds:

- 100% test pass rate for the module.
- All edge cases documented in `test-plan.template.md`.
- Visual/Functional verification completed via Browser DevTools for UI components.
- Zero regressions in the main simulation heartbeat.

---

## 🏛️ Extended Operational Framework

### The Test Pyramid

Invest testing effort according to the pyramid to ensure speed and reliability:

```
          ╱╲
         ╱  ╲         E2E Tests (~5%)
        ╱    ╲        Full user flows, real browser
       ╱──────╲
      ╱        ╲      Integration Tests (~15%)
     ╱          ╲     Component interactions, API boundaries
    ╱────────────╲
   ╱              ╲   Unit Tests (~80%)
  ╱                ╲  Pure logic, isolated, milliseconds each
 ╱──────────────────╲
```

**The Beyonce Rule**: If you liked it, you should have put a test on it. Infrastructure changes, refactoring, and migrations are not responsible for catching your bugs — your tests are. If a change breaks your code and you didn't have a test for it, that's on you.

### Test Sizes (Resource Model)

| Size       | Constraints                               | Standard         | Example                                |
| ---------- | ----------------------------------------- | ---------------- | -------------------------------------- |
| **Small**  | Single process, no I/O, no network.       | Vitest           | Pure function tests, state transforms  |
| **Medium** | Multi-process OK, localhost only (Dexie). | Vitest + DB-Mock | Component tests, local persistence     |
| **Large**  | Multi-machine / External services.        | Playwright       | Full E2E tests, performance benchmarks |

---

## ✍️ Writing Good Tests (DAMP Standard)

### Test State, Not Interactions

Assert on the _outcome_ of an operation, not on which methods were called internally. Tests that verify method call sequences break when you refactor, even if the behavior is unchanged.

### DAMP Over DRY in Tests

In production code, DRY (Don't Repeat Yourself) is usually right. In tests, **DAMP (Descriptive And Meaningful Phrases)** is better. A test should read like a specification — each test should tell a complete story without requiring the reader to trace through shared helpers.

### Prefer Real Implementations Over Mocks

Use the simplest test double that gets the job done. The more your tests use real code, the more confidence they provide.

1. **Real implementation** → Highest confidence.
2. **Fake** → In-memory version of a dependency (e.g., in-memory Dexie).
3. **Stub** → Returns canned data, no behavior.
4. **Mock** → Verifies method calls — use sparingly.

### Use the Arrange-Act-Assert (Triple-A) Pattern

```javascript
it("marks overdue tasks when deadline has passed", () => {
  // Arrange: Set up the test scenario
  const task = createTask({ title: "Test", deadline: new Date("2025-01-01") });

  // Act: Perform the action being tested
  const result = checkOverdue(task, new Date("2025-01-02"));

  // Assert: Verify the outcome
  expect(result.isOverdue).toBe(true);
});
```

### One Assertion Per Concept

Each test should verify exactly one behavior. Do not bundle multiple validation rules into a single monolithic test.

---

## 🌐 Browser Testing with DevTools

For anything that runs in a browser (Sensory UI), unit tests alone aren't enough — you need runtime verification.

### The DevTools Debugging Workflow

1. **REPRODUCE**: Navigate to the page, trigger the bug, screenshot.
2. **INSPECT**: Console errors? DOM structure? Computed styles? Network responses?
3. **DIAGNOSE**: Compare actual vs expected — is it HTML, CSS, JS, or data?
4. **FIX**: Implement the fix in source code.
5. **VERIFY**: Reload, screenshot, confirm console is clean, run tests.

### What to Check

- **Console**: Zero errors and warnings in production-quality code.
- **Network**: Status codes, payload shape, timing, CORS errors.
- **DOM**: Element structure, attributes, accessibility tree.
- **Styles**: Computed styles vs expected, specificity conflicts.
- **Screenshots**: Before/after comparison for CSS and layout changes.

---

## 🚩 Test Anti-Patterns to Avoid

- **Testing implementation details**: Tests break when refactoring even if behavior is unchanged.
- **Flaky tests**: Erode trust. Ensure deterministic assertions.
- **Snapshot abuse**: Use sparingly; large snapshots mask real bugs.
- **No test isolation**: Each test must set up and tear down its own state.

---

## ✅ Final Verification Checklist

- [ ] Every new behavior has a corresponding test in the `src/` hierarchy.
- [ ] Bug fixes include a reproduction test that failed before the fix.
- [ ] Test names describe the behavior being verified rather than the method name.
- [ ] All tests pass: `npm test` or `vitest run`.
- [ ] Coverage hasn't decreased (if tracked).
- [ ] UI changes verified via Chrome DevTools.
