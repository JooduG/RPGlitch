<#
.SYNOPSIS
  Post-Execution Architecture, Symbol & Barrel Audit for the 6-Rank DAG Refactor.
#>
[CmdletBinding()]
param(
    [switch]$RunGates
)

$ErrorActionPreference = "Stop"
$script:Failures = [System.Collections.Generic.List[string]]::new()
$script:PassedCount = 0

function Pass([string]$Message) {
    $script:PassedCount++
    Write-Host "  [PASS] $Message" -ForegroundColor Green
}

function Fail([string]$Message) {
    $script:Failures.Add($Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
}

function Section([string]$Title) {
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function Remove-JsComments([string]$Text) {
    return [regex]::Replace($Text, "(?s)/\*.*?\*/|//[^\r\n]*", "")
}

# ---------------------------------------------------------------------------
# 1. EXTINCTION LEDGER: Files That Must Not Exist
# ---------------------------------------------------------------------------
Section "1. Extinction Ledger (Deleted Files)"

$DeletedFiles = @(
    "src/utils/tags.js",
    "src/utils/llm-sanitize.js",
    "src/utils/detox.js",
    "src/utils/styles.js",
    "src/utils/registries.js",
    "src/utils/registries.test.js",
    "src/utils/job-queue.js",
    "src/utils/job-queue.test.js",
    "src/media/optics.js",
    "src/media/visual.svelte.js",
    "src/media/tokens.js",
    "src/media/palette.js",
    "src/engine/gate.js",
    "src/engine/dynamics.js",
    "src/engine/sieve.js",
    "src/engine/prompts.js",
    "src/engine/verifier.js",
    "src/engine/sessions.svelte.js",
    "src/engine/runtime.svelte.js",
    "src/engine/log.svelte.js",
    "src/engine/status.svelte.js",
    "src/engine/runs.js",
    "src/engine/turns.js",
    "src/engine/caretaker-compaction-template.md",
    "src/engine/fixtures.test-util.js",
    "src/ui/interface.svelte.js"
)

foreach ($file in $DeletedFiles) {
    if (Test-Path $file) {
        Fail "Retired file still exists: $file"
    } else {
        Pass "Confirmed deleted: $file"
    }
}

# ---------------------------------------------------------------------------
# 2. TARGET STRUCTURE: Files That Must Exist
# ---------------------------------------------------------------------------
Section "2. Target File Presence (Ranks 0-4 & Barrels)"

$RequiredFiles = @(
    "src/config.js",
    "src/utils/index.js",
    "src/utils/math.js",
    "src/utils/vectors.js",
    "src/utils/text.js",
    "src/utils/queue.js",
    "src/utils/resilience.js",
    "src/utils/style-resolve.js",
    "src/utils/tokens.js",
    "src/utils/palette.js",
    "src/utils/embeddings.svelte.js",
    "src/utils/onnx.js",
    "src/utils/xml.js",
    "src/utils/macros.js",
    "src/utils/alternations.js",
    "src/utils/markdown.js",
    "src/utils/html.js",
    "src/utils/field-path.js",
    "src/utils/actions.js",
    "src/utils/ui-helpers.js",
    "src/definitions/index.js",
    "src/definitions/dynamics-registry.js",
    "src/definitions/narrative-styles.js",
    "src/definitions/premades.js",
    "src/definitions/profile-taxonomy.js",
    "src/definitions/speaking-styles.js",
    "src/definitions/visual-styles.js",
    "src/simulation/index.js",
    "src/simulation/brackets.js",
    "src/simulation/llm-output.js",
    "src/simulation/history.js",
    "src/simulation/dynamics.js",
    "src/simulation/retrieval.js",
    "src/simulation/prompts.js",
    "src/simulation/caretaker-compaction-template.md",
    "src/simulation/fixtures.test-util.js",
    "src/data/index.js",
    "src/data/db.js",
    "src/data/session.js",
    "src/data/records.js",
    "src/data/ledger.js",
    "src/data/checkpoint.js",
    "src/data/card-codec.js",
    "src/data/exporters.js",
    "src/media/index.js",
    "src/media/policy.js",
    "src/media/image-generation.js",
    "src/media/audio.svelte.js",
    "src/media/motion.svelte.js",
    "src/media/design.css",
    "src/state/index.js",
    "src/state/app.svelte.js",
    "src/state/runtime.svelte.js",
    "src/state/chat.svelte.js",
    "src/state/devlog.svelte.js",
    "src/state/streaming.svelte.js",
    "src/state/status.svelte.js",
    "src/engine/index.js",
    "src/engine/transport.js",
    "src/engine/runner.js",
    "src/engine/lifecycle.js",
    "src/engine/chrono.svelte.js"
)

foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Pass "Found target file: $file"
    } else {
        Fail "Missing target file: $file"
    }
}

