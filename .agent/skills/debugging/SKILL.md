---
name: debugging
description: Master skill for troubleshooting, systematic debugging, and root cause analysis.
allowed-tools: Read, Write, Edit, Run
version: 1.0
priority: HIGH
---

# 🐞 Skill: Debugging (The Troubleshooter)

> **The Iron Law:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

## 1. When to Use

- **Emergency:** Production bugs, build failures.
- **Confusion:** "It works on my machine but not CI."
- **Persistence:** A bug that survives the first fix attempt.
- **Complexity:** Multi-component failures.

## 2. The Systematic Protocol

Do not guess. Follow the **Scientific Method**.

### Phase 1: Investigation (Root Cause)

1.  **Read & Trace:** Read the _entire_ error message and stack trace.
2.  **Reproduce:** Create a reliable reproduction case. If you can't reproduce it, you can't fix it.
3.  **Bisection:**
    - Isolate the failing commit (git bisect).
    - Comment out half the code to isolate the failing component.
4.  **Tracing:** Use `root-cause-tracing.md` to work backward from the symptom to the source.

### Phase 2: Hypothesis

1.  **Formulate:** "I think X is causing Y because Z."
2.  **Evidence:** What variables support this? (Network, State, Input).
3.  **Invalidate:** Try to _disprove_ your hypothesis.

### Phase 3: Repair (The Fix)

1.  **Test First:** Write a failing test case (TDD).
2.  **Minimal Change:** Change only one variable at a time.
3.  **Defense in Depth:** Once the root cause is fixed, add safeguards (see `defense-in-depth.md`) to prevent recurrence.

## 3. Techniques

### Binary Search (Isolation)

"The bug is in [Component A] because [Component B] works."

- Disable half the plugins/modules.
- Disable half the lines in the function.
- Isolate inputs.

### Comparative Analysis

- Find a working example in the codebase.
- Diff the working vs. broken code line-by-line.
- Check environment variables and configuration.

### Instrument & Log

- Don't just stare at code. Add excessive logging to trace data flow.
- Verify assumptions: `console.log('Is ID present?', id)`.

## 4. Anti-Patterns (STOP IF YOU DO THIS)

- ❌ **Shotgun Debugging:** Randomly changing things hoping it works.
- ❌ **Symptom Patching:** Adding `if (x) return` without knowing _why_ `x` is bad.
- ❌ **The "Just One More" Trap:** If 3 fixes fail, **STOP**. You are wrong about the root cause. Question the architecture.
- ❌ **Ignoring Evidence:** "That shouldn't matter" is the motto of a bug.

## 5. Resources

- **[Root Cause Tracing](./root-cause-tracing.md)**: Deep dive into tracing mechanics.
- **[Defense in Depth](./defense-in-depth.md)**: How to harden code after a fix.
- **[Condition Based Waiting](./condition-based-waiting.md)**: Solving "flaky" timing bugs.
