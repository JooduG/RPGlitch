# RPGlitch – Non-Intrusive Edits SOP

## Scope

For routine polish (a11y, perf, error-handling, DX) without changing flows or data shape.

## File Mode Rules

- **Small files (utils.js, entities.js, entity-form.js, profile-router.js, etc.)**
  - Deliver **full-file rewrites**, but **preserve structure & API**.
- **Core (RPGlitch.html / RPGlitch.js / RPGlitch.scss)**
  - Deliver **surgical patches/snippets** only.

## Change Classes

- **A11y**: labels, roles, aria-*; no visual/flow change.
- **Perf**: debounce, lazy-loading; no logic change.
- **Safety**: try/catch around storage/JSON; sanitize strings.
- **DX**: comments/JSDoc, logs behind a flag.

## Invariants

- Keep DOM ids/classes, storage keys, function names, and public APIs unchanged.
- No feature removals or renames.
- Additive edits only, unless explicitly requested.

## Workflow

1) Load originals; note public APIs & invariants.
2) Apply minimal deltas; mark with `// NEW:` or `// UPDATED:`.
3) Avoid new cross-file deps (provide fallbacks).
4) Run test surfaces that rely on selectors or public functions.

## Output Discipline

- Small files → full code.
- RPGlitch.xxx → patch blocks with insertion points.