# ---------------------------------------------------------------------------
# 3. ERADICATED SHIMS, BRIDGES & DEAD EXPORTS across src/
# ---------------------------------------------------------------------------
Section "3. Eradicated Shims, Bridges & Pruned Symbols (Codebase Scan)"

$BannedPatterns = @(
    @{ Name = "state_bridge";                        Pattern = "\bstate_bridge\b" },
    @{ Name = "stream_bridge";                       Pattern = "\bstream_bridge\b" },
    @{ Name = "stories_bridge";                      Pattern = "\bstories_bridge\b" },
    @{ Name = "register_state_accessors";            Pattern = "\bregister_state_accessors\b" },
    @{ Name = "register_stream_handlers";            Pattern = "\bregister_stream_handlers\b" },
    @{ Name = "register_bump";                       Pattern = "\bregister_bump\b" },
    @{ Name = "bind_session_driver";                 Pattern = "\bbind_session_driver\b" },
    @{ Name = "set_visualizer_envision_impl";        Pattern = "\bset_visualizer_envision_impl\b" },
    @{ Name = "register_speaking_rules";             Pattern = "\bregister_speaking_rules\b" },
    @{ Name = "register_anti_ai_rules";              Pattern = "\bregister_anti_ai_rules\b" },
    @{ Name = "register_cluster_words";              Pattern = "\bregister_cluster_words\b" },
    @{ Name = "extract_json_block (dead)";           Pattern = "\bextract_json_block\b" },
    @{ Name = "escape_unescaped_json_quotes (dead)"; Pattern = "\bescape_unescaped_json_quotes\b" },
    @{ Name = "looks_truncated (dead)";              Pattern = "\blooks_truncated\b" },
    @{ Name = "raw_to_text (dead)";                  Pattern = "\braw_to_text\b" },
    @{ Name = "raw_stop_reason (dead)";              Pattern = "\braw_stop_reason\b" },
    @{ Name = "parse_profile_json (dead)";           Pattern = "\bparse_profile_json\b" },
    @{ Name = "get_recent_window (dead)";            Pattern = "\bget_recent_window\b" },
    @{ Name = "acquire_foreground_generation";       Pattern = "\bacquire_foreground_generation\b" },
    @{ Name = "release_foreground_generation";       Pattern = "\brelease_foreground_generation\b" },
    @{ Name = "acquire_background_generation";       Pattern = "\bacquire_background_generation\b" },
    @{ Name = "release_background_generation";       Pattern = "\brelease_background_generation\b" }
)

$SrcFiles = Get-ChildItem -Path "src" -Recurse -File -Include *.js, *.svelte
foreach ($rule in $BannedPatterns) {
    $hits = @()
    foreach ($f in $SrcFiles) {
        $lines = Get-Content $f.FullName
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            if ($line -match "^\s*(//|\*|\/*)") { continue }
            if ($line -match $rule.Pattern) {
                $relPath = Resolve-Path $f.FullName -Relative
                $hits += "${relPath}:$($i + 1)"
            }
        }
    }
    if ($hits.Count -gt 0) {
        Fail "Banned symbol '$($rule.Name)' found at: $($hits -join ', ')"
    } else {
        Pass "Zero active references to '$($rule.Name)'"
    }
}

# ---------------------------------------------------------------------------
# 4. MODULE SYMBOL CONTRACTS & ARCHITECTURAL INVARIANTS
# ---------------------------------------------------------------------------
Section "4. Module Symbol Contracts & Boundary Invariants"

