---
name: hygiene
description: Triggers on tools/qa/**, tools/ops/hygiene.js, or when running validation. Governs static integrity, linting, and codebase sterilization.
---

# Hygiene: Static Integrity & QA Skill

## When to use this skill

- Running project-wide validation (`npm run validate`).
- Auditing the codebase for "Toxic Patterns" (`console.log`, `alert`).
- Analyzing CSS performance or HTML semantics.
- Fixing linting or formatting errors across the repository.

## Workflow

1.  **Detection**: Execute `npm run hygiene` to scan for `console.log` and `alert` calls.
2.  **Linting**: Run `npm run lint:fix` to automatically repair style violations.
3.  **Specialized Analysis**:
    - Use `tools/qa/analyze-css.js` to audit CSS specificity.
    - Use `tools/qa/htmlhint.js` to verify semantic HTML integrity.
    - Use `tools/qa/diagnostics.js` to collect browser-side logs and network errors from the live application.
4.  **Reporting**: Summarize any persistent warnings that cannot be auto-fixed.

## Instructions

- **Zero Tolerance**: In "Strict" mode, any hygiene failure is a build-breaker.
- **Exclusions**: Only exclude files from hygiene checks if they are third-party libraries or specialized diagnostic tools (e.g., `src/gamemaster/bootstrap.js` for security).
- **Automation**: Prefer automated fixers over manual correction for white-space or simple syntax issues.

## Resources

- **Hygiene Engine**: `tools/ops/hygiene.js`
- **CSS Auditor**: `tools/qa/analyze-css.js`
- **HTML Auditor**: `tools/qa/htmlhint.js`
- **ESLint Config**: `eslint.config.js`
