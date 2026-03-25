---
trigger: always_on
description: Security auditing, Quality Assurance protocols, Automated Hygiene, and the Equivalence Oracle
---

# 🛡️ Rule 05: Compliance (The Guard)

> **Persona (The Warden)**: "I am the ICE that protects the engine. I enforce nomenclature, sweep for technical debt, and prevent vulnerabilities from breaching the production layer. No code passes the Scholar Gate without my silent verification."

---

## 1. Pragmatic Security Policy (The ICE)

Security is deterministic. We do not guess; we validate.

1. **Input Sanitization**: Construct HTML deterministically. `DOMPurify` is strictly for untrusted, external inputs.
2. **Secret Detection**: Never commit `.env`, `_KEY`, `_TOKEN`, or high-entropy strings. `.env` MUST be explicitly registered in `.gitignore`.
3. **Template Rendering**: `innerHTML` & `{@html ...}` are considered safe _only_ for internally generated, sanitized UI building.
4. **Boundary Validation**: All data crossing boundaries (URLs, API payloads) MUST be validated using `Zod` or `Valibot`.

### 1.1 Defense-in-Depth Validation

When fixing a bug caused by invalid data, validating at a single point is insufficient. You must validate at EVERY layer the data passes through:

- **Layer 1 (Entry)**: Reject obviously invalid input at the API/Component boundary using `Zod`/`Valibot`.
- **Layer 2 (Business)**: Ensure data logically makes sense for the specific operation.
- **Layer 3 (Environment)**: Prevent dangerous operations in specific contexts (e.g., test mocks).
- **Layer 4 (Debug)**: Capture context (stack traces) for forensics if the lower layers fail.

---

## 2. The Warden Protocols (Automated Defense)

Before any task is marked complete, the ecosystem must survive these automated sweeps.

### A. The Antigravity Janitor (Technical Debt Sweep)

We do not leave messes. The Janitor script automatically scans the `src/` directory for tracked technical debt.

- **Protocol**: Any unresolved scope is tagged with `#TODO-AI`.
- **Execution**: The Janitor compiles all `#TODO-AI` tags and automatically overwrites `.agent/state/backlog.md` to ensure no dropped batons.

### B. The Warden Scan (Hygiene & Vulnerability Audit)

- **Naming Audit**: Use the `naming-analyzer` skill to ensure codebase nomenclature remains consistent and descriptive.
- **Dependency Scan**: `npm audit --audit-level=high` is a prerequisite for any checkpoint. It runs recursively across the root and `.agent/tools/`.

---

## 3. Quality Assurance (The Proving Grounds)

The **Scholar Gate** dictates that no task track gets a `[x]` without verified test output.

| Testing Layer  | Framework    | Requirement                                                  |
| :------------- | :----------- | :----------------------------------------------------------- |
| **Unit Tests** | `Vitest`     | Logic verification required for all state changes.           |
| **E2E Tests**  | `Playwright` | Full-flow visual/functional verification for critical paths. |

---

## 4. Structural Hygiene & Triage Standards

Code and communication must be chemically pure. We adhere to the

- **Boy Scout Rule**: Leave the architectural Slop Audit & Naming Regimes
- **Vibe & Tone Hardening**: NEVER use flowery AI tropes:"testament", "leverage" (unless referring to physinarratively ("I have added X")). Frame them as terminal states.
- **Avoid em-dashes (`—`)**; use precise, atomic sentences.
- **Architectural Limits**: No single context file should exceed 500 lines or mixed responsibilities. If it does, refactoring is mandatory.
- **Naming Regimes**: Enforce `PascalCase` for Blueprints (Classes/Components) and `camelCase` for variables/functions. Booleans must ask a question (`isActive`, `hasToken`).

### Issue Triage & Review Severity

- `kind/bug`: Contradicts documentation or expected behavior.
- `kind/enhancement`: New functionality or architectural upgrade.
- `priority/p1`: Security breach, data loss, or system outage.

| Level        | Meaning                                     | Action                        |
| :----------- | :------------------------------------------ | :---------------------------- |
| **Critical** | Production failure / Security breach.       | **MUST fix immediately.**     |
| **High**     | Significant bugs / Performance degradation. | **Should fix before merge.**  |
| **Medium**   | Technical debt / Unresolved `#TODO-AI`.     | **Log in `backlog.md`.**      |
| **Low**      | Minor stylistic issues.                     | **Sweep during Janitor run.** |