$ModuleContracts = @{
    "src/utils/math.js" = @{
        MustHave    = @("clamp", "get_percentage", "HASH_OFFSET_BASIS", "HASH_PRIME", "fnv1a_hash", "stable_pick", "generate_uuid", "generate_secure_seed", "pick_random")
        MustNotHave = @("cosine_similarity", "serialize_embedding", "deserialize_embedding", "quantize_vector_q8", "dequantize_vector_q8", "evaluate_image_trigger")
    }
    "src/utils/vectors.js" = @{
        MustHave    = @("cosine_similarity", "serialize_embedding", "deserialize_embedding", "quantize_vector_q8", "dequantize_vector_q8")
        MustNotHave = @()
    }
    "src/utils/style-resolve.js" = @{
        MustHave    = @("resolve_style")
        MustNotHave = @()
    }
    "src/utils/text.js" = @{
        MustHave    = @("NAME_PREFIXES", "NAME_PREFIX_STEMS", "collapse_whitespace", "truncate_at_word", "truncate_at_boundary", "count_tokens", "clean_text", "indent_continuation", "compute_initials", "match_case", "format_key_as_label", "format_datetime", "normalize_comma_spacing", "match_keyword_pattern", "alternations\.js")
        MustNotHave = @("parse_relational_vector", "format_relational_vector", "derive_vector_title", "collapse_history", "filter_narrative_messages", "xml\.js")
    }
    "src/utils/queue.js" = @{
        MustHave    = @("CLEARED_RESULT", "SUPERSEDED_RESULT", "create_job_queue", "LLM_PRIORITY", "enqueue_llm_job|run_llm_job", "resolve_priority", "get_queue_status|get_llm_gate_status", "reset_queue_for_testing|_reset_gate_for_testing")
        MustNotHave = @()
    }
    "src/utils/resilience.js" = @{
        MustHave    = @("merge_abort_signals", "ExponentialBackoffRetryer", "CircuitBreaker")
        MustNotHave = @()
    }
    "src/simulation/brackets.js" = @{
        MustHave    = @("parse_tagged_fields", "format_tagged_fields", "apply_tagged_field_deltas", "safe_parse_pseudo_json", "balance_brackets", "normalize_physical_entries", "strip_leading_key_echo", "extract_entity_relationships", "has_bracket_bond", "parse_relational_vector", "format_relational_vector", "derive_vector_title", "CLEAR_TOKENS", "AGGREGATE_KEYS", "VISUAL_EXCLUDED_KEYS", "CLOTHING_KEYS", "PHYSICAL_KEY_ALIASES")
        MustNotHave = @("\`$state", "\`$derived", "\`$effect")
    }
    "src/simulation/llm-output.js" = @{
        MustHave    = @("parse_think_block", "strip_cognition_blocks", "safe_parse_json", "sanitize_llm", "strip_covert_directives", "clean_generated_prose|detox_prose", "resolve_speaking_style", "resolve_style", "lint_narrative_slop", "cap_somatic_markers", "audit_macro_shape")
        MustNotHave = @("register_speaking_rules", "register_anti_ai_rules", "register_cluster_words", "\`$state")
    }
    "src/simulation/history.js" = @{
        MustHave    = @("canonicalize_role", "is_narrative_role", "normalize_history_beat", "collapse_history", "filter_narrative_messages", "format_history_entries", "reconstruct_history_from_feed", "calculate_turn_tempo", "build_turn_summary", "match_speaker_snapshots", "resolve_entity_id_by_name", "is_telemetry_meta", "is_empty_narrative_message", "decompose_story_title")
        MustNotHave = @("\`$state", "\`$derived")
    }
    "src/simulation/dynamics.js" = @{
        MustHave    = @("step_dynamics", "evaluate_dynamics_directives", "extract_metric_baselines|extract_entity_dynamics_baselines", "CARETAKER_ROTATION", "resolve_caretaker_target")
        MustNotHave = @("\`$state", "\`$derived")
    }
    "src/simulation/retrieval.js" = @{
        MustHave    = @("extract_memory_candidates", "rank_memories|score_and_rank_memories", "select_context_memories|two_tier_sieve_rag", "create_vector_cache|create_ephemeral_vector_cache")
        MustNotHave = @("\`$state", "\`$derived")
    }
    "src/simulation/prompts.js" = @{
        MustHave    = @("render_thinking_mode", "compile_prompt", "extract_tag_sequence", "verify_tag_balance", "verify_system_envelope", "verify_tag_order", "verify_prompt_hygiene", "verify_compiled_prompt", "sanitize_visual_text", "ORDERED_VISUAL_STYLE_KEYS", "resolve_visual_engine_tokens", "build_aesthetic_map", "flatten_aesthetic_map", "extract_aesthetic_traits", "render_optics_fallback", "resolve_story_beat_style", "compose_story_beat_prompt")
        MustNotHave = @("state_bridge", "\`$state")
    }
    "src/data/session.js" = @{
        MustHave    = @("SESSION_ID_KEY", "get_active_session_id", "require_active", "set_active_session_id", "clear_active_session_id", "record_session_access", "get_recent_sessions", "create_from_selection", "resolve_log_entity_id", "resolve_story_round", "log_message|append_log_entry", "send", "regenerate", "load_log|get_story_log", "delete_log_entry", "edit_log_entry", "update_log_attachment", "delete_log_attachment", "delete_story_log")
        MustNotHave = @("\`$state", "\`$derived", "\`$effect")
    }
    "src/media/policy.js" = @{
        MustHave    = @("IMAGE_TIERS", "TIER_RESOLUTIONS", "normalize_image_tier", "get_resolution", "get_resolution_string", "get_tier_guidance_scale", "evaluate_image_trigger", "resolve_image_trigger")
        MustNotHave = @("\`$state")
    }
    "src/media/image-generation.js" = @{
        MustHave    = @("find_image_engine", "reset_cached_image_engine", "dispatch_visual_generation", "mark_generation_in_flight", "clear_generation_in_flight", "is_generation_in_flight", "reset_generation_in_flight", "get_image_generation_queue", "reset_image_generation_queue", "count_pending_ghosts", "ImageService|VisualEngine", "visual_engine")
        MustNotHave = @("set_visualizer_envision_impl", "state_bridge", "\`$state")
    }
    "src/state/app.svelte.js" = @{
        MustHave    = @("InterfaceStore", "app", "image_preview", "image_picker")
        MustNotHave = @("ImagePreview\.svelte", "stories_bridge")
    }
    "src/state/runtime.svelte.js" = @{
        MustHave    = @("RuntimeEngineStore", "runtime")
        MustNotHave = @("state_bridge", "get_app")
    }
    "src/state/chat.svelte.js" = @{
        MustHave    = @("ChatLogStore|SimulationLogStore", "simulation_log|chat", "session_driver")
        MustNotHave = @("bind_session_driver", "get_recent_window")
    }
    "src/state/devlog.svelte.js" = @{
        MustHave    = @("DEVELOPER_TELEMETRY_STORAGE_KEY", "DeveloperLogStore", "developer_log")
        MustNotHave = @()
    }
    "src/state/streaming.svelte.js" = @{
        MustHave    = @("StreamingStore", "streaming")
        MustNotHave = @()
    }
    "src/state/status.svelte.js" = @{
        MustHave    = @("SimulationStateStore", "simulation_state", "UIStateStore", "ui_state", "force_recover_simulation", "install_freeze_watchdog", "uninstall_freeze_watchdog")
        MustNotHave = @()
    }
    "src/engine/transport.js" = @{
        MustHave    = @("get_mock_message", "create_stream_transport|create_live_stream_fn", "get_transport", "reset_transport", "complete_text|generate_text", "transform_text|enhance_text")
        MustNotHave = @("stream_bridge")
    }
    "src/engine/runner.js" = @{
        MustHave    = @("run_planner_step|execute_turn_1_director", "run_generation_step|execute_turn_2_character", "continue_generation_step|execute_turn_2_continue", "run_memory_consolidation_step|execute_turn_3_caretaker", "run_image_prompt_step|execute_turn_visualizer", "run_schema_extraction_step|execute_turn_structuring", "generate_user_draft|execute_ghostwriter", "run_round|execute_round", "run_turn|execute_turn", "continue_turn|execute_continue", "write_back_turn_state", "dispatch_consolidation|dispatch_caretaker_consolidation", "persist_turn_rows", "maybe_spawn_turn_image", "reset_turn_scope_for_testing")
        MustNotHave = @("apply_director_deltas_to_dynamics")
    }
    "src/engine/lifecycle.js" = @{
        MustHave    = @("refine_image_prompt|execute_visualizer_envision", "parse_entity_profile|structure_profile", "generate_opening|execute_prologue", "generate_closing|execute_epilogue", "create_entity_with_profile|birth_entity_core")
        MustNotHave = @("\.\./media/optics\.js", "\.\./media/visual\.svelte\.js", "\.\./utils/detox\.js", "_ai_quadrant")
    }
    "src/engine/chrono.svelte.js" = @{
        MustHave    = @("ChronoEngine", "chrono_engine")
        MustNotHave = @()
    }
}

