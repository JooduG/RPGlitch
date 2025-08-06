########################################################
# OPERATIONAL-MODE HANDOFF — RPGlitch UI Polish Sprint
########################################################
**Scope** Fix the five UI/UX regressions uncovered in the latest manual test  
**Time-box** Each numbered task is broken into sub-steps that should take *≤ 5 minutes* apiece.  
**Branch** `feature/ui-polish-<your-initials>` → PR into `main`  
**CI Gate** `npm run lint && npm test && npm run build && npm run validate`

---

## 1 · Dropdowns Re-open for Re-selection (🐛 F-1)

| File | Location | Action |
|------|----------|--------|
| `apps/rpglitch/RPGlitch.js` | `App.updateStoryboardCard` | **A-1** Delete or guard `select.hidden = true` so it executes **only** while the heading is *not* editable. |
| same | same | **A-2** Add click-handler to the heading <br>`heading.addEventListener('click', () => select.hidden = false);` |
| same | `_attachStoryboardListeners` | **A-3** Call `App.updateStoryboardCard(<selectId>, <key>)` once at start-up so headings appear immediately. |

---

## 2 · Inline Card-Name Editing Style (🎨 F-2)

| File | Location | Action |
|------|----------|--------|
| `apps/rpglitch/RPGlitch.js` | click-handler that toggles `contentEditable` | **B-1** *Keep* `h4.card-title` class; *add* `card-title--editing` while editing. |
| `apps/rpglitch/RPGlitch.scss` | end of file | **B-2** ```scss\n.card-title--editing{ @extend .card-title; outline:1px dashed var(--color-accent); }\n``` |
| same | same | **B-3** Ensure blur or Enter → removes `card-title--editing` and commits text. |

---

## 3 · Dynamic Main Title Polish (📝 F-3)

| File | Location | Action |
|------|----------|--------|
| `apps/rpglitch/RPGlitch.js` | `_defaultStoryboardTitle` | **C-1** Add prefix list:<br>`const titlePrompts=[ "Once upon a time", "The tale of", "Chronicles of", "Legend speaks of", "Adventures of" ];` |
| same | `_defaultStoryboardTitle` | **C-2** *Always* prepend `randPrompt()` — even when all three cards selected. |
| `apps/rpglitch/RPGlitch.scss` | `#story-title` block | **C-3** ```scss\n#story-title{ text-align:center; text-wrap:balance; max-width:40ch; margin-inline:auto; }\n``` |
| `apps/rpglitch/RPGlitch.html` | story-title container | **C-4** Add `class="flex-center"` or ensure CSS centers on both axes. |

---

## 4 · Profile Pictures Render Correctly (🖼️ F-4)

| File | Location | Action |
|------|----------|--------|
| `apps/rpglitch/components/picture.js` | `getPictureClass` | **D-1** Return `"profile-picture chin-card"` or `"profile-picture storyboard-card"` accordingly. |
| `apps/rpglitch/RPGlitch.js` | `renderList` / `updateStoryboardCard` | **D-2** Replace previous context strings with `"chin-card"` and `"storyboard-card"`. |
| `apps/rpglitch/RPGlitch.scss` | avatar section | **D-3** ```scss\n.chin-card .profile-picture{ width:4rem; height:4rem; }\n.storyboard-card .profile-picture{ width:4rem; height:4rem; }\n``` _(adjust height if design needs 150 px)_ |

---

## 5 · Search Bar Height Matches Buttons (🔍 F-5)

| File | Location | Action |
|------|----------|--------|
| `apps/rpglitch/RPGlitch.scss` | `.topbar-search` | **E-1** `height:2.5rem; line-height:2.5rem; padding-inline:0.75rem;` |
| same | `.topbar-button` | **E-2** Confirm identical height/line-height; tweak padding only if mismatch remains. |

---

## 6 · Docs Terminology Update (“ASK” → “ANALYSE”) (📚)

| File | Action |
|------|--------|
| `memory-bank/docs/setup/unified-orchestrator-mode.md`<br>`memory-bank/docs/guides/unified-system-quick-reference.md`<br>`memory-bank/docs/guides/unified-system-troubleshooting.md` | **F-1** Search & replace **ASK** → **ANALYSE**.<br>**F-2** Ensure any remaining phase diagrams read **ANALYSE → PLAN → CODE**.<br>**F-3** Run markdown-lint if configured. |

---

### ✅ Commit-Per-Task Workflow

1. Finish subtasks in a section.  
2. `git add -p` the touched lines/files.  
3. `git commit -m "[rpglitch] fix: <concise summary>"`  
4. `npm run lint && npm test` — fix, amend if needed.  
5. Push & open PR; link this brief.

---

**End of Handoff — happy coding!**  
*(Ping the Planning team if any 5-minute block unexpectedly balloons.)*