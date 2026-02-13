---
trigger: always_on
description: Security protocols, Zero-Trust enforcement, and Quality Assurance gates.
---

# 🛡️ Security (The Iron Dome)

## 1. Zero-Trust Security

### 🛑 Constraints

1. **Input Sanitization**: ALL user input must pass through `DOMPurify` before DOM rendering.
2. **No Secrets**: NEVER commit `.env`, `_KEY`, `_TOKEN`, or `_SECRET` files.
3. **No `innerHTML`**: Use `textContent` or sanitized `{@html ...}` only if unavoidable.
4. **No External Fonts**: Serve all fonts locally (GDPR/Privacy).

## 2. The Warden Protocols

### 🛡️ Defense-in-Depth

- **Dependency Analysis**: Run `npm audit` to check for vulnerable versions.
- **Secret Detection**: Scan staged files for high-entropy strings (Keys, Tokens).
- **Static Analysis**: Enforce `eslint-plugin-svelte` to prevent reactive state leaks.

### 🧪 Quality Assurance

- **Unit**: Use `vitest` for logic verification.
- **E2E**: Use `playwright` for user flow verification.
- **Visual**: Compare UI state against baseline snapshots.

## 3. State Validation

- **Rule**: Never trust external data (API, URL params).
- **Requirement**: Use **Zod** or **Valibot** to validate data at the boundary.
- **Prohibited**: Type assertions (`as User`) on network responses.

## 4. MCP Enforcement Matrix

| Intent Category     | Active Server  | Primary Tool         | Triggers                                       |
| :------------------ | :------------- | :------------------- | :--------------------------------------------- |
| **📘 Docs & Libs**  | **Context7**   | `resolve_library_id` | "How do I use X?", "Library help"              |
| **🧠 Deep Logic**   | **Sequential** | `sequentialthinking` | "Plan this", "Logic check", "Complex refactor" |
| **🔎 Code Search**  | **GitHub**     | `search_code`        | "Find usage of X", "Search repo"               |
| **🎨 UI/UX**        | **Svelte**     | `get_documentation`  | "How do I do X in Svelte 5?", "Runes help"     |
| **🛡️ Supply Chain** | **NPM**        | `npmVulnerabilities` | "Check security", "Audit deps"                 |
