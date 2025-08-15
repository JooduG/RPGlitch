# RPGlitch

Single-file Perchance deliverable with storyboard + profiles.

## Entry / Output

- **Entry HTML:** `apps/rpglitch/RPGlitch.html`
- **Scripts:** `apps/rpglitch/js/*.js`
- **Styles (SCSS):** `apps/rpglitch/RPGlitch.scss`
- **Build output:** `build/output/RPGlitch-perchance.html` (inlined)

## Build

```bash
npm run fetch:libs      # downloads pico/cash/dexie/purify/_hyperscript → build/local_libs
npm run build           # builds only
npm run build:copy      # builds and copies final HTML to clipboard
```

## Perchance constraints we honor

- Strip all external `<script src>` and `<link>`; inline bundle only.
- Use **one** image source across storyboard/chin/profile (normalized `image`/`imageUrl`).
- Routes: `#storyboard`, `#profile/:type/:id`, `#form/:type/:id|new`.
- Storyboard `<select>` updates card **without navigating**; card click navigates.

## Folder map

```text
apps/rpglitch/
  RPGlitch.html
  RPGlitch.scss
  js/
    utils.js
    entities.js
    profile-router.js
    entity-form.js
```

## Gotchas / Troubleshooting

- If UI looks unstyled, re-run `npm run fetch:libs` (pico in
  `build/local_libs/pico.min.css`).
- If clipboard copy fails, PowerShell may need `Set-Clipboard`;
  re-open terminal or use `npm run build:perchance` and copy manually.