foreach ($entry in $ModuleContracts.GetEnumerator()) {
    $filePath = $entry.Key
    $rules = $entry.Value
    if (-not (Test-Path $filePath)) {
        Fail "Cannot inspect symbols (file missing): $filePath"
        continue
    }
    $raw = Get-Content $filePath -Raw
    $codeOnly = Remove-JsComments $raw

    $missing = @()
    foreach ($sym in $rules.MustHave) {
        if ($raw -notmatch "\b($sym)\b") {
            $missing += $sym
        }
    }
    if ($missing.Count -gt 0) {
        Fail "${filePath}: Missing required symbols: $($missing -join ', ')"
    } else {
        Pass "${filePath}: All $($rules.MustHave.Count) required symbols verified"
    }

    $forbidden = @()
    foreach ($bad in $rules.MustNotHave) {
        if ($codeOnly -match $bad) {
            $forbidden += $bad
        }
    }
    if ($forbidden.Count -gt 0) {
        Fail "${filePath}: Contains forbidden patterns/runes: $($forbidden -join ', ')"
    }
}

# ---------------------------------------------------------------------------
# 5. BARREL EXPORT COMPLETENESS & ORPHAN EXPORT AUDIT
# ---------------------------------------------------------------------------
Section "5. Barrel Export Completeness & Orphaned Exports"

