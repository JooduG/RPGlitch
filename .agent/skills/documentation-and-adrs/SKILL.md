---
name: documentation-and-adrs
description: Records decisions and documentation. Use when making architectural decisions, changing public APIs, shipping features, or when you need to record context that future engineers and agents will need to understand the codebase.
---

# Documentation and ADRs

> "Document the 'why', not just the 'what'. Code shows what was built; documentation explains why it was built this way."

## Overview

The `documentation-and-adrs` skill focuses on capturing the context, constraints, and trade-offs behind technical decisions. In the RPGlitch Engine, high-value documentation acts as forensic memory for both humans and agents, preventing architectural drift and redundant debates. It covers everything from Architecture Decision Records (ADRs) to inline JSDoc and README maintenance.

### Strategic Context

- **Decision Records**: Capture the reasoning behind significant choices (Frameworks, Schemas, APIs).
- **Intention Signaling**: Comment on the _why_ (non-obvious intent), not the _what_ (code expression).
- **Agent Grounding**: Keep Rules, Specs, and ADRs updated to maintain agentic alignment.

## When to Use

- **Positive Triggers**: Making a significant architectural decision, choosing between competing libraries, adding a public API to `window.exposed`, or shipping a major feature.
- **Refactoring Triggers**: When logic becomes non-obvious or requires a design rationale for future maintenance.
- **EXCLUSIONS**: Do not document obvious code or restate what a Svelte 5 Rune already expresses. Avoid "TODO" comments for tasks that should be fixed immediately.

## How It Works

1. **ADR Generation**: Create a new record in `tasks/decisions/` or `docs/decisions/` describing context, the decision, alternatives considered, and consequences.
2. **Inline Enrichment**: Add JSDoc to public functions and internal module boundaries (Rule 05).
3. **Spec Alignment**: Ensure all changes are reflected in `SPEC.md` or `DESIGN.md`.
4. **README & Changelog**: Update project-level documentation to reflect the latest state and commands.

### Architecture Decision Records (ADRs)

ADRs are the highest-value documentation. They follow a strict lifecycle: `PROPOSED -> ACCEPTED -> (SUPERSEDED or DEPRECATED)`. Never delete old ADRs; they provide essential history.

### Inline & API Documentation

- **Gotchas**: Explicitly document timing dependencies (e.g., SSR hydration traps).
- **Type-Safe Documentation**: Use JSDoc `@param` and `@returns` for all exported engine functions.

## Usage

```bash
# Create a new ADR from a template
npm run forge:adr create "choose-dexie-storage"

# Audit documentation coverage (JSDoc)
npm run audit:docs
```

## Present Results

Present the updated documentation or the new ADR.

- **Evidence**: The ADR content and a link to the modified `SPEC.md` or JSDoc blocks.
- **Validation**: Demonstrate that the documentation provides clear rationale and covers all consequences of the decision.

## Common Rationalizations

| Agent Excuse                    | The Reality                                                                          |
| :------------------------------ | :----------------------------------------------------------------------------------- |
| "The code is self-documenting." | Code lacks intent, rejected alternatives, and environmental constraints.             |
| "Nobody reads documentation."   | Agents prioritize ADRs. Future-you will appreciate the forensic breadcrumbs.         |
| "ADRs are overhead."            | A 10-minute ADR prevents a 2-hour debate when the same decision is questioned later. |

## Red Flags

- **Silent Decisions**: Implementing structural changes without a written rationale.
- **Leaked Implementation**: JSDoc restating the code logic instead of explaining the intended outcome.
- **Dead Comments**: Leaving commented-out code blocks ("Ghost Code") instead of deleting them.

## Troubleshooting

- **Outdated Docs**: If code and docs conflict, prioritize the code as reality but update the doc immediately to resolve the drift.
- **Ambiguous Specs**: If `SPEC.md` is unclear, trigger `idea-refine` before updating.

## Verification

- [ ] ADR exists for every significant architectural choice.
- [ ] Public APIs (via `window.exposed` or exports) are fully typed and documented.
- [ ] README covers quick start, commands, and architecture summary.
- [ ] **Hard Evidence Recorded**: A new ADR entry in the registry or updated JSDoc blocks.
