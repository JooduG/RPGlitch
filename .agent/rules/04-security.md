---
trigger: always_on
description: The Shield. Zero-Trust security, strict hygiene, and rune safety.
---

# 🛡️ Security (The Shield)

## 1. Pragmatic Security Policy

1. **Input Sanitization**: We construct HTML deterministically. `DOMPurify` is only required when injecting completely untrusted, raw external user inputs.
2. **Secret Detection**: Never commit `.env`, `_KEY`, `_TOKEN`, or high-entropy entropy strings.
3. **`innerHTML` & `{@html ...}`**: Safe to use for internal UI building. No need to wrap safe strings in `DOMPurify` for deterministically generated internal UI.

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

| Intent Category | Primary Tool                                                                                                                                    | Triggers                          |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| **📙 Docs**     | [context7](https://github.com/mcp-server/context7)                                                                                              | "How do I use X?"                 |
| **🧠 Logic**    | `sequentialthinking`                                                                                                                            | "Complex refactor", "Logic check" |
| **🔎 Search**   | `grep_search`                                                                                                                                   | "Find usage", "Search repo"       |
| **🛡️ Audit**    | [.agent/skills/security/scripts/security-scan.js](file:///c:/Users/johng/source/repos/RPGlitch/.agent/skills/security/scripts/security-scan.js) | "Security scan", "Check hygiene"  |
