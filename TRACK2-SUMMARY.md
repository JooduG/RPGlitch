# RPGlitch — 2026-08-16 track-npc-expansion change set (15 source files, 8 test files, 2 docs)

1. WORLD ROSTER, 3-TIER HIERARCHY & RELATIONSHIP MESH (data layer)
   - src/data/normalizer.js: every entity now normalizes `role_tier` (1 Background
     ephemeral · 2 Recurring · 3 Major, default 1), `is_wanderer` (bool), and
     `relationships: string[]` (plain-text directed vectors "`[Source]` → `[Target]`:
     `[dynamic]`", sanitized, trimmed, capped at 240 chars each / 40 entries).
   - src/data/db.js: schema v14 re-declares `stories` with `*npc_ids` (multiEntry
     index) so a story's world cast is queryable.
   - src/data/repository.js: `stories.list()` now returns `npc_ids`; new
     `stories.update_cast(id, npc_ids)` dedupes/cleans (null-safe) and persists.
   - src/engine/session.svelte.js: story creation persists `selection.npc_ids`.

2. STAGE SPOTLIGHT & WORLD-CAST HYDRATION (state layer)
   - src/state/runtime.svelte.js: new `active_npcs` (id → entity map),
     `in_scene_npc_ids` (string[] with a deduping setter), `streaming_entity_id`,
     plus `snapshot_npcs` / `snapshot_in_scene_npc_ids` getters. `sync()` hydrates
     the story's NPCs (all start ON-STAGE; the Director moves them off via
     `in_scene_change.exit`). save/update/delete_entity keep the cast map in sync.
   - src/state/app.svelte.js: `start_stream` resolves a `npc` role to the live
     world-cast entity via `runtime.streaming_entity_id`.
   - src/intelligence/context.js: payload gains `npc_entities` (compact hydrated
     cast) + `in_scene_ids`; NPC memory vectors are pre-embedded with the trio.

3. PROMPT ASSEMBLY — COMPACT CAST INDEX & GOVERNANCE LAWS
   - src/intelligence/prompts.js: new render blocks emitted into the Director
     system prompt (`<WORLD_CAST>` 1-line signatures with tier + `[In-Scene]`/
     `[Off-Screen (Stasis)]` tags, `<SCENE_ROSTER>`, `<RELATIONAL_MESH>`,
     `<ENTITY_CONVERGENCE_LAW>`, `<EPISTEMIC_RULES>`) and a shared
     `<CURRENT_STORY_STATE>` block in storyteller/narrator task snapshots. The
     Director task now teaches `speaker:"npc:<id>"`, `in_scene_change`, and
     `promotions` (tier 2 = recurring, tier 3 = major co-star; never invent ids
     absent from <WORLD_CAST>).
   - New `render_npc_character` / `prompt_builder.build_npc_prompt(payload, npc,
snapshot, director_data)`: a third-person supporting-character persona with
     the NPC's own fragments/memories (scored with `in_scene: true` for the 1.3x
     boost), the live roster, and explicit "never resolve the overarching quest".

4. DIRECTOR NPC DELEGATION & IN-SCENE MEMORY SALIENCE
   - src/intelligence/director-schema.js: `normalize_in_scene_change` ({enter,
     exit} with npc: prefix stripping), `normalize_promotions` (tier clamped to
     2|3), `strip_npc_id`; `normalize_director_data` now normalizes both fields.
   - src/intelligence/temporal.js: `TEMPORAL_SCORING.IN_SCENE_SALIENCE_BOOST =
1.3`; `score(vectors, in_scene)` / `score_async(..., in_scene)` /
     `format`/`format_async` (`options.in_scene`) apply the boost to memories of
     entities physically present in the room.
   - src/intelligence/kernel.js: after Director normalization, `_apply_in_scene_change`
     and `_apply_promotions` run before mutations; speaker `npc:<id>` resolves via
     `_resolve_npc_entity` (id or case-insensitive name), builds the NPC prompt,
     sets `streaming_entity_id` + generating-entity state, and persists the turn
     under role `"npc"` with `speaker_type`/`entity_id` meta. Unknown NPC ids fall
     back to the AI character with a warning. New `spawn_npc(bridge, draft)`
     (genesis: upsert entity, register on the story via `stories.update_cast`,
     put on-stage). Genesis is MANUAL — the Director never mints new ids, it only
     reuses `<WORLD_CAST>` entries (per the Entity Convergence Law).

