# 🛡️ Shield (The Vault)

description: Security auditing, Review protocols, and Issue Triage.

## 1. Pragmatic Security Policy

1. **Input Sanitization**: Construct HTML deterministically. `DOMPurify` is only for untrusted external inputs.
2. **Secret Detection**: Never commit `.env`, `_KEY`, `_TOKEN`, or high-entropy strings.
3. **`innerHTML` & `{@html ...}`**: Safe for internal UI building.

## 2. The Warden Protocols

### Defense-in-Depth

- **Hygiene Audit**: No `console.log`, `FIXME`, or dead comments in production-ready tracks.
- **Dependency Scan**: `npm audit` is a prerequisite for any checkpoint.
- **Static Analysis**: ESLint MUST enforce Svelte 5 rune safety.

### Quality Assurance

- **Unit (Vitest)**: Logic verification required for all state changes.
- **E2E (Playwright)**: Full-flow verification for critical paths.
- **State Validation**: Use Zod/Valibot at boundaries (URL, API).

## 3. Code Review Protocol

### Severity Levels

- **Critical**: Production failure/Security breach. MUST fix.
- **High**: Significant bugs/Performance degradation. Should fix.
- **Medium**: Technical debt.
- **Low**: Minor stylistic issues.

### Format

Use the `suggestion` block for actionable code changes. Ensure parity with target file indentation.

## 4. Issue Triage Protocol

- **kind/bug**: Contradicts docs or expected behavior.
- **kind/enhancement**: New functionality.
- **priority/p1**: Security, Data Loss, or Outage.
