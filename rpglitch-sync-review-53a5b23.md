# RPGlitch sync + review — HEAD 53a5b237

Date: 2026-08-21 | Commits since last sync (39abb1c): b7771f6 (docs) + 53a5b23 (code)

## Sync result

- Workspace src/ synced byte-exact to 53a5b237. 8 files changed: premades.js, sessions.svelte.js, prompts.js, prompts.test.js, Profile.svelte, profile/index.js (+2 new: RelationalGraph.svelte, RelationalGraph.test.js). Re-diff: 0 remaining differences.
- 3 generated workspace files preserved (tokens.js, design.css, signature-colors.js).
- Editor's index.html verified = new HEAD bundle (markers: "is_wanderer", "Add Directed Relationship Bond", "No recorded relationships yet", "mesh-glow"). Live boot: clean, no console errors.

## What the commit adds

1. **Session auto-seeding** (sessions.svelte.js create_from_selection): every new story's roster is seeded with (a) all characters marked is_wanderer, (b) characters with a relationship to the chosen fractal (either direction). Glitch + Rust are now is_wanderer (premades.js).
2. **Epistemic mesh scoping** (prompts.js render_relational_mesh_xml + render_current_story_state_xml): character prompt (L646) and NPC prompt (L760) now pass a perspective_entity, so the <RELATIONAL_MESH> is filtered to only the perspective entity's OWN outgoing bonds + the FRACTAL's bonds. Scene-narrator/director (L886) keeps the full mesh.
3. **RelationalGraph.svelte** (new, 529 lines): radial SVG relationship constellation on the profile view — dual-direction curved edges, tooltips, click-to-open-profile, inline add/delete/edit relationship UI matching the vector format. Tests added.

## Review — verdict: solid, well-tested commit. Issues below (most minor)

### Bugs / concerns

1. **Vector-format duplication (highest risk).** "A → B: dynamic" is parsed/emitted in 4+ places: RelationalGraph.svelte parse_edge (L73), sessions.svelte.js seed regex (x2), prompts.js is_from_me prefix, Profile.svelte editor. The regexes already diverge (`—>\s*` quirk, sessions variant omits capturing the dynamic). Recommend one shared parse/format util in utils/. Not a live bug today; it's the most likely future divergence point.
2. **find_matched_entity substring fallback** (RelationalGraph L89-103) can mis-match once the roster grows past premades ("Rust" → "Rusty X", "Glit" → "Glitch"). Exact-name match is fine today. Also the final fallback returns {name} with no id — links render but clicking them has nothing to navigate to.
3. **parse_edge edge cases**: names containing ":" split wrong; chained arrows "A → B → C: d" parse target as "B → C". Harmless for engine-written data, worth a comment.
4. **Incoming-edge harvest** (RelationalGraph ~L137): `current_name.includes(norm(target))` — substring match, so a relationship targeting "Glit" shows up on "Glitch"'s graph. Same family as #2.
5. **Seed behavior change**: wanderers are added to EVERY story regardless of chosen fractal — new stories always start with Glitch + Rust in the roster. Deliberate (commit message: "trans-fractal Wanderers") but worth knowing; also note selection.npc_ids are not passed through the ai/user exclusion (only the seeded loop is), so an explicitly-passed npc_id equal to the AI id would survive.
6. **Silent catch** in create_from_selection (catch(_err){}): an entity-store read failure silently falls back to the explicit selection with no log. Acceptable, but one console.warn would help future debugging.
7. **Pre-existing (unchanged at HEAD)**: parser.test.js:2 upward test import from ../ui/message/render.js. Test-only, runs fine under vitest, but breaks the intelligence→ui layering rule.

### Data-loss incident — MUST KNOW

The live IndexedDB currently has stories:0, simulation_log:0, sessions:0, entities:10. During the previous session's runtime test there WAS a story with ~50 log entries + a session. Something wiped the story/log data at some point (entities survived). No code path in the current sources clears stores on boot, and the storyboard DELETE ALL (DevControls hard_reset = db.delete() + reload) sits behind a confirm dialog, so I could not find a non-user cause. Most likely a stray click during the earlier UI-driving/testing. The new seed logic means starting a fresh story is cheap; just be aware the old session/log history is gone and it doesn't look code-caused.

## Tests

Test suite can't run here (no local shell — you run npm run verify). The commit adds RelationalGraph.test.js (80 lines, parse/geometry coverage) and extends prompts.test.js. Static review of all changed files found no blocking issues.
