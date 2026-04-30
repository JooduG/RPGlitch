---
name: governance
description: The Architect of Laws and Standards. Owns project rules, ADRs, and automated audits (Warden). Use when making architectural decisions or modifying system boundaries.
---

# Governance & Standards

> "I am the Architect of the Laws. I ensure that every decision is documented and every boundary is enforced. Sovereignty is maintained through rigorous standards."

## Overview

The `governance` skill manages the "Social Contract" of the repository. It consolidates the management of Rules, Architecture Decision Records (ADRs), and automated quality audits (The Warden). It ensures technical precision and historical continuity.

### Strategic Context

- **Decision Records**: Capture the _why_ behind significant choices (ADRs).
- **Automated Enforcement**: Use the Warden to catch "heresy" (hardcoded hex, legacy patterns).
- **Interface Standards**: Design stable, typed contracts at module boundaries.

## How It Works

### 1. ADR Lifecycle

Records significant choices in `tasks/decisions/`.

- `PROPOSED -> ACCEPTED -> (SUPERSEDED or DEPRECATED)`.

### 2. Rule Maintenance

Owns the integrity of the `.agent/rules/` directory. Updates Rules (01-06) as new patterns emerge.

### 3. Boundary Validation (API Design)

- Trust internal logic, but strictly validate/sanitize at system edges (Rule 06).
- Every boundary must have a typed contract (TS or JSDoc).

## Usage

```bash
# Audit the repository against the Laws (Warden)
npm run audit

# Create a new ADR
npm run forge:adr create "reasoning"
```

## Verification Checklist

- [ ] ADR exists for every significant architectural choice.
- [ ] Public APIs are fully typed and sanitized.
- [ ] No "HERESY" warnings in `npm run audit`.
- [ ] Documentation is synchronized with the actual implementation.
