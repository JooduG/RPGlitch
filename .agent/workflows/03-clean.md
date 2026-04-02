---
name: 03-clean
description: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
risk: low
source: AI
date_added: 2024-03-29
---

# [/03-clean](./03-clean.md) - Ordning & Reda: Pengar på Fredag

## Objectives: Maintenance

- Eliminate technical debt and security vulnerabilities.
- Enforce the Boy Scout Rule across the codebase.

## Context-Injection: Security Audit

- [Compliance](../rules/06-compliance.md)
- [Warden](../skills/warden/)

## Capabilities: Hygiene & Security

- **Vulnerability Check**: `npm run audit`
- **Linting**: `npm run lint`
- **Refactoring**: [Boy Scout Logic](../skills/warden/)

## Procedure

### Phase 1: Threat Detection (Step 2.3: Risk Routing)

1. **Audit**: Run dependency checks and linting. Identify security leaks and high-entropy secrets. [[Invoke: Warden]](../skills/warden/)
2. **Reproduction**: If fixing a bug, create a minimal reproduction case (Step 5.2).

### Phase 2: Elimination (Step 5: Execution)

1. **Isolation**: Fix the bug or debt in isolation. Ensure the fix adheres to Defense-in-Depth (Rule 06.1.1). [[Invoke: Warden]](../skills/warden/)
2. **Standard Alignment**: Ensure all code follows the [Intelligence Protocol](../rules/05-intelligence.md) and [Aesthetic Design System](../rules/04-aesthetics.md).

### Phase 3: The Quality Gate (Step 6: Completion)

1. **Verification**: Verify that the fix does not introduce regression. Run unit and E2E tests. [[Invoke: Warden]](../skills/warden/)
2. **Sanitization**: Ensure all new inputs are validated using Zod/DOMPurify (Rule 06.1).
3. **Convergence**: If any verification step fails or new debt is identified, restart the lifecycle from Phase 1. Repeat until all protocols align and a clean, zero-failure run is achieved.

## Anti-Patterns

- **Temporary Fixes**: Patching symptoms without treating the cause.
- **Hygiene Drift**: Adding "slop" comments or unaligned variable names.
- **Silent Vulnerabilities**: Ignoring non-critical security tool outputs.
