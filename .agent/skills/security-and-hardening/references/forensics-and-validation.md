# Forensics & Validation: The Sovereign Audit

> "Every logic gate is a checkpoint. Every error is a diagnostic trail. We do not patch symptoms; we trace to the origin and harden every layer of the boundary."

## 🔬 Table of Contents

- [The Root Cause Tracing Protocol (Forensics)](#the-root-cause-tracing-protocol-forensics)
- [Defense-in-Depth Validation (The Four-Layer Shield)](#defense-in-depth-validation-the-four-layer-shield)
- [Diagnostic Instrumentation](#diagnostic-instrumentation)
- [Validation Patterns for Local-First Data](#validation-patterns-for-local-first-data)

---

## The Root Cause Tracing Protocol (Forensics)

Bugs often manifest deep in the call stack—a state mutation triggered by an empty string far above, or a database index mismatch originating in a malformed schema update. To fix at the symptom point is to invite regression.

### The Forensic Cycle

1. **Observe the Symptom**: Identify the precise manifestation (e.g., `DexieError: Index out of bounds`).
2. **Find the Immediate Cause**: Locate the code directly throwing the error.
3. **Trace Backward through the Call Chain**: Use stack traces to identify the original trigger. Follow data flow from entry to failure.
4. **Identify the Original Trigger**: Find where the invalid data/state first entered the system.
5. **Fix at Source**: Add validation or fix logic at the origin.

### Diagnostics Toolbox

| Method             | Procedure                                                             | Trigger                           |
| :----------------- | :-------------------------------------------------------------------- | :-------------------------------- |
| **Binary Search**  | Comment out 50% of the logic to isolate the failure region.           | Unclear location of failure.      |
| **Rubber Ducking** | Explain the code line-by-line to the user or yourself.                | Logic seems correct but fails.    |
| **Clear Thought**  | Use `waldzell-clear-thought` to map findings formally before editing. | Complex, multi-file logic errors. |

---

## Defense-in-Depth Validation (The Four-Layer Shield)

Validating at a single point is insufficient. We apply 'Defense-in-Depth' to ensure that if Layer 1 fails, Layer 2 catches it.

### Layer 1: Boundary Enforcement (Entry)

Reject obviously invalid input at the API, Component, or Method entry point using strict typing and schema validation (Zod).

### Layer 2: Business Logic Validation (Core)

Ensure the data logically makes sense for the specific operation. Even if it's a valid string, does it violate simulation physics (e.g., a character trying to move through a locked state)?

### Layer 3: Environment Guard (System)

Prevent dangerous operations in specific contexts. In RPGlitch, this means ensuring that state mutations cannot occur if the `ui_locked` rune is active during a System Turn.

### Layer 4: Debug Instrumentation (Forensics)

Capture deep context for forensics. Log stack traces and state snapshots _before_ high-risk operations so failures can be replayed.

---

## Diagnostic Instrumentation

When a bug cannot be traced manually, add temporary instrumentation markers to the call chain.

```javascript
// Before the problematic operation
async function mutateEntityState(id, delta) {
  const stack = new Error().stack;
  console.debug("DIAGNOSTIC: Mutate Call", {
    id,
    delta,
    currentRound: state.round,
    isLocked: state.ui_locked,
    stack, // Captures full call history
  });

  // Verify business logic (Layer 2)
  if (!id) throw new Error("Refusing mutation for undefined entity");

  // Proceed with safe execution
}
```

---

## Validation Patterns for Local-First Data

In our local-first environment, data crossing the **Dexie.js** boundary is the primary target for validation.

### Schema Integrity Pattern

```javascript
const SanitizedUpdate = (raw) => {
  return {
    name: DOMPurify.sanitize(raw.name),
    stress: Math.max(0, Math.min(1, raw.stress)), // Bound to 0-1 range
    timestamp: Date.now(),
  };
};

async function persist(raw) {
  const clean = SanitizedUpdate(raw); // Layer 1
  await db.entities.update(id, clean);
}
```

## ✅ Final Verification Gate

- [ ] All bug fixes include validation at at least TWO layers.
- [ ] Root cause identified and neutralized at the source.
- [ ] Diagnostics removed or converted to structured logs before final merge.
- [ ] Zero usage of generic SQL/Prisma terminology in forensics advice.
