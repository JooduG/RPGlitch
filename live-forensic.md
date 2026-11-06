# Live Greenfield Forensics — @752ee63 vault

## T0 setup

## T1 (2-shot, Director ON) — PASS

- Sent: 'Check your harness, Orion...' Idle ~28s, round 0->1.
- Director: next_action=MAIN_CHARACTER (legacy enum, mapped to AI_TURN fine), note present, deltas {2,6,-3,3,4,2} all in `[-20,20]`, camera_note present.
- Character: 918 chars, think structured (Intent/Friction), meta {think, director_staging, greenfield:true}.
- Caretaker: 0 ledger rows r1 (greenfield persists via entity save, not ledger). Orion present.* updated: POSTURE arm around Glitch, FOCUS hoarding, MOOD predatory/dominant. Target=AI correct (1%3=1).
- OBS: (1) legacy next_action enum; (2) ledger-row gate is legacy-framed — entity diffs are the proof.

## T2 (Caretaker -> User) — PASS

- Sent trade message. Idle ~34s, round 1->2. AI_TURN r2 greenfield:true, staging present, 597 chars.
- Glitch past appended: `[EVENT: Glitch handed over the Silvers courier key | w: 7]`. Present reflects scene (breathless/cornered). Target=User correct (2%3=2).

## T3 (Caretaker -> Fractal) — PASS (provisional)

- Sent sirens message. Idle ~31s, round 2->3. AI_TURN r3 greenfield:true, 825 chars.
- Nova present/future read post-turn; siren-specific bracket may still be consolidating async. No bogus diffs observed in head. Target=Fractal correct (3%3=0).

## T4 (tiny pacing) — FINDING

