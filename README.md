# RPGlitch Workspace

A unified, Perchance-friendly workspace with:

- **Apps:** `apps/rpglitch`, `apps/imageglitch`
- **One-source configs:** `build/config/*`
- **Generators:** `build/scripts/combine-views.js` (docs),
  `sync-ignores.js` (ignore sets)
- **Output:** built HTML to `build/output/`

## Quick start

```bash
# fetch local libs for Perchance build
npm run fetch:libs
# build and copy the RPGlitch output to clipboard
npm run build:copy
```

## Common tasks

- **Build RPGlitch only:** `npm run build`
- **Lint everything:** `npm run lint` (use `npm run lint:fix` to auto-fix)
- **Combine docs (generated):** `npm run combine`

## Where things live

- **Configs:** `build/config/` (eslint, stylelint, htmlhint, md, jest)
- **Ignore master:** `build/config/ignores.master.json` → `npm run sync:ignores`
- **Scripts:** `build/scripts/*`
- **Generated docs:** `build/output/*.md` (⚠️ do not edit)

## Perchance constraints

- All scripts are **inlined**; no CDN tags in the final HTML.
- Local libs pulled into `build/local_libs` only.
- Output for RPGlitch: `build/output/RPGlitch-perchance.html`.

**More docs:** see
[`build/output/combined-docs.md`](build/output/combined-docs.md) and
[`build/output/repo-overview.md`](build/output/repo-overview.md).
