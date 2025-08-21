# RPGlitch Workspace

A unified, Perchance-friendly workspace with:

- **Apps:** `apps/rpglitch`, `apps/imageglitch`
- **One-source configs:** `build/config/*`
- **Generators:** `build/scripts/sync-combine.js` (docs),
  `sync-configs.js` (ignores + IDE configs)
- **Output:** built HTML to `build/output/`

## Quick start

```bash
# One command to rule them all - ready for Perchance
npm run deploy
# Or just build and copy
npm run build:copy
```

## Common tasks

- **Deploy to Perchance:** `npm run deploy` (sync all, test, lint, build & copy)
- **Build RPGlitch only:** `npm run build`
- **Lint everything:** `npm run lint` (use `npm run lint:fix` to auto-fix)
- **Sync everything:** `npm run sync` (libs, configs, combine docs)
- **Combine docs (generated):** `npm run sync:combine`

## Where things live

- **Configs:** `build/config/` (eslint, stylelint, htmlhint, md, jest)
- **Config sync:** `build/config/ignores.master.json` + `.rules/` → `npm run sync` (or individual sync:xxx commands)
- **Scripts:** `build/scripts/*`
- **Generated docs:** `build/output/*.md` (⚠️ do not edit)

## Perchance constraints

- All scripts are **inlined**; no CDN tags in the final HTML.
- Local libs pulled into `build/local_libs` only.
- Output for RPGlitch: `build/output/RPGlitch.html`.

**More docs:** see
[`build/output/combined-docs.md`](build/output/combined-docs.md) and
[`build/output/repo-overview.md`](build/output/hub.md).
