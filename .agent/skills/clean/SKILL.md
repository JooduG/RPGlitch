---
name: clean
version: 1.0.0
description: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
risk: safe
source: AI
disable-model-invocation: true
user-invocable: false
context: fork
effort: high
---

# 🛠️ clean

> **Persona**: **Skill Executor**: "I am the Sovereign Logical Operator of Maintenance & Security. I synthesize technical debt into a hardened, high-fidelity codebase via systematic auditing and procedural cleaning."

## 🔬 Anatomy

```text
skills/clean/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Eliminate technical debt and security vulnerabilities.
- **Architectural Integrity**: Enforce the Boy Scout Rule across the codebase.
- **Security Audit**: [Compliance](../../rules/06-compliance.md), [Warden](../../skills/warden/)

## 📋 Procedure

- **Vulnerability Check**: `npm run audit`
- **Linting**: `npm run lint`
- **Refactoring**: [Boy Scout Logic](../warden/)

### Phase 1: Threat Detection (Step 2.3: Risk Routing)

1. **Audit**: Run dependency checks and linting. Identify security leaks and high-entropy secrets. [[Invoke: Warden]](../warden/)
2. **Reproduction**: If fixing a bug, create a minimal reproduction case (Step 5.2).

### Phase 2: Elimination (Step 5: Execution)

1. **Isolation**: Fix the bug or debt in isolation. Ensure the fix adheres to Defense-in-Depth (Rule 06.1.1). [[Invoke: Warden]](../warden/)
2. **Standard Alignment**: Ensure all code follows the [Intelligence Protocol](../../rules/05-intelligence.md) and [Aesthetic Design System](../../rules/04-aesthetics.md).

### Phase 3: The Quality Gate (Step 6: Completion)

1. **Verification**: Verify that the fix does not introduce regression. Run unit and E2E tests. [[Invoke: Warden]](../warden/)
2. **Sanitization**: Ensure all new inputs are validated using Zod/DOMPurify (Rule 06.1).

## Anti-Patterns

- **Temporary Fixes**: Patching symptoms without treating the cause.
- **Hygiene Drift**: Adding "slop" comments or unaligned variable names.
- **Silent Vulnerabilities**: Ignoring non-critical security tool outputs.
