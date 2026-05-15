# 📜 ETERNAL: Legislative Consolidation Spec

## 🎯 Objective

Consolidate the RPGlitch audit ecosystem into a single, performant, and unified engine (The Reflex) to ensure strict adherence to Sovereign architecture standards with zero redundancy.

## 🏗️ Architecture

- **Central Engine**: `warden.js` (The Reflex).
- **Rule Providers**: Domain-specific scripts (CSS, Svelte, Security, Nomenclature, Skills, Templates) exporting a standard `Rule` interface.
- **Scanning**: Single recursive walker in `warden.js` respecting `.gitignore`.

## 📐 Rule Interface

Every rule must follow this structure:

```javascript
{
  id: string,          // Unique ID (e.g., N-LANG-001)
  severity: "HERESY" | "DEBT" | "ADVICE",
  message: string,     // Description of the violation
  regex?: RegExp,      // Optional line-by-line matcher
  validate?: (content, filePath) => boolean | { valid: boolean, errors: string[] }
}
```

## 🛠️ Refactor Plan

1. **`warden.js`**:
   - Enhance `Auditor.scan` to be the sole directory walker.
   - Integrate `scan_nomenclature` logic into the standard file-wide validation loop.
   - Standardize CLI flags and filters.
2. **`audit-nomenclature.js`**:
   - Refactor into a collection of `Rule` objects.
   - Remove `scan_nomenclature` walker and CLI entry point.
3. **`audit-skills.js`**:
   - Ensure `skill_rules` follow the standard interface.
   - Remove local main entry point.
4. **`audit-templates.js`**:
   - Ensure standard rule export.
5. **`warden-project.js`**:
   - Ensure standard rule export.

## ✅ Success Criteria

- [ ] `npm run audit` executes all audits via a single `warden.js` invocation (or orchestrated via `summarize.js`).
- [ ] No redundant directory walkers in `.agents/skills/legislative/scripts/`.
- [ ] All violations reported in a consistent ANSI-colored format.
- [ ] Zero impact on existing "HERESY" gate logic (process.exit(1) on critical violations).
