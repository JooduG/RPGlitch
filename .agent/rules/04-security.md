---
trigger: always_on
description: The Shield. Zero-Trust security, strict hygiene, and rune safety.
---

# 🛡️ Security (The Shield)

## 1. Zero-Trust Policy

1. **Input Sanitization**: All user input must pass through `DOMPurify` before rendering.
2. **Secret Detection**: Never commit `.env`, `_KEY`, `_TOKEN`, or high-entropy entropy strings.
3. **No `innerHTML`**: Use `textContent` or sanitized `{@html ...}` only if strictly necessary.

## 2. The Warden Protocols

### Defense-in-Depth

- **Hygiene Audit**: No `console.log`, `FIXME`, or dead comments allowed in production-ready tracks.
- **Dependency Scan**: `npm audit` is a prerequisite for any checkpoint.
- **Static Analysis**: ESLint must enforce Svelte 5 rune safety.

### Quality Assurance

- **Unit (Vitest)**: Logic verification is required for all state changes.
- **E2E (Playwright)**: Full-flow verification for critical paths.
- **State Validation**: Logic must not trust external data (URL, API); use Zod/Valibot at boundaries.

## 3. Enforcement Matrix

| Intent Category | Primary Tool         | Triggers                          |
| :-------------- | :------------------- | :-------------------------------- |
| **📙 Docs**     | `context7`           | "How do I use X?"                 |
| **🧠 Logic**    | `sequentialthinking` | "Complex refactor", "Logic check" |
| **🔎 Search**   | `grep_search`        | "Find usage", "Search repo"       |
| **🛡️ Audit**    | `security-scan.js`   | "Security scan", "Check hygiene"  |
