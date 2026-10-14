# Bugs, debt & bad shit

Verdict ledger vs `src/` @2c3eca27 (2026-10-14). Tags: `[BUG]` seen live or proven by execution · `[DEBT]` inert dead code / P4 violation · `[WATCH]` suspected or live-untested · `[METHOD]` measurement caveat. Line numbers verified today; audit-trail comments (`* - …`) are history, not debt, and are excluded. Fixed items sit at the bottom so nobody re-litigates them. Hand to user for repo-root copy (agent cannot write there).

## Open bugs

- [BUG] E2 — forge rewrites delete concealed brackets (~3-turn half-life for `|hide` items; dossier T21-22, DAGGER case). `temporal.js` has no hide-aware merge path: only visibility passthrough (`temporal.js:166,185`) plus flag-stripping for embeddings (`temporal.js:355`). Nothing preserves concealment across consolidation.
- [BUG] M1 — merge appends case-variant dupes (R12→R14 gash). No case-folded dedup anywhere in the temporal merge path (`merge_field_content`, `temporal.js:1110`).
- [BUG] Ghostwrite POV failures, 2× live (dossier T19-20). (a) AGENCY contradiction: Beast-POV draft speaking as the user persona. L3 is now in the ghostwrite prompt, but the structural contradiction stands — L3 forbids puppeteering the exact persona ghostwrite is instructed to speak as. (b) Owner `|hide` dropped on the ghostwrite path: `execute_ghostwriter` (`story.js:980-990`) compiles the full payload with no veil filtering in the block.
- [BUG] F6 — round advanced +3 on a single user send (4→7). Unexplained; old GEMINI text makes it a spec violation. No code site found.
- [BUG] F4 — intermittent `Generation aborted by caller` on forge + visual paths (4 of last 5 turns late-run). Suspected silent-path starvation. No code site found.
- [BUG] Recall clarity unwired (dossier T15-16/L14). `format_hybrid_recall` (`temporal.js:921`) has zero production callers (tests only); chaos 90–100 for 10+ turns never produced a `[fragmented recall]` prefix. Queued Phase V 5.3.
- [BUG] ENTITIES unbudgeted → 6k cliff fails live. `calculate_physical_salience` (`temporal.js:1057`) has zero call sites; `whole_vector_slice` is only re-exported (`sheets.js:43-45`), never used in scoring. Director runs 7.2–7.9k tok/turn with ENTITIES at 68%. Queued Phase V 5.1. This is the biggest architectural open item.
- [BUG] `audit_macro_shape` never runs live. Defined `styles.js:186`, zero callers — Tier-2 cluster linting exists only as dead code.
- [BUG] Destruction detector false-positives on idioms (proven by bundled execution today). `is_explicit_player_destruction_declared` (`director.js`) returns true for "it kills me every time", "I die-cast the miniature", "deathly pale" (substring match, no word boundaries). Fail-safe direction (over-blocks terminal collapse), low severity; wants `\b` matching or an idiom exclusion pass.
- [BUG] Think-channel tics invisible to the spent ledger (L12: "a hard stutter of light of X", T1+T9). Ledger only sees prose output.
- [BUG] Full-turn parrot regurgitation bypasses the ledger (L29) — input-anchored repeats don't trip phrasing dedup.
- [BUG] Narrator veil gap (L34) — narrator emitted `PRETEXT|hide`, guard is warn-only. Render-path site unpinned (no `filter_epistemic`/`perspective` hits in `story.js`; filtering happens off-path).
- [BUG] Phase III 3.9 LLM half missing (checked item, no code): the item claims LLM epistemic dispositions sourced from `present.non_physical` as `<DISPOSITION target>` — zero producers/consumers exist anywhere in non-test `src/` (old renderer was removed, "without redundant extraction"). UI dossier half exists and is test-pinned; the LLM half did not ship.
- [BUG] Phase III 3.8 storage-ban gate missing (checked item, no code): the item claims an automated gate in `prompts.test.js` banning `speaker`/`listener` from durable memory — no such test exists. Convention (TURN-only attrs) is implemented; enforcement is not.
- [BUG] @ID editor pattern malformed, minor UI (`ProfileHeader.svelte:70`): `pattern="^[A-Za-z0-9_-]{(2, 20)}$"` is an invalid quantifier (space + misplaced parens), so min-length is unenforced — max survives via `maxlength` + `slice(0, 20)`.

## Dead code & P4 violations (all inert, all should be pruned)