5. MULTI-VOICE KOKORO PIPELINE
   - src/media/audio.svelte.js: `infer_voice_for_chunk` (trailing "said Elias.",
     leading "Elias said …" / "Elias: …", case-insensitive roster match; unquoted
     prose → narrator, unattributed quotes → default) and `split_speech_by_speaker`
     (quote-aware per-sentence segmentation), plus `VoiceEngine.speak_with_voices`
     which queues each chunk with its own voice. `speak()` now shares the
     refactored `#enqueue_chunks`. `normalize_role` maps `"npc"` → `"ai"`.
     NOTE: live streaming TTS (`queue_stream_sentence`) still uses the single
     `selected_voice`; finished-turn narration goes through `speak_with_voices`.
   - src/ui/message/Message.svelte: NPC messages are left-aligned like AI, resolve
     their entity from `runtime.active_npcs`, and `handle_speak` builds the voice
     roster (NPCs + fractal narrator + companion) for `speak_with_voices`.
   - src/ui/message/Feed.svelte: `npc` role alignment.
   - src/ui/Storymode.svelte: "In Scene" chip row (click → `app.open_profile(npc)`).

TESTS ADDED / UPDATED (all 8 live in src/, run via `npm run verify`)

- normalizer.test.js: role_tier tiers + defaults, is_wanderer coercion,
  relationships sanitize/cap/limit.
- repository.test.js: update_cast dedupe/clean/null, npc_ids in list(), default [].
- director-schema.test.js: strip_npc_id, normalize_in_scene_change,
  normalize_promotions clamping/aliases, extended normalize_director_data.
- temporal.test.js: fixed the now-removed 2nd-arg `score(entries, "Iron kiss")`
  call; added the 1.3x in-scene boost test + constant range check.
- prompts.test.js: WORLD_CAST/SCENE_ROSTER/RELATIONAL_MESH/convergence/epistemic
  blocks, director task schema mentions, CURRENT_STORY_STATE in character task,
  build_npc_prompt third-person persona.
- kernel.test.js: _resolve_npc_entity,_apply_in_scene_change,_apply_promotions,
  spawn_npc genesis, execute_turn NPC delegation (build_npc_prompt, npc role log,
  streaming_entity_id) + unknown-NPC fallback. (Adds a targeted `@data` mock.)
- runtime.test.js: sync() world-cast hydration (all on-stage), clear on empty,
  save/update/delete cast maintenance, in_scene setter dedupe.
- audio.test.js: infer_voice_for_chunk attribution (trailing/leading/colon/
  narrator/default), split_speech_by_speaker segmentation + empty input.

VERIFICATION

- All edited JS files pass esbuild syntax checks (23/23; the 3 .svelte files are
  verified by the repo's own svelte-check/vite build).
- Prompt render paths (render_director/render_character/build_npc_prompt) verified
  by executing the real functions with stubbed data deps — all assertions pass.
- director-schema normalization verified by direct execution.
- audio attribution logic verified by direct execution (leading regex hardened to
  accept `Elias: "…"` colon form).
- repository.update_cast hardened so `null` entries don't become the literal
  string "null"; director-schema promotions clamp tier 4 → 3 (was 2).
- Live preview currently runs the previously built bundle (compiled into
  index.html), so browser verification of this round's code requires the rebuild
  step below. The page itself loads clean (no engine errors).

DEPLOY

- Apply the changed files to your repo (the src/ + tests below), run
  `npm run verify` (lint/audit/test) then `npm run deploy:prepare`, and paste the
  new dist/index.html into the Perchance editor as usual.
- After verifying in the editor, use the Director's `in_scene_change`/`promotions`
  fields and call `gamemaster.spawn_npc({ name: "...", role_tier: 2 })` to seed
  cast (optionally wire a "New NPC" button in the UI later).

TEST-FAILURE FIX ROUND (2026-08-16, 6 failures → 0)

- audio.svelte.js: the trailing-attribution regex was built from a template
  literal with unescaped `\b`/`\s` (backspace + literal "s"), so `"…," said
   Elias.` never matched and fell through to the default voice. Escaped both
  (`\\b`, `\\s+`) and widened the name group to `[A-Za-z]` so lowercase
  attributions (`"…," said elias.`) resolve case-insensitively.
- prompts.test.js: build_npc_prompt test now supplies AI/USER `present` state
  so the `<AI_CHARACTER>`/`<USER_PERSONA>` snapshot blocks survive clean_xml's
  empty-tag pruning.
- director-schema.js: `normalize_director_data` now preserves the delegated
  NPC's id as `npc_id` (`npc:ben1` → `ben1`) instead of collapsing it to a
  bare `"npc"` that the kernel couldn't resolve. Idempotent under the kernel's
  defensive re-normalization (a colon-less `"npc"` speaker keeps any prior
  `npc_id`).
- kernel.js: execute_turn resolves the delegated NPC via `director_data.npc_id`
  so `speaker:"npc:ben1"` actually routes to build_npc_prompt instead of
  falling back to the AI character.
- kernel.test.js: the NPC world-cast describe block lacked a `beforeEach`,
  so mock call history leaked between tests (the promotions-skip assertion saw
  the previous test's upsert call). Added a clearing beforeEach that also
  resets the runtime NPC state.