$BarrelDirs = @(
    "src/utils",
    "src/definitions",
    "src/simulation",
    "src/data",
    "src/media",
    "src/state",
    "src/engine"
)

foreach ($dir in $BarrelDirs) {
    $barrelPath = "$dir/index.js"
    if (-not (Test-Path $barrelPath)) {
        Fail "Missing barrel file: $barrelPath"
        continue
    }

    $barrelCode = Remove-JsComments (Get-Content $barrelPath -Raw)

    $pathMatches = [regex]::Matches($barrelCode, 'from\s+["''](\./[^"'']+)["'']')
    foreach ($m in $pathMatches) {
        $relTarget = $m.Groups[1].Value -replace "^\./", ""
        $fullTarget = Join-Path $dir $relTarget
        if (-not (Test-Path $fullTarget)) {
            Fail "${barrelPath}: Re-exports non-existent file './$relTarget'"
        }
    }

    $moduleFiles = Get-ChildItem -Path $dir -File | Where-Object {
        ($_.Name -like "*.js" -or $_.Name -like "*.svelte.js") -and
        $_.Name -ne "index.js" -and
        $_.Name -notlike "*.test.js" -and
        $_.Name -notlike "*.test-util.js"
    }

    foreach ($mod in $moduleFiles) {
        $modName = $mod.Name
        $escapedModName = [regex]::Escape($modName)

        if ($barrelCode -match "export\s+\*\s+from\s+[`"']\./$escapedModName[`"']") {
            Pass "${barrelPath}: Wildcard re-exports ./$modName"
            continue
        }

        $reExportedViaSibling = $false
        foreach ($sib in $moduleFiles) {
            if ($sib.Name -eq $modName) { continue }
            $sibCode = Remove-JsComments (Get-Content $sib.FullName -Raw)
            if ($sibCode -match "export\s+\*\s+from\s+[`"']\./$escapedModName[`"']") {
                $reExportedViaSibling = $true
                break
            }
        }
        if ($reExportedViaSibling) {
            Pass "${barrelPath}: Re-exports ./$modName transitively via sibling"
            continue
        }

        $modCode = Remove-JsComments (Get-Content $mod.FullName -Raw)
        $exportedSymbols = [System.Collections.Generic.HashSet[string]]::new()

        $declMatches = [regex]::Matches($modCode, "\bexport\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z0-9_`$]+)")
        foreach ($dm in $declMatches) {
            [void]$exportedSymbols.Add($dm.Groups[1].Value)
        }

        $listMatches = [regex]::Matches($modCode, "\bexport\s*\{([^}]+)\}")
        foreach ($lm in $listMatches) {
            $items = $lm.Groups[1].Value -split ","
            foreach ($item in $items) {
                $clean = $item.Trim()
                if (-not $clean) { continue }
                if ($clean -match "^[A-Za-z0-9_`$]+\s+as\s+([A-Za-z0-9_`$]+)$") {
                    [void]$exportedSymbols.Add($Matches[1])
                } elseif ($clean -match "^([A-Za-z0-9_`$]+)$") {
                    [void]$exportedSymbols.Add($Matches[1])
                }
            }
        }

        if ($exportedSymbols.Count -eq 0) {
            continue
        }

        $orphans = @()
        foreach ($sym in $exportedSymbols) {
            if ($sym.StartsWith("_")) { continue }
            if ($barrelCode -notmatch "\b$([regex]::Escape($sym))\b") {
                $orphans += $sym
            }
        }

        if ($orphans.Count -gt 0) {
            Fail "${barrelPath}: Missing re-export(s) from ./${modName}: $($orphans -join ', ')"
        } else {
            Pass "${barrelPath}: Explicitly re-exports all $($exportedSymbols.Count) symbols from ./$modName"
        }
    }
}

