---
name: api-and-interface-design
description: Guides stable API and interface design. Use when designing internal module contracts, Perchance window.exposed bridges, Dexie.js schemas, or any public interface where one piece of code talks to another.
---

# API and Interface Design

> "Design stable, well-documented interfaces that make the right thing easy and the wrong thing hard."

## Overview

The `api-and-interface-design` skill focuses on creating stable contracts between different parts of the RPGlitch Engine. This include internal module boundaries, Perchance bridges via `window.exposed`, Dexie.js database schemas, and Svelte 5 component props. A good interface hides implementation details and prevents misuse.

### Strategic Context

- **Hyrum's Law Awareness**: Be intentional about exposed behaviors.
- **One-Version Rule**: Avoid multiple versions of the same API; extend rather than fork.
- **Boundary Validation**: Trust internal logic, but strictly validate and sanitize at the system edges.

## When to Use

- **Positive Triggers**: Defining internal module contracts, creating `window.exposed` bridges, established Dexie.js schemas, or standardising component prop interfaces.
- **System Shifts**: When changing how the Engine core interacts with the UI or external environment.
- **EXCLUSIONS**: Do not use for pure internal function logic that doesn't cross a module or system boundary.

## How It Works

1. **Contract First**: Define the interface using TypeScript (or JSDoc) in the planning phase before implementation.
2. **Consistent Error Semantics**: Use a unified error shape (type, source, message, context).
3. **Boundary Validation**: Implement sanitization (Rule 06) and shape validation (Zod-style) at the point of entry.
4. **Additive Evolution**: Prefer adding optional fields over modifying existing ones to maintain backward compatibility.

### RPGlitch Specific Boundaries

- **Perchance Bridges**: Treat `window.exposed` as a public API; ensure serializable views are returned, not internal state.
- **Dexie Schema**: Schema changes require a migration plan and version increment (Rule 03).
- **Svelte Props**: Use `$props()` for strict component contracts.

## Usage

```bash
# Verify API contract consistency
npm run audit:api

# Document a new interface in the ADR registry
npm run forge:adr create "new-engine-contract"
```

## Present Results

Present the proposed interface definition and its justification.

- **Evidence**: TypeScript/JSDoc block defining the contract and boundary validation logic.
- **Validation**: Demonstrate that the interface satisfies backward compatibility and security requirements.

## Common Rationalizations

| Agent Excuse                      | The Reality                                                                    |
| :-------------------------------- | :----------------------------------------------------------------------------- |
| "It's just an internal module."   | Internal consumers are still consumers. Contracts prevent brittle coupling.    |
| "Validation at the UI is enough." | Rule 06: Validation must happen at the logic boundary for security and safety. |
| "TypeScript is overkill."         | Types are the documentation for future engineers and agents.                   |

## Red Flags

- **Leaking State**: Exposing internal reactive state objects directly to `window.exposed`.
- **Inconsistent Returns**: Endpoints returning different data shapes based on hidden state.
- **Verbs in State**: Naming state variables with action verbs (e.g., `get_user` instead of `user`).

## Troubleshooting

- **Schema Mismatch**: Use the Dexie `version` hook to handle data migrations without data loss.
- **Context Loss**: If an API call fails to pass context, check the payload serialization logic.

## Verification

- [ ] Every boundary has a typed contract (TS or JSDoc).
- [ ] Error responses follow a single consistent format.
- [ ] Validation happens at system edges only.
- [ ] **Hard Evidence Recorded**: JSDoc/TS definition matching the implementation precisely.
