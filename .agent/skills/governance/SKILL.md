---
name: governance
description: The Architect of Laws and Standards. Owns project rules, ADRs, workspace hygiene, and automated audits (Warden). Use when making architectural decisions, modifying system boundaries, or cleaning up the repository.
---

# Governance & Standards

> "I am the Architect of the Laws. I ensure that every decision is documented and every boundary is enforced. Sovereignty is maintained through rigorous standards."

## Overview

The `governance` skill manages the "Social Contract" of the repository. It consolidates the management of Rules, Architecture Decision Records (ADRs), and automated quality audits (The Warden). It ensures technical precision and historical continuity.

### Strategic Context

- **Decision Records**: Capture the _why_ behind significant choices (ADRs).
- **Automated Enforcement**: Use the Warden to catch "heresy" (hardcoded hex, legacy patterns).
- **Workspace Hygiene**: Enforce the "Zero-Clutter Root" policy and mandatory use of `tmp/` for transient artifacts.
- **Interface Standards**: Design stable, typed contracts at module boundaries.

## How It Works

### 1. ADR Lifecycle

Records significant choices in `tasks/decisions/`.

- `PROPOSED -> ACCEPTED -> (SUPERSEDED or DEPRECATED)`.

### 2. Rule Maintenance

Owns the integrity of the `.agent/rules/` directory. Updates Rules (01-06) as new patterns emerge.

### 3. Repository Hygiene (The Basement)

Ensures the repository root and `src/` remain free of "agent debris."

- **The Basement (tmp/)**: All transient scripts (`.py`, `.js`), logs (`.txt`), and temporary payloads (`.json`) MUST reside in `tmp/`.
- **Cleanup**: Scan for loose artifacts (`scratch/`, `temp/`) and consolidate into `tmp/` or delete if no longer needed.
- **Boy Scout Rule**: Always leave the codebase cleaner than you found it.

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
- [ ] Repository root is clean (no loose `.txt`, `.js`, or `.py` scratch files).
- [ ] All transient work is tucked into `tmp/`.
- [ ] Documentation is synchronized with the actual implementation.