# 5c. Verify src/engine/index.js has zero non-export statements (multi-line export aware)
$EngineBarrel = Remove-JsComments (Get-Content "src/engine/index.js" -Raw)
$EngineStatements = ($EngineBarrel -split ";") | Where-Object { $_.Trim() -ne "" }
$NonExportStatements = $EngineStatements | Where-Object { $_ -notmatch "^\s*export\b" }
if ($NonExportStatements.Count -gt 0) {
    Fail "src/engine/index.js contains non-export statements (side effects): $($NonExportStatements -join ' | ')"
} else {
    Pass "src/engine/index.js is a pure, side-effect-free barrel"
}

# ---------------------------------------------------------------------------
# 6. CONFIG, ALIAS & LAYER GATE AUDIT
# ---------------------------------------------------------------------------
Section "6. Layer Gate & Build Alias Configuration"

$LayerGateFile = ".agents/skills/local-scripts/scripts/rules/layers.js"
if (Test-Path $LayerGateFile) {
    $layerText = Get-Content $LayerGateFile -Raw
    foreach ($expected in @('"src/ui":\s*5', '"src/engine":\s*4', '"src/state":\s*3', '"src/data":\s*2', '"src/media":\s*2', '"src/simulation":\s*1', '"src/definitions":\s*0', '"src/utils":\s*0', '"@state"', '"@simulation"', '"@definitions"')) {
        if ($layerText -match $expected) {
            Pass "layers.js contains $expected"
        } else {
            Fail "layers.js missing $expected"
        }
    }
} else {
    Fail "Missing layer gate file: $LayerGateFile"
}

foreach ($cfg in @("vite.config.js", "vitest.config.js", "jsconfig.json", "types.d.ts")) {
    if (Test-Path $cfg) {
        $cfgText = Get-Content $cfg -Raw
        if ($cfgText -match "@simulation" -and $cfgText -match "@state") {
            Pass "${cfg}: Registers @simulation and @state"
        } else {
            Fail "${cfg}: Missing @simulation or @state alias registration"
        }
    } else {
        Fail "Missing config file: $cfg"
    }
}

# ---------------------------------------------------------------------------
# 7. OPTIONAL: RUN REPOSITORY VERIFICATION GATES
# ---------------------------------------------------------------------------
if ($RunGates) {
    Section "7. Executing Repository Gates (test:hooks & verify)"
    & npm run test:hooks
    if ($LASTEXITCODE -ne 0) { Fail "npm run test:hooks failed with exit code $LASTEXITCODE" }
    else { Pass "npm run test:hooks passed" }

    & npm run verify
    if ($LASTEXITCODE -ne 0) { Fail "npm run verify failed with exit code $LASTEXITCODE" }
    else { Pass "npm run verify passed" }
}

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
Write-Host "`n==========================================" -ForegroundColor Cyan
if ($script:Failures.Count -eq 0) {
    Write-Host " AUDIT COMPLETE: $($script:PassedCount) passed, 0 failed." -ForegroundColor Green
    exit 0
} else {
    Write-Host " AUDIT FAILED: $($script:PassedCount) passed, $($script:Failures.Count) failed:" -ForegroundColor Red
    foreach ($f in $script:Failures) {
        Write-Host "   - $f" -ForegroundColor Red
    }
    exit 1
}
