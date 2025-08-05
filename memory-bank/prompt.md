# RPGlitch — **Operational‑Mode Task Brief**

---

## ① JavaScript Tasks (👩‍💻 Core Logic)

Execute tasks sequentially, committing after each block passes tests & lint. Reference `AGENTS.md` for commit message format, PR template, and reviewer assignment.

### A. Replace `window.prompt` with Modal Forms

1. **Generate component** → `{{APP_ROOT}}/components/story-form.js`
2. **Dialog skeleton** : `<dialog id="story-dialog"><form><input name="title" …>`
3. **Export helper** `openStoryModal(onSubmit)` → `dialog.showModal()`; wire Save/Cancel/Escape.
4. **Duplicate** for characters & worlds (`character-form.js`, `world-form.js`).
5. **Wire in** `_attachContentChinActions` (import modal, remove `prompt`).
6. **onSubmit** : validate, call `App.addStory()`, then `App.refreshAllLists()`.

### B. Introduce Dexie (IndexedDB) + Schema Validation

1. `pnpm add dexie ajv`
2. **Create** `{{APP_ROOT}}/db.js` → init tables `stories, characters, worlds`.
3. **Export** `getAll`, `add`, `bulkPut`, etc. (Promise‑based).
4. **Bootstrap migration** on `App.initializeWhenReady`: copy old `localStorage` → Dexie.
5. Swap all direct `localStorage` calls with awaited DB helpers.
6. **Import validation** → schemas in `{{APP_ROOT}}/schemas/*.json`; validate via AJV during import.

### C. Accessibility + Search Fixes

1. In `_attachChinSearchHandlers`: lowercase compare; `card.toggleAttribute('hidden', !match)`.
2. Add Escape‑to‑close listener & focus trap when chin open.
3. Passive `{passive:true}` for any `touchstart` listeners.
4. Jest: ensure `chin-lists.test.js` passes.

### D. Async Profile Picture Flow

1. `ProfilePictureComponent.js` → `export async function getProfilePictureHTML(..)`.
2. Await `textToImage.generate`; return loader `<div class="pfp loading" …>` until resolved.
3. Catch errors → `createInitialsOnlyHTML(name)` fallback.
4. Propagate `await` in `renderList` & `updateStoryboardCard`.
5. Unit test `profile-picture.test.js` for success & failure paths.

### E. Build / Test Hygiene

1. Shared JSDOM helper → `tests/helpers/setup-dom.js`.
2. Axe‑core scan → `tests/accessibility.test.js`.
3. Final gate → See CONTRIBUTING.md § 2 Standard Check.

---

## ② CSS Tasks (🎨 Theme & Layout)

Execute tasks sequentially, committing after each block passes tests & lint. Reference `AGENTS.md` for commit message format, PR template, and reviewer assignment.

### A. Tokenise & Clean

1. Add to top of `RPGlitch.scss`:

   ```scss
   :root {
     --color-accent: #ff7ad5;
     --z-overlay: 1000;
   }
   ```

2. Replace any literal duplicates (colour / z‑index) with variables.

### B. Fix Flex & Focus

1. `align-items:right|left` → `flex-end|flex-start`.
2. `justify-content:right` → `flex-end`.
3. Remove `*:focus{outline:none}`; add `:focus-visible{outline:2px solid var(--color-accent);}`.

### C. Remove Bloat & Bugs

1. Delete obsolete `-webkit-display`, `-moz-display`, etc.
2. Replace `z-index:999999` with `var(--z-overlay)`.
3. Flatten nested `calc()` expressions.
4. Delete unused selectors `#profile-field` / `#profile-field-label` if not present in HTML.

### D. Lint & Verify

1. Run `npm run lint:css` (or `stylelint`); fix reported issues.

---

## ③ HTML Tasks (🖥️ Structure & ARIA)

Execute tasks sequentially, committing after each block passes tests & lint. Reference `AGENTS.md` for commit message format, PR template, and reviewer assignment.

### A. Top‑Bar & Chin Panels

1. In `{{APP_ROOT}}/RPGlitch.html` top‑bar container → `role="tablist"`.
2. Each tab button → `role="tab"` + `aria-controls="<panel-id>"`.
3. Each chin panel → `role="tabpanel"` + matching `id`.

### B. Focus Management

1. Ensure first focusable element inside each chin receives `autofocus` or is focused on open (handled by JS focus trap).

### C. Meta & Misc

1. (If missing) Ensure `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width,initial-scale=1">` present.
2. Remove inline `window.prompt` references now obsolete.

---

## [BACKLOG] ImageGlitch – Future Sprint

Execute tasks sequentially, committing after each block passes tests & lint. Reference `AGENTS.md` for commit message format, PR template, and reviewer assignment.

> _No immediate coding required; keep for backlog._

1. **Viewport meta** → add when sprinting ImageGlitch.
2. Extract inline JS to `ImageGlitch.js`; export `initImageGlitch()`.
3. Replace `!important` overrides with state classes `.is-disabled`.
4. Convert media queries `(width <= …)` → `@media (max-width: …)`.
5. `build-and-copy.js` → integrate `clipboardy` for macOS/Linux.
6. Fix `combine-rules.js` link replacement + Jest coverage.

---