- Input 12 chars -> tempo 1 expected; output 783 chars (longer than T2's 597). Budget compiled as advisory prompt line only; greenfield has NO post-hoc enforcement (no finishTail equivalent — grep confirms tempo only in prompts.js:145 + dev_log record). Model ignored it.
- Severity: moderate — beats are soft guidance; but 1-beat inputs ballooning past substantive-turn length defeats input-proportional pacing. Recommend backstop (truncate/clamp) or recalibrate gate to advisory.

## T5 (epistemic plant) — PASS

- Planted `[SECRET_GOAL: betray the syndicate at midnight | hide]` in Glitch present.non_physical via runtime.save_entity (in-memory synced).
- Neutral probe answered r5 (759 chars). Full prose+think scanned: zero occurrences of syndicate/midnight/betray/SECRET_GOAL. Wall holds.
- NOTE (non-planted invention): 'the folder with my name on it' — ungrounded, but not the planted content. Watch item, not a leak.

## T7-8 (1-shot bypass) — PASS

- director_enabled=false. r6 AI_TURN greenfield:true, 819 chars, director_staging key present-but-empty (bypass confirmed, no staging payload). Prose + caretaker normal.
- Director re-enabled after.

## T9 (abort/rollback) — FAIL (greenfield)

- Two probes: stop at ~6s and mid-stream (generating/streaming confirmed). Both completed full AI_TURNs (r7 958ch, r8 891ch), rounds 6->7->8.
- Root cause: chrono passes controller.signal to execute_greenfield_turn, but bridge never forwards _options.signal into kernel.submit_turn/transport.stream. Transport honors abort (transport.js:87) and live_stream_fn wires signal->generation.stop() — the middle link is dropped. Fix: forward signal through submit_turn -> transport.stream options.
- Legacy path unaffected (gamemaster receives signal directly).

## T10 (greenfield retry) — UNTESTABLE via UI

- No Regenerate/Retry/Reroll affordance found: composer has Settings+Send only; message cards expose Thoughts/View Raw Data + avatar menus; contextmenu on AI message opens nothing with retry. Delete All is log-clear.
- Static: chrono.retry() -> regenerate() -> advance_turn(is_retry) -> greenfield branch present (chrono.svelte.js:294). Retry passes null input -> execute_greenfield_turn('') — empty-input handling on that path deserves a unit test, not a live probe.

## T11 (sliding window) — PASS (static)

- prompts.js:386 slices history to last TEMPO_ROUNDS.STANDARD (8); origin fallback chain user/fractal/system/AI intact (:398-406). Feed at rounds 0-8 (9 rounds) so next compile exercises the cap. Live byte-length measurement needs console interception — not probed.

## T3 revised (Fractal caretaker) — FINDING (downgraded from provisional PASS)

- Sirens event recorded NOWHERE: Nova present/past/future clean, 0 ledger rows r3, ledger still 25 (legacy only). Rotation targeted Fractal correctly (cycle AI->User->Fractal held for r1/r2 with real diffs), but the fractal consolidation no-op'd on a recordable world event. Either over-conservative no-op or silent branch drop. Severity: low-moderate.

## T6 (expansive pacing) — SKIPPED (covered by T4 finding; same advisory-only mechanism)

## T12 (image enhance+dispatch) — PASS

- Context-menu Generate AI Character Image: placeholder r8 + diffusion result persisted (hasSrc:true, mode:story_character, no failure). Refine-or-draft chain held end-to-end in ~32s.

## T13 (llm_refine:false bypass) + T14 (VisualWing url alias) — PASS (static)

- Bypass branch + url-alias return verified in synced code + new unit tests (user runs vitest locally); T12 proved dispatch+persist live. Live toggle-switch not repeated to save generations.

## T15-18 (origin attribution) — PASS

- DB roles across 22 rows: system/user/ai/fractal all correctly attributed; <ROUND origin> fallback chain verified in code; no misattribution observed.

## T19-20 (audio) — PASS (implicit)

- Dozens of button interactions with sound:true, zero audio exceptions in console; speechSynthesis present, voice_suppressed=false, 8 turns streamed with no TTS lock. No dedicated synth probe (headless).

## Console hygiene

- page_eval consoleOutput across ~20 evals: only benign warns (content-length, wasm dtype). Zero errors, zero perchanceErrors.

## SCORECARD

- PASS: round sovereignty, 2-shot staging+prose+think, caretaker AI/User rotation+diffs, sliding-window code+cap, epistemic wall (live plant), 1-shot bypass, image dispatch+persist, bypass/url-alias (static), origin attribution, audio implicit, console hygiene.
- FINDINGS: (1) tiny-input pacing advisory-only, 783ch on tempo-1, no backstop; (2) greenfield abort signal dropped in bridge (Stop is a no-op); (3) fractal caretaker no-op'd on sirens event.
- UNTESTABLE via UI: retry affordance absent (code path present).
- NOT PROBED live: prompt byte-length at cap (static only), prologue already legacy (by design).

## User screenshots: style + telemetry freeze — findings (reported 2026-11-06, user asked to log in full)

### Q1/Q2 verdicts: neither shot is photographic

- Shot 1 (`story_scene`, round 0): a 3-panel comic-strip illustration (gridded panels, inked linework, flat cel color, motion lines, halftone/paper texture) — not photographic in any panel. Matches an illustrated/comic treatment, not the app-level "raw photography" choice.
- Shot 2 (`story_character`, round 8, generated during T12): a 1950s pulp-magazine cover illustration (painted gouache look, dramatic rim light, paperboard texture). This is not raw photography either — it is exactly what Orion's entity style `pulp` specifies (visual-styles.js:494-508: medium "1950s pulp magazine cover illustration in the style of Frank Frazetta, vintage paperback gouache painting"; premade-entities.js:51 sets Orion `visual_style: "pulp"`). So shot 2 is the pipeline working as coded for Orion; shot 1's comic look is the unexplained one.

### Root cause A — style precedence buries the app-level choice (visual.js:418)

- `enhance()` resolves `style_key = entity?.visual_style || state_bridge.runtime?.active_fractal?.visual_style || "none"`. Entity-level style wins first, fractal second, app-level raw/photo last (effectively never — there is no app-level input in the chain at all). For Orion the entity key `pulp` always wins, so T12 produced pulp regardless of the raw setting. Fix: decide the intended hierarchy explicitly (app-level default should beat entity/fractal, or entity beat app as a deliberate override) and pass it in as a parameter instead of letting entity style silently win.

### Root cause B — the refine path drops every style token (visual.js:424-470)

- Only the `llm_refine === false` bypass path returns style tokens (`negative_prompt: style_def.negative_prompt`, :421). Every other exit — JSON-parsed refine (:453-457), emergency fallback (:466), empty-response (:444), catch (:469) — returns `negative_prompt: ""` and never injects the style's `engine.medium/camera/palette/texture/composition` into the prompt. The Visualizer LLM gets `camera_note` only, so style identity survives only if the model re-invents it. DB metadata from T12 confirms: persisted payload had no style key and an empty negative prompt. Fix: append `style_def.engine.medium + camera` to the compiled system prompt (or post-fix the returned prompt) and always append `style_def.negative_prompt`; the bypass path already proves the shape.

### Root cause C — the `none` label is a "raw photography" trap (visual-styles.js:89-97)

- Style `none` ("No Visual Style", `llm_refine: false`) has keywords `["none", "raw", "unmodified"]` and means "unmodified draft, baseline quality guards only" — but its keyword `raw` collides with the photo style's `raw` keyword (photo keywords include `raw`, :108) and with the user's plain-English expectation of "raw photography". Selecting what reads as "raw" can resolve to `none` = unstyled draft = ironically the comic/illustrated-looking output. Fix: rename/keywords-disambiguate `none` (e.g. keywords `["unstyled", "draft"]`, name "Unstyled Draft") so it can never match a request for photographic raw.

### Quick Shot frozen — telemetry gate only knows legacy rows (Message.svelte:77-84, telemetry-format.js)

- `is_telemetry` is true only for `sender === "system"` with `meta.type` in {DYNAMICS_DELTA, STORY_START, VECTOR_RESOLUTION, CONTINUUM_FORMATION, MEMORY_FORMATION}. The live DB holds exactly one such row — the prologue DYNAMICS_DELTA — so the panel renders once and never updates. All greenfield per-turn director output sits in `AI_TURN` rows under `meta.director_staging`, which no component reads (grep: zero readers outside chrono/dev-log). Fix (pick one): emit a DYNAMICS_DELTA-shaped system row per greenfield turn from the existing staging payload, or feed TelemetryCard directly from `meta.director_staging` + entity diffs.

### Back Shot frozen — ledger is legacy-only (25 rows, all round 0)

- The mutation ledger's 25 rows are all round 0 (genesis + continuum formation). The greenfield Caretaker persists via `save_entity`, which writes zero ledger rows — so a ledger-driven Back Shot view can never advance past genesis on the greenfield path. Fix: write a ledger row per greenfield caretaker turn (entity diffs already exist — T1/T2 proved them), or repoint Back Shot at entity history.

### Status

- All of the above is static-code + DB-metadata analysis on top of the live T12 generation; user has not yet answered whether to implement the fixes (abort-signal forwarding, pacing backstop, style-token injection, telemetry/ledger emission). Nothing implemented yet.
