RPGlitch — 2026-08-16 change set (7 files edited, 2 added)

1. WRITE-TIME DETOX PIPELINE
   - src/intelligence/kernel.js: reply is detox_prose()'d (plain register) before log_message,
     so the DB log and .md exports match the display layer. Director state_append strings are
     scrubbed before apply_state_mutations so clichés never seed prompt history. The epilogue
     response is scrubbed too.
   - src/data/definitions/detox-rules.js: added the "metallic tang" rule (the near-miss from the
     stress test; taste-of-copper / ozone / heart-hammering were already covered).
   - src/data/definitions/detox-rules.test.js: coverage for metallic tang.

2. DYNAMIC SPEAKER ROUTING
   - src/data/definitions/protocols.js: new DIRECTOR.SPEAKER_ROUTING protocol (non-verbal
     environmental turns -> "fractal"; a long unbroken "ai" streak hands an environmental beat over).
   - src/intelligence/prompts.js: SPEAKER_ROUTING added to the Director protocol list, plus a
     deterministic non_verbal_environmental_hint() that injects a <USER_ACTION_NOTE> when the
     user input is dialogue-free with spatial/locational focus.

3. INVENTORY CONTINUITY & CAUSALITY (PROP PROVENANCE)
   - src/data/definitions/protocols.js: new PROP PROVENANCE LAW in DIRECTOR.CONTINUITY.
     Mundane personal gear -> accepted (yes-and, presumed carried). Plot-significant or
     lore-contradicting items -> challenged in-character / reinterpreted as fake/decoy, never
     accepted as genuine. (Matches the discussed design: lighter-from-pocket OK, relic-from-
     back-pocket is a bluff.)

4. AUTOMATED EPILOGUE
   - src/intelligence/kernel.js: execute_turn now reads director story_status; on CONCLUDED or
     COLLAPSED it auto-runs execute_epilogue() + stories.conclude() after the final turn beat.
     Guarded by _has_epilogue() (no double dispatch) and a try/catch that never breaks the turn.
     execute_epilogue() itself no-ops when an epilogue already exists (also protects manual
     END STORY). COLLAPSED currently uses the same epilogue path — see COLLAPSED-ENDING-NOTES.md
     for the planned separate tragedy treatment (out of scope).

5. HOOK BRACKETS (decision: drop literal labels)
   - src/data/definitions/protocols.js: SCENE.CONTINUATION no longer requires literal
     [Statement]/[Action]/[Hover]/[Silence] brackets; decisive statement/action/hover/silence
     endings remain.

6. PACING CALIBRATION
   - src/data/definitions/protocols.js: HYGIENE.RESPONSE_LENGTH rewritten from a fixed
     "~2 paragraphs" rule to: roughly match the length/energy of the user's message (soft
     guideline), keeping the complete-sentence requirement.

TESTS ADDED
   - detox-rules.test.js: metallic tang scrub.
   - prompts.test.js: speaker hint fires on non-verbal spatial turns / not on dialogue turns;
     pacing guidance present (old "roughly 2 paragraphs" gone); no literal bracket labels.
   - kernel.test.js: auto-epilogue dispatch on CONCLUDED (+ final beat delivered first);
     no dispatch on IN_PROGRESS.

VERIFICATION
   - All edited files pass esbuild syntax checks.
   - detox_prose verified live: "metallic tang" -> "raw iron taste", copper/ozone/heart-hammering all scrubbed.
   - non_verbal_environmental_hint verified live: hints on spatial no-dialogue turns, silent on dialogue/social turns.
   - Workspace src/ synced byte-exact to this tree (173 files).

DEPLOY
   - Apply files to your repo, run npm run deploy:prepare, paste dist/index.html into the
     Perchance editor as usual.
