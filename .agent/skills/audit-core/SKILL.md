---
name: audit-core
description: Scans specific files for violations of the Tech Stack rules (e.g., legacy Svelte syntax, inline styles).
---

# 🛡️ Audit Protocol

## Inspection Targets

### 1. Runes Compliance (Critical)

- **Search:** `export let`
- **Verdict:** ❌ **CRITICAL ERROR**. Deprecated. Must use `$props()`.
- **Search:** `$:` (followed by space or variable)
- **Verdict:** ❌ **CRITICAL ERROR**. Deprecated. Must use `$derived` or `$effect`.
- **Search:** `createEventDispatcher`
- **Verdict:** ❌ **CRITICAL ERROR**. Deprecated. Must use callback props.

### 2. Styling Hygiene (Critical)

- **Search:** `style="` (Inline Styles)
- **Verdict:** ❌ **CRITICAL ERROR**. All styles must be in `<style>` blocks or CSS files.
- **Search:** `#` (Hex Codes in CSS)
- **Verdict:** ⚠️ **WARNING**. Should use `var(--color-...)` tokens.

### 3. Type Safety

- **Search:** `: any`
- **Verdict:** ⚠️ **WARNING**. Strict TypeScript required.

## Remediation

If **CRITICAL ERRORS** are found, the build is **FAILED**.

1.  List the specific violations (Line #).
2.  Do NOT ask for permission to fix.
3.  Immediately refactor to the compliant Svelte 5 / SCSS pattern.
