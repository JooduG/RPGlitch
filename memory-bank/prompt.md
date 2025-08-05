# AGENT TASK: RULESET REFACTOR (High-Priority)

---

## Context

We want to slim down and de-duplicate our rule documents (AGENTS.md + siblings) so future LLM runs cost fewer tokens and are easier to maintain.  
Follow the file/line-exact edit plan below **verbatim**.  Treat all paths as repo-root–relative.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 · AGENTS.md  (root)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Generate component** → `{{APP_ROOT}}/components/story-form.js`
2. **Dialog skeleton** : `<dialog id="story-dialog"><form><input name="title" …>`
3. **Export helper** `openStoryModal(onSubmit)` → `dialog.showModal()`; wire Save/Cancel/Escape.
4. **Duplicate** for characters & worlds (`character-form.js`, `world-form.js`).
5. **Wire in** `_attachContentChinActions` (import modal, remove `prompt`).
6. **onSubmit** : validate, call `App.addStory()`, then `App.refreshAllLists()`.

1.1  Delete the **entire block** “### Lint / Test Workflow” (≈ lines 73-82).  

1. `pnpm add dexie ajv`
2. **Create** `{{APP_ROOT}}/db.js` → init tables `stories, characters, worlds`.
3. **Export** `getAll`, `add`, `bulkPut`, etc. (Promise‑based).
4. **Bootstrap migration** on `App.initializeWhenReady`: copy old `localStorage` → Dexie.
5. Swap all direct `localStorage` calls with awaited DB helpers.
6. **Import validation** → schemas in `{{APP_ROOT}}/schemas/*.json`; validate via AJV during import.

1.2  Insert immediately in its place: > `See CONTRIBUTING.md § 2 “Standard Check”.`

1.3  Relocate “## 8 Pull-Request Workflow” block (≈ lines 83-88) **into** *CONTRIBUTING.md* § 3.  Replace the original lines with: > `Refer to CONTRIBUTING.md § 3 “Pull-Request Workflow”.`

1.4  Search headings for any emoji (🚀 🎯 ⚡ 🧠 etc.) → **remove** them (keep plain text).

1.5  After the “Version 1.4.0” header (≈ line 4-7) **insert**:

```md
### Constants
| Token | Value            |
|-------|------------------|
| `{{APP_ROOT}}` | `apps/rpglitch` |
```

1.6  Find 4 occurrences of literal text apps/rpglitch and replace with {{APP_ROOT}}.

1.7  Under “## 3 Core Rulesets” change every ### heading to #### (one level deeper).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2 · Create CONTRIBUTING.md  (root)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# CONTRIBUTING

## 1. Overview

Central location for workflows & conventions referenced by AGENTS.md.

   ```scss
   :root {
     --color-accent: #ff7ad5;
     --z-overlay: 1000;
   }
   ```
## 2. Standard Check

Run before every commit / PR:

```bash
npm run lint && npm test && npm run build && npm run validate
```

## 3. Pull-Request Workflow

- Title: [<package>] <summary>
- Description links to issue IDs
- All code must pass the Standard Check above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 · Create GLOSSARY.md  (root)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```md
# Glossary

| Term            | Meaning                                            |
|-----------------|----------------------------------------------------|
| Chin (Panel)    | Slide-out side panel used in RPGlitch UI           |
| Storyboard Card | Card representing Story + Character + World tuple  |
| PF-Pic          | Profile-picture placeholder component              |
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4 · Rule-Folder Clean-up
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 Inside .cursor/rules/ rename any file whose filename OR H1 heading starts with an emoji; strip the emoji.

4.2 Within every .mdc that repeats npm run lint && npm test && npm run build && npm run validate → replace text with

See CONTRIBUTING.md § 2 Standard Check.

1. In `{{APP_ROOT}}/RPGlitch.html` top‑bar container → `role="tablist"`.
2. Each tab button → `role="tab"` + `aria-controls="<panel-id>"`.
3. Each chin panel → `role="tabpanel"` + matching `id`.
  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5 · Backlog Label (Task Brief Canvas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Search the canvas document for heading ## ④ ImageGlitch
→ rename to

## [BACKLOG] ImageGlitch – Future Sprint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6 · Commit Process
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```bash
pnpm prettier --write AGENTS.md CONTRIBUTING.md GLOSSARY.md
git add AGENTS.md CONTRIBUTING.md GLOSSARY.md .cursor/rules
git commit -m "docs: deduplicate workflows, add glossary & contributing guide"
```

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
=======
After commit, run the Standard Check. All stages must pass.

##############################################
END OF AGENT TASK
##############################################