- [DEBT] `story.js:270-271,398` — ALT-BRANCH block reads `director_data.alternative_branches`, always `[]` since the Phase I purge. Loop never executes; meta write never fires.
- [DEBT] `output.js:56` — director output-schema placeholder still documents `alternative_branches`, which `DIRECTOR_SCHEMA` no longer accepts and the director is never asked for.
- [DEBT] `task.js:668` — `values.has_candidates` is set but never read (Phase II deleted the CONVERGENCE gating that consumed it; `builder.js:567,598` still computes and passes it).
- [DEBT] `story.js:525,1008` — literal `"<think>"` string checks alongside the imported `THINK_OPEN_TAG` (used at `:544`). Case-drift risk, flagged twice, never unified.
- [DEBT] Tier-1 detox registration ordering is implicit. Works today only because `speaking-styles.js` self-registers at import (`:1129,1175`) and rides into the bundle via the `@data` chain (`normalizer.js:43`, `data/index.js:90`) — nothing declares the requirement, so a future lazy-load or tree-shake silently disables scrubbing.
- [DEBT] `MEMORY_ADVISORY` is continuum-envelope-only by construction (`prompts.js:112,460,474`; absent from story task). Dossier T12's protocol-text note was never answered — either document it as intended or close it.
- [DEBT] RelationalContext tuple (Phase III 3.3) is never constructed in production — sole construction site is the internal fallback (`macros.js:69`). The broker exists as a type + tests; no prompt-assembly caller composes me/you/speaker/listener/target/witnesses. Same landed-unwired pattern as Track 1 salience.
- [DEBT] `{me}`/`{you}` curly purge vs item text (Phase III 3.4/3.11): the items describe extending/normalizing curly syntax, but the implementation deletes it (`macros.test.js` asserts literal passthrough) with no intake-time `{me}`→`@ME` conversion anywhere — user content using curlies now renders literally.

## Watch items (unproven or live-untested)

- [WATCH] Momentum 8/16 trip has never fired in natural play; Phase II 2.6 changed the underlying math (same-role drift). Thresholds verified headless (7→silent, 8→soft, 15→soft, 16→critical) but live behavior is untested.
- [WATCH] Engine token estimate undercounts ~19% vs plugin tokens (dossier anatomy). Budgets tuned against the wrong ruler.
- [WATCH] Entity sheets contain em-dashes (genesis-authored data lives outside detox scope, C3). Detox-clean prose over dirty sheets.
- [WATCH] History-modal predicates pane renders empty (dossier T28-29 UI obs).
- [WATCH] Optics framing lenses unverified — no demanded image round produced a lens-tagged capture; images flow via fallback path (dossier T9-11 partial).
- [WATCH] Commit messages oversell the diffs ("6-axis dynamics simulation engine" = calibration co-location; "subtext protocols" appear in no diff). Process smell, not code — but it already caused one mis-scoped review.
- [WATCH] 360° dossier displays hidden-bracket content in-UI by design (test asserts `secret arms smuggling` visible alongside the epistemic-lock indicator). Concealed content is one click away for anyone opening the card — needs a conscious security sign-off, not just an indicator.
- [WATCH] Multi-word slug migration: live saves whose brackets use pre-Phase-III keys (`@ORION THE PINK PROTECTOR`) no longer match anything — veil keys strictly by canonical single-word slugs with no fuzzy fallback. Ongoing stories may silently lose relationship extraction.
- [WATCH] Phase III 3.10 has no sync logic: eternal↔present do not write to each other anywhere. What shipped is the unified 4-quadrant veil record (one view, not propagation) — mark the item down to that or schedule the write path.

## Method caveats (how not to fool yourself)

- [METHOD] Feed uses `content-visibility:auto` — audit via IDB/DOM, never `innerText` (F5).
- [METHOD] ENTRY numbering is window-relative; round labels drift across captures (1 vs 2 vs 15 for identical text). Never join captures on round labels.
- [METHOD] Transport passes the instruction as a closure — prompt capture must call it (forensics interception note).

## Fixed — do not re-litigate

- F7 ledger dupe rows → compare-then-skip verified firing (R3:S1 EMPTY).
- TINY pacing balloon (467c) → Track 5 hard stream-cut, verified live (1 beat).
- CONTRACT director CALIBRATION gap → fixed upstream; harness 12/12, 0 problems @2c3eca27.
- Prompt-solutions Issues 1–12 → implemented upstream in Phases I–II (14/14 checked items verified in code; two deliberate deviations: `channel=` renamed to `type=` instead of frozen, branches purged instead of gated).
- Lorebook ghost layer → fully purged, zero live references.
- Stagnation structurally untrippable (input-vs-AIreply) → 2.6 same-role math, code-verified, live-untested (see WATCH).
- Director death-veto asymmetry (finale note) → 2.5 Climax Sovereignty Dual Defense, behavior-verified headless on all four paths (downgrade / consent / no-input / string-input).
- Phase III verified in code (2026-10-14 sync): 3.1 NPC-identity fix (blanket removed, ID-match in); 3.2 epistemic-first order holds (sanitize → `render_field_value` → `parse_macros`, no regression); 3.5 slug migration + @ID editor (minus the pattern-attr bug above); 3.6 slug format test-pinned; 3.7 APPEARANCE compaction + universal CHARACTER tag; 3.9 UI dossier half; 3.11 diegetic fallbacks. Open/deviating: 3.3 tuple unwired, 3.4/3.11 curly handling, 3.8 gate, 3.9 LLM half, 3.10 write path (all tracked above).
